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
import { CommandType } from '../../frontend/src/lib/models/types/commandTypes';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import { WebhookEvent } from '../../frontend/src/lib/models/types/webhook';
import type { PlayerStatChangePayload, StockChangePayload, StrikeStatePayload } from '../../frontend/src/lib/models/types/webhook';
import type { Flow, FlowAction, FlowContext, FlowEvent, FlowGameMode } from '../../frontend/src/lib/models/types/flow';
import { actionsToRun, validateFlow } from '../../frontend/src/lib/utils/flowEngine';
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
		@inject(SqliteOrm) private sqlite: SqliteOrm,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => ElectronStrikeStore)) private storeStrike: ElectronStrikeStore,
		@inject(delay(() => ElectronCommandStore)) private storeCommands: ElectronCommandStore,
		@inject(delay(() => WebhookService)) private webhookService: WebhookService,
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
		this.clientEmitter.on('FlowTest', (id) => {
			const flow = this.getFlow(id);
			if (!flow) return;
			const actions = flow.nodes.flatMap((n) => (n.kind === 'action' ? [n.data] : []));
			void this.runActions(flow, actions, { type: 'gameStart' });
		});

		this.localEmitter.on('LiveStatsSceneChange', (scene: LiveStatsScene) => this.handle({ type: 'sceneChange', scene }));
		this.localEmitter.on('MemoryControllerInput', (inputs: PlayerController) => this.handleController(inputs));
		this.localEmitter.on('GameEvent', (event, payload) => this.handleGameEvent(event, payload));
	}

	private lastCombo = 0;
	private handleController(inputs: PlayerController) {
		if (!this.flows.some((f) => f.enabled && f.nodes.some((n) => n.kind === 'trigger' && n.data.type === 'controllerCombo'))) return;
		if (Date.now() - this.lastCombo < COMBO_COOLDOWN_MS) return;
		const index = this.storeCommands.getControllerIndex(inputs);
		const buttons = index === undefined ? undefined : inputs?.[index]?.buttons;
		if (!buttons || !Object.values(buttons).some(Boolean)) return;
		if (this.handle({ type: 'controllerCombo', buttons })) this.lastCombo = Date.now();
	}

	private handleGameEvent(event: WebhookEvent, payload: unknown) {
		switch (event) {
			case WebhookEvent.GameStart:
				this.prevStocks = [];
				return void this.handle({ type: 'gameStart', payload });
			case WebhookEvent.GameEnd:
				return void this.handle({ type: 'gameEnd', payload });
			case WebhookEvent.RankChange:
				return void this.handle({ type: 'rankChange', payload });
			case WebhookEvent.StrikeState:
				return void this.handle({ type: 'strikeChange', action: (payload as StrikeStatePayload | undefined)?.turn?.action ?? 'waiting', payload });
			case WebhookEvent.PercentChange: {
				const p = payload as PlayerStatChangePayload;
				[p?.p1, p?.p2].forEach((diff, i) => {
					if (diff && diff.diff > 0) {
						this.handle({ type: 'damageTaken', player: (i + 1) as 1 | 2, isCurrentPlayer: diff.isCurrentPlayer, damage: diff.diff, payload });
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
						this.handle({ type: 'stockLost', player: (i + 1) as 1 | 2, isCurrentPlayer: diff.isCurrentPlayer, payload });
					}
				});
				return;
			}
		}
	}

	/** Run every flow this event triggers. Returns whether anything ran. */
	private handle(event: FlowEvent): boolean {
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
		};
	}

	// ── Actions ──────────────────────────────────────────────────────────────────────────────────
	private async runActions(flow: Flow, actions: FlowAction[], event: FlowEvent) {
		for (const action of actions) {
			try {
				await this.runAction(flow, action, event);
			} catch (err) {
				this.log.error(`Flow "${flow.name}" action ${action.type} failed:`, err);
			}
		}
	}

	private async runAction(flow: Flow, action: FlowAction, event: FlowEvent) {
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

	private bodyFor(action: Extract<FlowAction, { type: 'httpPost' }>, event: FlowEvent): unknown {
		if (action.body === 'trigger') return 'payload' in event ? (event.payload ?? null) : event;
		if (action.body === 'gameState') return this.gameState();
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

	private async post(flow: Flow, action: Extract<FlowAction, { type: 'httpPost' }>, event: FlowEvent) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
		try {
			const res = await fetch(action.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(action.bearerToken ? { Authorization: `Bearer ${action.bearerToken}` } : {}),
				},
				body: JSON.stringify({ flow: flow.name, trigger: event.type, timestamp: new Date().toISOString(), payload: this.bodyFor(action, event) }),
				signal: controller.signal,
			});
			if (!res.ok) this.log.warn(`Flow "${flow.name}" POST ${action.url} → ${res.status}`);
		} finally {
			clearTimeout(timer);
		}
	}
}
