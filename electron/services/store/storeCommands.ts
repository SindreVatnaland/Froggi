// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import {
	CommandType,
	Controller,
	ControllerCommand,
	SceneSwitchCommands,
	Command,
	RequestType,
	ObsCustomRequest,
	PayloadType,
	ObsCustomPayload,
} from '../../../frontend/src/lib/models/types/commandTypes';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import {
	InGameState,
	LiveStatsScene,
} from '../../../frontend/src/lib/models/enum';
import { PlayerController } from '../../../frontend/src/lib/models/types/controller';
import { ElectronPlayersStore } from './storePlayers';
import { ElectronSettingsStore } from './storeSettings';
import { ObsWebSocket } from '../obs';
import { MessageHandler } from '../messageHandler';
import { newId } from '../../utils/functions';
import { ElectronLiveStatsStore } from './storeLiveStats';
import { isNil } from 'lodash';
import { getSubsetCommands } from '../../../frontend/src/lib/utils/controllerCommandHelper';
import { OBSRequestTypes } from 'obs-websocket-js';
import { ObsItem } from '../../../frontend/src/lib/models/types/obsTypes';

@singleton()
export class ElectronCommandStore {
	private store: Store = new Store();
	private controllerCommands: ControllerCommand[] = [];
	private controllerCommandState: boolean = false;
	private commandTimeout: boolean = false;
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,

		@inject(ObsWebSocket) private obsWebSocket: ObsWebSocket,
		@inject(ElectronPlayersStore) private storePlayer: ElectronPlayersStore,
		@inject(ElectronSettingsStore) private storeSettings: ElectronSettingsStore,
		@inject(ElectronLiveStatsStore) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing Obs Command Store');
		this.initListeners();
		this.initEventListeners();
		this.init();
	}

	getController(): Controller {
		return this.store.get('command.controller') as Controller;
	}

	setController(controller: Controller) {
		this.store.set('command.controller', controller);
		this.controllerCommands = controller.inputCommands as ControllerCommand[];
		this.controllerCommandState = controller.enabled as boolean;
	}

	getControllerCommandInputs(): ControllerCommand[] {
		return this.controllerCommands ?? [];
	}

	addControllerCommand(command: ControllerCommand) {
		const commands = this.getControllerCommandInputs();
		this.store.set('command.controller.inputCommands', [
			...commands,
			{ ...command, id: newId() },
		]);
	}

	deleteControllerCommand(commandId: string) {
		const controllerCommands = this.getControllerCommandInputs() ?? [];
		this.store.set(
			'command.controller.inputCommands',
			controllerCommands.filter((controllerCommands) => controllerCommands.id !== commandId),
		);
	}

	getControllerCommandsState(): boolean {
		return this.controllerCommandState ?? false;
	}

	toggleControllerCommandsState() {
		const state = (this.store.get('command.controller.enabled') as boolean) ?? false;
		this.store.set('command.controller.enabled', !state);
	}

	getSceneCommands(): SceneSwitchCommands {
		return (
			(this.store.get('command.sceneSwitch') as SceneSwitchCommands) ?? {
				enabled: false,
				[LiveStatsScene.WaitingForDolphin]: [],
				[LiveStatsScene.Menu]: [],
				[LiveStatsScene.InGame]: [],
				[LiveStatsScene.PostGame]: [],
				[LiveStatsScene.PostSet]: [],
				[LiveStatsScene.RankChange]: [],
			}
		);
	}

	getSceneCommandsByScene(scene: LiveStatsScene): Command[] {
		const sceneCommands = this.getSceneCommands();
		return sceneCommands[scene];
	}

	setSceneCommands(value: SceneSwitchCommands) {
		this.store.set('command.sceneSwitch', value);
	}

	addSceneCommand(scene: LiveStatsScene, command: Command) {
		const sceneCommands = this.getSceneCommands();
		if (!Array.isArray(sceneCommands[scene])) {
			sceneCommands[scene] = [];
		}
		sceneCommands[scene] = [...sceneCommands[scene], { ...command, id: newId() }];
		this.setSceneCommands(sceneCommands);
	}

	deleteSceneCommand(scene: LiveStatsScene, commandId: string) {
		const sceneCommands = this.getSceneCommands();
		sceneCommands[scene] = sceneCommands[scene].filter((command) => command.id !== commandId);
		this.setSceneCommands(sceneCommands);
	}

	getSceneSwitchCommandsState(): boolean {
		return this.getSceneCommands().enabled;
	}

	toggleSceneSwitchCommandsState() {
		const state = this.getSceneSwitchCommandsState();
		if (isNil(state)) return;
		this.store.set('command.sceneSwitch.enabled', !state);
	}

	private init() {
		this.controllerCommands =
			(this.store.get('command.controller.inputCommands') as ControllerCommand[]) ?? [];
		this.controllerCommandState =
			(this.store.get('command.controller.enabled') as boolean) ?? false;
	}

	private getControllerIndex = (playerControllerInputs: PlayerController): number | undefined => {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		const players = this.storePlayer.getCurrentPlayers();
		const player = players?.find((player) => player.connectCode === connectCode);

		const isSpectating = players?.some((player) => player.connectCode) && !player
		if (isSpectating) return;
		const isGameActive = [InGameState.Running, InGameState.Paused].includes(
			this.storeLiveStats.getGameState(),
		);
		const lowestActiveControllerIndex = Number(
			Object.entries(playerControllerInputs)?.find(
				([, controller]) => controller.isConnected,
			)?.[0],
		);
		const lowestIndex = isGameActive
			? players?.sort((a, b) => a.port - b.port).at(0)?.playerIndex ?? 0
			: lowestActiveControllerIndex;

		return player?.playerIndex ?? lowestIndex;
	};

	private handleControllerCommand = (playerControllerInputs: PlayerController) => {
		if (!this.getControllerCommandsState()) return;
		if (this.commandTimeout) return;

		const controllerIndex = this.getControllerIndex(playerControllerInputs);

		if (isNil(controllerIndex)) return;

		const buttonInputs = playerControllerInputs?.[controllerIndex]?.buttons;

		const controllerCommands = getSubsetCommands(this.controllerCommands, buttonInputs);
		if (!controllerCommands) return;

		controllerCommands.forEach(async (controllerCommand) => {
			await this.executeCommand(
				CommandType.Obs,
				controllerCommand.command.requestType,
				controllerCommand.command.payload,
			);
		});
		this.commandTimeout = true;
		setTimeout(() => {
			this.commandTimeout = false;
		}, 1000);
	};

	private handleSceneChangeCommands = async (commands: Command[]) => {
		if (!this.getSceneSwitchCommandsState()) return;
		commands?.forEach(async (command) => {
			await this.executeCommand(command.type, command.requestType, command.payload);
		});
	};

	executeCommand = async <Type extends keyof PayloadType>(
		type: CommandType,
		requestType: RequestType,
		payload: PayloadType[Type],
	) => {
		if (type === CommandType.Obs)
			await this.executeObsCommand(requestType as keyof OBSRequestTypes, payload);
		if (type === CommandType.ObsCustom)
			await this.executeObsCustomCommand(
				requestType as ObsCustomRequest,
				payload as ObsCustomPayload<ObsCustomRequest>,
			);
		// if (type === CommandType.Overlay)
		// 	await this.executeOverlayCommand(
		// 		requestType as OverlayRequest,
		// 		payload as OverlayPayload<OverlayRequest>,
		// 	);
	};

	private executeObsCommand = async <T extends keyof OBSRequestTypes>(
		command: T,
		payload: OBSRequestTypes[T] | undefined,
	) => {
		await this.obsWebSocket.executeCommand(command, payload);
	};

	private executeObsCustomCommand = async <T extends ObsCustomRequest>(
		command: T,
		payload: ObsCustomPayload<T>,
	) => {
		switch (command) {
			case 'ToggleSceneItem':
				await this.toggleSceneItem(payload.itemName);
		}
	};

	// private executeOverlayCommand = async <T extends OverlayRequest>(
	// 	command: T,
	// 	payload: OverlayPayload<T>,
	// ) => {
	// 	this.log.info('Executing Overlay Command', command, payload);
	// 	switch (command) {
	// 		// case 'ChangeScene':
	// 		// 	this.storeLiveStats.setStatsScene(payload.liveStatsScene);
	// 	}
	// };

	private toggleSceneItem = async (itemName: string) => {
		try {
			const scene = (await this.obsWebSocket.obs.call('GetCurrentProgramScene'))
				.currentProgramSceneName;
			const item = (
				await this.obsWebSocket.obs.call('GetSceneItemList', { sceneName: scene })
			).sceneItems.find((item) => item.name === itemName) as unknown as ObsItem;
			const state = (
				await this.obsWebSocket.obs.call('GetSceneItemEnabled', {
					sceneName: scene,
					sceneItemId: item.sceneItemId,
				})
			).sceneItemEnabled;
			this.executeCommand(CommandType.Obs, 'SetSceneItemEnabled', {
				sceneName: scene,
				sceneItemId: item.sceneItemId,
				enabled: state,
			});
		} catch (err) {
			this.log.error(err);
		}
	};

	private initEventListeners() {
		this.clientEmitter.on('ExecuteCommand', async (type, command, payload) => {
			this.executeCommand(type, command, payload);
		});
		this.localEmitter.on('MemoryControllerInput', (controllerInputs) => {
			this.handleControllerCommand(controllerInputs);
		});
		this.localEmitter.on('LiveStatsSceneChange', (scene: LiveStatsScene) => {
			const commands = this.getSceneCommandsByScene(scene);
			if (!commands) return;
			this.handleSceneChangeCommands(commands);
		});
		this.clientEmitter.on(
			'SceneSwitchCommandAdd',
			(scene: LiveStatsScene, command: Command) => {
				this.addSceneCommand(scene, command);
			},
		);
		this.clientEmitter.on(
			'SceneSwitchCommandDelete',
			(scene: LiveStatsScene, commandId: string) => {
				this.deleteSceneCommand(scene, commandId);
			},
		);
		this.clientEmitter.on('SceneSwitchCommandStateToggle', () => {
			this.toggleSceneSwitchCommandsState();
		});
		this.clientEmitter.on('ControllerCommandAdd', (command: ControllerCommand) => {
			this.addControllerCommand(command);
		});
		this.clientEmitter.on('ControllerCommandDelete', (commandId: string) => {
			this.deleteControllerCommand(commandId);
		});
		this.clientEmitter.on('ControllerCommandStateToggle', () => {
			this.toggleControllerCommandsState();
		});
	}

	private initListeners() {
		this.store.onDidChange('command.controller', (value) => {
			const controller = value as Controller;
			this.setController(controller);
			this.messageHandler.sendMessage('ControllerCommand', value as Controller);
		});
		this.store.onDidChange('command.sceneSwitch', (value) => {
			this.messageHandler.sendMessage('SceneSwitchCommands', value as SceneSwitchCommands);
		});
	}
}
