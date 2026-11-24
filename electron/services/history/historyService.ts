import path from 'path';
import { Worker } from 'worker_threads';
import Store from 'electron-store';
import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import type { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { InGameState } from '../../../frontend/src/lib/models/enum';
import type { GameStats } from '../../../frontend/src/lib/models/types/slippiData';
import type { HistoryStatus } from '../../../frontend/src/lib/models/types/history';
import { MessageHandler } from '../messageHandler';
import { ElectronSettingsStore } from '../store/storeSettings';
import type { HistoryWorkerIn, HistoryWorkerOut } from '../workers/historyWorker';

const GAME_END_KEY = 'history.importOnGameEnd';
const QUERY_TIMEOUT_MS = 15_000;
// Let startup finish before counting the replay folder.
const STARTUP_DELAY_MS = 30_000;
// Re-count the folder at most this often when Settings / the AI asks for the status.
const RECOUNT_MS = 60_000;
// Slippi finishes writing the replay right after the game ends.
const GAME_END_DELAY_MS = 3_000;

/**
 * Game history for the AI: every replay in the Slippi replay folder imported into history.sqlite
 * (historyWorker), queried with read-only SQL (MCP get_game_history_schema / query_game_history).
 * The full import is started by the user (Settings → Game History "Import replays", or the AI's import_replays):
 * progress bar, Cancel keeps what was imported and the next import picks up the rest. Pauses while a game runs.
 * Each finished game is added right after it ends (toggle). Startup only counts the replays not imported yet.
 */
@singleton()
export class HistoryService {
	private worker?: Worker;
	private status: HistoryStatus;
	private queries = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
	private nextId = 1;
	private inGame = false;
	private countedAt = 0;

	constructor(
		@inject('AppDir') private appDir: string,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ElectronStore') private store: Store,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
	) {
		this.status = { state: 'idle', pending: null, total: 0, done: 0, failed: 0, games: 0, me: null, importOnGameEnd: this.importOnGameEnd(), replayRoot: null };
		this.startWorker();
		this.initListeners();
		setTimeout(() => this.recount(true), STARTUP_DELAY_MS);
	}

	getStatus(): HistoryStatus {
		return { ...this.status, replayRoot: this.root() ?? null };
	}

	/** Count the replays not imported yet (only lists the folder; skipped while importing). */
	recount(force = false) {
		const root = this.root();
		if (!root || (!force && Date.now() - this.countedAt < RECOUNT_MS)) return;
		this.countedAt = Date.now();
		this.post({ type: 'count', root });
	}

	/** Import every replay not imported yet (newest first). Picks up where a cancelled import stopped. */
	importAll(): { started: boolean; reason?: string } {
		const root = this.root();
		if (!root) return { started: false, reason: 'No Slippi replay folder found — set it in Slippi Launcher → Settings → Replays.' };
		this.post({ type: 'import', root });
		return { started: true };
	}

	/** Stop the import; what was imported stays. */
	cancelImport() {
		this.post({ type: 'cancel' });
	}

	/** One read-only SELECT against history.sqlite (rows capped). Rejects with the SQL error or a timeout. */
	query(sql: string, limit: number): Promise<{ columns: string[]; rows: Record<string, unknown>[]; truncated: boolean }> {
		const id = this.nextId++;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.queries.delete(id);
				// A runaway query blocks the worker — restart it; the import resumes from its files table.
				this.log.warn('History query timed out — restarting the history worker');
				void this.worker?.terminate();
				this.startWorker();
				if (this.status.state === 'importing' || this.status.state === 'paused') this.importAll();
				reject(new Error(`The query took longer than ${QUERY_TIMEOUT_MS / 1000} s — narrow it (WHERE, fewer joins) and try again.`));
			}, QUERY_TIMEOUT_MS);
			this.queries.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
			this.post({ type: 'query', id, sql, limit });
		});
	}

	private root() {
		return this.storeSettings.getReplayRootPath();
	}

	private importOnGameEnd() {
		return (this.store.get(GAME_END_KEY) as boolean | undefined) ?? true;
	}

	private startWorker() {
		this.worker = new Worker(path.join(__dirname, '../workers/historyWorker.js'), {
			workerData: { dbPath: path.join(this.appDir, 'history.sqlite') },
		});
		this.worker.on('message', (msg: HistoryWorkerOut) => this.onMessage(msg));
		this.worker.on('error', (e: Error) => {
			this.log.error('History worker error:', e);
			this.status = { ...this.status, state: 'error', error: String(e?.message ?? e) };
			this.sendStatus();
		});
		this.post({ type: 'setMe', code: this.storeSettings.getCurrentPlayerConnectCode() || null });
		if (this.inGame) this.post({ type: 'pause', paused: true });
	}

	private post(msg: HistoryWorkerIn) {
		this.worker?.postMessage(msg);
	}

	private onMessage(msg: HistoryWorkerOut) {
		if (msg.type === 'status') {
			this.status = { ...this.status, ...msg.status, error: undefined };
			this.sendStatus();
			return;
		}
		const pending = this.queries.get(msg.id);
		if (!pending) return;
		clearTimeout(pending.timer);
		this.queries.delete(msg.id);
		if (msg.error) pending.reject(new Error(msg.error));
		else pending.resolve(msg.result);
	}

	private sendStatus() {
		this.messageHandler.sendMessage('HistoryStatus', this.getStatus());
	}

	private initListeners() {
		this.clientEmitter.on('HistoryStatusRequest', () => {
			this.sendStatus();
			this.recount();
		});
		this.clientEmitter.on('HistoryImportStart', () => this.importAll());
		this.clientEmitter.on('HistoryImportCancel', () => this.cancelImport());
		this.clientEmitter.on('HistoryImportOnGameEnd', (enabled: boolean) => {
			this.store.set(GAME_END_KEY, enabled);
			this.status.importOnGameEnd = enabled;
			this.sendStatus();
		});
		// Don't compete with the live game for CPU.
		this.localEmitter.on('GameState', (state: InGameState | undefined) => {
			const inGame = state === InGameState.Running || state === InGameState.Paused;
			if (inGame === this.inGame) return;
			this.inGame = inGame;
			this.post({ type: 'pause', paused: inGame });
		});
		this.localEmitter.on('PostGameStats', (game: GameStats | undefined) => {
			const root = this.root();
			if (!game?.replayPath || !root || !this.importOnGameEnd()) return;
			const file = path.isAbsolute(game.replayPath) ? game.replayPath : path.join(root, game.replayPath);
			setTimeout(() => this.post({ type: 'importFile', root, file }), GAME_END_DELAY_MS);
		});
		this.store.onDidChange('settings.currentPlayer.connectCode' as never, (code: unknown) => {
			this.post({ type: 'setMe', code: (code as string) || null });
		});
	}
}
