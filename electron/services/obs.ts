// https://github.com/obs-websocket-community-projects/obs-websocket-js

import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import OBSWebSocket, { OBSRequestTypes } from 'obs-websocket-js';
import { ElectronObsStore } from './store/storeObs';
import { ObsAuth, ObsInputs, ObsItem, ObsScenes } from '../../frontend/src/lib/models/types/obsTypes';
import { MessageHandler } from './messageHandler';
import { NotificationType, ConnectionState } from '../../frontend/src/lib/models/enum';
import { getObsWebsocketConfig, isObsRunning } from '../utils/obsProcess';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { AspectRatio } from '../../frontend/src/lib/models/types/overlay';

@singleton()
export class ObsWebSocket {
	obs = new OBSWebSocket();
	private obsConnectionInterval: NodeJS.Timeout | undefined;
	private obsProcessInterval: NodeJS.Timeout | undefined;
	private shouldSendNotification = true;
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject("ClientEmitter") private clientEmitter: TypedEmitter,
		@inject(ElectronObsStore) private storeObs: ElectronObsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing OBS');
		this.initObsWebSocket();
		this.initEventListeners();
	}

	private updateObsData = async () => {
		this.updateScenes();
		this.updateInputs();
		this.updateItems();
	};

	private updateScenes = async () => {
		try {
			const scenes = await this.obs.call('GetSceneList');
			this.storeObs.setScenes(scenes as unknown as ObsScenes);
		} catch (err) {
			this.log.error(`Could not update scenes:`, err);
		}
	};

	private updateInputs = async () => {
		const inputList = await this.obs.call('GetInputList');
		let inputs = inputList.inputs as unknown as ObsInputs[];
		for (const [index, input] of inputs.entries()) {
			try {
				const volume = await this.obs.call('GetInputVolume', {
					inputName: `${input.inputName}`,
				});
				inputs[index] = {
					...input,
					volume: { ...volume },
				};
			} catch (err) {
				this.log.error(`Could not get input volume from: ${input.inputName}`);
			}

		}
		const filteredInputs = inputs.filter(
			(input) => !['browser_source'].includes(input.inputKind),
		);
		this.storeObs.setInputs(filteredInputs as unknown as ObsInputs[]);
	};

	private updateItems = async () => {
		try {
			const scenes = await this.obs.call('GetSceneList');
			const itemsList = await this.obs.call('GetSceneItemList', {
				sceneName: scenes.currentProgramSceneName,
			});
			const items = itemsList.sceneItems as unknown as ObsItem[];

			this.storeObs.setItems(items);
		} catch (err) {
			this.log.error(`Could not update items`, err);
		}
	};

	private addBrowserSource = async (url: string, inputName: string, aspectRatio: AspectRatio) => {
		this.log.info(`Adding Browser Source: ${inputName}`);
		try {
			const programScene = await this.obs.call('GetCurrentProgramScene');
			const videoInfo = await this.obs.call("GetVideoSettings");

			const width = videoInfo.baseHeight * aspectRatio.width / aspectRatio.height;
			const height = videoInfo.baseHeight;

			const params = {
				sceneName: programScene.currentProgramSceneName,
				inputName: inputName,
				inputKind: 'browser_source',
				inputSettings: {
					url: url,
					width: width,
					height: height,
				},
				sceneItemEnabled: true
			};

			const response = await this.obs.call("CreateInput", params);
			this.log.info(`Browser Source Added: ${response}`);

			await this.reloadBrowserSources();

			this.messageHandler.sendMessage("Notification", "Browser Source Added", NotificationType.Success, 2000);
		} catch (err) {
			this.log.error(`Could not add browser source`, err);
			this.messageHandler.sendMessage("Notification", "Browser Source Could Not Be Added", NotificationType.Success, 2000);
		}
	};

	private reloadBrowserSources = async () => {
		this.log.info('Refreshing Browser Sources');
		const scenes = await this.obs.call('GetSceneList');
		const sceneList = scenes.scenes.map((scene) => scene.sceneName);
		for (const scene of sceneList) {
			try {

				const itemsList = await this.obs.call('GetSceneItemList', {
					sceneName: `${scene}`,
				});
				itemsList.sceneItems.forEach(async (item) => {
					if (item.inputKind === 'browser_source') {
						try {
							this.log.info(`Refreshing browser source: ${item.sourceName}`);
							await this.obs.call('PressInputPropertiesButton', {
								inputName: `${item.sourceName}`,
								propertyName: 'refreshnocache',
							});
						} catch (err) {
							this.log.error(`Could not refresh browser source: ${item.sourceName}`, err);
						}
					}
				});
			} catch (err) {
				this.log.error(`Could not get scene items`, err);
			}
		}
	};

	private startReplayBuffer = async () => {
		try {
			const replayBufferState = await this.obs.call('GetReplayBufferStatus');
			if (replayBufferState.outputActive) return;
			await this.obs.call('StartReplayBuffer');
		} catch (err) {
			this.log.error(`Could not save Replay Buffer`, err);
		}
	};

	private searchForObs = async () => {
		clearTimeout(this.obsConnectionInterval);
		this.log.info('Searching for OBS connection');
		this.storeObs.setConnectionState(ConnectionState.Searching);
		this.obsConnectionInterval = setTimeout(async () => {
			const password = this.storeObs.getPassword();
			const ipAddress = this.storeObs.getIpAddress();
			const port = this.storeObs.getPort();
			try {
				await this.obs.connect(`ws://${ipAddress}:${port}`, password);
			} catch {
				this.log.error(
					`Could not connect to OBS: ${`ws://${ipAddress}:${port}`}`,
				);
			}
		}, 5000);
	};

	private connectToObs = async (ipAddress: string, port: string, password: string) => {
		try {
			await this.obs.connect(`ws://${ipAddress}:${port}`, password);
		} catch {
			this.log.error(
				`Could not connect to OBS: ${`ws://${ipAddress}:${port}`}`,
			);
		}
	}

	private initConnection = async () => {
		await this.updateObsData();
		await this.reloadBrowserSources();
		await this.startReplayBuffer();
	};

	private initObsWebSocket = async () => {
		this.obs.on('ConnectionClosed', async () => {
			this.startProcessSearchInterval();
			this.shouldSendNotification = true;
			this.log.info('OBS Connection Closed');
		});
		this.obs.on('ConnectionError', () => {
			this.startProcessSearchInterval();
			this.log.error('OBS Connection Error');
		});
		this.obs.on('ConnectionOpened', async () => {
			clearInterval(this.obsConnectionInterval);
			clearInterval(this.obsProcessInterval);
			this.storeObs.setConnectionState(ConnectionState.Connected);
			this.messageHandler.sendMessage("Notification", "OBS Connected", NotificationType.Success, 2000);
			setTimeout(this.initConnection.bind(this), 1000);
			this.log.info('OBS Connection Opened');

		});

		this.obs.on('CurrentProgramSceneChanged', () => {
			this.updateObsData();
		});
		this.obs.on('SceneListChanged', () => {
			this.updateObsData();
		});
		this.obs.on('InputVolumeChanged', () => {
			this.updateObsData();
		});
		this.obs.on('ReplayBufferSaved', () => {
			this.messageHandler.sendMessage(
				'Notification',
				'Replay Saved',
				NotificationType.Success,
			);
		});
		this.obs.on('ReplayBufferStateChanged', (state) => {
			this.storeObs.setReplayBufferState(state);
		});

		this.startProcessSearchInterval();
	};

	private async startProcessSearchInterval() {
		const connectionState = this.storeObs.getConnectionState();
		if (connectionState === ConnectionState.Connected) return;
		this.stopProcessSearchInterval();
		this.storeObs.setConnectionState(ConnectionState.Searching);
		this.log.info('Looking For OBS Process');
		this.obsProcessInterval = setInterval(async () => {
			const isRunning = await isObsRunning();
			if (!isRunning) return;
			this.log.info('OBS Process Found');
			const obsWebsocketConfig = getObsWebsocketConfig()

			if (!obsWebsocketConfig) {
				this.log.error('Could not get OBS Websocket Config');
				this.pauseProcessSearchInterval(60000);
				return;
			};
			this.log.info('OBS WebSocket Config: ', obsWebsocketConfig);

			if (obsWebsocketConfig?.server_enabled) {
				this.storeObs.setPort(String(obsWebsocketConfig?.server_port ?? '4455'));
				this.storeObs.setPassword(obsWebsocketConfig?.server_password ?? '');
				this.searchForObs();
				this.stopProcessSearchInterval();
				return;
			}

			if (obsWebsocketConfig?.server_enabled === false) {
				this.log.error('OBS Websocket is not enabled');
				this.pauseProcessSearchInterval(120000);
			}

			if (this.shouldSendNotification) {
				this.messageHandler.sendMessage(
					'Notification',
					'OBS Websocket is not enabled',
					NotificationType.Warning,
				);
				this.shouldSendNotification = false;
			}
		}, 15000);
	}

	private stopProcessSearchInterval() {
		clearInterval(this.obsProcessInterval);
	}

	private pauseProcessSearchInterval(timeout: number) {
		this.log.info(`Pausing OBS Process Search for ${timeout}ms`);
		clearInterval(this.obsProcessInterval);
		setTimeout(() => {
			this.startProcessSearchInterval();
		}, timeout);
	}

	executeCommand = async <T extends keyof OBSRequestTypes>(
		command: T,
		payload: OBSRequestTypes[T] | undefined,
	) => {
		try {
			await this.obs.call(command, payload);
			await this.updateObsData();
		} catch {
			this.log.error(`Could not execute command: ${command}`);
			this.messageHandler.sendMessage(
				'Notification',
				`Could not execute command: ${command}`,
				NotificationType.Warning,
			);
		}
	};

	initEventListeners() {
		this.clientEmitter.on("ObsManualConnect", (auth: ObsAuth) => {
			this.connectToObs(auth.ipAddress, auth.port, auth.password);
		})
		this.clientEmitter.on("ObsCreateBrowserSource", (url: string, inputName: string, aspectRatio: AspectRatio) => {
			this.addBrowserSource(url, inputName, aspectRatio);
		})
	}
}
