import {
	SlpParserEvent,
	SlippiGame,
	SlpParser,
	SlpStream,
	FrameEntryType,
	GameEndType,
	GameStartType,
	PlayerType,
	GameEndMethod,
	SlpStreamEvent,
	SlpRawEventPayload,
} from '@slippi/slippi-js';
import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { Api } from './api';
import {
	GameStats,
	Player,
	StatsTypeExtended,
} from '../../frontend/src/lib/models/types/slippiData';
import { InGameState, LiveStatsScene } from '../../frontend/src/lib/models/enum';
import fs from 'fs/promises';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { ElectronSettingsStore } from './store/storeSettings';
import { ElectronPlayersStore } from './store/storePlayers';
import { dateTimeNow, getGameMode } from '../utils/functions';
import { analyzeMatch } from '../utils/analyzeMatch';
import os from 'os';
import { debounce, isNil } from 'lodash';
import { getWinnerIndex } from '../../frontend/src/lib/utils/gamePredicates';
import { Command } from '../../frontend/src/lib/models/types/overlay';
import { MessageHandler } from './messageHandler';
import path from 'path';

@singleton()
export class StatsDisplay {
	private pauseInterval: NodeJS.Timeout;
	private isWin: boolean = os.platform() === 'win32';
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('SlpParser') private slpParser: SlpParser,
		@inject('SlpStream') private slpStream: SlpStream,
		@inject(delay(() => Api)) private api: Api,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronCurrentPlayerStore))
		private storeCurrentPlayer: ElectronCurrentPlayerStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
	) {
		this.initStatDisplay();
	}

	private async initStatDisplay() {
		this.log.info('Initialize Dolphin Events');
		this.slpStream.on(SlpStreamEvent.COMMAND, async (event: SlpRawEventPayload) => {
			this.slpParser.handleCommand(event.command, event.payload);
			if (event.command === Command.GAME_START) {
				const gameSettings = this.slpParser.getSettings();
				this.handleUndefinedPlayers(gameSettings);
				await this.handleGameStart(gameSettings);
			}
		});

		this.slpParser.on(SlpParserEvent.END, async (gameEnd: GameEndType) => {
			await new Promise((resolve) => setTimeout(resolve, 0));
			const settings = this.slpParser.getSettings();
			const latestFrame = this.slpParser.getLatestFrame();
			if (isNil(settings) || isNil(latestFrame) || isNil(gameEnd)) return;
			await this.handleGameEnd(gameEnd, latestFrame, settings);
		});

		this.slpParser.on(
			SlpParserEvent.FRAME,
			debounce(
				(frameEntry: FrameEntryType) => {
					this.handleGameFrame(frameEntry);
				},
				2
			)
		);
	}

	private resetPauseInterval() {
		if (this.isWin) return;
		this.stopPauseInterval();
		this.pauseInterval = setTimeout(() => {
			this.handleGamePaused();
		}, 160);
	}

	private stopPauseInterval() {
		clearInterval(this.pauseInterval);
	}

	async handleGameFrame(frameEntry: FrameEntryType) {
		this.messageHandler.sendMessage('GameFrame', frameEntry);
		this.storeLiveStats.setGameState(InGameState.Running);
		this.resetPauseInterval();
	}

	async handleGamePaused() {
		this.storeLiveStats.setGameState(InGameState.Paused);
	}

	async handleGameStart(settings: GameStartType | null) {
		this.log.info("Game start:", settings)
		if (!settings) return;
		const currentPlayers = await this.getCurrentPlayersWithRankStats(settings);

		this.log.info("Current players:", currentPlayers)

		this.storeLiveStats.setGameState(InGameState.Running);
		this.storeLiveStats.setStatsScene(LiveStatsScene.InGame);
		if (currentPlayers.every((player) => "rank" in player)) {
			this.storePlayers.setCurrentPlayers(currentPlayers);
		}
		this.storeLiveStats.setGameSettings(settings);

		const previousGame = this.storeGames.getRecentGames()?.at(0)?.at(0);

		if (
			previousGame?.settings?.matchInfo.matchId ===
			settings?.matchInfo?.matchId?.replace(/[.:]/g, '-')
		)
			return;
		this.log.info("New game detected. Clearing recent games.")
		this.storeGames.clearRecentGames();
	}

	async handleGameEnd(
		gameEnd: GameEndType,
		latestGameFrame: FrameEntryType | null,
		settings: GameStartType,
	) {
		this.log.info("Game end:", gameEnd)
		this.stopPauseInterval();
		this.handleInGameState(gameEnd, latestGameFrame);

		let gameStats = await this.getRecentGameStats(settings, gameEnd);
		if (!gameStats) {
			this.log.info("Did not find the recently played game.")
			this.storeLiveStats.setStatsScene(LiveStatsScene.Menu)
			return;
		};

		let score = this.storeGames.getGameScore();

		gameStats.score = this.handleScore(gameStats, score)

		this.storeGames.setGameScore(gameStats.score);
		this.handleGameSetStats(gameStats);
		this.handlePostGameScene(gameStats);
		this.storeLiveStats.deleteGameFrame();
		setTimeout(() => {
			this.storeLiveStats.setGameState(InGameState.Inactive);
		}, 5000)
	}

	private handleScore(gameStats: GameStats, score: number[]): number[] {
		const winnerIndex = getWinnerIndex(gameStats);
		if (isNil(winnerIndex)) return score;
		score[winnerIndex ?? 0] += 1;
		this.log.info("Player", winnerIndex + 1, "won the game. Score:", score)
		return score
	}

	private async handlePostGameScene(game: GameStats | null) {
		if (isNil(game)) return;
		this.log.info("Handle post game scene:")

		const playerConnectCode = this.storeSettings.getCurrentPlayerConnectCode()

		const bestOf = this.storeLiveStats.getBestOf();
		this.log.info("Best of:", bestOf)
		const isPostSet = game.score.some((score) => score >= Math.ceil(bestOf / 2));
		this.log.info("Is post set:", isPostSet)
		const isRanked = game.settings?.matchInfo?.mode === 'ranked';
		const oldRank = this.storeCurrentPlayer.getCurrentPlayerCurrentRankStats();
		if (isPostSet && isRanked && playerConnectCode && oldRank) {
			const currentPlayerRankStats = await this.api.getNewRankWithBackoff(oldRank, playerConnectCode)
			return this.storeCurrentPlayer.setCurrentPlayerNewRankStats(currentPlayerRankStats);
		}
		if (isPostSet) {
			return this.storeLiveStats.setStatsSceneTimeout(
				LiveStatsScene.PostSet,
				LiveStatsScene.Menu,
				60000,
			);
		} else
			return this.storeLiveStats.setStatsSceneTimeout(
				LiveStatsScene.PostGame,
				LiveStatsScene.Menu,
				60000,
			);
	}

	private handleInGameState(gameEnd: GameEndType | null, latestGameFrame: FrameEntryType | null) {
		if (gameEnd?.gameEndMethod === GameEndMethod.TIME)
			this.storeLiveStats.setGameState(InGameState.Time);
		if (gameEnd?.gameEndMethod === GameEndMethod.GAME)
			this.storeLiveStats.setGameState(InGameState.End);
		if (
			latestGameFrame &&
			Object.entries(latestGameFrame.players).every(
				([_, player]) => isNil(player) || player.post.stocksRemaining === 0,
			)
		)
			this.storeLiveStats.setGameState(InGameState.Tie);
	}

	private handleGameSetStats(gameStats: GameStats | null) {
		if (!gameStats) return;
		this.storeLiveStats.setGameStats(gameStats);
		this.storeGames.setGameMatch(gameStats);
		const games = this.storeGames.getRecentGames();
		if (!games || !games?.length) return;

		const matchStats = analyzeMatch(games.flat().filter((game) => !game.isMock));
		this.storeLiveStats.setMatchStats(matchStats);
	}

	private async getCurrentPlayersWithRankStats(settings: GameStartType): Promise<Player[]> {
		this.log.info("Getting current players with rank stats")
		const isNewGame = this.storeLiveStats.getGameSettings()?.matchInfo?.matchId !== settings?.matchInfo?.matchId;
		const currentPlayers = settings.players.filter((player) => player);

		if (!isNewGame || currentPlayers.some((player) => !player.connectCode))
			return settings.players
				.filter((player) => player)
				.map((player, i: number) => {
					return {
						...player,
						rank: this.storePlayers.getCurrentPlayers()?.at(i)?.rank,
					};
				});

		const currentPlayer = this.storeCurrentPlayer.getCurrentPlayer();

		return (
			await Promise.all(
				currentPlayers.map(async (player: PlayerType) => {
					if (player.connectCode === currentPlayer?.connectCode)
						return { ...player, rank: { current: currentPlayer?.rank?.current } }
					return await this.api.getPlayerWithRankStats(player);
				}),
			)
		).filter((player): player is Player => player !== undefined);
	}

	private async getGameFiles(): Promise<string[] | undefined> {
		const re = new RegExp('^Game_.*.slp$');

		const slippiSettings = this.storeSettings.getSlippiLauncherSettings();
		this.log.debug('Settings:', slippiSettings);

		if (!slippiSettings?.rootSlpPath) return;

		const isBeta = slippiSettings?.useNetplayBeta;
		const mainlineRegex = /\b(Mainline|beta)\b/i;
		const directoryRegex = /^\d{4}-\d{2}$/


		const subFolder = slippiSettings.useMonthlySubfolders
			? (await fs.readdir(slippiSettings.rootSlpPath, { withFileTypes: true }))
				.filter((dirent) => dirent.isDirectory())
				.map((dirent) => dirent.name)
				.filter((dirname) => (isBeta ? mainlineRegex.test(dirname) : dirname))
				.filter((dirname) => directoryRegex.test(dirname))
				.sort((a, b) => (a < b ? 1 : -1))
				.at(0) ?? './'
			: './';

		const root = slippiSettings.rootSlpPath;

		this.log.info("Replay directory:", path.join(root, subFolder))

		const replaysDirContent = await this.getReplayDirs(root, subFolder);

		const replayFiles = replaysDirContent
			.map((filename: string) => `${path.parse(filename).name}.slp`)
			.filter((f: string) => re.test(f))
			.map(
				(f: string) =>
					`${slippiSettings.rootSlpPath}/${subFolder ? `${subFolder}/` : ''}${f}`,
			);

		return replayFiles.sort((a, b) => (a > b ? -1 : 1));
	}

	private getReplayDirs = async (root: string, subFolder: string | undefined) => {
		let filesFromRoot: string[] = [];
		let filesFromSpectate: string[] = [];
		try {
			filesFromRoot = await fs.readdir(`${root}${subFolder ? `/${subFolder}` : ''}`);
		} catch (error) {
			if (error.code !== 'ENOENT') {
				console.error('Error reading files from root:', error);
			}
		}

		try {
			filesFromSpectate = await fs.readdir(`${root}/Spectate`);
		} catch (error) {
			if (error.code !== 'ENOENT') {
				console.error('Error reading files from Spectate:', error);
			}
		}

		return [...(filesFromRoot || []), ...(filesFromSpectate || [])];
	};

	private async getRecentGameStats(
		settings: GameStartType | undefined = undefined,
		gameEnd: GameEndType | undefined = undefined,
	): Promise<GameStats | null> {
		const files = await this.getGameFiles();
		if (!files || !files.length) return null;
		const matchId = settings?.matchInfo?.matchId ?? '';
		const gameNumber = settings?.matchInfo?.gameNumber ?? 0;
		const randomSeed = settings?.randomSeed;
		this.log.info("Looking for replay:", matchId, gameNumber)
		const file = files.find((file) => {
			const settings = new SlippiGame(file).getSettings();
			return matchId
				? (
					settings?.matchInfo?.matchId === matchId &&
					settings?.matchInfo?.gameNumber === gameNumber &&
					settings?.matchInfo?.tiebreakerNumber === 0
				)
				: settings?.randomSeed === randomSeed;
		});
		if (!file) {
			this.log.error("Could not find recent replay")
			return null
		};
		this.log.info("Analyzing game:", settings?.matchInfo)
		this.log.debug('Analyzing recent game file:', file);
		let game = new SlippiGame(file);
		return this.getGameStats(game, gameEnd);
	}

	private async handleUndefinedPlayers(settings: GameStartType | null | undefined) {
		if (!settings) return;
		const players = this.storePlayers.getCurrentPlayers();
		if (!players) this.storePlayers.setCurrentPlayers(settings.players);
	}

	private getGameStats(
		game: SlippiGame | null,
		gameEnd: GameEndType | undefined = undefined,
	): GameStats | null {
		if (!game) return null;
		const settings = game.getSettings();
		return {
			gameEnd: gameEnd ?? game?.getGameEnd(),
			lastFrame: game.getLatestFrame(),
			postGameStats: this.enrichPostGameStats(game),
			settings: {
				...settings,
				matchInfo: {
					...settings?.matchInfo,
					mode: getGameMode(settings),
					matchId: settings?.matchInfo?.matchId?.replace(/[.:]/g, '-'),
					bestOf: this.storeLiveStats.getBestOf(),
				},
			},
			timestamp: dateTimeNow(),
		} as GameStats;
	}

	// TODO: Add additional data not included in the default stats
	private enrichPostGameStats(game: SlippiGame | null): StatsTypeExtended | null {
		if (!game) return null;
		return {
			...game.getStats(),
		} as StatsTypeExtended;
	}
}
