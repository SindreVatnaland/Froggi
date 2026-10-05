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
import { pickForFormat } from '../../../frontend/src/lib/utils/commandFormat';
import { ComboHold, comboKey } from '../../utils/comboHold';
import type { ControllerButtons } from '../../../frontend/src/lib/models/types/controller';
import { OBSRequestTypes } from 'obs-websocket-js';
import { ObsItem } from '../../../frontend/src/lib/models/types/obsTypes';
import { SqliteOrm } from '../sqlite/initiSqlite';
import { ControllerCommandEntity, SceneCommandEntity } from '../sqlite/entities/automation/automationEntities';

@singleton()
export class ElectronCommandStore {
	private store: Store = new Store();
	private controllerCommands: ControllerCommand[] = [];
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,

		@inject(ObsWebSocket) private obsWebSocket: ObsWebSocket,
		@inject(ElectronPlayersStore) private storePlayer: ElectronPlayersStore,
		@inject(ElectronSettingsStore) private storeSettings: ElectronSettingsStore,
		@inject(ElectronLiveStatsStore) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(SqliteOrm) private sqlite: SqliteOrm,
	) {
		this.log.info('Initializing Obs Command Store');
		this.initListeners();
		this.initEventListeners();
		this.init();
	}

	// Command lists live in SQLite (ControllerCommandEntity / SceneCommandEntity), kept in memory for the
	// input/scene handlers; the on/off switches stay in electron-store. Older electron-store lists are
	// copied over once (the old keys are left as a backup).
	private sceneCommandList: { scene: LiveStatsScene; command: Command }[] = [];

	private controllerRepo() {
		return this.sqlite.getRepository(ControllerCommandEntity);
	}
	private sceneRepo() {
		return this.sqlite.getRepository(SceneCommandEntity);
	}

	private async loadCommands() {
		await this.sqlite.initializing;
		try {
			if (!this.store.get('migrations.commandsSqlite')) {
				const legacyController = (this.store.get('command.controller.inputCommands') ?? []) as ControllerCommand[];
				for (const c of legacyController) {
					await this.controllerRepo().save(this.controllerRepo().create({ id: c.id || newId(), inputs: c.inputs, command: c.command, format: c.format ?? 'any' }));
				}
				const legacyScenes = (this.store.get('command.sceneSwitch') ?? {}) as Partial<Record<LiveStatsScene, Command[]>>;
				let sceneCount = 0;
				for (const scene of Object.values(LiveStatsScene)) {
					for (const command of legacyScenes[scene] ?? []) {
						await this.sceneRepo().save(this.sceneRepo().create({ id: command.id || newId(), scene, command, format: command.format ?? 'any' }));
						sceneCount++;
					}
				}
				this.store.set('migrations.commandsSqlite', true);
				if (legacyController.length || sceneCount) this.log.info(`Moved ${legacyController.length} controller and ${sceneCount} scene command(s) to SQLite`);
			}
			const controllerRows = (await this.controllerRepo().find()) ?? [];
			this.controllerCommands = controllerRows.map((r) => ({ id: r.id, inputs: r.inputs, command: r.command, format: r.format }));
			const sceneRows = (await this.sceneRepo().find()) ?? [];
			this.sceneCommandList = sceneRows.map((r) => ({ scene: r.scene, command: { ...r.command, id: r.id, format: r.format } }));
		} catch (err) {
			this.log.error('Could not load commands:', err);
		}
		this.emitController();
		this.emitSceneCommands();
	}

	private emitController() {
		this.messageHandler.sendMessage('ControllerCommand', this.getController());
	}

	private emitSceneCommands() {
		this.messageHandler.sendMessage('SceneSwitchCommands', this.getSceneCommands());
	}

	getController(): Controller {
		return { enabled: this.getControllerCommandsState(), inputCommands: this.controllerCommands };
	}

	getControllerCommandInputs(): ControllerCommand[] {
		return this.controllerCommands ?? [];
	}

	addControllerCommand(command: ControllerCommand) {
		const saved = { ...command, id: newId(), format: command.format ?? 'any' };
		this.controllerCommands = [...this.controllerCommands, saved];
		void this.controllerRepo().save(this.controllerRepo().create(saved)).catch((err) => this.log.error('Saving controller command failed:', err));
		this.emitController();
	}

	deleteControllerCommand(commandId: string) {
		this.controllerCommands = this.controllerCommands.filter((c) => c.id !== commandId);
		void this.controllerRepo().delete({ id: commandId }).catch((err) => this.log.error('Deleting controller command failed:', err));
		this.emitController();
	}

	getControllerCommandsState(): boolean {
		return (this.store.get('command.controller.enabled') as boolean) ?? false;
	}

	toggleControllerCommandsState() {
		this.store.set('command.controller.enabled', !this.getControllerCommandsState());
		this.emitController();
	}

	getSceneCommands(): SceneSwitchCommands {
		const commands = Object.fromEntries(Object.values(LiveStatsScene).map((scene) => [scene, [] as Command[]])) as Record<LiveStatsScene, Command[]>;
		for (const { scene, command } of this.sceneCommandList) (commands[scene] ??= []).push(command);
		return { enabled: this.getSceneSwitchCommandsState(), ...commands } as SceneSwitchCommands;
	}

	getSceneCommandsByScene(scene: LiveStatsScene): Command[] {
		return this.sceneCommandList.filter((c) => c.scene === scene).map((c) => c.command);
	}

	addSceneCommand(scene: LiveStatsScene, command: Command) {
		const saved = { ...command, id: newId(), format: command.format ?? 'any' };
		this.sceneCommandList = [...this.sceneCommandList, { scene, command: saved }];
		void this.sceneRepo().save(this.sceneRepo().create({ id: saved.id, scene, command: saved, format: saved.format })).catch((err) => this.log.error('Saving scene command failed:', err));
		this.emitSceneCommands();
	}

	deleteSceneCommand(_scene: LiveStatsScene, commandId: string) {
		this.sceneCommandList = this.sceneCommandList.filter((c) => c.command.id !== commandId);
		void this.sceneRepo().delete({ id: commandId }).catch((err) => this.log.error('Deleting scene command failed:', err));
		this.emitSceneCommands();
	}

	getSceneSwitchCommandsState(): boolean {
		return (this.store.get('command.sceneSwitch.enabled') as boolean) ?? false;
	}

	toggleSceneSwitchCommandsState() {
		this.store.set('command.sceneSwitch.enabled', !this.getSceneSwitchCommandsState());
		this.emitSceneCommands();
	}

	private init() {
		void this.loadCommands();
	}

	/** Which controller drives commands: the current player, else the lowest port in game / first connected. */
	getControllerIndex = (playerControllerInputs: PlayerController): number | undefined => {
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

	// A combo must be held 0.5s to fire, then nothing fires for 1s.
	private comboHold = new ComboHold(500, 1000);
	private heldButtons: ControllerButtons | undefined;

	private handleControllerCommand = (playerControllerInputs: PlayerController) => {
		if (!this.getControllerCommandsState()) return this.comboHold.update(null, () => undefined);
		const controllerIndex = this.getControllerIndex(playerControllerInputs);
		this.heldButtons = isNil(controllerIndex) ? undefined : playerControllerInputs?.[controllerIndex]?.buttons;
		const anyMatch = getSubsetCommands(this.controllerCommands, this.heldButtons).length > 0;
		this.comboHold.update(anyMatch ? comboKey(this.heldButtons as unknown as Record<string, boolean>) : null, () =>
			this.runControllerCommands(this.heldButtons),
		);
	};

	private runControllerCommands(buttonInputs: ControllerButtons | undefined) {
		const matched = getSubsetCommands(this.controllerCommands, buttonInputs);
		// Global / Singles / Doubles override per button combo (not across different combos).
		const byCombo = new Map<string, ControllerCommand[]>();
		for (const c of matched) {
			const key = JSON.stringify(Object.entries(c.inputs).filter(([, on]) => on).map(([k]) => k).sort());
			byCombo.set(key, [...(byCombo.get(key) ?? []), c]);
		}
		const controllerCommands = [...byCombo.values()].flatMap((group) => pickForFormat(group, this.isTeamsGame()));
		controllerCommands.forEach(async (controllerCommand) => {
			await this.executeCommand(
				CommandType.Obs,
				controllerCommand.command.requestType,
				controllerCommand.command.payload,
			);
		});
	}

	private isTeamsGame = () => !!this.storeLiveStats.getGameSettings()?.isTeams;

	private handleSceneChangeCommands = async (allCommands: Command[]) => {
		if (!this.getSceneSwitchCommandsState()) return;
		const commands = pickForFormat(allCommands, this.isTeamsGame());
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
		// Lists are saved through the methods above (SQLite), which notify the app themselves.
	}
}
