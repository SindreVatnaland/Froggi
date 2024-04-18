import { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import os from 'os';
import { getControllerInputs } from './memoryRead/controllerInputs';
import { getPause } from './memoryRead/gameState';
import { MessageHandler } from './messageHandler';
import DolphinMemory from 'dolphin-memory-reader';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { InGameState } from '../../frontend/src/lib/models/enum';
import { isNil } from 'lodash';

@singleton()
export class MemoryRead {
	private memoryReadInterval: NodeJS.Timeout = {} as NodeJS.Timeout;
	private isWindows = os.platform() === 'win32';
	private memory: DolphinMemory | null = null;
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {}

	initMemoryRead() {
		this.initMemoryReadWin();
	}

	private async initMemoryReadWin() {
		if (!this.isWindows) return;
		this.log.info('Initializing Memory Read');
		this.memory = new DolphinMemory();
		await this.memory.init();
		this.memoryReadInterval = setInterval(() => {
			try {
				if (isNil(this.memory)) {
					this.stopMemoryRead();
					return;
				}
				this.handleGameState(this.memory);
				this.handleController(this.memory);
				// TODO: Get Menu Location
			} catch (err) {
				this.log.error(err);
				this.stopMemoryRead();
				this.memory = null;
			}
		}, 16);
	}

	private handleController = (memory: DolphinMemory) => {
		const controllers = getControllerInputs(memory);
		this.messageHandler.sendMessage('MemoryControllerInput', controllers);
	};

	private handleGameState = (memory: DolphinMemory) => {
		const currentState = this.storeLiveStats.getGameState();
		if (currentState !== InGameState.Running) return;
		const isPaused = getPause(memory);
		if (!isPaused) return;
		this.storeLiveStats.setGameState(InGameState.Paused);
	};

	stopMemoryRead() {
		this.log.info('Stopping memory read');
		this.memory = null;
		clearInterval(this.memoryReadInterval);
	}
}
