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
import { BACKEND_PORT, VITE_PORT } from '../../frontend/src/lib/models/const';
import { newId } from '../utils/functions';

@singleton()
export class MessageHandler {
	private app: any = express();
	private server: any;
	private webSocketWorker: Worker = new Worker(
		path.join(__dirname, 'workers/websocketWorker.js'),
	);
	private expressWss: WebSocketServer = new WebSocketServer({ noServer: true });
	private expressWsConnections: Map<string, WebSocket> = new Map();

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
	) {
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

			if (!this.dev) {
				this.app.use('/', staticFrontendServe);
				this.app.use('*', staticFrontendServe);
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
				this.expressWss.handleUpgrade(req, socket, head, (ws) => {
					this.expressWss.emit('connection', ws);
				});
			});

			this.server.listen(BACKEND_PORT, () => {
				this.log.info(`listening on *:${BACKEND_PORT}`);
			});
		} catch (err) {
			this.log.error(err);
		}
	}

	private initExpressWebSocket() {
		this.expressWss.on('connection', (socket: WebSocket) => {
			const socketId = newId();
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
					const keyValid = !serverKey || authKey === serverKey;
					const isAuthorized = matchIdValid || keyValid;
					const allowUnauth = ['InitData', 'InitElectron', 'InitAuthentication', 'Ping'];

					for (const [key, value] of Object.entries(data)) {
						if (['AuthorizationKey', 'MatchId'].includes(key)) continue;
						if (isAuthorized || allowUnauth.includes(key)) {
							this.clientEmitter.emit(key as keyof MessageEvents, ...(value as any));
						} else {
							if (socket.readyState === WebSocket.OPEN) {
								socket.send(JSON.stringify({ Notification: ['Unauthorized - Update key in settings', NotificationType.Danger] }));
							}
						}
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
		this.webSocketWorker.postMessage(JSON.stringify({ [topic]: payload }));
		const msg = JSON.stringify({ [topic]: payload });
		this.expressWsConnections.forEach((socket) => {
			if (socket.readyState === WebSocket.OPEN) socket.send(msg);
		});
	}

	private sendElectronMessage<J extends keyof MessageEvents>(topic: J, ...payload: Parameters<MessageEvents[J]>) {
		this.mainWindow.webContents.send(
			'message',
			JSON.stringify({
				[topic]: payload,
			}),
		);
		this.localEmitter.emit(topic, ...payload);
	}

	private sendInitMessage<J extends keyof MessageEvents>(
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
		console.log("Init Data", socketId)
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
		this.sendInitMessage(socketId, 'RemoteAccessStatus', this.remoteAccessUrl, this.remoteAccessProvider);
		if (!socketId) this.detectTailscaleStatus();
		this.sendInitMessage(socketId, 'StrikeState', this.storeStrike.getStrikeState());
	}

	private sendAuthorizedMessage(socketId: string, clientKey: string, clientMatchId: string = '') {
		const serverKey = this.storeSettings.getAuthorizationKey();
		const currentMatchId = this.storeLiveStats.getGameSettings()?.matchInfo?.matchId ?? null;
		const gameMode = this.storeLiveStats.getGameMode();
		const matchIdValid = Boolean(clientMatchId && currentMatchId && clientMatchId === currentMatchId && gameMode === 'ranked');
		const keyValid = !serverKey || clientKey === serverKey;
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

	private remoteAccessUrl: string | undefined = undefined;
	private remoteAccessProvider: 'tailscale' | 'ngrok' | undefined = undefined;
	private tailscaleBin: string | undefined = undefined;

	private readonly tailscaleCandidates = [
		'tailscale',
		'/usr/local/bin/tailscale',
		'/opt/homebrew/bin/tailscale',
		'/Applications/Tailscale.app/Contents/MacOS/Tailscale',
	];

	private async detectTailscaleStatus(): Promise<void> {
		this.log.info('detectTailscaleStatus: scanning candidates');
		let bin: string | undefined;
		for (const candidate of this.tailscaleCandidates) {
			const exists = await new Promise<boolean>((resolve) => {
				exec(`"${candidate}" version`, { timeout: 2000 }, (err) => resolve(!err));
			});
			this.log.info(`  candidate ${candidate}: ${exists ? 'found' : 'not found'}`);
			if (exists) { bin = candidate; break; }
		}
		this.tailscaleBin = bin;
		this.log.info('detectTailscaleStatus: bin=', bin);

		if (!bin) {
			this.log.info('detectTailscaleStatus: not installed');
			this.sendMessage('TailscaleStatus', { installed: false, authenticated: false, funnelActive: false });
			return;
		}

		const status = await new Promise<any>((resolve) => {
			exec(`"${bin}" status --json`, { timeout: 3000 }, (err, stdout) => {
				this.log.info('detectTailscaleStatus: status err=', err?.message, 'stdout len=', stdout?.length);
				if (err || !stdout) { resolve(null); return; }
				try { resolve(JSON.parse(stdout)); } catch { resolve(null); }
			});
		});

		const authenticated = status?.BackendState === 'Running';

		const serveStatus = await new Promise<Record<string, unknown> | null>((resolve) => {
			exec(`"${bin}" serve status --json`, { timeout: 3000 }, (err, stdout) => {
				this.log.info('detectTailscaleStatus: serve status err=', err?.message, 'stdout=', stdout?.slice(0, 200));
				if (err || !stdout) { resolve(null); return; }
				try { resolve(JSON.parse(stdout)); } catch { resolve(null); }
			});
		});
		const allowFunnel = serveStatus?.AllowFunnel as Record<string, unknown> | undefined;
		const funnelActive = Boolean(allowFunnel && Object.keys(allowFunnel).length > 0);

		this.log.info('detectTailscaleStatus: BackendState=', status?.BackendState, 'authenticated=', authenticated, 'AllowFunnel=', allowFunnel, 'funnelActive=', funnelActive);
		this.sendMessage('TailscaleStatus', { installed: true, authenticated, funnelActive });
	}

	private detectRemoteAccess = async (): Promise<void> => {
		// Try ngrok local API
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

		this.log.info('detectRemoteAccess: ngrokUrl=', ngrokUrl);
		if (ngrokUrl) {
			this.remoteAccessUrl = ngrokUrl;
			this.remoteAccessProvider = 'ngrok';
			this.sendMessage('RemoteAccessStatus', ngrokUrl, 'ngrok');
			return;
		}

		// Try tailscale — try several binary locations since Electron PATH is minimal
		const tailscaleUrl = await (async () => {
			for (const bin of this.tailscaleCandidates) {
				const result = await new Promise<string | undefined>((resolve) => {
					exec(`"${bin}" status --json`, { timeout: 3000 }, (err, stdout) => {
						this.log.info(`detectRemoteAccess: tailscale ${bin} err=${err?.message} dnsName=${(() => { try { return JSON.parse(stdout ?? '{}')?.Self?.DNSName; } catch { return '?'; } })()}`);
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

		this.log.info('detectRemoteAccess: tailscaleUrl=', tailscaleUrl);
		if (tailscaleUrl) {
			this.remoteAccessUrl = tailscaleUrl;
			this.remoteAccessProvider = 'tailscale';
			this.sendMessage('RemoteAccessStatus', tailscaleUrl, 'tailscale');
			return;
		}

		this.remoteAccessUrl = undefined;
		this.remoteAccessProvider = undefined;
		this.log.info('detectRemoteAccess: no tunnel found');
		this.sendMessage('RemoteAccessStatus', undefined, undefined);
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
	}
}
