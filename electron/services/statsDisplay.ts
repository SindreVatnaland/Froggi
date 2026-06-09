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
	CurrentPlayer,
	EdgeGuard,
	GameStartTypeExtended,
	GameStats,
	OverallTypeExtended,
	Player,
	Rank,
	RankedNetplayProfile,
	SlippiLauncherSettings,
	StatsTypeExtended,
} from '../../frontend/src/lib/models/types/slippiData';
import { STAGE_DATA } from '../../frontend/src/lib/models/constants/stageData';
import { isDamaged } from '../../frontend/src/lib/models/constants/actionStates';
import { InGameState, LiveStatsScene, NotificationType } from '../../frontend/src/lib/models/enum';
import fs from 'fs/promises';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { ElectronSettingsStore } from './store/storeSettings';
import { ElectronPlayersStore } from './store/storePlayers';
import { dateTimeNow } from '../utils/functions';
import { analyzeMatch } from '../utils/analyzeMatch';
import os from 'os';
import { debounce, isNil } from 'lodash';
import { Command } from '../../frontend/src/lib/models/types/overlay';
import { MessageHandler } from './messageHandler';
import path from 'path';
import { PacketCapture } from './packetCapture';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { scopedLog } from '../utils/logger';
import { ElectronSessionStore } from './store/storeSession';
import { retryFunctionAsync } from './../utils/retryHelper';
import { predictNewRating } from './../utils/rankPrediction';
import { getPlayerRank } from '../../frontend/src/lib/utils/playerRankHelper';
import { getGameMode } from '../../frontend/src/lib/utils/gamePredicates';

function computeEdgeguardStats(
	frames: Record<number, FrameEntryType>,
	defenderIdx: number,
	stageData: { leftLedgeX: number; rightLedgeX: number },
): EdgeGuard {
	let attempts = 0;
	let successes = 0;
	let attemptActive = false;
	let prevStocks = -1;

	const sortedFrames = Object.values(frames).sort((a, b) => (a.frame ?? 0) - (b.frame ?? 0));
	for (const frameEntry of sortedFrames) {
		const defPost = frameEntry.players?.[defenderIdx]?.post;
		if (!defPost) continue;

		const defX = defPost.positionX ?? 0;
		const defStocks = defPost.stocksRemaining ?? 0;
		const offStage = defX < stageData.leftLedgeX || defX > stageData.rightLedgeX;
		const inHitstun = isDamaged(defPost.actionStateId ?? -1);
		const stockLost = prevStocks > 0 && defStocks < prevStocks;

		if (!attemptActive) {
			if (offStage && inHitstun) {
				attemptActive = true;
				attempts++;
			}
		} else {
			if (stockLost) {
				successes++;
				attemptActive = false;
			} else if (!offStage && !inHitstun) {
				attemptActive = false;
			}
		}
		prevStocks = defStocks;
	}

	const unsuccessful = attempts - successes;
	return {
		totalAttempts: attempts,
		successfulAttempts: successes,
		unsuccessfulAttempts: unsuccessful,
		successfulAttemptsPercent: attempts > 0 ? (successes / attempts) * 100 : 0,
		unsuccessfulAttemptsPercent: attempts > 0 ? (unsuccessful / attempts) * 100 : 0,
	};
}

@singleton()
export class StatsDisplay {
	private pauseInterval: NodeJS.Timeout;
	private isWin: boolean = os.platform() === 'win32';
	private abortController: AbortController = new AbortController();
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('SlpParser') private slpParser: SlpParser,
		@inject('SlpStream') private slpStream: SlpStream,
		@inject(delay(() => Api)) private api: Api,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronCurrentPlayerStore))
		private storeCurrentPlayer: ElectronCurrentPlayerStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => ElectronSessionStore)) private storeSession: ElectronSessionStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(PacketCapture) private packetCapture: PacketCapture,
	) {
		this.log = scopedLog(this.log, 'Stats');
		this.initStatDisplay();
		this.initListeners();
	}

	private async initStatDisplay() {
		this.log.info('Initializing Dolphin Events');
		this.slpStream.on(SlpStreamEvent.COMMAND, async (event: SlpRawEventPayload) => {
			this.slpParser.handleCommand(event.command, event.payload);
			if (event.command === Command.GAME_START) {
				const gameSettings = this.slpParser.getSettings();
				if (!gameSettings) return;
				this.handleUndefinedPlayers(gameSettings);
				await this.handleGameStart(gameSettings);
			}
		});

		this.slpParser.on(SlpParserEvent.END, async (gameEnd: GameEndType) => {
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
		const intervalTime = this.isWin ? 320 : 160;
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

	async handleGameStart(settings: GameStartType) {
		this.log.info("Game start:\n" + JSON.stringify(settings, null, 2));
		this.cancelSimulation();
		this.packetCapture.stopPacketCapture();
		if (!settings) return;

		await this.storeSession.checkAndResetSessionStats();
		const recentGames = await this.storeGames.getRecentGames();
		const { settings: resolvedSettings, isNewGame } = await this.resolveReplaySettings(settings, recentGames);
		await this.applyCurrentPlayers(resolvedSettings, isNewGame);

		this.storeLiveStats.setGameState(InGameState.Running);
		this.storeLiveStats.setStatsScene(LiveStatsScene.InGame);

		if (!isNewGame) return;
		this.log.info("New game detected. Clearing recent games.");
		await this.storeGames.clearRecentGames();
	}

	private async resolveReplaySettings(
		settings: GameStartType,
		recentGames: GameStats[],
	): Promise<{ settings: GameStartType; isNewGame: boolean }> {
		const previousGameSettings = recentGames.at(-1)?.settings;
		const replay = await retryFunctionAsync(5, () => this.findGameFromSettings(settings));
		this.log.debug("Replay:", replay);
		const replaySettings = replay?.getSettings();

		const isReplay = Boolean(replaySettings?.matchInfo?.matchId && !settings.matchInfo?.matchId);
		if (isReplay && replaySettings?.matchInfo) {
			this.log.info("Replay found. Using replay settings.", replaySettings);
			settings = replaySettings;
		}

		const isFirstReplay = Boolean(isReplay && recentGames.filter(g => g.isReplay).length === 0);
		const isNewMatchId = settings?.matchInfo?.matchId !== previousGameSettings?.matchInfo?.matchId;
		const prevGame = recentGames.at(-1);
		const bestOf = this.storeLiveStats.getBestOf();
		const prevSetEnded = prevGame?.score?.some(score => score >= Math.ceil(bestOf / 2));
		const isNewGame = Boolean(isNewMatchId || isFirstReplay || prevSetEnded);

		this.storeLiveStats.setGameSettings(settings);
		return { settings, isNewGame };
	}

	private async applyCurrentPlayers(settings: GameStartType, isNewGame: boolean): Promise<Player[]> {
		const currentPlayers = await this.getCurrentPlayersWithRankStats(settings, isNewGame);
		const currentPlayerConnectCode = this.storeSettings.getCurrentPlayerConnectCode();
		const currentPlayer = currentPlayers.find(p => p.connectCode === currentPlayerConnectCode);

		if (currentPlayer) {
			await this.storeCurrentPlayer.setCurrentPlayerBaseData(currentPlayer);
		}

		this.log.debug("Current players:", currentPlayers);
		if (currentPlayers.every(p => "rank" in p)) {
			this.storePlayers.setCurrentPlayers(currentPlayers);
		}
		return currentPlayers;
	}

	async handleGameEnd(
		gameEnd: GameEndType,
		latestGameFrame: FrameEntryType | null,
		settings: GameStartType | GameStartTypeExtended,
	) {
		this.log.info("Game end:\n" + JSON.stringify(gameEnd, null, 2));
		this.cancelSimulation();
		this.packetCapture.startPacketCapture();
		this.stopPauseInterval();
		this.handleInGameState(gameEnd, latestGameFrame);

		let gameStats = await this.findCurrentGameStats(settings, gameEnd);
		if (!gameStats) {
			this.log.info("Did not find the recently played game.")
			this.storeLiveStats.setStatsScene(LiveStatsScene.Menu)
			return;
		};

		if (!settings.matchInfo?.matchId && gameStats.settings?.matchInfo?.matchId) {
			this.log.info("Settings matchId does not match replay matchId. Assuming replay.")
			gameStats.isReplay = true;
			gameStats.settings.matchInfo.mode = "local";
		}

		gameStats = await this.handleGameSetStats(gameStats);
		if (gameStats) this.storeLiveStats.setGameStats(gameStats);
		await this.handlePostGameScene(gameStats);
		this.storeLiveStats.deleteGameFrame();
		setTimeout(() => {
			this.storeLiveStats.setGameState(InGameState.Inactive);
		}, 5000)
	}

	private async handlePostGameScene(game: GameStats | undefined): Promise<void> {
		if (isNil(game)) return;
		this.log.debug("Handle post game scene:")

		const playerConnectCode = this.storeSettings.getCurrentPlayerConnectCode()

		const bestOf = this.storeLiveStats.getBestOf();
		this.log.debug("Best of:", bestOf)
		const isPostSet = game.score.some((score) => score >= Math.ceil(bestOf / 2));
		this.log.debug("Is post set:", isPostSet)
		const isRanked = game.settings?.matchInfo?.mode === 'ranked';
		const player = await this.storeCurrentPlayer.getCurrentPlayer();

		if (!player) {
			this.log.error("Player not found. Cannot handle post game scene.")
			return;
		};

		const prevRank = { ...player?.rank } as Rank;

		if ((game.settings?.isSimulated) && playerConnectCode) {
			this.mockPostGameScene();
			return;
		}

		if (isPostSet && isRanked && playerConnectCode && prevRank && !game.isReplay && prevRank.current) {
			this.storeLiveStats.setStatsScene(LiveStatsScene.RankChange);
			if (player.rank?.predictedRating) {
				await this.handlePredictedRank(player, prevRank.current, game);
				return
			} else if (player.rank?.current) {
				const currentPlayerRankStats = await this.api.getNewRankWithBackoff(player.rank?.current, playerConnectCode)
				await this.storeCurrentPlayer.setCurrentPlayerNewRankStats(currentPlayerRankStats);
				return;
			} else {
				this.log.error("Player rank is undefined. Cannot handle rank change.")
				return;
			}
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

	private async handlePredictedRank(player: CurrentPlayer, prevRank: RankedNetplayProfile, game: GameStats) {
		const didWin = game.score[player.playerIndex] > game.score[player.playerIndex === 0 ? 1 : 0];
		const prediction = didWin ? player.rank?.predictedRating?.win : player.rank?.predictedRating?.loss;
		if (!prediction) return;
		prevRank.rating = prediction.ordinal ?? prevRank.rating;
		prevRank.totalGames += game.score.reduce((a, b) => a + b, 0);
		prevRank.wins += didWin ? 1 : 0;
		prevRank.losses += didWin ? 0 : 1;
		prevRank.rank = getPlayerRank(prevRank.rating, prevRank.dailyRegionalPlacement, prevRank.dailyGlobalPlacement);
		prevRank.ratingMu = prediction.mu ?? prevRank.ratingMu;
		prevRank.ratingSigma = prediction.sigma ?? prevRank.ratingSigma;

		this.log.info("Handling predicted rank:", prevRank)

		await new Promise((resolve) => setTimeout(resolve, 2000));

		await this.storeCurrentPlayer.setCurrentPlayerNewRankStats(prevRank);
	}

	private async mockPostGameScene() {
		this.storeLiveStats.setStatsScene(LiveStatsScene.RankChange);
		await new Promise((resolve) => setTimeout(resolve, 2000));
		const currentPlayerRankStats = await this.storeCurrentPlayer.getCurrentPlayerCurrentRankStats();
		if (!currentPlayerRankStats) return;
		const didWin = Math.random() > 0.5;
		const ratingChange = (didWin ? 1 : -1) * Math.random() * 500;
		const newMockRating = Number((currentPlayerRankStats.rating + ratingChange).toFixed(1));
		const newMockRank = getPlayerRank(newMockRating, 0, 0);
		const prevRank = await this.storeCurrentPlayer.getCurrentPlayerCurrentRankStats();
		const currentPlayerNewRankStats = {
			...currentPlayerRankStats,
			rating: newMockRating,
			rank: newMockRank,
			wins: currentPlayerRankStats.wins + (didWin ? 1 : 0),
			losses: currentPlayerRankStats.losses + (didWin ? 0 : 1),
			isMock: true,
		}
		await this.storeCurrentPlayer.setCurrentPlayerNewRankStats(currentPlayerNewRankStats);
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
				([, player]) => isNil(player) || player.post.stocksRemaining === 0,
			)
		)
			this.storeLiveStats.setGameState(InGameState.Tie);
	}

	private async handleGameSetStats(gameStats: GameStats | null): Promise<GameStats | undefined> {
		if (!gameStats) return;
		await this.storeGames.setGameMatch(gameStats);
		const games = await this.storeGames.getRecentGames();
		if (!games || !games?.length) return;

		const matchStats = analyzeMatch(games.flat().filter((game) => !game.isMock));
		this.storeLiveStats.setMatchStats(matchStats);
		return games.at(-1);
	}

	private async getCurrentPlayersWithRankStats(settings: GameStartType, isNewGame: boolean): Promise<Player[]> {
		this.log.debug("Getting current players with rank stats")

		const currentPlayers = settings.players.filter((player) => player);
		const previousPlayers = this.storePlayers.getCurrentPlayers();

		if ((!isNewGame || currentPlayers.some((player) => !player.connectCode)) && previousPlayers) {
			previousPlayers.forEach((player, i) => {
				player.displayName ||= currentPlayers[i]?.displayName;
			});
			return previousPlayers;
		}

		const currentPlayer = await this.storeCurrentPlayer.getCurrentPlayer();
		const newCurrentPlayer = currentPlayers.find((player) => player.connectCode === currentPlayer?.connectCode);
		const mode = getGameMode(settings);

		let currentPlayerNewSlippiData: Player | undefined;
		if (mode === "ranked" && newCurrentPlayer) {
			currentPlayerNewSlippiData = await this.api.getPlayerWithRankStats(newCurrentPlayer);
			await this.storeCurrentPlayer.setCurrentPlayerBaseData(currentPlayerNewSlippiData);
			await this.storeCurrentPlayer.setCurrentPlayerCurrentRankStats(currentPlayerNewSlippiData?.rank?.current);
		}

		const currentPlayersWithRankStats = (
			await Promise.all(
				currentPlayers.map(async (player: PlayerType) => {
					if (player.connectCode === currentPlayer?.connectCode)
						return currentPlayerNewSlippiData ?? { ...newCurrentPlayer, rank: currentPlayer?.rank };
					return await this.api.getPlayerWithRankStats(player);
				}),
			)
		).filter((player): player is Player => player !== undefined);

		currentPlayersWithRankStats[0].rank!.predictedRating = predictNewRating(currentPlayersWithRankStats[0], currentPlayersWithRankStats[1])
		currentPlayersWithRankStats[1].rank!.predictedRating = predictNewRating(currentPlayersWithRankStats[1], currentPlayersWithRankStats[0])

		return currentPlayersWithRankStats;
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

	private findGameFromSettings = async (settings: GameStartType | undefined): Promise<SlippiGame | undefined> => {
		if (!settings) return;
		this.log.debug(`Finding game: matchId=${settings.matchInfo?.matchId ?? 'none'} game=${settings.matchInfo?.gameNumber ?? '?'} seed=${settings.randomSeed ?? '?'}`);
		const matchId = settings.matchInfo?.matchId;
		const gameNumber = settings.matchInfo?.gameNumber;
		const tiebreakerNumber = settings.matchInfo?.tiebreakerNumber ?? 0;
		const randomSeed = settings.randomSeed;
		const files = await this.getGameFiles();
		if (!files || !files.length) return;
		const file = files.find((file) => {
			const fileSettings = new SlippiGame(file).getSettings();
			return matchId
				? (
					fileSettings?.matchInfo?.matchId === matchId &&
					fileSettings?.matchInfo?.gameNumber === gameNumber &&
					(fileSettings?.matchInfo?.tiebreakerNumber ?? 0) === tiebreakerNumber
				)
				: fileSettings?.randomSeed === randomSeed;
		});
		if (!file) return;
		return new SlippiGame(file);
	}

	private async findCurrentGameStats(
		settings: GameStartType | GameStartTypeExtended | undefined,
		gameEnd: GameEndType | undefined,
	): Promise<GameStats | undefined> {
		const files = await this.getGameFiles();
		if (!files || !files.length) return;

		const matchId = settings?.matchInfo?.matchId ?? '';
		const gameNumber = settings?.matchInfo?.gameNumber ?? 0;
		const randomSeed = settings?.randomSeed;
		this.log.info("Looking for replay:", matchId, "Game number:", gameNumber, "Random seed:", randomSeed);

		const game = await retryFunctionAsync(5, async () => await this.findGameFromSettings(settings))

		if (!game) {
			this.log.error("Could not find recent replay")
			return
		};

		this.log.info("Analyzing game:", settings?.matchInfo)
		this.log.debug('Analyzing recent game file:');

		const gameStats = this.createGameStats(game, gameEnd);
		if (!gameStats || !gameStats.settings) return;
		gameStats.settings = { ...settings, ...gameStats.settings };
		return gameStats;
	}

	private async handleUndefinedPlayers(settings: GameStartType | null | undefined) {
		if (!settings) return;
		const players = this.storePlayers.getCurrentPlayers();
		if (!players) this.storePlayers.setCurrentPlayers(settings.players);
	}

	private createGameStats(
		game: SlippiGame | undefined,
		gameEnd: GameEndType | undefined = undefined,
	): GameStats | undefined {
		if (!game) return;
		const settings = game.getSettings();
		const matchId = settings?.matchInfo?.matchId;
		const gameStats = {
			gameEnd: gameEnd ?? game?.getGameEnd(),
			lastFrame: game.getLatestFrame(),
			postGameStats: this.enrichPostGameStats(game),
			settings: {
				...settings,
				matchInfo: {
					...settings?.matchInfo,
					mode: getGameMode(settings),
					matchId: matchId ? matchId : "",
					bestOf: this.storeLiveStats.getBestOf(),
				},
			},
			timestamp: dateTimeNow(),
		} as GameStats;
		return gameStats;
	}

	private enrichPostGameStats(game: SlippiGame | null): StatsTypeExtended | null {
		if (!game) return null;
		const stats = game.getStats();
		if (!stats) return null;

		const settings = game.getSettings();
		const stageId = settings?.stageId ?? null;
		const stageData = stageId != null ? (STAGE_DATA[stageId] ?? null) : null;
		const frames = stageData ? game.getFrames() : null;
		const players = settings?.players ?? [];

		const overall: OverallTypeExtended[] = (stats.overall ?? []).map(playerOverall => {
			let edgeGuard: EdgeGuard | undefined;
			if (frames && stageData) {
				const myIdx = playerOverall.playerIndex;
				const oppPlayer = players.find(p => p && p.playerIndex !== myIdx);
				const oppIdx = oppPlayer?.playerIndex ?? (myIdx === 0 ? 1 : 0);
				edgeGuard = computeEdgeguardStats(frames, oppIdx, stageData);
			}
			return { ...playerOverall, edgeGuard, recovery: undefined };
		});

		return { ...stats, overall } as StatsTypeExtended;
	}

	private getRecentReplay = async (): Promise<SlippiGame | undefined> => {
		const files = await this.getGameFiles();
		if (!files || !files.length) return;
		const onlineFile = files.find((file) => {
			try {
				const settings = new SlippiGame(file).getSettings();
				return settings?.players.some((player) => player?.connectCode);
			} catch { return false; }
		});
		return new SlippiGame(onlineFile ?? files[0]);
	};

	simulateGame = async () => {
		this.cancelSimulation();
		const game = await this.getRecentReplay();
		if (!game) {
			this.messageHandler.sendMessage('Notification', 'No replay files found. Configure Slippi path in settings.', NotificationType.Warning, 3000);
			return;
		}
		const settings = game.getSettings() as GameStartTypeExtended;
		const frames = game.getFrames()
		if (!settings || !frames) return;
		settings.isSimulated = true;
		this.stopPauseInterval();
		await this.handleGameFrame(frames[0]);
		await this.handleGameStart(settings);
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
		await this.handleGameEnd(gameEnd, latestFrame, settings);
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
		await this.handleGameEnd(gameEnd, latestFrame, settings);
	}

	private waitWithCancel = (ms: number) => {
		return new Promise((resolve, reject) => {
			const signal = this.abortController?.signal;
			const onAbort = () => {
				clearTimeout(timeout);
				reject(new Error('Simulation canceled'));
			};
			const timeout = setTimeout(() => {
				// Remove the per-frame abort listener so it doesn't accumulate across
				// the thousands of frames in a replay (MaxListenersExceededWarning).
				signal?.removeEventListener('abort', onAbort);
				resolve(undefined);
			}, ms);
			signal?.addEventListener('abort', onAbort, { once: true });
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
