// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { FrameEntryType } from '@slippi/slippi-js';
import { BestOf, InGameState, LiveStatsScene } from '../../../frontend/src/lib/models/enum';
import {
	GameStartMode,
	GameStartTypeExtended,
	GameStats,
	Match,
	MatchStats,
} from '../../../frontend/src/lib/models/types/slippiData';
import { isNil } from 'lodash';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';

@singleton()
export class ElectronLiveStatsStore {
	private sceneTimeout: NodeJS.Timeout;
	private rankChangeSceneTimeout: NodeJS.Timeout;
	private gameState: InGameState = InGameState.Inactive;
	private gameFrame: FrameEntryType | null | undefined;
	private liveStatsScene: LiveStatsScene = LiveStatsScene.WaitingForDolphin;
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ElectronStore') private store: Store,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing Live Stats Store');
		this.initListeners();
		this.initSvelteListeners();
	}

	getStatsScene(): LiveStatsScene {
		return this.liveStatsScene;
	}

	setStatsScene(scene: LiveStatsScene) {
		this.log.info('Setting scene to', scene);
		clearTimeout(this.sceneTimeout);
		clearTimeout(this.rankChangeSceneTimeout)
		this.liveStatsScene = scene;
		this.messageHandler.sendMessage('LiveStatsSceneChange', this.liveStatsScene as LiveStatsScene);
	}

	setStatsSceneTimeout(firstScene: LiveStatsScene, secondScene: LiveStatsScene, ms: number) {
		clearTimeout(this.sceneTimeout);
		this.log.info('Setting scene to', firstScene, "for", ms, "ms,", "then to", secondScene);
		this.setStatsScene(firstScene);
		this.sceneTimeout = setTimeout(() => {
			this.setStatsScene(secondScene);
		}, ms);
	}

	getGameFrame(): FrameEntryType | null | undefined {
		return this.gameFrame;
	}

	setGameFrame(frameEntry: FrameEntryType | undefined | null) {
		if (!frameEntry) return;
		this.gameFrame = frameEntry;
		this.messageHandler.sendMessage('GameFrame', frameEntry as FrameEntryType);
	}

	deleteGameFrame() {
		this.gameFrame = null;
	}

	getGameState(): InGameState {
		return (this.gameState) ?? InGameState.Inactive;
	}

	setGameState(state: InGameState) {
		this.gameState = state;
		this.messageHandler.sendMessage('GameState', state as InGameState);
	}

	getGameSettings(): GameStartTypeExtended | undefined {
		return this.store.get('stats.game.settings') as GameStartTypeExtended;
	}

	getGameMode(): GameStartMode {
		return this.store.get('stats.game.settings.matchInfo.mode') as GameStartMode;
	}

	getGameStats(): GameStats | undefined {
		return (this.store.get('stats.game.stats') ?? {}) as GameStats;
	}

	setGameStats(gameStats: GameStats | null) {
		if (!gameStats) return;
		this.store.set('stats.game.stats', gameStats);
	}

	setMatchStats(matchStats: MatchStats | undefined | null) {
		if (!matchStats) return;
		this.store.set('stats.match.stats', matchStats);
	}

	setBestOf(bestOf: BestOf | undefined) {
		if (isNil(bestOf)) return;
		this.store.set('stats.game.settings.matchInfo.bestOf', bestOf);
	}

	getBestOf(): BestOf {
		const bestOf = this.store.get('stats.game.settings.matchInfo.bestOf') as BestOf;
		return bestOf ?? BestOf.BestOf3;
	}

	initListeners() {
		this.store.onDidChange(`stats.game.settings`, async (value) => {
			this.messageHandler.sendMessage('GameSettings', value as GameStartTypeExtended);
		});
		this.store.onDidChange(`stats.game.stats`, async (value) => {
			this.messageHandler.sendMessage('PostGameStats', value as GameStats);
		});
		this.store.onDidChange(`stats.match`, async (value) => {
			this.messageHandler.sendMessage('CurrentMatch', value as Match);
		});
	}

	initSvelteListeners() {
		this.clientEmitter.on('LiveStatsSceneChange', (value: LiveStatsScene | undefined) => {
			if (!value) return;
			this.setStatsScene(value);
		});
		this.clientEmitter.on('BestOfUpdate', (bestOf: BestOf) => {
			this.setBestOf(bestOf);
		});
	}
}
