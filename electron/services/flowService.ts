import { delay, inject, singleton } from 'tsyringe';
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
import { WebhookService } from './webhookService';
import { ElectronObsStore } from './store/storeObs';
import { CommandType } from '../../frontend/src/lib/models/types/commandTypes';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import { WebhookEvent } from '../../frontend/src/lib/models/types/webhook';
import type { GameEndPayload, GameStartPayload, PlayerStatChangePayload, RankChangePayload, StockChangePayload, StrikeStatePayload } from '../../frontend/src/lib/models/types/webhook';
import type { Flow, FlowAction, FlowContext, FlowEventWithTokens, FlowGameMode } from '../../frontend/src/lib/models/types/flow';
import { actionsToRun, fillTemplate, flowForImport, flowForSharing, triggerMatches, validateFlow } from '../../frontend/src/lib/utils/flowEngine';
import { buildFroggiZip, FROGGI_EXT, readFroggiZip, readJsonEntry, safeName, wrongKindMessage } from '../utils/froggiFile';
import { app, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { ComboHold, comboKey } from '../utils/comboHold';
import type { PlayerController } from '../../frontend/src/lib/models/types/controller';

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
	) {
		this.log = scopedLog(this.log, 'Flows');
		this.log.info('Initializing Flow Service');
		void this.load();
		this.initListeners();
	}

	// ── Storage (SQLite) ─────────────────────────────────────────────────────────────────────────
	private async load() {
		await this.sqlite.initializing;
		this.repo = this.sqlite.getRepository(FlowEntity);
		const rows = (await this.repo.find()) ?? [];
		this.flows = rows.map((r) => ({ ...r, updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined }));
		this.emitFlows();
	}

	getFlows(): Flow[] {
		return this.flows;
	}

	getFlow(id: string): Flow | undefined {
		return this.flows.find((f) => f.id === id);
	}

	/** Save (create or update). Returns validation problems instead of saving when there are any. */
	async saveFlow(flow: Flow): Promise<{ ok: true; flow: Flow } | { ok: false; problems: string[] }> {
		const problems = validateFlow(flow);
		if (problems.length) return { ok: false, problems };
		await this.sqlite.initializing;
		const repo = this.repo ?? this.sqlite.getRepository(FlowEntity);
		await repo.save(repo.create({ id: flow.id, name: flow.name.trim(), enabled: flow.enabled, format: flow.format, nodes: flow.nodes, edges: flow.edges }));
		const saved = { ...flow, name: flow.name.trim(), updatedAt: new Date().toISOString() };
		this.flows = [...this.flows.filter((f) => f.id !== flow.id), saved];
		this.emitFlows();
		return { ok: true, flow: saved };
	}

	async deleteFlow(id: string) {
		await this.sqlite.initializing;
		await (this.repo ?? this.sqlite.getRepository(FlowEntity)).delete({ id });
		this.flows = this.flows.filter((f) => f.id !== id);
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
		this.clientEmitter.on('FlowTest', (id) => {
			const flow = this.getFlow(id);
			if (!flow) return;
			const actions = flow.nodes.flatMap((n) => (n.kind === 'action' ? [n.data] : []));
			void this.runActions(flow, actions, { type: 'gameStart' });
		});

		this.localEmitter.on('LiveStatsSceneChange', (scene: LiveStatsScene) => this.handle({ type: 'sceneChange', scene, tokens: { scene } }));
		this.localEmitter.on('MemoryControllerInput', (inputs: PlayerController) => this.handleController(inputs));
		this.localEmitter.on('GameEvent', (event, payload) => this.handleGameEvent(event, payload));
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
			case WebhookEvent.GameStart:
				this.prevStocks = [];
				return void this.handle({ type: 'gameStart', payload, tokens: { stage: (payload as GameStartPayload)?.stage?.name ?? null, mode: (payload as GameStartPayload)?.mode ?? null } });
			case WebhookEvent.GameEnd:
				return void this.handle({ type: 'gameEnd', payload, tokens: this.gameEndTokens(payload as GameEndPayload) });
			case WebhookEvent.RankChange:
				return void this.handle({ type: 'rankChange', payload, tokens: this.rankTokens(payload as RankChangePayload) });
			case WebhookEvent.StrikeState:
				{
					const strike = payload as StrikeStatePayload | undefined;
					const action = strike?.turn?.action ?? 'waiting';
					return void this.handle({ type: 'strikeChange', action, payload, tokens: { action, playerName: strike?.turn?.name ?? null, phase: strike?.phase ?? null } });
				}
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

	/** Run every flow this event triggers. Returns whether anything ran. */
	private handle(event: FlowEventWithTokens): boolean {
		if (!this.flows.length) return false;
		const ctx = this.context();
		let ran = false;
		for (const flow of this.flows) {
			const actions = actionsToRun(flow, event, ctx);
			if (!actions.length) continue;
			const last = this.lastRun.get(flow.id) ?? 0;
			if (Date.now() - last < FLOW_COOLDOWN_MS) continue;
			this.lastRun.set(flow.id, Date.now());
			ran = true;
			void this.runActions(flow, actions, event);
		}
		return ran;
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

	// ── Actions ──────────────────────────────────────────────────────────────────────────────────
	private async runActions(flow: Flow, actions: FlowAction[], event: FlowEventWithTokens) {
		for (const action of actions) {
			try {
				await this.runAction(flow, action, event);
			} catch (err) {
				this.log.error(`Flow "${flow.name}" action ${action.type} failed:`, err);
			}
		}
	}

	private async runAction(flow: Flow, action: FlowAction, event: FlowEventWithTokens) {
		switch (action.type) {
			case 'obsScene':
				return this.storeCommands.executeCommand(CommandType.Obs, 'SetCurrentProgramScene', { sceneName: action.sceneName });
			case 'obsToggleSource':
				return this.storeCommands.executeCommand(CommandType.ObsCustom, 'ToggleSceneItem', { itemName: action.sourceName });
			case 'obsVolume':
				return this.storeCommands.executeCommand(CommandType.Obs, 'SetInputVolume', { inputName: action.inputName, inputVolumeMul: action.volume });
			case 'obsSaveReplay':
				return this.storeCommands.executeCommand(CommandType.Obs, 'SaveReplayBuffer', undefined);
			case 'httpPost':
				return this.post(flow, action, event);
		}
	}

	private gameEndTokens(p: GameEndPayload | undefined) {
		const score = p?.score ?? [];
		return { stage: p?.stage?.name ?? null, method: p?.gameEndMethod ?? null, score: score.length ? score.join('-') : null };
	}

	private rankTokens(p: RankChangePayload | undefined) {
		return { playerName: p?.displayName || p?.connectCode || null, rating: p?.after?.rating ?? null, ratingChange: p?.diff?.rating ?? null, rank: (p?.after as { rank?: string } | undefined)?.rank ?? null };
	}

	private bodyFor(action: Extract<FlowAction, { type: 'httpPost' }>, event: FlowEventWithTokens): unknown {
		if (action.body === 'trigger') return 'payload' in event ? (event.payload ?? null) : event;
		if (action.body === 'gameState') return this.gameState();
		if (action.body === 'custom') return null;
		return this.webhookService.getLatestPayload(action.body);
	}

	/** Snapshot of the current game for POST bodies. */
	gameState() {
		const ctx = this.context();
		const players = this.storePlayers.getCurrentPlayers() ?? [];
		return {
			scene: ctx.scene,
			mode: ctx.mode ?? null,
			format: ctx.isTeams ? 'doubles' : 'singles',
			players: [0, 1].map((i) => ({
				displayName: players[i]?.displayName ?? null,
				connectCode: players[i]?.connectCode ?? null,
				characterId: players[i]?.characterId ?? null,
				stocks: ctx.players[i]?.stocks ?? null,
				percent: ctx.players[i]?.percent ?? null,
				isCurrentPlayer: ctx.currentPlayerSlot === i,
			})),
			strike: this.webhookService.getLatestPayload(WebhookEvent.StrikeState),
		};
	}

	private async post(flow: Flow, action: Extract<FlowAction, { type: 'httpPost' }>, event: FlowEventWithTokens) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
		try {
			const res = await fetch(action.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(action.bearerToken ? { Authorization: `Bearer ${action.bearerToken}` } : {}),
				},
				// Custom body: the user's JSON template with {{key}} filled; otherwise Froggi's envelope.
				body:
					action.body === 'custom'
						? fillTemplate(action.template ?? '{}', event.tokens)
						: JSON.stringify({ flow: flow.name, trigger: event.type, timestamp: new Date().toISOString(), tokens: event.tokens ?? {}, payload: this.bodyFor(action, event) }),
				signal: controller.signal,
			});
			if (!res.ok) this.log.warn(`Flow "${flow.name}" POST ${action.url} → ${res.status}`);
		} finally {
			clearTimeout(timer);
		}
	}
}
