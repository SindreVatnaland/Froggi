// https://github.com/obs-websocket-community-projects/obs-websocket-js

import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import OBSWebSocket, { OBSRequestTypes } from 'obs-websocket-js';
import { ElectronObsStore } from './store/storeObs';
import { ObsAuth, ObsInputs, ObsItem, ObsScenes } from '../../frontend/src/lib/models/types/obsTypes';
import { MessageHandler } from './messageHandler';
import { NotificationType, ConnectionState } from '../../frontend/src/lib/models/enum';
import { enableObsWebsocket, getObsWebsocketConfig, isObsRunning } from '../utils/obsProcess';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { AspectRatio } from '../../frontend/src/lib/models/types/overlay';

@singleton()
export class ObsWebSocket {
	obs = new OBSWebSocket();
	private obsConnectionInterval: NodeJS.Timeout | undefined;
	private obsProcessInterval: NodeJS.Timeout | undefined;
	private obsPreviewInterval: NodeJS.Timeout | undefined;
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
		const inputs = inputList.inputs as unknown as ObsInputs[];
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
				this.log.error(`Could not get input volume from: ${input.inputName}`, err);
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

			try {
				const response = await this.obs.call("CreateInput", params);
				this.log.info(`Browser Source Added: ${response}`);
			} catch (createErr: any) {
				if (createErr?.message?.includes('already exists')) {
					this.log.info(`Browser source "${inputName}" already exists — updating URL`);
					await this.obs.call("SetInputSettings", {
						inputName,
						inputSettings: { url, width, height },
						overlay: true,
					});
				} else {
					throw createErr;
				}
			}

			await this.reloadBrowserSources();

			this.messageHandler.sendMessage("Notification", "Browser Source Added", NotificationType.Success, 2000);
		} catch (err) {
			this.log.error(`Could not add browser source`, err);
			this.messageHandler.sendMessage("Notification", "Browser Source Could Not Be Added", NotificationType.Danger, 2000);
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
			// Force 30s duration in whichever output mode is active
			for (const category of ['SimpleOutput', 'AdvOut']) {
				try {
					await this.obs.call('SetProfileParameter', {
						parameterCategory: category,
						parameterName: 'RecRBTime',
						parameterValue: '30',
					});
				} catch { /* ignore — category may not exist in this output mode */ }
			}

			const { outputActive } = await this.obs.call('GetReplayBufferStatus');
			if (outputActive) {
				await this.obs.call('StopReplayBuffer');
				await new Promise(resolve => setTimeout(resolve, 600));
			}
			await this.obs.call('StartReplayBuffer');
		} catch (err: any) {
			if (err?.message?.includes('not available')) {
				this.messageHandler.sendMessage(
					'Notification',
					'Enable Replay Buffer in OBS: Settings → Output → Replay Buffer → Enable Replay Buffer',
					NotificationType.Warning,
				);
			} else {
				this.log.error(`Could not start Replay Buffer`, err);
			}
		}
	};

	private searchForObs = async () => {
		clearTimeout(this.obsConnectionInterval);
		this.storeObs.setConnectionState(ConnectionState.Searching);
		const password = this.storeObs.getPassword();
		const ipAddress = this.storeObs.getIpAddress();
		const port = this.storeObs.getPort();
		this.log.info(`Connecting to OBS: ws://${ipAddress}:${port} (auth: ${password ? 'yes' : 'no'})`);
		try {
			await this.obs.connect(`ws://${ipAddress}:${port}`, password);
		} catch {
			this.log.error(`Could not connect to OBS: ws://${ipAddress}:${port}`);
		}
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
			const wasConnected = this.storeObs.getConnectionState() === ConnectionState.Connected;
			this.storeObs.setConnectionState(ConnectionState.Disconnected);
			this.shouldSendNotification = true;
			this.log.info('OBS Connection Closed');
			if (wasConnected) {
				this.startProcessSearchInterval();
			} else {
				setTimeout(() => this.startProcessSearchInterval(), 5000);
			}
		});
		this.obs.on('ConnectionError', () => {
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
		if (connectionState === ConnectionState.Searching) return;
		this.stopProcessSearchInterval();
		this.storeObs.setConnectionState(ConnectionState.Searching);
		this.log.info('Looking For OBS Process');

		const checkObs = async () => {
			const isRunning = await isObsRunning();
			if (!isRunning) {
				this.messageHandler.sendMessage('ObsProcessStatus', { running: false });
				return;
			}
			this.log.info('OBS Process Found');
			const obsWebsocketConfig = getObsWebsocketConfig();

			if (!obsWebsocketConfig) {
				this.messageHandler.sendMessage('ObsProcessStatus', { running: true });
				this.log.error('Could not get OBS Websocket Config');
				this.pauseProcessSearchInterval(60000);
				return;
			};
			this.log.info('OBS WebSocket Config: ', obsWebsocketConfig);

			const effectivePassword = obsWebsocketConfig.auth_required ? (obsWebsocketConfig.server_password ?? '') : '';
			this.messageHandler.sendMessage('ObsProcessStatus', {
				running: true,
				websocketEnabled: obsWebsocketConfig.server_enabled,
				port: String(obsWebsocketConfig.server_port ?? 4455),
				password: effectivePassword,
			});

			if (obsWebsocketConfig?.server_enabled) {
				this.storeObs.setIpAddress('127.0.0.1');
				this.storeObs.setPort(String(obsWebsocketConfig?.server_port ?? '4455'));
				this.storeObs.setPassword(effectivePassword);
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
		};

		await checkObs();
		this.obsProcessInterval = setInterval(checkObs, 15000);
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
			this.log.info(`Executing command: ${command}`, payload);
			await this.obs.call(command, payload);
			await this.updateObsData();
		} catch (err) {
			this.log.error(`Could not execute command: ${command}`, err);
			this.messageHandler.sendMessage(
				'Notification',
				`Could not execute command: ${command}`,
				NotificationType.Warning,
			);
		}
	};

	private startPreview = () => {
		clearInterval(this.obsPreviewInterval);
		this.obsPreviewInterval = setInterval(async () => {
			try {
				const scene = await this.obs.call('GetCurrentProgramScene');
				const screenshot = await this.obs.call('GetSourceScreenshot', {
					sourceName: scene.currentProgramSceneName,
					imageFormat: 'jpeg',
					imageWidth: 854,
					imageCompressionQuality: 55,
				});
				this.messageHandler.sendMessage('OBSPreview', screenshot.imageData);
			} catch {
				// OBS disconnected or source unavailable — stop polling silently
				this.stopPreview();
			}
		}, 1000);
	};

	private stopPreview = () => {
		clearInterval(this.obsPreviewInterval);
		this.obsPreviewInterval = undefined;
	};

	initEventListeners() {
		this.clientEmitter.on('ObsProcessRefresh', async () => {
			if (this.storeObs.getConnectionState() === ConnectionState.Connected) {
				const config = getObsWebsocketConfig();
				const effectivePassword = config
					? (config.auth_required ? (config.server_password ?? '') : '')
					: this.storeObs.getPassword();
				this.messageHandler.sendMessage('ObsProcessStatus', {
					running: true,
					websocketEnabled: true,
					port: this.storeObs.getPort(),
					password: effectivePassword,
				});
				return;
			}
			this.storeObs.setConnectionState(ConnectionState.Disconnected);
			await this.startProcessSearchInterval();
		});
		this.clientEmitter.on('ObsWebsocketEnable', async () => {
			if (this.storeObs.getConnectionState() === ConnectionState.Connected) return;
			const config = getObsWebsocketConfig();
			if (!config) {
				this.messageHandler.sendMessage('Notification', 'OBS not found. Make sure OBS is running.', NotificationType.Warning);
				return;
			}
			if (!config.server_enabled) {
				const ok = enableObsWebsocket();
				this.messageHandler.sendMessage(
					'Notification',
					ok
						? 'OBS WebSocket enabled. Connecting…'
						: 'Could not enable automatically — enable in OBS → Tools → WebSocket Server Settings.',
					ok ? NotificationType.Success : NotificationType.Warning,
				);
				if (ok) {
					this.storeObs.setIpAddress('127.0.0.1');
					this.storeObs.setPort(String(config.server_port ?? 4455));
					this.storeObs.setPassword(config.auth_required ? (config.server_password ?? '') : '');
					await this.searchForObs();
				}
				return;
			}
			this.storeObs.setIpAddress('127.0.0.1');
			this.storeObs.setPort(String(config.server_port ?? 4455));
			this.storeObs.setPassword(config.auth_required ? (config.server_password ?? '') : '');
			await this.searchForObs();
		});
		this.clientEmitter.on("ObsManualConnect", (auth: ObsAuth) => {
			this.connectToObs(auth.ipAddress, auth.port, auth.password);
		})
		this.clientEmitter.on("ObsCreateBrowserSource", (url: string, inputName: string, aspectRatio: AspectRatio) => {
			this.addBrowserSource(url, inputName, aspectRatio);
		})
		this.clientEmitter.on("OBSPreviewToggle", (enabled: boolean) => {
			enabled ? this.startPreview() : this.stopPreview();
		});
		this.clientEmitter.on('EnableReplayBuffer', () => {
			this.startReplayBuffer();
		});
	}
}
