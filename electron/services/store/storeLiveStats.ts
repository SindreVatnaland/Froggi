// https://www.npmjs.com/package/electron-store
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { FrameEntryType, GameStartType } from '@slippi/slippi-js';
import { BestOf, InGameState, LiveStatsScene } from '../../../frontend/src/lib/models/enum';
import {
	GameStartMode,
	GameStartTypeExtended,
	GameStats,
	MatchStats,
} from '../../../frontend/src/lib/models/types/slippiData';
import { isNil, merge } from 'lodash';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';

@singleton()
export class ElectronLiveStatsStore {
	private sceneTimeout: NodeJS.Timeout;
	private rankChangeSceneTimeout: NodeJS.Timeout;
	private gameState: InGameState = InGameState.Inactive;
	private gameFrame: FrameEntryType | null | undefined;
	private gameSettings: GameStartTypeExtended | undefined;
	private gameStats: GameStats | undefined;
	private matchStats: MatchStats;
	private liveStatsScene: LiveStatsScene = LiveStatsScene.WaitingForDolphin;
	// Synthetic id for the current offline/local set. Slippi gives local games no matchId,
	// so without this they all collide under "" — one unbounded bucket. Minted per set.
	private localSetId: string | undefined;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing Live Stats Store');
		this.initListeners();
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
		return this.gameSettings
	}

	setGameSettings(settings: GameStartTypeExtended | GameStartType) {
		const prevSettings = this.getGameSettings();
		this.gameSettings = merge(prevSettings, settings)
		this.messageHandler.sendMessage('GameSettings', this.gameSettings);
	}

	getGameMode(): GameStartMode {
		return this.gameSettings?.matchInfo.mode ?? "local";
	}

	getGameStats(): GameStats | undefined {
		return this.gameStats;
	}

	setGameStats(gameStats: GameStats | null) {
		if (!gameStats) return;
		this.gameStats = gameStats;
		this.messageHandler.sendMessage('PostGameStats', this.gameStats);
	}

	setMatchStats(matchStats: MatchStats | undefined | null) {
		if (!matchStats) return;
		this.matchStats = matchStats;
		this.messageHandler.sendMessage('CurrentMatch', this.matchStats);
	}

	setBestOf(bestOf: BestOf | undefined) {
		if (isNil(bestOf)) return;
		const prev = this.gameSettings?.matchInfo;
		this.gameSettings = {
			...(this.gameSettings ?? {} as GameStartTypeExtended),
			matchInfo: {
				matchId: prev?.matchId ?? null,
				gameNumber: prev?.gameNumber ?? null,
				tiebreakerNumber: prev?.tiebreakerNumber ?? null,
				mode: prev?.mode ?? 'local',
				bestOf,
			},
		} as GameStartTypeExtended;
		this.messageHandler.sendMessage('GameSettings', this.gameSettings);
	}

	getBestOf(): BestOf {
		return (this.gameSettings?.matchInfo?.bestOf ?? BestOf.BestOf3) as BestOf;
	}

	getLocalSetId(): string | undefined {
		return this.localSetId;
	}

	setLocalSetId(id: string | undefined) {
		this.localSetId = id;
	}


	initListeners() {
		this.clientEmitter.on('LiveStatsSceneChange', (value: LiveStatsScene | undefined) => {
			if (!value) return;
			this.setStatsScene(value);
		});
		this.clientEmitter.on('BestOfUpdate', (bestOf: BestOf) => {
			this.setBestOf(bestOf);
		});
	}
}
