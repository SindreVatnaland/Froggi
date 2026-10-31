import { delay, inject, singleton } from 'tsyringe';
import Store from 'electron-store';
import { debounce } from 'lodash';
import type { ElectronLog } from 'electron-log';
import type { Repository } from 'typeorm';
import { scopedLog } from '../utils/logger';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { SqliteOrm } from './sqlite/initiSqlite';
import { FlowEntity } from './sqlite/entities/flow/flowEntity';
import { MessageHandler } from './messageHandler';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronPlayersStore } from './store/storePlayers';
import { ElectronSettingsStore } from './store/storeSettings';
import { ElectronStrikeStore } from './store/storeStrike';
import { ElectronCommandStore } from './store/storeCommands';
import { CHARACTER_NAMES_BY_ID, STAGE_NAMES_BY_ID, WebhookService } from './webhookService';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronHighlightStore } from './store/storeHighlights';
import { ElectronObsStore } from './store/storeObs';
import { ObsWebSocket } from './obs';
import { CommandType } from '../../frontend/src/lib/models/types/commandTypes';
import { ConnectionState, LiveStatsScene } from '../../frontend/src/lib/models/enum';
import { isSetComplete } from '../../frontend/src/lib/utils/gamePredicates';
import { secondsLeft, stockPace, winChances } from '../../frontend/src/lib/utils/winProbability';
import { evaluateFormula } from '../../frontend/src/lib/utils/formula';
import { applyListOp, fieldValue, itemTokens, listTokens, type ListItem } from '../../frontend/src/lib/utils/flowList';
import { MEDIA_ID, replayItems } from '../../frontend/src/lib/utils/highlightReel';
import { strikeFlowState } from '../../frontend/src/lib/utils/strikeFlowState';
import { SequenceTracker, type PlayerSnapshot, type SequenceEvent } from '../utils/sequenceTracker';
import { SCENE_SWITCHING_FLOW } from '../../frontend/src/lib/content/sceneFlow';
import { HIGHLIGHTS_FLOW } from '../../frontend/src/lib/content/highlightsFlow';
import { WebhookEvent } from '../../frontend/src/lib/models/types/webhook';
import type { GameStartTypeExtended } from '../../frontend/src/lib/models/types/slippiData';
import type { GameEndPayload, GameStartPayload, PlayerStatChangePayload, RankChangePayload, StockChangePayload } from '../../frontend/src/lib/models/types/webhook';
import { type Flow, type FlowAction, type FlowContext, FlowEventWithTokens, FlowFailure, FlowGameMode, FlowOAuth, FlowTokens } from '../../frontend/src/lib/models/types/flow';
import { clearKeys, stepsToRun, stepsAfter, waitsForResult, type FlowOutcome, type FlowStep, fillTemplate, hasNoBody, flowForImport, flowForSharing, gameStartTokens, migrateFlow, SAMPLE_TOKENS, triggerMatches, validateFlow } from '../../frontend/src/lib/utils/flowEngine';
import { flattenState, TEAM_COLORS, type FlowGameState, type FlowStatePlayer, type FlowStateTeam } from '../../frontend/src/lib/utils/flowState';
import { playerKey } from '../../frontend/src/lib/utils/teams';
import { buildFroggiZip, FROGGI_EXT, readFroggiZip, readJsonEntry, safeName, wrongKindMessage } from '../utils/froggiFile';
import { app, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { ComboHold, comboKey } from '../utils/comboHold';
import type { PlayerController } from '../../frontend/src/lib/models/types/controller';

const oauthKey = (o: FlowOAuth) => `${o.tokenUrl}|${o.clientId}|${o.clientSecret}|${o.scope ?? ''}|${o.credentials ?? 'body'}`;

/** electron-store flag: the default Scene switching flow was installed once. */
const SCENE_FLOW_SEEDED = 'migrations.sceneFlowInstalled';
/** electron-store: every flow's values + lists (Calculate / List cards), kept across restarts. */
const FLOW_VALUES_KEY = 'flows.values';
// v2: the rule-card version (replaces the first, never-released one once).
const HIGHLIGHTS_FLOW_SEEDED = 'migrations.highlightsFlowInstalledV5';

/** Minimum time between two runs of the same flow (damage events can come in bursts). */
const FLOW_COOLDOWN_MS = 250;
const COMBO_COOLDOWN_MS = 1000;
const POST_TIMEOUT_MS = 5000;

/**
 * Runs automation flows (see models/types/flow.ts). Events come from the backend — scene changes,
 * controller combos and the game changes the webhook service detects (GameEvent) — and are matched
 * against every flow's When; conditions read the live game state; actions POST or drive OBS.
 */
@singleton()
export class FlowService {
	private repo: Repository<FlowEntity> | undefined;
	private flows: Flow[] = [];
	private lastRun = new Map<string, number>();
	private prevStocks: (number | undefined)[] = [];
	/** OAuth access tokens by token URL + client + scope (memory only; refetched after a restart). */
	private oauthTokens = new Map<string, { token: string; expiresAt: number }>();

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('BrowserWindow') private mainWindow: BrowserWindow,
		@inject(SqliteOrm) private sqlite: SqliteOrm,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => ElectronStrikeStore)) private storeStrike: ElectronStrikeStore,
		@inject(delay(() => ElectronCommandStore)) private storeCommands: ElectronCommandStore,
		@inject(delay(() => WebhookService)) private webhookService: WebhookService,
		@inject(delay(() => ElectronObsStore)) private storeObs: ElectronObsStore,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronHighlightStore)) private storeHighlights: ElectronHighlightStore,
		@inject(delay(() => ObsWebSocket)) private obs: ObsWebSocket,
	) {
		this.log = scopedLog(this.log, 'Flows');
		this.log.info('Initializing Flow Service');
		this.loadValues();
		void this.load();
		this.initListeners();
	}

	// ── Storage (SQLite) ─────────────────────────────────────────────────────────────────────────
	private async load() {
		await this.sqlite.initializing;
		this.repo = this.sqlite.getRepository(FlowEntity);
		const rows = (await this.repo.find()) ?? [];
		// migrateFlow: renamed {{state.…}} keys + old flow-level format (saved back below when needed).
		this.flows = rows.map((r) => migrateFlow({ ...r, updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined }));
		// Flow-level singles/doubles → "Game format is" condition (one-time, saved back).
		for (const flow of this.flows.filter((f) => f.format && f.format !== 'any')) await this.saveFlow(flow);
		this.emitFlows();
		await this.seedSceneFlow();
		await this.seedHighlightsFlow();
	}

	/** Scenes are switched by flows only. The default "Scene switching" flow is installed (enabled) once;
	 *  after that it is the user's — deleting or editing it is respected (Flows page: Restore default). */
	private async seedSceneFlow() {
		const store = new Store();
		if (store.get(SCENE_FLOW_SEEDED)) return;
		const result = await this.saveFlow({ ...SCENE_SWITCHING_FLOW, enabled: true });
		if (!result.ok) return this.log.error('Could not install the Scene switching flow:', result.problems);
		store.set(SCENE_FLOW_SEEDED, true);
		this.log.info('Installed the default Scene switching flow');
	}

	/** The "Highlights (replay buffer)" flow is installed once, turned off — the user turns it on. */
	private async seedHighlightsFlow() {
		const store = new Store();
		if (store.get(HIGHLIGHTS_FLOW_SEEDED)) return;
		// V5 (daily: 5 per game): replaces the earlier one only while it is off — a flow the user turned on is theirs.
		if (this.getFlow(HIGHLIGHTS_FLOW.id)?.enabled) return void store.set(HIGHLIGHTS_FLOW_SEEDED, true);
		const result = await this.saveFlow(HIGHLIGHTS_FLOW);
		if (!result.ok) return this.log.error('Could not install the Highlights flow:', result.problems);
		store.set(HIGHLIGHTS_FLOW_SEEDED, true);
		this.log.info('Installed the Highlights flow (off)');
	}

	/** Put the default "Scene switching" flow back (enabled), replacing the one with its id. */
	async restoreSceneFlow() {
		const result = await this.saveFlow({ ...SCENE_SWITCHING_FLOW, enabled: true });
		if (result.ok) this.notify('Restored the default "Scene switching" flow', NotificationType.Success);
		else this.notify(`Could not restore the scene flow: ${result.problems.join('; ')}`, NotificationType.Danger);
		return result;
	}

	getFlows(): Flow[] {
		return this.flows;
	}

	getFlow(id: string): Flow | undefined {
		return this.flows.find((f) => f.id === id);
	}

	/** Save (create or update). Returns validation problems instead of saving when there are any. */
	async saveFlow(input: Flow): Promise<{ ok: true; flow: Flow } | { ok: false; problems: string[] }> {
		const flow = migrateFlow(input);
		const problems = validateFlow(flow);
		if (problems.length) return { ok: false, problems };
		await this.sqlite.initializing;
		const repo = this.repo ?? this.sqlite.getRepository(FlowEntity);
		await repo.save(repo.create({ id: flow.id, name: flow.name.trim(), enabled: flow.enabled, format: 'any', nodes: flow.nodes, edges: flow.edges }));
		const saved = { ...flow, name: flow.name.trim(), updatedAt: new Date().toISOString() };
		this.flows = [...this.flows.filter((f) => f.id !== flow.id), saved];
		this.emitFlows();
		return { ok: true, flow: saved };
	}

	async deleteFlow(id: string) {
		await this.sqlite.initializing;
		await (this.repo ?? this.sqlite.getRepository(FlowEntity)).delete({ id });
		this.flows = this.flows.filter((f) => f.id !== id);
		// Its values and lists go with it.
		if (this.values.delete(id)) this.saveValues();
		this.emitFlows();
	}

	// ── Sharing (.froggi, kind "flow") ───────────────────────────────────────────────────────────
	async exportFlow(id: string) {
		const flow = this.getFlow(id);
		if (!flow) return;
		const { canceled, filePath } = await dialog.showSaveDialog(this.mainWindow, {
			defaultPath: `${safeName(flow.name)}.${FROGGI_EXT}`,
			filters: [{ name: 'Froggi flow', extensions: [FROGGI_EXT] }],
		});
		if (canceled || !filePath) return;
		const zip = buildFroggiZip(
			{ format: 'froggi', version: 1, kind: 'flow', froggiVersion: app.getVersion(), createdAt: new Date().toISOString() },
			{ [`flows/${flow.id}.json`]: Buffer.from(JSON.stringify(flowForSharing(flow), null, 2)) },
		);
		fs.writeFileSync(filePath, zip);
		this.notify(`Exported "${flow.name}" (bearer tokens are not included)`, NotificationType.Success);
	}

	async importFlowFile() {
		const { canceled, filePaths } = await dialog.showOpenDialog(this.mainWindow, {
			properties: ['openFile'],
			filters: [{ name: 'Froggi flow', extensions: [FROGGI_EXT] }],
		});
		if (canceled || !filePaths[0]) return;
		try {
			const { manifest, files } = readFroggiZip(fs.readFileSync(filePaths[0]));
			if (manifest.kind !== 'flow') return this.notify(wrongKindMessage(manifest.kind), NotificationType.Warning);
			let imported = 0;
			for (const name of Object.keys(files).filter((f) => f.startsWith('flows/') && f.endsWith('.json'))) {
				const raw = readJsonEntry<Flow>(files, name);
				if (!raw) continue;
				const flow = flowForImport(raw, this.flows.map((f) => f.id), () => `flow-${Date.now().toString(36)}${imported}`);
				const result = await this.saveFlow(flow);
				if (result.ok) imported++;
				else this.log.warn(`Skipped imported flow "${raw.name}": ${result.problems.join('; ')}`);
			}
			this.notify(imported ? `Imported ${imported} flow${imported === 1 ? '' : 's'} — turned off until you check and enable them` : 'No valid flows in that file', imported ? NotificationType.Success : NotificationType.Warning);
		} catch (err) {
			this.log.error('Flow import failed:', err);
			this.notify('Could not read that file', NotificationType.Danger);
		}
	}

	private notify(message: string, type: NotificationType) {
		this.messageHandler.sendMessage('Notification', message, type);
	}

	private emitFlows() {
		this.messageHandler.sendMessage('Flows', this.flows);
	}

	// ── Events → flows ───────────────────────────────────────────────────────────────────────────
	private initListeners() {
		this.clientEmitter.on('FlowsRequest', () => this.emitFlows());
		this.clientEmitter.on('FlowSave', (flow) => {
			void this.saveFlow(flow).then((r) => {
				if (!r.ok) this.messageHandler.sendMessage('Notification', `Flow not saved: ${r.problems.join('; ')}`, 'warning' as never);
			});
		});
		this.clientEmitter.on('FlowDelete', (id) => void this.deleteFlow(id));
		this.clientEmitter.on('FlowExport', (id) => void this.exportFlow(id));
		this.clientEmitter.on('FlowImport', () => void this.importFlowFile());
		this.clientEmitter.on('FlowTest', (id) => void this.testFlow(id));
		this.clientEmitter.on('FlowStateRequest', () => this.messageHandler.sendMessage('FlowState', this.gameStateObject()));

		this.localEmitter.on('LiveStatsSceneChange', (scene: LiveStatsScene) => this.handle({ type: 'sceneChange', scene, tokens: { scene } }));
		this.localEmitter.on('MemoryControllerInput', (inputs: PlayerController) => this.handleController(inputs));
		this.localEmitter.on('GameEvent', (event, payload) => this.handleGameEvent(event, payload));
		this.localEmitter.on('GameFrame', (frame) => this.sequences.frame(frame));
		this.localEmitter.on('SetStarted', (set) => this.handle({ type: 'setStart', payload: set, tokens: { ...set } }));
		this.localEmitter.on('DolphinConnectionState', (state) => {
			if (state !== ConnectionState.Connected && state !== ConnectionState.Disconnected) return;
			const connected = state === ConnectionState.Connected;
			this.handle({ type: 'dolphinConnection', connected, tokens: { connected } });
		});
		this.localEmitter.on('ObsReplaySaved', (file) => this.handle({ type: 'obsReplaySaved', payload: { path: file }, tokens: { path: file, fileName: path.basename(file) } }));
		this.clientEmitter.on('HighlightReelShown', (key, id) => this.storeHighlights.started(key, id));
		// Highlight Replay elements: a flow list by name (only its replay fields leave Froggi), and the frames
		// of one window of a .slp by id.
		this.clientEmitter.on('ReplayListRequest', (name) => {
			this.watchedLists.add(String(name));
			this.sendReplayList(String(name));
		});
		this.clientEmitter.on('HighlightFramesRequest', (id, from, to) => {
			if (!MEDIA_ID.test(String(id)) || !Number.isInteger(from) || !Number.isInteger(to)) return;
			void this.storeHighlights
				.replayFrames(String(id), from, to)
				.catch((err) => (this.log.warn(`Replay ${id}: could not read frames`, err), null))
				.then((frames) => this.messageHandler.sendMessage('HighlightFrames', `${id}:${from}:${to}`, frames));
		});
		this.localEmitter.on('StrikePlayerAction', (a) => this.handle({ type: 'strikeAction', event: a.event, payload: a, tokens: { event: a.event, player: a.player ? `p${a.player}` : null, playerName: a.playerName, phase: a.phase, stage: a.stage ?? null, character: a.character ?? null, rps: a.rps ?? null } }));
		// No replay found after a game: still "Game ends" (the scene flow moves on from In Game).
		this.localEmitter.on('GameEndWithoutReplay', (gameEnd) => this.handle({ type: 'gameEnd', payload: gameEnd, tokens: { stage: null, method: null, score: null } }));
		this.clientEmitter.on('FlowRestoreSceneDefault', () => void this.restoreSceneFlow());
		this.clientEmitter.on('FlowFailuresRequest', () => this.messageHandler.sendMessage('FlowFailures', this.failures));
		this.clientEmitter.on('FlowFailuresClear', () => {
			this.failures = [];
			this.messageHandler.sendMessage('FlowFailures', this.failures);
		});
	}

	// ── Sequences ("A sequence ends") ────────────────────────────────────────────────────────────
	private sequences = new SequenceTracker((e) => this.onSequence(e));

	private onSequence(e: SequenceEvent) {
		const tokens = this.sequenceTokens(e);
		const { before: _before, after: _after, ...payload } = e;
		this.handle({ type: 'sequence', kind: e.kind, player: tokens.player === 2 || tokens.player === 4 ? 2 : 1, isCurrentPlayer: !!tokens.isCurrentPlayer, payload, tokens });
	}

	/** Keys of a sequence (SEQUENCE_KEYS). Player/victim are slots (1–4); win chance is for the attacker's side. */
	sequenceTokens(e: SequenceEvent): FlowTokens {
		const settings = this.storeLiveStats.getGameSettings();
		const slots = (this.storePlayers.getCurrentPlayers() ?? []).slice(0, 4);
		const slotOf = (index: number) => slots.findIndex((p) => p?.playerIndex === index);
		const who = (index: number) => {
			const p = slots[slotOf(index)];
			const character = settings?.players?.find((s) => s?.playerIndex === index)?.characterId;
			return { slot: slotOf(index) + 1 || index + 1, name: p?.displayName || p?.connectCode || `Port ${index + 1}`, character: character != null ? (CHARACTER_NAMES_BY_ID[character] ?? null) : null };
		};
		const attacker = who(e.attackerIndex);
		const victim = who(e.victimIndex);
		const side = (attacker.slot - 1) % 2; // slots 1 + 3 = Player 1's side
		const score = this.storeGames.getGameScore() ?? [];
		const fightSnap = this.storeLiveStats.fightStats.snapshot();
		const stockSeconds = fightSnap.stockSeconds?.match ?? [];
		const odds = (snap: Record<number, PlayerSnapshot>, frame: number) => {
			const sideOf = (s: number) => slots.flatMap((p, i) => {
				if (!p || i % 2 !== s || !snap[p.playerIndex]) return [];
				const set = fightSnap.match?.[playerKey(p)];
				return [{ stocks: snap[p.playerIndex].stocks, percent: snap[p.playerIndex].percent, deaths: set?.deaths, deathPercent: set?.deathPercent }];
			});
			const left = secondsLeft(settings, frame);
			const c = winChances(sideOf(0), sideOf(1), [score[0] ?? 0, score[1] ?? 0], this.storeLiveStats.getBestOf(), left != null ? { secondsLeft: left, stockSeconds } : null);
			return { game: Math.round(c.game[side] * 100), set: Math.round(c.set[side] * 100) };
		};
		const before = odds(e.before, e.startFrame);
		const after = odds(e.after, e.endFrame);
		const victimSideStocks = slots.reduce((n, p, i) => n + (p && i % 2 !== side ? (e.after[p.playerIndex]?.stocks ?? 0) : 0), 0);
		const seconds = Math.round(((e.endFrame - e.startFrame) / 60) * 10) / 10;
		return {
			kind: e.kind,
			player: attacker.slot,
			playerName: attacker.name,
			character: attacker.character,
			isCurrentPlayer: this.context().currentPlayerSlot === attacker.slot - 1,
			victim: victim.slot,
			victimName: victim.name,
			victimCharacter: victim.character,
			hits: e.hits,
			damage: e.damage,
			startPercent: e.startPercent,
			endPercent: e.endPercent,
			seconds,
			hitsPerSecond: Math.round((e.hits / Math.max(seconds, 0.5)) * 10) / 10,
			didKill: e.didKill,
			gameEnding: e.didKill && victimSideStocks === 0,
			teamKills: e.teamKills,
			openingType: e.openingType || null,
			moves: e.moves.join(', '),
			lastMove: e.moves.at(-1) ?? null,
			offstage: e.offstage,
			victimStocksLeft: e.after[e.victimIndex]?.stocks ?? null,
			// How deep into the game: every player's stocks left after it, of all stocks at the start.
			gameStocksLeft: Object.values(e.after).reduce((n, p) => n + (p?.stocks ?? 0), 0),
			gameStocksTotal: (settings?.players ?? []).reduce((n, p) => n + (p ? (p.startStocks ?? 4) : 0), 0) || null,
			winChanceBefore: before.game,
			winChanceAfter: after.game,
			winChanceSwing: after.game - before.game,
			setChanceSwing: after.set - before.set,
			startTime: e.startTime,
			endTime: e.endTime,
			startFrame: e.startFrame,
			endFrame: e.endFrame,
		};
	}

	// Same feel as Controller Commands: hold the combo 0.5s, then 1s cooldown.
	private comboHold = new ComboHold(500, COMBO_COOLDOWN_MS);
	private heldButtons: Record<string, boolean> | undefined;

	private handleController(inputs: PlayerController) {
		const comboFlows = this.flows.filter((f) => f.enabled && f.nodes.some((n) => n.kind === 'trigger' && n.data.type === 'controllerCombo'));
		if (!comboFlows.length) return this.comboHold.update(null, () => undefined);
		const index = this.storeCommands.getControllerIndex(inputs);
		this.heldButtons = index === undefined ? undefined : (inputs?.[index]?.buttons as unknown as Record<string, boolean>);
		const anyMatch = comboFlows.some((f) =>
			f.nodes.some((n) => n.kind === 'trigger' && triggerMatches(n.data, { type: 'controllerCombo', buttons: this.heldButtons ?? {} })),
		);
		this.comboHold.update(anyMatch ? comboKey(this.heldButtons) : null, () =>
			this.handle({ type: 'controllerCombo', buttons: this.heldButtons ?? {}, tokens: { buttons: comboKey(this.heldButtons) } }),
		);
	}

	private handleGameEvent(event: WebhookEvent, payload: unknown) {
		switch (event) {
			case WebhookEvent.GameStart: {
				this.prevStocks = [];
				const settings = this.storeLiveStats.getGameSettings();
				// Sequence detection only runs while an enabled flow listens for it.
				if (settings && this.flows.some((f) => f.enabled && f.nodes.some((n) => n.kind === 'trigger' && n.data.type === 'sequence'))) this.sequences.start(settings);
				else this.sequences.stop();
				return void this.handle({ type: 'gameStart', payload, tokens: { ...gameStartTokens(this.gameStateObject()), stage: (payload as GameStartPayload)?.stage?.name ?? null, mode: (payload as GameStartPayload)?.mode ?? null, newSet: !!(settings as GameStartTypeExtended | undefined)?.isNewSet } });
			}
			case WebhookEvent.GameEnd:
				this.sequences.stop();
				return void this.handle({ type: 'gameEnd', payload, tokens: this.gameEndTokens(payload as GameEndPayload) });
			case WebhookEvent.RankChange:
				return void this.handle({ type: 'rankChange', payload, tokens: this.rankTokens(payload as RankChangePayload) });
			case WebhookEvent.PercentChange: {
				const p = payload as PlayerStatChangePayload;
				[p?.p1, p?.p2].forEach((diff, i) => {
					if (diff && diff.diff > 0) {
						this.handle({
							type: 'damageTaken', player: (i + 1) as 1 | 2, isCurrentPlayer: diff.isCurrentPlayer, damage: diff.diff, payload,
							tokens: { player: i + 1, playerName: diff.displayName || diff.connectCode || `Player ${i + 1}`, isCurrentPlayer: diff.isCurrentPlayer, damage: Math.round(diff.diff * 10) / 10, percent: Math.round(diff.current * 10) / 10 },
						});
					}
				});
				return;
			}
			case WebhookEvent.StockChange: {
				const p = payload as StockChangePayload;
				[p?.p1, p?.p2].forEach((diff, i) => {
					if (!diff) return;
					const before = this.prevStocks[i];
					this.prevStocks[i] = diff.current;
					if (before !== undefined && diff.current < before) {
						this.handle({
							type: 'stockLost', player: (i + 1) as 1 | 2, isCurrentPlayer: diff.isCurrentPlayer, payload,
							tokens: { player: i + 1, playerName: diff.displayName || diff.connectCode || `Player ${i + 1}`, isCurrentPlayer: diff.isCurrentPlayer, stocksLeft: diff.current },
						});
					}
				});
				return;
			}
		}
	}

	/** Run every action once (trigger + conditions skipped) with example trigger keys and the real game
	 *  state, and report each result to the editor. */
	async testFlow(id: string) {
		const flow = this.getFlow(id);
		if (!flow) return;
		const trigger = flow.nodes.find((n) => n.kind === 'trigger');
		const type = trigger?.kind === 'trigger' ? trigger.data.type : 'gameStart';
		const live = Object.fromEntries(Object.entries(this.stateTokens()).filter(([, v]) => v !== null));
		const event = { type, tokens: { ...SAMPLE_TOKENS, ...live } } as FlowEventWithTokens;
		const results: { action: string; ok: boolean; detail: string }[] = [];
		for (const action of flow.nodes.flatMap((n) => (n.kind === 'action' ? [n.data] : []))) {
			try {
				results.push({ action: action.type, ok: true, detail: (await this.runAction(flow, action, event)) ?? 'Done' });
			} catch (err) {
				results.push({ action: action.type, ok: false, detail: err instanceof Error ? err.message : String(err) });
			}
		}
		this.messageHandler.sendMessage('FlowTestResult', { flowId: id, at: new Date().toISOString(), results });
	}

	/** Run every flow this event triggers. Returns whether anything ran. */
	private handle(trigger: FlowEventWithTokens): boolean {
		if (!this.flows.length) return false;
		const event = { ...trigger, tokens: { ...this.stateTokens(), ...trigger.tokens } } as FlowEventWithTokens;
		const ctx = this.context();
		let ran = false;
		for (const flow of this.flows) {
			const steps = stepsToRun(flow, event, ctx);
			if (!steps.length) continue;
			// Per flow AND trigger type: throttles bursts (damage) without dropping a different trigger
			// of the same flow (e.g. the Scene switching flow's game end right after a scene change).
			// Sequences are never throttled (two doubles KOs can end in the same frame).
			const runKey = `${flow.id}:${event.type}`;
			if (event.type !== 'sequence' && Date.now() - (this.lastRun.get(runKey) ?? 0) < FLOW_COOLDOWN_MS) continue;
			this.lastRun.set(runKey, Date.now());
			ran = true;
			// Own copy per flow (Calculate / List / error change its keys) with the flow's values.
			void this.runSteps(flow, steps, { ...event, computed: new Set(), tokens: { ...event.tokens, ...this.valueTokens(flow) } });
		}
		return ran;
	}

	/** Run steps in order. A card that waits for its result (yes/no, can fail, changes keys) picks its
	 *  output from the result; the cards after it run with the keys as they are then (Calculate keys, {{error}}). */
	private async runSteps(flow: Flow, steps: FlowStep[], event: FlowEventWithTokens) {
		for (const step of steps) {
			if (step.action.type === 'timer') {
				this.startTimer(flow, step.nodeId, step.action, event);
				continue;
			}
			let outcome: FlowOutcome = 'continue';
			try {
				await this.runAction(flow, step.action, event);
			} catch (err) {
				outcome = 'error';
				event.tokens = { ...event.tokens, error: err instanceof Error ? err.message : String(err) };
				this.recordFailure(flow, step.action.type, err);
			}
			if (waitsForResult(step.action)) {
				const tokens = { ...event.tokens, ...this.stateTokens(), ...this.valueTokens(flow, event.computed) };
				await this.runSteps(flow, stepsAfter(flow, step.nodeId, this.context(), tokens, outcome), { ...event, tokens });
			}
		}
	}

	private context(): FlowContext {
		const settings = this.storeLiveStats.getGameSettings();
		const frame = this.storeLiveStats.getGameFrame();
		const players = this.storePlayers.getCurrentPlayers() ?? [];
		const code = this.storeSettings.getCurrentPlayerConnectCode();
		const slot = players.findIndex((p) => code && p?.connectCode === code);
		const mode = this.storeLiveStats.getGameMode() as FlowGameMode | undefined;
		return {
			scene: this.storeLiveStats.getStatsScene(),
			mode,
			isTeams: !!settings?.isTeams,
			players: [0, 1].map((i) => {
				const post = frame?.players?.[players[i]?.playerIndex ?? i]?.post;
				return { stocks: post?.stocksRemaining ?? undefined, percent: post?.percent ?? undefined };
			}),
			currentPlayerSlot: slot >= 0 ? slot : undefined,
			strikePhase: this.storeStrike.getStrikeState()?.phase,
			obsScene: this.storeObs.getConnection()?.scenes?.currentProgramSceneName,
			replayBufferActive: !!this.storeObs.getConnection()?.replayBufferState?.outputActive,
		};
	}

	// ── Failures (Flows → Problems, MCP get_flow_problems) ───────────────────────────────────────
	private failures: FlowFailure[] = [];

	private recordFailure(flow: Flow, action: string, err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		this.log.error(`Flow "${flow.name}" action ${action} failed:`, message);
		this.failures = [{ at: new Date().toISOString(), flowId: flow.id, flowName: flow.name, action, message }, ...this.failures].slice(0, 30);
		this.messageHandler.sendMessage('FlowFailures', this.failures);
	}

	/** Recent action failures, newest first (memory only). */
	getFailures(): FlowFailure[] {
		return this.failures;
	}

	// ── Values (Calculate / List cards) ────────────────────────────────────────────────────────
	/** flow id → name → number / list. A value stays (also for the flow's next runs, and restarts) until a
	 *  Clear values card clears it — nothing resets on its own. Each flow has its own values. */
	private values = new Map<string, Record<string, number | ListItem[]>>();

	/** The flow's values as keys: every name its Calculate / List cards set — unset or cleared reads as
	 *  empty (0 in a formula); a list gives {{list}} (values joined) and {{list.count}}. */
	/** `own`: the Calculate keys this run set itself — they stay the run's (two punishes waiting on their
	 *  timers each keep their own score); every other value and every list is read as it is now (a counter
	 *  another run raised meanwhile is not lost). */
	valueTokens(flow: Flow, own?: Set<string>): FlowTokens {
		const values = this.values.get(flow.id) ?? {};
		const tokens: FlowTokens = {};
		for (const n of flow.nodes) {
			if (n.kind !== 'action') continue;
			if (n.data.type === 'calculate' && own?.has(n.data.key.trim())) continue;
			if (n.data.type === 'calculate') {
				const v = values[n.data.key.trim()];
				tokens[n.data.key.trim()] = typeof v === 'number' ? v : '';
			}
			if (n.data.type === 'list') Object.assign(tokens, listTokens(n.data.key.trim(), this.list(flow, n.data.key)));
		}
		return tokens;
	}

	/** Every list of the flow by name (empty when not set yet) — for list functions in formulas. */
	private lists(flow: Flow): Record<string, ListItem[]> {
		return Object.fromEntries(flow.nodes.flatMap((n) => (n.kind === 'action' && n.data.type === 'list' && n.data.key ? [[n.data.key.trim(), this.list(flow, n.data.key)]] : [])));
	}

	private list(flow: Flow, key: string): ListItem[] {
		const v = this.values.get(flow.id)?.[key.trim()];
		return Array.isArray(v) ? v : [];
	}

	private setValue(flow: Flow, key: string, value: number | ListItem[] | undefined) {
		const values = { ...this.values.get(flow.id) };
		if (value === undefined) delete values[key];
		else values[key] = value;
		this.values.set(flow.id, values);
		this.saveValues();
		if (value === undefined || Array.isArray(value)) {
			this.listChanged.set(key, { flowId: flow.id, at: Date.now() });
			if (this.watchedLists.has(key)) this.sendReplayList(key);
		}
	}

	// ── Lists for Highlight Replay elements ───────────────────────────────────────────────────────
	/** List name → the flow that changed it last and when (a name used by two flows: the last change wins). */
	private listChanged = new Map<string, { flowId: string; at: number }>();
	/** Lists an overlay asked for — sent again whenever they change. */
	private watchedLists = new Set<string>();

	private async sendReplayList(name: string) {
		const last = this.listChanged.get(name);
		const owner = last?.flowId ?? [...this.values.entries()].find(([, v]) => Array.isArray(v[name]))?.[0];
		const list = owner ? this.values.get(owner)?.[name] : undefined;
		// Windows end where their game ends: every screen then knows each highlight's exact length up front and
		// switches the moment its frames run out.
		const items = await Promise.all(
			replayItems(Array.isArray(list) ? list : []).map(async (i) => {
				const lastFrame = await this.storeHighlights.lastFrame(i.replay).catch(() => null);
				return lastFrame !== null && i.endFrame > lastFrame ? { ...i, endFrame: Math.max(i.startFrame + 1, lastFrame) } : i;
			}),
		);
		this.messageHandler.sendMessage('ReplayList', { name, items, changedAt: last?.at ?? 0 });
	}

	/** Values + lists are kept across restarts (a daily highlight list must survive one) — electron-store. */
	private saveValues = debounce(() => {
		try {
			new Store().set(FLOW_VALUES_KEY, Object.fromEntries(this.values));
		} catch (err) {
			this.log.warn('Could not save flow values', err);
		}
	}, 1000);

	private loadValues() {
		try {
			const saved = new Store().get(FLOW_VALUES_KEY) as Record<string, Record<string, number | ListItem[]>> | undefined;
			for (const [flowId, values] of Object.entries(saved ?? {})) this.values.set(flowId, values);
		} catch (err) {
			this.log.warn('Could not load flow values', err);
		}
	}

	// ── Timer cards ──────────────────────────────────────────────────────────────────────────────
	/** Running timers by key (keys are shared by all flows, so any flow can cancel them). */
	private timers = new Map<string, NodeJS.Timeout>();

	private startTimer(flow: Flow, nodeId: string, timer: Extract<FlowAction, { type: 'timer' }>, event: FlowEventWithTokens) {
		const key = fillTemplate(timer.key, event.tokens, '').trim();
		this.cancelTimer(key);
		// A number, or a formula — e.g. {{clips.first.seconds}} to wait as long as a highlight plays.
		let seconds = 0;
		try {
			seconds = evaluateFormula(String(timer.seconds ?? 0), { ...event.tokens, ...this.valueTokens(flow, event.computed) }, this.lists(flow));
		} catch (err) {
			this.log.warn(`Flow "${flow.name}": timer "${key}" — ${err instanceof Error ? err.message : err}`);
		}
		this.log.info(`Flow "${flow.name}": timer "${key}" ${seconds}s`);
		// ponytail: at least 0.1 s, so a loop whose time reads 0 can't spin.
		seconds = Math.max(0.1, Number(seconds) || 0);
		this.timers.set(key, setTimeout(() => {
			this.timers.delete(key);
			const current = this.getFlow(flow.id); // edited or turned off meanwhile → use what is saved now
			if (!current) return;
			const tokens = { ...event.tokens, ...this.stateTokens(), ...this.valueTokens(current, event.computed) };
			void this.runSteps(current, stepsAfter(current, nodeId, this.context(), tokens), { ...event, tokens });
		}, Math.max(0, seconds) * 1000));
	}

	private cancelTimer(key: string) {
		const t = this.timers.get(key.trim());
		if (!t) return false;
		clearTimeout(t);
		this.timers.delete(key.trim());
		return true;
	}

	/** Runs one card; a thrown error = its Error output. */
	private async runAction(flow: Flow, action: FlowAction, event: FlowEventWithTokens): Promise<string | void> {
		switch (action.type) {
			case 'setHighlightVideo': {
				// "Set media": ONE thing on the key — a file id, a file path or a web link, with an optional
				// start / end (seconds, empty = all). Empty source = clear the key.
				const key = action.key?.trim() || 'game';
				const source = fillTemplate(action.path ?? '', event.tokens, '').trim();
				const seconds = (v: string | number | undefined) => {
					const text = fillTemplate(String(v ?? ''), event.tokens, '').trim();
					return text === '' ? null : evaluateFormula(text, event.tokens ?? {}, this.lists(flow));
				};
				const reel = await this.storeHighlights.setMedia(key, source, { start: seconds(action.start), end: seconds(action.end) });
				return reel ? `Media "${key}": ${reel.kind === 'image' ? 'image' : 'video'} ${source}` : `Media "${key}" cleared`;
			}
			case 'list': {
				const key = action.key.trim();
				const before = this.list(flow, key);
				const lists = this.lists(flow);
				const items = applyListOp(before, action.op, {
					item: Object.fromEntries((action.fields ?? []).filter((f) => f.name?.trim()).map((f) => [f.name.trim(), fieldValue(fillTemplate(f.value ?? '', event.tokens, ''))])),
					from: action.from ? this.list(flow, action.from) : [],
					formula: action.formula,
					order: action.order,
					field: action.field?.trim(),
					// A number or a formula (e.g. 5% of the list, at least 10, at most 30).
					count: action.count === undefined || action.count === '' ? undefined : evaluateFormula(String(action.count), event.tokens ?? {}, lists),
					evaluate: (formula, item) => evaluateFormula(formula, { ...event.tokens, ...itemTokens(item) } as FlowTokens, lists),
				});
				this.setValue(flow, key, items);
				event.tokens = { ...event.tokens, ...listTokens(key, items) };
				return `${key}: ${action.op} → ${items.length} item(s)`;
			}
			case 'calculate': {
				const key = action.key.trim();
				const value = Math.round(evaluateFormula(action.formula, event.tokens ?? {}, this.lists(flow)) * 1000) / 1000;
				event.tokens = { ...event.tokens, [key]: value };
				event.computed?.add(key);
				this.setValue(flow, key, value);
				return `${key} = ${value}`;
			}
			case 'clearValues': {
				const keys = clearKeys(action.keys);
				for (const key of keys) {
					this.setValue(flow, key, undefined);
					event.tokens = { ...event.tokens, [key]: '', ...(event.tokens?.[`${key}.count`] !== undefined ? { [`${key}.count`]: 0 } : {}) };
				}
				return `Cleared ${keys.join(', ')}`;
			}
			case 'setVideoVolume':
				this.storeHighlights.setVolume(action.key.trim() || 'game', Number(action.volume));
				return `Video "${action.key}" volume ${action.volume}`;
			case 'obsReplayBufferSettings': {
				// No folders or characters a file name can't hold.
				const fileName = fillTemplate(action.fileName ?? '', event.tokens, '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
				return this.obs.setReplayBufferSettings(Number(action.seconds) || undefined, action.format || undefined, fileName || undefined);
			}
			case 'setScene':
				this.storeLiveStats.setStatsScene(action.scene);
				return `Scene → ${action.scene}`;
			case 'timer':
				return `Timer "${action.key}" (${action.seconds}s) — runs when the flow runs`;
			case 'cancelTimer':
			{
				const key = fillTemplate(action.key, event.tokens, '').trim();
				return this.cancelTimer(key) ? `Cancelled timer "${key}"` : `No timer "${key}" running`;
			}
			case 'notify': {
				const message = fillTemplate(action.message ?? '', event.tokens, '–');
				this.notify(message, NotificationType.Info);
				return `Shown: ${message}`;
			}
			case 'log': {
				const message = fillTemplate(action.message ?? '', event.tokens, '–');
				this.log.info(`Flow "${flow.name}": ${message}`);
				return `Logged: ${message}`;
			}
			case 'obsScene':
				return this.obsResult(await this.storeCommands.executeCommand(CommandType.Obs, 'SetCurrentProgramScene', { sceneName: action.sceneName }), `Switched OBS to "${action.sceneName}"`);
			case 'obsToggleSource':
				return this.obsResult(await this.storeCommands.executeCommand(CommandType.ObsCustom, 'ToggleSceneItem', { itemName: action.sourceName }), `Toggled "${action.sourceName}"`);
			case 'obsVolume':
				return this.obsResult(await this.storeCommands.executeCommand(CommandType.Obs, 'SetInputVolume', { inputName: action.inputName, inputVolumeMul: action.volume }), `Volume of "${action.inputName}" set`);
			case 'obsSaveReplay': {
				// Waits for OBS's file: {{file}} (its id), {{path}}, {{fileSeconds}}, {{savedAt}} (when it ends).
				const since = Date.now();
				this.obsResult(await this.storeCommands.executeCommand(CommandType.Obs, 'SaveReplayBuffer', undefined), 'Replay saved');
				const saved = await this.storeHighlights.savedFile(since);
				if (!saved) throw new Error('OBS did not write a replay file — is its replay buffer running?');
				event.tokens = { ...event.tokens, file: saved.file, path: saved.path, fileSeconds: saved.fileSeconds, savedAt: saved.savedAt };
				return `Replay saved: ${path.basename(saved.path)} (${saved.fileSeconds ?? '?'} s)`;
			}
			case 'httpPost':
				return this.request(flow, action, event);
		}
	}

	/** OBS said no (or is not connected) → a failed action (the ✕ output). */
	private obsResult(ok: boolean | undefined, done: string): string {
		if (ok === false) throw new Error('OBS did not accept the command — is OBS connected?');
		return done;
	}

	private gameEndTokens(p: GameEndPayload | undefined) {
		const score = p?.score ?? [];
		return { stage: p?.stage?.name ?? null, method: p?.gameEndMethod ?? null, score: score.length ? score.join('-') : null };
	}

	private rankTokens(p: RankChangePayload | undefined) {
		const side = (r: RankChangePayload['before'] | undefined, prefix: string) => ({
			[`${prefix}.rank`]: r?.rank ?? null,
			[`${prefix}.rating`]: r?.rating != null ? Math.round(r.rating * 10) / 10 : null,
			[`${prefix}.wins`]: r?.wins ?? null,
			[`${prefix}.losses`]: r?.losses ?? null,
			[`${prefix}.leaderboardPlacement`]: r?.leaderboardPlacement ?? null,
		});
		return {
			playerName: p?.displayName || p?.connectCode || null,
			connectCode: p?.connectCode ?? null,
			// Kept for existing flows: the new values.
			rank: p?.after?.rank ?? null,
			rating: p?.after?.rating ?? null,
			ratingChange: p?.diff?.rating != null ? Math.round(p.diff.rating * 10) / 10 : null,
			rankChanged: p?.diff?.rankChanged ?? null,
			...side(p?.before, 'before'),
			...side(p?.after, 'after'),
		};
	}

	private bodyFor(action: Extract<FlowAction, { type: 'httpPost' }>, event: FlowEventWithTokens): unknown {
		if (action.body === 'trigger') return 'payload' in event ? (event.payload ?? null) : event;
		if (action.body === 'gameState') return this.gameStateObject();
		if (action.body === 'custom') return null;
		return this.webhookService.getLatestPayload(action.body);
	}

	private async request(flow: Flow, action: Extract<FlowAction, { type: 'httpPost' }>, event: FlowEventWithTokens, retried = false): Promise<string> {
		const method = (action.method || 'POST').toUpperCase();
		const url = fillTemplate(action.url, event.tokens, '', encodeURIComponent);
		// Custom body: the user's template with {{key}} filled — JSON when it parses, else plain text.
		// Otherwise Froggi's envelope.
		const body =
			hasNoBody(method)
				? undefined
				: action.body === 'custom'
					? fillTemplate(action.template ?? '', event.tokens)
					: JSON.stringify({ flow: flow.name, trigger: event.type, timestamp: new Date().toISOString(), tokens: event.tokens ?? {}, payload: this.bodyFor(action, event) });
		const isJson = body !== undefined && (() => { try { JSON.parse(body); return true; } catch { return false; } })();
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
		try {
			const res = await fetch(url, {
				method,
				// Custom headers last, so they can override Content-Type / Authorization.
				headers: {
					...(body !== undefined ? { 'Content-Type': isJson ? 'application/json' : 'text/plain; charset=utf-8' } : {}),
					...(action.oauth ? { Authorization: `Bearer ${await this.oauthToken(action.oauth)}` } : action.bearerToken ? { Authorization: `Bearer ${action.bearerToken}` } : {}),
					...Object.fromEntries((action.headers ?? []).filter((h) => h.name?.trim()).map((h) => [h.name.trim(), fillTemplate(h.value ?? '', event.tokens, '')])),
				},
				body,
				signal: controller.signal,
			});
			// Expired/revoked OAuth token: get a fresh one and try once more.
			if (res.status === 401 && action.oauth && !retried) {
				this.oauthTokens.delete(oauthKey(action.oauth));
				return this.request(flow, action, event, true);
			}
			const text = (await res.text().catch(() => '')).slice(0, 500);
			const summary = `${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`;
			if (!res.ok) throw new Error(summary);
			return summary;
		} catch (err) {
			if (controller.signal.aborted) throw new Error(`No answer within ${POST_TIMEOUT_MS / 1000}s`);
			throw err;
		} finally {
			clearTimeout(timer);
		}
	}

	/** OAuth 2 client-credentials access token (cached until 30s before it expires). */
	private async oauthToken(oauth: FlowOAuth): Promise<string> {
		const key = oauthKey(oauth);
		const cached = this.oauthTokens.get(key);
		if (cached && cached.expiresAt > Date.now()) return cached.token;
		const form = new URLSearchParams({ grant_type: 'client_credentials' });
		if (oauth.scope?.trim()) form.set('scope', oauth.scope.trim());
		const basic = oauth.credentials === 'basic';
		if (!basic) {
			form.set('client_id', oauth.clientId);
			form.set('client_secret', oauth.clientSecret ?? '');
		}
		const res = await fetch(oauth.tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				...(basic ? { Authorization: `Basic ${Buffer.from(`${encodeURIComponent(oauth.clientId)}:${encodeURIComponent(oauth.clientSecret ?? '')}`).toString('base64')}` } : {}),
			},
			body: form.toString(),
			signal: AbortSignal.timeout(POST_TIMEOUT_MS),
		});
		const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
		if (!res.ok || !data.access_token) {
			throw new Error(`OAuth token request failed: ${res.status} ${data.error_description || data.error || res.statusText}`);
		}
		this.oauthTokens.set(key, { token: data.access_token, expiresAt: Date.now() + Math.max(0, (data.expires_in ?? 3600) - 30) * 1000 });
		return data.access_token;
	}

	/** Everything Froggi knows about the game right now (see utils/flowState.ts). */
	gameStateObject(): FlowGameState {
		const ctx = this.context();
		const settings = this.storeLiveStats.getGameSettings();
		const frame = this.storeLiveStats.getGameFrame();
		const players = (this.storePlayers.getCurrentPlayers() ?? []).slice(0, 4);
		const score = this.storeGames.getGameScore() ?? [];
		const fight = this.storeLiveStats.fightStats.snapshot();
		const isTeams = !!settings?.isTeams;
		const round = (n: number | null | undefined) => (n != null ? Math.round(n * 10) / 10 : null);
		const slots = players.map((p, i) => {
			const post = p ? frame?.players?.[p.playerIndex]?.post : undefined;
			const setting = settings?.players?.find((s) => s?.playerIndex === p?.playerIndex);
			const key = p ? playerKey(p) : '';
			const player: FlowStatePlayer = {
				name: p?.displayName || p?.connectCode || (p ? `Port ${p.port ?? p.playerIndex + 1}` : null),
				displayName: p?.displayName || null,
				connectCode: p?.connectCode || null,
				tag: setting?.nametag || null,
				port: p?.port ?? (p ? p.playerIndex + 1 : null),
				character: p?.characterId != null ? (CHARACTER_NAMES_BY_ID[p.characterId] ?? null) : null,
				characterId: p?.characterId ?? null,
				costume: p?.characterColor ?? null,
				team: isTeams && p?.teamId != null ? (TEAM_COLORS[p.teamId] ?? null) : null,
				isCurrentPlayer: ctx.currentPlayerSlot === i,
				stocks: post?.stocksRemaining ?? null,
				percent: round(post?.percent),
				rank: { rank: p?.rank?.current?.rank ?? null, rating: round(p?.rank?.current?.rating), leaderboardPlacement: p?.rank?.current?.leaderboardPlacement ?? null },
				fight: { game: fight.game[key] ?? null, match: fight.match[key] ?? null },
			};
			return player;
		});
		const sum = (vals: (number | null)[]) => (vals.some((v) => v != null) ? round(vals.reduce<number>((a, v) => a + (v ?? 0), 0)) : null);
		// Doubles slot order is [T1P1, T2P1, T1P2, T2P2] → team 1 = slots 1 + 3, team 2 = slots 2 + 4.
		const teams: Record<string, FlowStateTeam> = {};
		if (isTeams) {
			[0, 1].forEach((t) => {
				const members = [slots[t], slots[t + 2]].filter((p): p is FlowStatePlayer => !!p);
				if (!members.length) return;
				teams[t + 1] = {
					color: members[0].team ?? TEAM_COLORS[t],
					players: members.map((m) => m.name).join(' & '),
					stocks: sum(members.map((m) => m.stocks)),
					percent: sum(members.map((m) => m.percent)),
					score: score[t] ?? 0,
				};
			});
		}
		return {
			scene: ctx.scene ?? null,
			mode: ctx.mode ?? null,
			format: isTeams ? 'doubles' : 'singles',
			isTeams,
			match: { id: settings?.matchInfo?.matchId ?? null, gameNumber: settings?.matchInfo?.gameNumber ?? null, bestOf: settings?.matchInfo?.bestOf ?? null },
			set: (() => {
				const strike = this.storeStrike.getStrikeState();
				const isActive = !!strike && strike.phase !== 'lobby' && strike.phase !== 'setComplete';
				const bestOf = isActive ? strike!.bestOf : this.storeLiveStats.getBestOf();
				const isComplete = strike?.phase === 'setComplete' || isSetComplete(score, bestOf);
				return { isActive, isComplete };
			})(),
			stage: settings?.stageId != null && STAGE_NAMES_BY_ID[settings.stageId] ? { id: settings.stageId, name: STAGE_NAMES_BY_ID[settings.stageId] } : null,
			rules: {
				stocks: settings?.players?.find((p) => p)?.startStocks ?? null,
				timerMinutes: settings?.startingTimerSeconds != null ? settings.startingTimerSeconds / 60 : null,
				friendlyFire: settings?.friendlyFireEnabled ?? null,
				isPAL: settings?.isPAL ?? null,
				isFrozenPS: settings?.isFrozenPS ?? null,
			},
			score: { 1: score[0] ?? 0, 2: score[1] ?? 0 },
			players: Object.fromEntries(slots.map((p, i) => [i + 1, p])),
			teams,
			strike: strikeFlowState(this.storeStrike.getStrikeState(), (id) => CHARACTER_NAMES_BY_ID[id] ?? null),
			lastGame: (this.webhookService.getLatestPayload(WebhookEvent.GameEnd) as Record<string, unknown> | undefined) ?? null,
			obs: { scene: ctx.obsScene ?? null, replayBuffer: !!ctx.replayBufferActive },
			odds: (() => {
				// Slot order: Player 1's side = slots 1 + 3, Player 2's side = slots 2 + 4.
				const side = (s: 0 | 1) => slots.flatMap((p, i) => {
					if (!p || i % 2 !== s || p.stocks === null) return [];
					const set = p.fight?.match;
					return [{ stocks: p.stocks, percent: p.percent ?? 0, deaths: set?.deaths, deathPercent: set?.deathPercent }];
				});
				const left = secondsLeft(settings, frame?.frame);
				const stockSeconds = fight.stockSeconds?.match ?? [];
				const c = winChances(side(0), side(1), [score[0] ?? 0, score[1] ?? 0], this.storeLiveStats.getBestOf(), left != null ? { secondsLeft: left, stockSeconds } : null);
				const pct = (n: number) => Math.round(n * 100);
				const pace = stockPace(stockSeconds);
				return {
					game: { 1: c.live ? pct(c.game[0]) : null, 2: c.live ? pct(c.game[1]) : null },
					set: { 1: pct(c.set[0]), 2: pct(c.set[1]) },
					secondsLeft: left != null ? Math.round(left) : null,
					stockSeconds: { avg: round(pace.avg), min: round(pace.min), max: round(pace.max), count: stockSeconds.length },
				};
			})(),
			replay: { file: this.storeHighlights.liveReplayFile },
			links: { tailscale: this.messageHandler.getTailscaleUrl() ?? null, ngrok: this.messageHandler.getNgrokUrl() ?? null },
			time: { now: Date.now(), today: new Date().setHours(0, 0, 0, 0) },
		};
	}

	/** The game state as {{state.…}} keys. */
	stateTokens(): FlowTokens {
		return flattenState(this.gameStateObject(), 'state');
	}
}
