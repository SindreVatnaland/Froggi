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
import { Api, getPlayerRank } from './api';
import {
	GameStartTypeExtended,
	GameStats,
	Player,
	SlippiLauncherSettings,
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
import { Command } from '../../frontend/src/lib/models/types/overlay';
import { MessageHandler } from './messageHandler';
import path from 'path';
import { PacketCapture } from './packetCapture';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';

@singleton()
export class StatsDisplay {
	private pauseInterval: NodeJS.Timeout;
	private isWin: boolean = os.platform() === 'win32';
	private abortController: AbortController = new AbortController();
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('Dev') private isDev: boolean,
		@inject('SlpParser') private slpParser: SlpParser,
		@inject('SlpStream') private slpStream: SlpStream,
		@inject(delay(() => Api)) private api: Api,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronCurrentPlayerStore))
		private storeCurrentPlayer: ElectronCurrentPlayerStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(PacketCapture) private packetCapture: PacketCapture,
	) {
		this.initStatDisplay();
		this.initListeners();
	}

	private async initStatDisplay() {
		this.log.info('Initializing Dolphin Events');
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
		let intervalTime = this.isWin ? 320 : 160;
		this.stopPauseInterval();
		this.pauseInterval = setTimeout(() => {
			this.handleGamePaused();
		}, intervalTime);
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
		this.cancelSimulation();
		this.packetCapture.stopPacketCapture();
		if (!settings) return;

		const resentGames = await this.getPreviousGameStats();

		const previousSettings = resentGames?.settings;

		const isNewGame = Boolean(settings.matchInfo?.matchId) && previousSettings?.matchInfo?.matchId !== settings?.matchInfo?.matchId;

		const currentPlayers = await this.getCurrentPlayersWithRankStats(settings, isNewGame);

		this.log.info("Current players:", currentPlayers)

		if (currentPlayers.every((player) => "rank" in player)) {
			this.storePlayers.setCurrentPlayers(currentPlayers);
		}

		this.storeLiveStats.setGameState(InGameState.Running);
		this.storeLiveStats.setStatsScene(LiveStatsScene.InGame);

		if (!isNewGame) return;
		this.log.info("New game detected. Clearing recent games.")
		this.storeGames.clearRecentGames();
	}

	async handleGameEnd(
		gameEnd: GameEndType,
		latestGameFrame: FrameEntryType | null,
		settings: GameStartType,
	) {
		this.log.info("Game end:", gameEnd)
		this.cancelSimulation();
		this.packetCapture.startPacketCapture();
		this.stopPauseInterval();
		this.handleInGameState(gameEnd, latestGameFrame);

		let gameStats = await this.getPreviousGameStats(settings, gameEnd);
		if (!gameStats) {
			this.log.info("Did not find the recently played game.")
			this.storeLiveStats.setStatsScene(LiveStatsScene.Menu)
			return;
		};

		if (!settings.matchInfo?.matchId && gameStats.settings?.matchInfo?.matchId) {
			this.log.info("Settings matchId does not match replay matchId. Assuming replay.")
			gameStats.isReplay = true;
		}

		await this.handleGameSetStats(gameStats);
		await this.handlePostGameScene(gameStats);
		this.storeLiveStats.deleteGameFrame();
		setTimeout(() => {
			this.storeLiveStats.setGameState(InGameState.Inactive);
		}, 5000)
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
		const oldRank = await this.storeCurrentPlayer.getCurrentPlayerCurrentRankStats();

		if ((this.isDev || game.settings?.isSimulated) && playerConnectCode) {
			this.mockPostGameScene();
			return;
		}

		if (isPostSet && isRanked && playerConnectCode && oldRank) {
			this.storeLiveStats.setStatsScene(LiveStatsScene.RankChange);
			const currentPlayerRankStats = await this.api.getNewRankWithBackoff(oldRank, playerConnectCode)
			this.storeCurrentPlayer.setCurrentPlayerNewRankStats(currentPlayerRankStats);
			return;
		}

		if (isPostSet) {
			return this.storeLiveStats.setStatsSceneTimeout(
				LiveStatsScene.PostSet,
				LiveStatsScene.Menu,
				150000,
			);
		} else
			return this.storeLiveStats.setStatsSceneTimeout(
				LiveStatsScene.PostGame,
				LiveStatsScene.Menu,
				150000,
			);
	}

	private async mockPostGameScene() {
		this.storeLiveStats.setStatsScene(LiveStatsScene.RankChange);
		await new Promise((resolve) => setTimeout(resolve, 2000));
		let currentPlayerRankStats = await this.storeCurrentPlayer.getCurrentPlayerCurrentRankStats();
		if (!currentPlayerRankStats) return;
		const didWin = Math.random() > 0.5;
		const ratingChange = (didWin ? 1 : -1) * Math.random() * 500;
		const newMockRating = Number((currentPlayerRankStats.rating + ratingChange).toFixed(1));
		const newMockRank = getPlayerRank(newMockRating, 0, 0);
		const prevRank = await this.storeCurrentPlayer.getCurrentPlayerCurrentRankStats();
		currentPlayerRankStats = {
			...currentPlayerRankStats,
			rating: newMockRating,
			rank: newMockRank,
			wins: currentPlayerRankStats.wins + (didWin ? 1 : 0),
			losses: currentPlayerRankStats.losses + (didWin ? 0 : 1),
			isMock: true,
		}
		this.storeCurrentPlayer.setCurrentPlayerNewRankStats(currentPlayerRankStats);
		setTimeout(() => {
			this.storeCurrentPlayer.setCurrentPlayerNewRankStats(prevRank);
		}, 10000);
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

	private async handleGameSetStats(gameStats: GameStats | null) {
		if (!gameStats) return;
		this.storeGames.setGameMatch(gameStats);
		const games = await this.storeGames.getRecentGames();
		if (!games || !games?.length) return;

		const matchStats = analyzeMatch(games.flat().filter((game) => !game.isMock));
		this.storeLiveStats.setMatchStats(matchStats);
	}

	private async getCurrentPlayersWithRankStats(settings: GameStartType, isNewGame: boolean): Promise<Player[]> {
		this.log.info("Getting current players with rank stats")

		const currentPlayers = settings.players.filter((player) => player);

		if (!isNewGame || currentPlayers.some((player) => !player.connectCode)) {
			const previousPlayers = this.storePlayers.getCurrentPlayers();
			if (previousPlayers) return previousPlayers;
		}

		const currentPlayer = await this.storeCurrentPlayer.getCurrentPlayer();

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
		const re = new RegExp('^.*Game.*\\.slp$');

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

		const replaysDirContent = await this.getReplayDirs(slippiSettings, subFolder);

		const replayFiles = replaysDirContent
			.filter((f: string) => re.test(f))


		return replayFiles.sort((a, b) => (a > b ? -1 : 1));
	}

	private getReplayDirs = async (slippiLauncherSettings: SlippiLauncherSettings, subFolder: string | undefined) => {
		let filesFromRoot: string[] = [];
		let filesFromSpectate: string[] = [];


		try {
			const root = slippiLauncherSettings.rootSlpPath;
			if (root) {
				const dir = path.join(root, subFolder ?? '');
				const files = await fs.readdir(dir);
				filesFromRoot = files.map(
					(file: string) => path.join(dir, file),
				);
			}
		} catch (error) {
			if (error.code !== 'ENOENT') {
				console.error('Error reading files from root:', error);
			}
		}

		if (!slippiLauncherSettings.spectateSlpPath) return filesFromRoot;

		try {
			const dir = slippiLauncherSettings.spectateSlpPath;
			if (dir) {
				const files = await fs.readdir(dir);
				filesFromSpectate = files.map(
					(file: string) => path.join(dir, file),
				);
			}
		} catch (error) {
			if (error.code !== 'ENOENT') {
				console.error('Error reading files from Spectate:', error);
			}
		}

		return [...(filesFromRoot || []), ...(filesFromSpectate || [])];
	};

	private async getPreviousGameStats(
		settings: GameStartType | undefined = undefined,
		gameEnd: GameEndType | undefined = undefined,
	): Promise<GameStats | null> {
		const files = await this.getGameFiles();
		if (!files || !files.length) return null;
		const matchId = settings?.matchInfo?.matchId ?? '';
		const gameNumber = settings?.matchInfo?.gameNumber ?? 0;
		const randomSeed = settings?.randomSeed;
		this.log.info("Looking for replay:", matchId, "Game number:", gameNumber, "Random seed:", randomSeed)
		const file = files.find((file) => {
			const settings = new SlippiGame(file).getSettings();
			return matchId
				? (
					(settings?.matchInfo?.matchId === matchId &&
						settings?.matchInfo?.gameNumber === gameNumber &&
						settings?.matchInfo?.tiebreakerNumber === 0)
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
		return this.createGameStats(game, gameEnd);
	}

	private async handleUndefinedPlayers(settings: GameStartType | null | undefined) {
		if (!settings) return;
		const players = this.storePlayers.getCurrentPlayers();
		if (!players) this.storePlayers.setCurrentPlayers(settings.players);
	}

	private createGameStats(
		game: SlippiGame | null,
		gameEnd: GameEndType | undefined = undefined,
	): GameStats | null {
		if (!game) return null;
		const settings = game.getSettings();
		const gameStats = {
			gameEnd: gameEnd ?? game?.getGameEnd(),
			lastFrame: game.getLatestFrame(),
			postGameStats: this.enrichPostGameStats(game),
			settings: {
				...settings,
				matchInfo: {
					...settings?.matchInfo,
					mode: getGameMode(settings),
					matchId: settings?.matchInfo?.matchId,
					bestOf: this.storeLiveStats.getBestOf(),
				},
			},
			timestamp: dateTimeNow(),
		} as GameStats;
		return gameStats;
	}

	// TODO: Add additional data not included in the default stats
	private enrichPostGameStats(game: SlippiGame | null): StatsTypeExtended | null {
		if (!game) return null;
		return {
			...game.getStats(),
		} as StatsTypeExtended;
	}

	private getRecentReplay = async (): Promise<SlippiGame | undefined> => {
		const files = await this.getGameFiles();
		if (!files || !files.length) return;
		const file = files.find((file) => {
			const settings = new SlippiGame(file).getSettings();
			return settings?.players.some((player) => player?.connectCode);
		});
		if (!file) return;
		const game = new SlippiGame(file);
		return game;
	};

	simulateGame = async () => {
		this.cancelSimulation();
		const game = await this.getRecentReplay();
		if (!game) return;
		const settings = game.getSettings() as GameStartTypeExtended;
		const frames = game.getFrames()
		if (!settings || !frames) return;
		settings.isSimulated = true;
		this.stopPauseInterval();
		this.storeLiveStats.setGameState(InGameState.Running);
		await this.handleGameFrame(frames[0]);
		this.handleGameStart(settings);
		const sortedKeys = Object.keys(frames).map(Number).sort((a, b) => a - b);
		for (const key of sortedKeys) {
			if (this.abortController.signal.aborted) return;
			const frame = frames[key];
			await this.handleGameFrame(frame);
			await this.waitWithCancel(16);
		}
		const gameEnd = game.getGameEnd();
		const latestFrame = game.getLatestFrame();
		if (!gameEnd) return;
		this.handleGameEnd(gameEnd, latestFrame, settings);
	}

	simulateGameEnd = async () => {
		const liveStatsScene = this.storeLiveStats.getStatsScene();
		if (liveStatsScene === LiveStatsScene.RankChange) return;
		const game = await this.getRecentReplay();
		if (!game) return;
		const gameEnd = game.getGameEnd();
		const latestFrame = game.getLatestFrame();
		const settings = game.getSettings() as GameStartTypeExtended;
		if (!gameEnd || !settings) return;
		settings.isSimulated = true;
		this.handleGameEnd(gameEnd, latestFrame, settings);
	}

	private waitWithCancel = (ms: number) => {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(resolve, ms);
			if (this.abortController) {
				this.abortController.signal.addEventListener("abort", () => {
					clearTimeout(timeout);
					reject(new Error("Simulation canceled"));
				});
			}
		});
	};

	private cancelSimulation = () => {
		if (this.abortController) {
			this.abortController.abort();
			console.log("Simulation stopped");
		}
		this.abortController = new AbortController();
	};

	private initListeners() {
		this.clientEmitter.on('SimulateGameStart', this.simulateGame.bind(this));
		this.clientEmitter.on('SimulateGameEnd', this.simulateGameEnd.bind(this));
	}
}
