import { BrowserWindow } from 'electron';
import type { IpcMain } from 'electron';
import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
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

@singleton()
export class MessageHandler {
	private app: any = express();
	private server: any;
	private webSocketWorker: Worker = new Worker(
		path.join(__dirname, 'workers/websocketWorker.js'),
	);

	constructor(
		@inject('AppDir') private appDir: string,
		@inject('Dev') private dev: boolean,
		@inject('BrowserWindow') private mainWindow: BrowserWindow,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('IpcMain') private ipcMain: IpcMain,
		@inject('Port') private port: string,
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
	) {
		this.log.info('Initializing Message Handler');
		this.app.use(cors());
		this.server = http.createServer(this.app);

		this.initElectronMessageHandler();
		this.initHtml();
		this.initWebSocket();
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
			}
			this.server.listen(3200, (_: any) => {
				this.log.info(`listening on *:${this.port}`);
			});
		} catch (err) {
			this.log.error(err);
		}
	}

	private tryCreatePublicDir(dir: string) {
		this.log.info('Creating Public Dir');
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
			this.log.info('Public Dir Created');
			return;
		}
		this.log.info('Public Dir Already Exists');
	}

	private initElectronMessageHandler() {
		this.ipcMain.on('message', (_: any, data: any) => {
			let parse = JSON.parse(data);
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
				for (let [key, value] of Object.entries(parse) as [
					key: keyof MessageEvents,
					value: Parameters<MessageEvents[keyof MessageEvents]>,
				]) {
					if (["socketId", "AuthorizationKey"].includes(key as string)) continue;
					sendAuthenticatedMessage(
						parse['socketId'],
						parse['AuthorizationKey'],
						this.storeSettings.getAuthorizationKey(),
						this.clientEmitter,
						this.webSocketWorker,
						key as keyof MessageEvents,
						value as any,
					);
					this.initData(parse['socketId']);
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
		this.webSocketWorker.postMessage(
			JSON.stringify({
				[topic]: payload,
			}),
		);
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
		if (socketId) {
			this.sendWebsocketMessage(topic, ...payload);
		} else {
			this.sendElectronMessage(topic, ...payload);
		}
	}

	private async initData(socketId: string | undefined = undefined) {
		console.log("Init Data", socketId)
		this.sendInitMessage(socketId, 'CurrentPlayer', this.storeCurrentPlayer.getCurrentPlayer());
		this.sendInitMessage(socketId, 'CurrentPlayers', this.storePlayers.getCurrentPlayers());
		this.sendInitMessage(
			socketId,
			'DolphinConnectionState',
			this.storeDolphin.getDolphinConnectionState(),
		);
		this.sendInitMessage(socketId, 'GameScore', this.storeGames.getGameScore());
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
		this.sendInitMessage(socketId, 'RecentGames', this.storeGames.getRecentGames());
		this.sendInitMessage(socketId, 'Url', this.storeSettings.getLocalUrl());
		this.sendInitMessage(socketId, 'SessionStats', this.storeSession.getSessionStats());
	}

	private sendAuthorizedMessage(socketId: string, clientKey: string) {
		const serverKey = this.storeSettings.getAuthorizationKey();
		const isAuthorized = !serverKey || clientKey === serverKey;
		console.log('Is Authorized', isAuthorized, clientKey, serverKey, socketId);
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

	private initEventListeners() {
		this.clientEmitter.on('LayerPreviewChange', (layerIndex: number) => {
			this.sendMessage('LayerPreviewChange', layerIndex);
		});
		this.clientEmitter.on('InitData', (socketId: string) => {
			this.initData(socketId);
		});
		this.clientEmitter.on('InitAuthentication', (socketId, authKey) => {
			this.sendAuthorizedMessage(socketId, authKey ?? '');
		});
		this.clientEmitter.on('Notification', (message: string, type: NotificationType) => {
			this.sendMessage('Notification', message, type);
		});
	}
}
