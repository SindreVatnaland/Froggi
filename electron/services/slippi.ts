import {
	DolphinConnection,
	Ports,
	ConnectionEvent,
	DolphinMessageType,
	ConnectionStatus,
	SlpStream,
} from '@slippi/slippi-js';
import { inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { ConnectionState, LiveStatsScene, NotificationType } from '../../frontend/src/lib/models/enum';
import { ElectronDolphinStore } from './store/storeDolphin';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { Api } from './api';
import { ElectronSettingsStore } from './store/storeSettings';
import { findPlayKey } from '../utils/playkey';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { MemoryRead } from './memoryRead';
import { isDolphinRunning } from '../utils/dolphinProcess';
import { MessageHandler } from './messageHandler';
import { SqliteCurrentPlayer } from './sqlite/sqliteCurrentPlayer';
import { dateTimeNow } from './../utils/functions';
import { ElectronSessionStore } from './store/storeSession';
import { OverlayInjector } from './injectOverlay';

@singleton()
export class SlippiJs {
	dolphinConnection = new DolphinConnection();
	private dolphinProcessInterval: NodeJS.Timeout;
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('SlpStream') private slpStream: SlpStream,
		@inject(Api) private api: Api,
		@inject(SqliteCurrentPlayer) private sqliteCurrentPlayer: SqliteCurrentPlayer,
		@inject(ElectronCurrentPlayerStore) private storeCurrentPlayer: ElectronCurrentPlayerStore,
		@inject(ElectronDolphinStore) private storeDolphin: ElectronDolphinStore,
		@inject(ElectronLiveStatsStore) private storeLiveStats: ElectronLiveStatsStore,
		@inject(ElectronSessionStore) private storeSession: ElectronSessionStore,
		@inject(ElectronSettingsStore) private storeSettings: ElectronSettingsStore,
		@inject(MessageHandler) private messageHandler: MessageHandler,
		@inject(MemoryRead) private memoryRead: MemoryRead,
		@inject(OverlayInjector) private overlayInjection: OverlayInjector
	) {
		this.initSlippiJs();
	}

	initSlippiJs() {
		this.log.info('Initializing SlippiJs');
		this.storeLiveStats.setStatsScene(LiveStatsScene.WaitingForDolphin);
		this.startProcessSearchInterval();

		this.dolphinConnection.on(ConnectionEvent.STATUS_CHANGE, async (status) => {
			this.log.info('Dolphin Connection State:', ConnectionStatus[status]);
			if (status === ConnectionStatus.DISCONNECTED) {
				this.handleDisconnected();
			}
			if (status === ConnectionStatus.CONNECTED) {
				this.messageHandler.sendMessage('Notification', 'Dolphin connected', NotificationType.Success);
				await this.handleConnected();
			}
			if (status === ConnectionStatus.CONNECTING) {
				this.handleConnecting();
			}
		});

		this.dolphinConnection.on(ConnectionEvent.MESSAGE, (message) => {
			switch (message.type) {
				case DolphinMessageType.CONNECT_REPLY:
					this.log.info('Connected: ', message);
					break;
				case DolphinMessageType.GAME_EVENT:
					{
						const decoded = Buffer.from(message.payload, 'base64');
						this.slpStream.write(decoded);
						break;
					}
			}
		});

		this.dolphinConnection.on(ConnectionEvent.ERROR, (err) => {
			// Log the error messages we get from Dolphin
			this.log.error('Dolphin connection error', err);
			if (err.message.includes('Unexpected game data cursor')) {
				this.messageHandler.sendMessage('Notification', "Dolphin connection seems unstable, consider restarting.", NotificationType.Danger, 5000);
			}
		});
	}

	private handleDisconnected() {
		this.storeDolphin.setDolphinConnectionState(ConnectionState.Disconnected);
		this.storeLiveStats.setStatsScene(LiveStatsScene.WaitingForDolphin);
		this.memoryRead.stopMemoryRead();
		this.overlayInjection.stopInjection();
		setTimeout(() => {
			this.startProcessSearchInterval();
		}, 1000);
	}

	private handleConnecting() {
		this.storeDolphin.setDolphinConnectionState(ConnectionState.Connecting);
	}

	private async handleConnected() {
		await this.handleUserSlippiData();
		this.storeDolphin.setDolphinConnectionState(ConnectionState.Connected);
		this.storeLiveStats.setStatsScene(LiveStatsScene.Menu);
		await this.storeSession.checkAndResetSessionStats();
		this.memoryRead.initMemoryRead();
		await this.overlayInjection.injectIntoGame();
		this.stopProcessSearchInterval();
	}

	private async handleUserSlippiData() {
		this.log.info("Fetching logged in slippi user")
		const connectCode = (await findPlayKey()).connectCode;
		this.log.info("User connect code:", connectCode)
		this.storeSettings.setCurrentPlayerConnectCode(connectCode);
		let rankedNetplayProfile = (await this.sqliteCurrentPlayer.getCurrentPlayer(connectCode))?.rank?.current;
		if ((dateTimeNow().getTime() - new Date(rankedNetplayProfile?.timestamp ?? 0).getTime()) > (60 * 60 * 1000)) {
			rankedNetplayProfile = await this.api.getPlayerRankStats(connectCode);
		}
		this.log.info("Logging in user ranked netplay profile:", rankedNetplayProfile)
		await this.storeCurrentPlayer.setCurrentPlayerCurrentRankStats(rankedNetplayProfile);
		await this.storeCurrentPlayer.setCurrentPlayerNewRankStats(rankedNetplayProfile);
	}

	private async startProcessSearchInterval() {
		this.stopProcessSearchInterval();
		this.storeDolphin.setDolphinConnectionState(ConnectionState.Searching);
		this.log.info('Looking For Dolphin Process');
		this.dolphinProcessInterval = setInterval(async () => {
			const process = await isDolphinRunning();
			if (process) {
				this.log.info(`Dolphin Found: ${process}`);
				this.dolphinConnection.connect('127.0.0.1', Ports.DEFAULT);
				this.stopProcessSearchInterval();
			}
		}, 5000);
	}

	private stopProcessSearchInterval() {
		clearInterval(this.dolphinProcessInterval);
	}
}
