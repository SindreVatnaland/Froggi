import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import os from 'os';
import { getControllerInputs } from './memoryRead/controllerInputs';
import { getPause } from './memoryRead/gameState';
import { MessageHandler } from './messageHandler';
import DolphinMemory from 'dolphin-memory-reader';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { InGameState } from '../../frontend/src/lib/models/enum';
import { isNil } from 'lodash';
import { isDolphinRunning } from './../utils/dolphinProcess';
import { MenuState } from '../../frontend/src/lib/models/constants/memoryReadMapper';
import { ByteSize } from 'dolphin-memory-reader/dist/types/enum';


@singleton()
export class MemoryRead {
	private memoryReadInterval: NodeJS.Timeout | null = null;
	private dolphinProcessInterval: NodeJS.Timeout | null = null;
	private isWindows = os.platform() === 'win32';
	private memory: DolphinMemory | null = null;
	private isReading = false;
	private prevMenuState: MenuState | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject(delay(() => ElectronLiveStatsStore))
		private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) { }

	initMemoryRead() {
		this.log.info('Initializing Memory Read Service');
		if (!this.isWindows) return;
		this.startProcessSearchInterval();
	}

	private async startMemoryRead() {
		if (this.isReading) {
			return;
		}
		this.isReading = true;
		this.log.info('Initializing Memory Read');

		if (this.dolphinProcessInterval) {
			clearInterval(this.dolphinProcessInterval);
			this.dolphinProcessInterval = null;
		}
		if (this.memoryReadInterval) {
			clearInterval(this.memoryReadInterval);
			this.memoryReadInterval = null;
		}

		this.memory = new DolphinMemory();
		try {
			await this.memory.init();
		} catch (error) {
			this.log.error('Failed to initialize memory:', error);
			this.isReading = false;
			this.stopMemoryRead();
			return;
		}
		this.log.info('Memory Read Initialized');

		this.memoryReadInterval = setInterval(() => {
			try {
				if (isNil(this.memory) || !this.isReading) {
					this.stopMemoryRead();
					return;
				}
				this.handleGameState(this.memory);
				this.handleController(this.memory);
				this.handleMenuState(this.memory);
			} catch (err) {
				this.log.error('Error during memory read interval:', err);
				this.stopMemoryRead();
				this.memory = null;
			}
		}, 64);
	}

	private handleController(memory: DolphinMemory) {
		const controllers = getControllerInputs(memory);
		this.messageHandler.sendMessage('MemoryControllerInput', controllers);
	}

	private handleGameState(memory: DolphinMemory) {
		const currentState = this.storeLiveStats.getGameState();
		if (currentState !== InGameState.Running) return;
		const isPaused = getPause(memory);
		if (!isPaused) return;
		this.storeLiveStats.setGameState(InGameState.Paused);
	}

	private handleMenuState(memory: DolphinMemory) {
		const menuId = memory.read(0x804A04F0, ByteSize.U8);
		if (this.prevMenuState === menuId) return;
		const menuName = MenuState[menuId];
		this.prevMenuState = menuId;
		this.log.info(menuId, menuName);
	}


	stopMemoryRead() {
		this.log.warn('Stopping memory read');
		this.memory = null;
		if (this.memoryReadInterval) {
			clearInterval(this.memoryReadInterval);
			this.memoryReadInterval = null;
		}
		this.isReading = false;
		this.startProcessSearchInterval();
	}

	private async startProcessSearchInterval() {
		if (this.dolphinProcessInterval) {
			clearInterval(this.dolphinProcessInterval);
			this.dolphinProcessInterval = null;
		}
		if (this.memoryReadInterval) {
			clearInterval(this.memoryReadInterval);
			this.memoryReadInterval = null;
		}

		this.dolphinProcessInterval = setInterval(async () => {
			try {
				if (await isDolphinRunning()) {
					if (this.dolphinProcessInterval) {
						clearInterval(this.dolphinProcessInterval);
						this.dolphinProcessInterval = null;
					}
					setTimeout(() => {
						this.startMemoryRead();
					});
				}
			} catch (err) {
				this.log.error('Error checking if Dolphin is running:', err);
			}
		}, 5000);
	}
}
