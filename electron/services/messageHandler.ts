import { BrowserWindow } from 'electron';
import type { IpcMain } from 'electron';
import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import WebSocket, { WebSocketServer } from 'ws';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronSettingsStore } from './store/storeSettings';
import { ElectronObsStore } from './store/storeObs';
import { ElectronOverlayStore } from './store/storeOverlay';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { ElectronPlayersStore } from './store/storePlayers';
import { ElectronSessionStore } from './store/storeSession';
import { ElectronDolphinStore } from './store/storeDolphin';
import path from 'path';
import { exec } from 'child_process';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { scopedLog } from '../utils/logger';
import type { MessageEvents } from '../../frontend/src/lib/utils/customEventEmitter';
import { Worker } from 'worker_threads';
import { sendAuthenticatedMessage } from '../../frontend/src/lib/utils/websocketAuthentication';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { ElectronCommandStore } from './store/storeCommands';
import fs from "fs"
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Duplex } from 'stream';
import { OverlayEditor } from '../../frontend/src/lib/models/types/overlay';
import openurl from 'openurl';
import { ElectronFroggiStore } from './store/storeFroggi';
import { OverlayInjector } from './injectOverlay';
import { ElectronStrikeStore } from './store/storeStrike';
import { NgrokService } from './ngrokService';
import { ElectronWebhookStore } from './store/storeWebhook';
import { BACKEND_PORT, VITE_PORT } from '../../frontend/src/lib/models/const';
import { newId } from '../utils/functions';
import { BingoService } from './bingoService';
import { IronManService } from './ironmanService';

@singleton()
export class MessageHandler {
	private app: any = express();
	private server: any;
	private webSocketWorker: Worker = new Worker(
		path.join(__dirname, 'workers/websocketWorker.js'),
	);
	// perMessageDeflate compresses frames — the repetitive ~2KB GameFrame JSON shrinks
	// a lot over the wire, so remote viewers at 60fps cost far less bandwidth.
	private expressWss: WebSocketServer = new WebSocketServer({ noServer: true, perMessageDeflate: true });
	private expressWsConnections: Map<string, WebSocket> = new Map();
	readonly bingoPeerWss: WebSocketServer = new WebSocketServer({ noServer: true });
	readonly ironManPeerWss: WebSocketServer = new WebSocketServer({ noServer: true });
	readonly lobbyPeerWss: WebSocketServer = new WebSocketServer({ noServer: true });
	lobbyGame: 'bingo' | 'ironman' | null = null;

	constructor(
		@inject('AppDir') private appDir: string,
		@inject('Dev') private dev: boolean,
		@inject('BrowserWindow') private mainWindow: BrowserWindow,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('IpcMain') private ipcMain: IpcMain,
		@inject('RootDir') private rootDir: string,
		@inject(delay(() => ElectronDolphinStore)) private storeDolphin: ElectronDolphinStore,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronObsStore)) private storeObs: ElectronObsStore,
		@inject(delay(() => ElectronCommandStore))
		private storeObsCommands: ElectronCommandStore,
		@inject(delay(() => ElectronOverlayStore)) private storeOverlay: ElectronOverlayStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronCurrentPlayerStore))
		private storeCurrentPlayer: ElectronCurrentPlayerStore,
		@inject(delay(() => ElectronSessionStore)) private storeSession: ElectronSessionStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => ElectronFroggiStore)) private storeFroggi: ElectronFroggiStore,
		@inject(delay(() => OverlayInjector)) private overlayInjector: OverlayInjector,
		@inject(delay(() => ElectronStrikeStore)) private storeStrike: ElectronStrikeStore,
		@inject(delay(() => NgrokService)) private ngrokService: NgrokService,
		@inject(delay(() => ElectronWebhookStore)) private storeWebhook: ElectronWebhookStore,
		@inject(delay(() => BingoService)) private bingoService: BingoService,
		@inject(delay(() => IronManService)) private ironManService: IronManService,
	) {
		this.log = scopedLog(this.log, 'MessageHandler');
		this.log.info('Initializing Message Handler');
		this.app.use(cors());
		this.server = http.createServer(this.app);

		this.initElectronMessageHandler();
		this.initHtml();
		this.initWebSocket();
		this.initExpressWebSocket();
		this.initEventListeners();
	}

	private initHtml() {
		this.log.info('Initializing ExpressJs');
		this.tryCreatePublicDir(this.appDir + '/public')

		const staticFrontendServe = express.static(path.join(this.rootDir + '/build'));
		const staticFileServe = express.static(path.join(this.appDir + '/public'));

		try {
			this.app.use('/public', staticFileServe);

			this.app.get('/lobby-info', (_req: express.Request, res: express.Response) => {
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.json({ game: this.lobbyGame });
			});

			if (!this.dev) {
				this.app.use('/', staticFrontendServe);
				// SPA fallback: serve index.html ONLY for navigation requests. Asset/module
				// requests (anything with a file extension, e.g. /_app/immutable/*.js) that
				// aren't found must 404 — otherwise the browser receives index.html and fails
				// with "Importing a module script failed" when it tries to import it as JS.
				this.app.use((req: express.Request, res: express.Response) => {
					if (req.method !== 'GET' || path.extname(req.path)) {
						res.status(404).end();
						return;
					}
					res.sendFile(path.join(this.rootDir, 'build', 'index.html'));
				});
			} else {
				// Dev: proxy page requests to Vite so port 3200 can serve the frontend
				// (allows Tailscale funnel on 3200 to reach both Express WS and Vite UI)
				this.app.use('/', (req: express.Request, res: express.Response) => {
					const proxy = http.request(
						{ hostname: 'localhost', port: VITE_PORT, path: req.url, method: req.method, headers: { ...req.headers, host: `localhost:${VITE_PORT}` } },
						(proxyRes) => { res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers); proxyRes.pipe(res); },
					);
					proxy.on('error', () => res.end());
					req.pipe(proxy);
				});
			}

			this.server.on('upgrade', (req: http.IncomingMessage, socket: Duplex, head: Buffer) => {
				if (req.url?.startsWith('/peer')) {
					this.lobbyPeerWss.handleUpgrade(req, socket, head, (ws) => {
						this.lobbyPeerWss.emit('connection', ws);
					});
				} else if (req.url?.startsWith('/bingo-peer')) {
					this.bingoPeerWss.handleUpgrade(req, socket, head, (ws) => {
						this.bingoPeerWss.emit('connection', ws);
					});
				} else if (req.url?.startsWith('/ironman-peer')) {
					this.ironManPeerWss.handleUpgrade(req, socket, head, (ws) => {
						this.ironManPeerWss.emit('connection', ws);
					});
				} else {
					this.expressWss.handleUpgrade(req, socket, head, (ws) => {
						this.expressWss.emit('connection', ws);
					});
				}
			});

			this.server.listen(BACKEND_PORT, () => {
				this.log.info(`listening on *:${BACKEND_PORT}`);
			});
		} catch (err) {
			this.log.error(err);
		}
	}

	private initExpressWebSocket() {
		// Cap concurrent remote viewers (shared /live, Tailscale/ngrok) so a flood of
		// connections can't degrade the host's own experience. Local OBS uses port 3100.
		const MAX_REMOTE_CLIENTS = 5;
		this.expressWss.on('connection', (socket: WebSocket) => {
			if (this.expressWsConnections.size >= MAX_REMOTE_CLIENTS) {
				this.log.info('Express WS rejected — viewer limit reached');
				try {
					socket.send(JSON.stringify({ Notification: [`This Froggi stream is full (max ${MAX_REMOTE_CLIENTS} viewers).`, NotificationType.Warning] }));
				} catch { /* ignore */ }
				socket.close(1013, 'Stream full');
				return;
			}
			const socketId = newId();
			(socket as WebSocket & { isAlive?: boolean }).isAlive = true;
			socket.on('pong', () => { (socket as WebSocket & { isAlive?: boolean }).isAlive = true; });
			this.expressWsConnections.set(socketId, socket);
			this.log.info('Express WS connected:', socketId);

			socket.on('message', (raw) => {
				try {
					const data = JSON.parse(raw.toString());
					const authKey = data['AuthorizationKey'] ?? '';
					const matchId = data['MatchId'] ?? '';
					const serverKey = this.storeSettings.getAuthorizationKey();
					const currentMatchId = this.storeLiveStats.getGameSettings()?.matchInfo?.matchId ?? null;
					const gameMode = this.storeLiveStats.getGameMode();
					const matchIdValid = Boolean(matchId && currentMatchId && matchId === currentMatchId && gameMode === 'ranked');
					// A password MUST be set for remote commands — empty no longer means open.
					const hasServerKey = Boolean(serverKey);
					const keyValid = hasServerKey && authKey === serverKey;
					const isAuthorized = matchIdValid || keyValid;
					const allowUnauth = ['InitData', 'InitElectron', 'InitAuthentication', 'Ping'];

					for (const [key, value] of Object.entries(data)) {
						if (['AuthorizationKey', 'MatchId'].includes(key)) continue;
						if (isAuthorized || allowUnauth.includes(key)) {
							this.clientEmitter.emit(key as keyof MessageEvents, ...(value as any));
						}
						// Unauthorized commands are dropped silently — clients get a passive
						// "unauthorized" UI state (Settings → Authorization explains it). No popup
						// on connect; active command feedback is handled client-side.
					}
					this.initData(socketId);
					this.sendAuthorizedMessage(socketId, authKey, matchId);
				} catch (err) {
					this.log.error('Express WS message error:', err);
				}
			});

			socket.on('close', () => {
				this.expressWsConnections.delete(socketId);
				this.log.info('Express WS disconnected:', socketId);
			});

			this.initData(socketId);
			this.sendAuthorizedMessage(socketId, '');
		});

		// Heartbeat: mobile backgrounding / Tailscale Funnel drops often kill the socket
		// without a clean close frame, so the slot would leak and the viewer cap fill up.
		// Ping each viewer; terminate any that miss a pong (terminate fires 'close' → frees the slot).
		setInterval(() => {
			for (const [id, socket] of this.expressWsConnections) {
				const s = socket as WebSocket & { isAlive?: boolean };
				if (s.isAlive === false) {
					this.log.info('Express WS heartbeat timeout — terminating', id);
					socket.terminate();
					continue;
				}
				s.isAlive = false;
				try { socket.ping(); } catch { /* ignore */ }
			}
		}, 30000);
	}

	private tryCreatePublicDir(dir: string) {
		this.log.info('Attempting to create public dir at', dir);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
			this.log.info('Public Dir Created');
			return;
		}
		this.log.info('Public Dir Already Exists');
	}

	private initElectronMessageHandler() {
		this.ipcMain.on('message', (_: any, data: any) => {
			const parse = JSON.parse(data);
			for (const [key, value] of Object.entries(parse) as [
				key: keyof MessageEvents,
				value: Parameters<MessageEvents[keyof MessageEvents]>,
			]) {
				this.clientEmitter.emit(key as any, ...(value as any));
			}
		});
		this.clientEmitter.on('InitElectron', () => {
			this.initData();
			this.sendAuthKey();
		});
	}

	private initWebSocket() {
		try {
			this.webSocketWorker.on('message', (value: string) => {
				const parse = JSON.parse(value);
				const socketId = parse['socketId'];
				if (!socketId) return;
				for (const [key, value] of Object.entries(parse) as [
					key: keyof MessageEvents,
					value: Parameters<MessageEvents[keyof MessageEvents]>,
				]) {
					if (["socketId", "AuthorizationKey"].includes(key as string)) continue;
					sendAuthenticatedMessage(
						parse['socketId'],
						parse['AuthorizationKey'],
						this.storeSettings.getAuthorizationKey(),
						parse['MatchId'] ?? '',
						this.storeLiveStats.getGameSettings()?.matchInfo?.matchId ?? null,
						this.storeLiveStats.getGameMode(),
						this.clientEmitter,
						this.webSocketWorker,
						key as keyof MessageEvents,
						value as any,
					);
					this.initData(parse['socketId']);
					this.sendAuthorizedMessage(parse['socketId'], parse['AuthorizationKey']);
				}
			});
		} catch (err) {
			this.log.error(err);
		}
	}

	sendMessage<J extends keyof MessageEvents>(topic: J, ...payload: Parameters<MessageEvents[J]>) {
		this.sendElectronMessage(topic, ...payload);
		this.sendWebsocketMessage(topic, ...payload);
		this.localEmitter.emit(topic, ...payload);
	}

	private sendWebsocketMessage<J extends keyof MessageEvents>(topic: J, ...payload: Parameters<MessageEvents[J]>) {
		// Serialize once and reuse for the worker (3100) and every express (3200) client.
		const msg = JSON.stringify({ [topic]: payload });
		this.webSocketWorker.postMessage(msg);
		this.expressWsConnections.forEach((socket) => {
			if (socket.readyState === WebSocket.OPEN) socket.send(msg);
		});
	}

	private sendElectronMessage<J extends keyof MessageEvents>(topic: J, ...payload: Parameters<MessageEvents[J]>) {
		try {
			this.mainWindow.webContents.send(
				'message',
				JSON.stringify({
					[topic]: payload,
				}),
			);
		} catch { /* renderer frame disposed */ }
	}

	sendInitMessage<J extends keyof MessageEvents>(
		socketId: string | undefined,
		topic: J,
		...payload: Parameters<MessageEvents[J]>
	) {
		if (!socketId) {
			this.sendElectronMessage(topic, ...payload);
			return;
		}
		const expressClient = this.expressWsConnections.get(socketId);
		if (expressClient) {
			if (expressClient.readyState === WebSocket.OPEN) {
				expressClient.send(JSON.stringify({ [topic]: payload }));
			}
		} else {
			this.webSocketWorker.postMessage(JSON.stringify({ [topic]: payload, socketId }));
		}
	}

	private async initData(socketId: string | undefined = undefined) {
		this.sendInitMessage(socketId, 'CurrentPlayer', await this.storeCurrentPlayer.getCurrentPlayer());
		this.sendInitMessage(socketId, 'CurrentPlayers', this.storePlayers.getCurrentPlayers());
		this.sendInitMessage(
			socketId,
			'DolphinConnectionState',
			this.storeDolphin.getDolphinConnectionState(),
		);
		const recentGames = await this.storeGames.getRecentGames();
		this.sendInitMessage(socketId, 'GameScore', recentGames.at(-1)?.score ?? this.storeGames.getGameScore());
		this.sendInitMessage(socketId, 'GameSettings', this.storeLiveStats.getGameSettings());
		this.sendInitMessage(socketId, 'GameState', this.storeLiveStats.getGameState());
		this.sendInitMessage(socketId, 'LiveStatsSceneChange', this.storeLiveStats.getStatsScene());
		this.sendInitMessage(socketId, 'Overlays', await this.storeOverlay.getOverlays());
		this.sendInitMessage(socketId, 'Obs', this.storeObs.getObs());
		this.sendInitMessage(
			socketId,
			'ControllerCommand',
			this.storeObsCommands.getController(),
		);
		this.sendInitMessage(socketId, 'SceneSwitchCommands', this.storeObsCommands.getSceneCommands());
		this.sendInitMessage(socketId, 'PostGameStats', this.storeLiveStats.getGameStats());
		this.sendInitMessage(socketId, 'RecentGames', recentGames);
		this.sendInitMessage(socketId, 'Url', this.storeSettings.getLocalUrl());
		this.sendInitMessage(socketId, 'SessionStats', await this.storeSession.getSessionStats());
		this.sendInitMessage(socketId, 'FroggiSettings', this.storeFroggi.getFroggiConfig());
		this.sendInitMessage(socketId, 'InjectedOverlays', this.overlayInjector.injectedOverlayIds);
		this.sendInitMessage(socketId, 'RemoteAccessStatus', this.tailscaleUrl, 'tailscale');
		this.sendInitMessage(socketId, 'RemoteAccessStatus', this.ngrokUrl, 'ngrok');
		// TailscaleStatus is otherwise only broadcast on change — a client connecting after
		// the startup detection would miss it and show "not installed". Send the last known
		// status to every connecting client.
		this.sendInitMessage(socketId, 'TailscaleStatus', this.tailscaleLastStatus ?? { installed: false, authenticated: false, funnelActive: false });
		if (!socketId) {
			this.detectTailscaleStatus();
			this.detectRemoteAccess();
		}
		this.sendInitMessage(socketId, 'NgrokStatus', this.ngrokService.getStatus());
		this.sendInitMessage(socketId, 'StrikeState', this.storeStrike.getStrikeState());
		this.sendInitMessage(socketId, 'WebhookProfiles', this.storeWebhook.getProfiles());
		this.sendInitMessage(socketId, 'WebhooksEnabled', this.storeWebhook.getEnabled());
		this.sendInitMessage(socketId, 'BingoLobbyState', this.bingoService.getLobby());
		this.sendInitMessage(socketId, 'BingoState', { session: this.bingoService.getSession() });
		this.sendInitMessage(socketId, 'BingoVoteState', this.bingoService.getVoteState());
		this.sendInitMessage(socketId, 'IronManLobbyState', this.ironManService.getLobby());
		this.sendInitMessage(socketId, 'IronManState', { session: this.ironManService.getSession() });
		this.sendInitMessage(socketId, 'TwitchUsername', this.storeSettings.getTwitchUsername());
	}

	private sendAuthorizedMessage(socketId: string, clientKey: string, clientMatchId: string = '') {
		const serverKey = this.storeSettings.getAuthorizationKey();
		const currentMatchId = this.storeLiveStats.getGameSettings()?.matchInfo?.matchId ?? null;
		const gameMode = this.storeLiveStats.getGameMode();
		const matchIdValid = Boolean(clientMatchId && currentMatchId && clientMatchId === currentMatchId && gameMode === 'ranked');
		const keyValid = Boolean(serverKey) && clientKey === serverKey;
		const isAuthorized = matchIdValid || keyValid;
		this.sendInitMessage(socketId, 'Authorize', isAuthorized);
	}

	private sendAuthKey() {
		this.mainWindow.webContents.send(
			'message',
			JSON.stringify({
				['AuthorizationKey']: [this.storeSettings.getAuthorizationKey()],
			}),
		);
	}

	private tailscaleUrl: string | undefined = undefined;
	private ngrokUrl: string | undefined = undefined;

	/** Public tunnel URL for remote clients, preferring Tailscale Funnel over ngrok. Undefined if neither is up. */
	getRemoteAccessUrl(): string | undefined {
		return this.tailscaleUrl ?? this.ngrokUrl;
	}

	/** ngrok URL only — used for the public lobby invite / connect code (kept consistent with the RPC join secret). */
	getNgrokUrl(): string | undefined {
		return this.ngrokUrl;
	}

	/** Last-known Tailscale status snapshot, or null before the first detection pass has run. */
	getTailscaleStatus(): { installed: boolean; authenticated: boolean; funnelActive: boolean } | null {
		return this.tailscaleLastStatus;
	}
	private tailscaleBin: string | undefined = undefined;
	private tailscaleLastStatus: { installed: boolean; authenticated: boolean; funnelActive: boolean } | null = null;
	private tailscaleScanAttempted = false;

	private readonly tailscaleCandidates = [
		'tailscale',
		'/usr/local/bin/tailscale',
		'/opt/homebrew/bin/tailscale',
		'/Applications/Tailscale.app/Contents/MacOS/Tailscale',
	];

	private async detectTailscaleStatus(): Promise<void> {
		// Re-scan candidates only if bin not yet found. Once not installed, this repeats
		// every poll (bin never resolves) — only log the scan the first time, not every 10s.
		if (!this.tailscaleBin) {
			const logScan = !this.tailscaleScanAttempted;
			this.tailscaleScanAttempted = true;
			if (logScan) this.log.info('detectTailscaleStatus: scanning candidates');
			for (const candidate of this.tailscaleCandidates) {
				const exists = await new Promise<boolean>((resolve) => {
					exec(`"${candidate}" version`, { timeout: 2000 }, (err) => resolve(!err));
				});
				if (logScan) this.log.info(`  candidate ${candidate}: ${exists ? 'found' : 'not found'}`);
				if (exists) { this.tailscaleBin = candidate; break; }
			}
			if (logScan) this.log.info('detectTailscaleStatus: bin=', this.tailscaleBin);
		}

		const bin = this.tailscaleBin;
		if (!bin) {
			const next = { installed: false, authenticated: false, funnelActive: false };
			if (!this.tailscaleLastStatus) {
				this.log.info('detectTailscaleStatus: not installed');
				this.tailscaleLastStatus = next;
				this.sendMessage('TailscaleStatus', next);
			}
			return;
		}

		const status = await new Promise<any>((resolve) => {
			exec(`"${bin}" status --json`, { timeout: 3000 }, (err, stdout) => {
				if (err || !stdout) { resolve(null); return; }
				try { resolve(JSON.parse(stdout)); } catch { resolve(null); }
			});
		});

		const authenticated = status?.BackendState === 'Running';

		const serveStatus = await new Promise<Record<string, unknown> | null>((resolve) => {
			exec(`"${bin}" serve status --json`, { timeout: 3000 }, (err, stdout) => {
				if (err || !stdout) { resolve(null); return; }
				try { resolve(JSON.parse(stdout)); } catch { resolve(null); }
			});
		});
		const allowFunnel = serveStatus?.AllowFunnel as Record<string, unknown> | undefined;
		const funnelActive = Boolean(allowFunnel && Object.keys(allowFunnel).length > 0);

		const next = { installed: true, authenticated, funnelActive };
		const last = this.tailscaleLastStatus;
		const changed = !last || last.installed !== next.installed || last.authenticated !== next.authenticated || last.funnelActive !== next.funnelActive;

		if (changed) {
			this.log.info('detectTailscaleStatus: BackendState=', status?.BackendState, 'authenticated=', authenticated, 'AllowFunnel=', allowFunnel, 'funnelActive=', funnelActive);
			this.tailscaleLastStatus = next;
			this.sendMessage('TailscaleStatus', next);
		}
	}

	private detectRemoteAccess = async (): Promise<void> => {
		// Check ngrok independently
		const ngrokUrl = await new Promise<string | undefined>((resolve) => {
			const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => {
					try {
						const parsed = JSON.parse(data);
						const tunnel = parsed?.tunnels?.find((t: any) => t.proto === 'https');
						resolve(tunnel?.public_url);
					} catch { resolve(undefined); }
				});
			});
			req.on('error', () => resolve(undefined));
			req.setTimeout(1500, () => { req.destroy(); resolve(undefined); });
		});

		if (ngrokUrl !== this.ngrokUrl) {
			this.ngrokUrl = ngrokUrl;
			this.log.info('detectRemoteAccess: ngrokUrl=', ngrokUrl);
			this.sendMessage('RemoteAccessStatus', ngrokUrl, 'ngrok');
		}

		// Check tailscale independently (always, regardless of ngrok)
		const tailscaleUrl = await (async () => {
			for (const bin of this.tailscaleCandidates) {
				const result = await new Promise<string | undefined>((resolve) => {
					exec(`"${bin}" status --json`, { timeout: 3000 }, (err, stdout) => {
						if (err || !stdout) { resolve(undefined); return; }
						try {
							const parsed = JSON.parse(stdout);
							const dnsName = parsed?.Self?.DNSName;
							resolve(dnsName ? `https://${dnsName.replace(/\.$/, '')}` : undefined);
						} catch { resolve(undefined); }
					});
				});
				if (result) return result;
			}
			return undefined;
		})();

		if (tailscaleUrl !== this.tailscaleUrl) {
			this.tailscaleUrl = tailscaleUrl;
			this.log.info('detectRemoteAccess: tailscaleUrl=', tailscaleUrl);
			this.sendMessage('RemoteAccessStatus', tailscaleUrl, 'tailscale');
		}
	};

	private initEventListeners() {
		this.clientEmitter.on('CurrentOverlayEditor', (overlayEditor: OverlayEditor) => {
			this.sendMessage('CurrentOverlayEditor', overlayEditor);
		});
		this.clientEmitter.on('InitData', (socketId: string) => {
			this.initData(socketId);
		});
		this.clientEmitter.on('InitAuthentication', (socketId, authKey, matchId?) => {
			this.sendAuthorizedMessage(socketId, authKey ?? '', matchId ?? '');
		});
		this.clientEmitter.on('Notification', (message: string, type: NotificationType) => {
			this.sendMessage('Notification', message, type);
		});
		this.clientEmitter.on('NgrokStatus', (status: { installed: boolean; authenticated: boolean; running: boolean; url?: string; installMethod?: string }) => {
			this.sendMessage('NgrokStatus', status);
		});
		this.clientEmitter.on('RemoteAccessStatus', (url: string | undefined, provider: 'tailscale' | 'ngrok' | undefined) => {
			if (provider === 'ngrok') {
				this.ngrokUrl = url ?? undefined;
				this.sendMessage('RemoteAccessStatus', url, provider);
			}
		});
		this.clientEmitter.on('OpenUrl', (url: string) => {
			openurl.open(url);
		});
		this.clientEmitter.on('RemoteAccessRefresh', async () => {
			await this.detectRemoteAccess();
			await this.detectTailscaleStatus();
		});
		this.clientEmitter.on('TailscaleFunnel', (enable: boolean) => {
			const bin = this.tailscaleBin;
			this.log.info('TailscaleFunnel', { enable, bin, dev: this.dev });
			if (!bin) {
				this.log.warn('TailscaleFunnel: no bin found');
				this.sendMessage('Notification', 'Tailscale not installed', 'danger' as any);
				return;
			}
			const port = BACKEND_PORT;
			const args = enable ? `funnel --bg ${port}` : `funnel reset`;
			const cmd = `"${bin}" ${args}`;
			this.log.info('TailscaleFunnel exec:', cmd);
			exec(cmd, { timeout: 8000 }, async (err, stdout, stderr) => {
				this.log.info('TailscaleFunnel result', { err: err?.message, stdout: stdout?.trim(), stderr: stderr?.trim() });
				if (err) {
					const msg = stderr?.trim() || err.message || 'Tailscale funnel failed';
					this.log.error('TailscaleFunnel error:', msg);
					this.sendMessage('Notification', msg.split('\n')[0].slice(0, 80), 'danger' as any);
					return;
				}
				await this.detectRemoteAccess();
				await this.detectTailscaleStatus();
			});
		});
		this.clientEmitter.on('TailscaleLogin', () => {
			const bin = this.tailscaleBin ?? this.tailscaleCandidates[0];
			exec(`"${bin}" login`, { timeout: 120000 }, () => {
				setTimeout(async () => {
					await this.detectRemoteAccess();
					await this.detectTailscaleStatus();
				}, 2000);
			});
		});
		this.detectRemoteAccess().then(() => this.detectTailscaleStatus());

		setInterval(async () => {
			await this.detectRemoteAccess();
			await this.detectTailscaleStatus();
		}, 10000);

		this.clientEmitter.on('GetTwitchUsername', () => {
			this.sendMessage('TwitchUsername', this.storeSettings.getTwitchUsername());
		});

		this.clientEmitter.on('SaveTwitchUsername', (username: string) => {
			this.storeSettings.setTwitchUsername(username);
		});
	}
}
