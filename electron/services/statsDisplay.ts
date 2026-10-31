import { SlpParserEvent, SlpParser, GameEndMethod, SlpCommandEventPayload as SlpRawEventPayload } from '@slippi/slippi-js';
import type { FrameEntryType as SlpFrameEntryType, GameEndType as SlpGameEndType } from '@slippi/slippi-js';
import { SlippiGame, SlpStream, SlpStreamEvent } from '@slippi/slippi-js/node';
import type { FrameEntryType, GameEndType, GameStartType, PlayerType } from '../../frontend/src/lib/models/types/slippiTypes';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';
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
	ReplaySummary,
} from '../../frontend/src/lib/models/types/slippiData';
import { STAGE_DATA } from '../../frontend/src/lib/models/constants/stageData';
import { isDamaged } from '../../frontend/src/lib/models/constants/actionStates';
import { InGameState, LiveStatsScene, NotificationType } from '../../frontend/src/lib/models/enum';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { ElectronSettingsStore } from './store/storeSettings';
import { ElectronPlayersStore } from './store/storePlayers';
import { dateTimeNow } from '../utils/functions';
import { analyzeMatch } from '../utils/analyzeMatch';
import { assignKeys, continuesSet as continuesSetAcrossSessions, type KeyedPlayer } from '../../frontend/src/lib/utils/playerIdentity';
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
import { didPlayerWin, getGameMode, isDisconnectEnding, isSetComplete } from '../../frontend/src/lib/utils/gamePredicates';
import { applyTeamOrder, orderTeams, setReference, slotOrder } from '../../frontend/src/lib/utils/teams';
import { fightStatsFromFrames } from '../../frontend/src/lib/utils/fightStats';
import { ElectronHighlightStore } from './store/storeHighlights';
import { ElectronSetService } from './setService';

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
		@inject(delay(() => ElectronSetService)) private setService: ElectronSetService,
		@inject(delay(() => ElectronHighlightStore)) private storeHighlights: ElectronHighlightStore,
	) {
		this.log = scopedLog(this.log, 'Stats');
		this.initStatDisplay();
		this.initListeners();
	}

	private async initStatDisplay() {
		this.log.info('Initializing Dolphin Events');
		this.slpStream.on(SlpStreamEvent.COMMAND, async (event: SlpRawEventPayload) => {
			try {
				this.slpParser.handleCommand(event.command, event.payload);
			} catch (err) {
				// Frame/bookend commands can arrive before GAME_START if we connect mid-game
				// (slippi-js's parser has no null-guard for that case) — drop the command and
				// wait for the next GAME_START rather than crashing the process.
				this.log.warn('Dropped Slippi command before GAME_START was seen:', err);
				return;
			}
			if (event.command === Command.GAME_START) {
				const gameSettings = nulled(this.slpParser.getSettings());
				if (!gameSettings) return;
				this.handleUndefinedPlayers(gameSettings);
				await this.handleGameStart(gameSettings);
			}
		});

		this.slpParser.on(SlpParserEvent.END, async (rawGameEnd: SlpGameEndType) => {
			const gameEnd = nulled(rawGameEnd);
			const settings = nulled(this.slpParser.getSettings());
			const latestFrame = nulled(this.slpParser.getLatestFrame());
			if (isNil(settings) || isNil(latestFrame) || isNil(gameEnd)) return;
			await this.handleGameEnd(gameEnd, latestFrame, settings);
		});

		this.slpParser.on(
			SlpParserEvent.FRAME,
			debounce(
				(frameEntry: SlpFrameEntryType) => {
					this.handleGameFrame(nulled(frameEntry));
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

	/** Host swap from Fix set…: the striking set, the stored set (score), and the live players. */
	private async swapSides(kind: 'sides' | 'team1' | 'team2') {
		const isTeams = !!this.storeLiveStats.getGameSettings()?.isTeams;
		this.messageHandler.sendMessage('SidesSwapped', kind);
		const stored = await this.storeGames.swapSides(kind);
		this.storePlayers.swapPlayers(kind, isTeams);
		this.log.info(`Sides swapped (${kind})${stored ? '' : ' — no stored game yet: applies to this game only'}`);
	}

	async handleGameFrame(frameEntry: FrameEntryType) {
		this.messageHandler.sendMessage('GameFrame', frameEntry);
		this.storeLiveStats.trackFightStats(frameEntry);
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
		this.storeLiveStats.startFightStats(resolvedSettings, isNewGame);

		this.storeLiveStats.setGameState(InGameState.Running);
		// Scenes are switched by flows (the "Scene switching" flow: Game starts → In Game).

		if (!isNewGame) return;
		this.log.info("New game detected. Clearing recent games.");
		this.messageHandler.sendMessage('NewSetDetected');
		await this.storeGames.clearRecentGames();
	}

	private async resolveReplaySettings(
		settings: GameStartType,
		recentGames: GameStats[],
	): Promise<{ settings: GameStartType; isNewGame: boolean }> {
		const previousGameSettings = recentGames.at(-1)?.settings;
		const replay = await retryFunctionAsync(5, () => this.findGameFromSettings(settings));
		this.log.debug("Replay:", replay);
		// Flows get it as {{state.replay.file}} (highlights point into it while the game is played).
		this.storeHighlights.setLiveReplay(replay?.getFilePath() ?? null);
		const replaySettings = nulled(replay?.getSettings());

		const isReplay = Boolean(replaySettings?.matchInfo?.matchId && !settings.matchInfo?.matchId);
		if (isReplay && replaySettings?.matchInfo) {
			this.log.info("Replay found. Using replay settings.", replaySettings);
			settings = replaySettings;
		}

		const isFirstReplay = Boolean(isReplay && recentGames.filter(g => g.isReplay).length === 0);
		// Local games have no live matchId; once persisted they carry a synthetic "local-*" id, so
		// comparing the live "" against a persisted synthetic id would falsely flag every local game
		// as a new set. Only treat it as a new match when a real (non-empty) live matchId changes.
		const currentMatchId = settings?.matchInfo?.matchId ?? "";
		const prevMatchId = previousGameSettings?.matchInfo?.matchId ?? "";
		const isNewMatchId = currentMatchId ? currentMatchId !== prevMatchId : false;
		const prevGame = recentGames.at(-1);
		const bestOf = this.storeLiveStats.getBestOf();
		const prevSetEnded = prevGame?.score?.some(score => score >= Math.ceil(bestOf / 2));
		// A new Slippi session (disconnect / restart) with the same online players continues the set:
		// its games are stored under the set's match id, so score and stats carry on.
		const continuesSet = !isFirstReplay && continuesSetAcrossSessions({
			enabled: this.storeGames.getContinueSetAcrossSessions(),
			currentMatchId,
			previousMatchId: prevMatchId,
			previousSetEnded: !!prevSetEnded,
			currentPlayers: settings.players,
			previousPlayers: previousGameSettings?.players,
		});
		if (continuesSet) this.log.info(`New Slippi session with the same players — continuing set ${prevMatchId}`);
		this.storeLiveStats.setSetMatchId(continuesSet ? prevMatchId : undefined);
		const isNewGame = Boolean((isNewMatchId && !continuesSet) || isFirstReplay || prevSetEnded);

		// Who is who across the set (offline doubles: Red-1 …; online: connect code).
		const keys = assignKeys(settings.players ?? [], !!settings.isTeams, isNewGame ? undefined : previousGameSettings?.players);
		for (const p of settings.players ?? []) if (p) (p as KeyedPlayer).froggiKey = keys[p.playerIndex] ?? null;

		// Offline/local play has no live matchId. Mint a synthetic per-set id so its games group
		// under a unique id instead of piling under "" (the unbounded bucket that hung startup).
		if (!currentMatchId && (isNewGame || !this.storeLiveStats.getLocalSetId())) {
			this.storeLiveStats.setLocalSetId(`local-${crypto.randomUUID()}`);
		}

		(settings as GameStartTypeExtended).gameStartId = crypto.randomUUID();
		(settings as GameStartTypeExtended).isNewSet = isNewGame;
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
			// Still a game end for flows (no stats to show) — the scene flow moves on from In Game.
			this.messageHandler.sendMessage('GameEndWithoutReplay', gameEnd);
			return;
		};

		if (!settings.matchInfo?.matchId && gameStats.settings?.matchInfo?.matchId) {
			this.log.info("Settings matchId does not match replay matchId. Assuming replay.")
			gameStats.isReplay = true;
			gameStats.settings.matchInfo.mode = "local";
		}

		// Keep the live game's set identities (and any host fix) on the stored game.
		const live = this.storeLiveStats.getGameSettings()?.players ?? [];
		if (gameStats.settings?.players) {
			gameStats.settings.players = gameStats.settings.players.map((p) =>
				p ? ({ ...p, froggiKey: (live.find((l) => l?.playerIndex === p.playerIndex) as KeyedPlayer | undefined)?.froggiKey ?? null } as typeof p) : p,
			);
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
		const isPostSet = isSetComplete(game.score, bestOf);
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

		// Scenes (Post Game / Post Set / Rank Change) are switched by flows; here only the rank data.
		if (isPostSet && isRanked && playerConnectCode && prevRank && !game.isReplay && prevRank.current) {
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

		// A ranked game cut short by a disconnect has no winner in the replay, so the score never reaches
		// the end of the set. Slippi's server decides whether the set counted — ask it in the background.
		if (!isPostSet && isRanked && isDisconnectEnding(game.gameEnd) && playerConnectCode && prevRank.current && !game.isReplay) {
			void this.checkRankAfterDisconnect(prevRank.current, playerConnectCode);
		}
	}

	/** After a disconnect: show the rank change if Slippi counted the set (totalSets went up). */
	private async checkRankAfterDisconnect(prevRank: RankedNetplayProfile, connectCode: string) {
		const newRank = await this.api.getNewRankWithBackoff(prevRank, connectCode);
		if (newRank.totalSets <= prevRank.totalSets) {
			this.log.info('Ranked game ended by a disconnect; the set was not counted (yet)');
			return;
		}
		this.log.info('Ranked set ended by a disconnect — showing the rank change');
		await this.storeCurrentPlayer.setCurrentPlayerNewRankStats(newRank);
	}

	private async handlePredictedRank(player: CurrentPlayer, prevRank: RankedNetplayProfile, game: GameStats) {
		const didWin = didPlayerWin(game, player);
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
		// Restore the real rank quietly — announcing it would be a second rank change (flows would react).
		setTimeout(() => {
			void this.storeCurrentPlayer.setCurrentPlayerCurrentRankStats(prevRank);
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

		// Doubles: players in slot order (T1P1, T2P1, T1P2, T2P2) so Player 1/2 elements show each team's
		// first player; teams keep their slot from the set's first game. No rating lookups in doubles.
		if (settings.isTeams) {
			if (isNewGame) this.storePlayers.newSet(); // new teams → back to "Tag & Tag" (unless Start Set named them)
			const recent = isNewGame ? [] : await this.storeGames.getRecentGames();
			const first = recent.find((g) => g.settings?.isTeams && g.settings.players?.length);
			// Sides from the set's first game, with the host's swaps (Fix set…).
			const ref = setReference(first);
			return this.storePlayers.withSetTags(
				slotOrder(applyTeamOrder(orderTeams(currentPlayers, first ? ref.teamRef : undefined), ref.teamOrder)).map(
					(p) => ({ ...p, rank: previousPlayers?.find((x) => x.connectCode && x.connectCode === p.connectCode)?.rank }) as Player,
				),
			);
		}

		if ((!isNewGame || currentPlayers.some((player) => !player.connectCode)) && previousPlayers) {
			previousPlayers.forEach((player, i) => {
				player.displayName ||= currentPlayers[i]?.displayName;
			});
			// Same players, maybe on other ports (a new Slippi session): refresh port/character by connect code.
			return previousPlayers.map((prev) => {
				const now = prev.connectCode ? currentPlayers.find((c) => c.connectCode === prev.connectCode) : undefined;
				return now ? ({ ...prev, ...now, displayName: now.displayName || prev.displayName, rank: prev.rank } as Player) : prev;
			});
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

		const rootSlpPath = this.storeSettings.getReplayRootPath();
		if (!slippiSettings || !rootSlpPath) return;
		if (!existsSync(rootSlpPath)) {
			this.log.warn(`Replay folder not found: ${rootSlpPath} — set the replay folder in Slippi Launcher → Settings → Replays`);
			return;
		}

		const isBeta = slippiSettings?.useNetplayBeta;
		const mainlineRegex = /\b(Mainline|beta)\b/i;
		const directoryRegex = /^\d{4}-\d{2}$/


		const subFolder = slippiSettings.useMonthlySubfolders
			? (await fs.readdir(rootSlpPath, { withFileTypes: true }))
				.filter((dirent) => dirent.isDirectory())
				.map((dirent) => dirent.name)
				.filter((dirname) => (isBeta ? mainlineRegex.test(dirname) : dirname))
				.filter((dirname) => directoryRegex.test(dirname))
				.sort((a, b) => (a < b ? 1 : -1))
				.at(0) ?? './'
			: './';

		const replaysDirContent = await this.getReplayDirs({ ...slippiSettings, rootSlpPath }, subFolder);

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
			const fileSettings = nulled(new SlippiGame(file).getSettings());
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
		const settings = nulled(game.getSettings());
		const matchId = settings?.matchInfo?.matchId;
		const gameStats = {
			gameEnd: gameEnd ?? nulled(game.getGameEnd()),
			lastFrame: nulled(game.getLatestFrame()),
			postGameStats: this.enrichPostGameStats(game),
			settings: {
				...settings,
				matchInfo: {
					...settings?.matchInfo,
					mode: getGameMode(settings),
					// Persist the synthetic local set id when Slippi gave no matchId, so local games
					// group per set. getGameMode still reads "local" (the id doesn't match its regex).
					matchId: this.storeLiveStats.getSetMatchId() ?? (matchId ? matchId : (this.storeLiveStats.getLocalSetId() ?? "")),
					bestOf: this.storeLiveStats.getBestOf(),
				},
			},
			timestamp: dateTimeNow(),
			replayPath: this.replayReference(game.getFilePath()),
		} as GameStats;
		return gameStats;
	}

	/** A replay file as stored with its game: relative to the Slippi replay folder when inside it, else absolute. */
	private replayReference(filePath: string | null | undefined): string | null {
		if (!filePath) return null;
		const root = this.storeSettings.getReplayRootPath();
		const relative = root ? path.relative(root, filePath) : '';
		return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? relative.split(path.sep).join('/') : filePath;
	}

	private enrichPostGameStats(game: SlippiGame | null): StatsTypeExtended | null {
		if (!game) return null;
		const stats = nulled(game.getStats());
		if (!stats) return null;

		const settings = nulled(game.getSettings());
		const stageId = settings?.stageId ?? null;
		const stageData = stageId != null ? (STAGE_DATA[stageId] ?? null) : null;
		const frames = stageData ? nulled(game.getFrames()) : null;
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
		const settings = nulled(game.getSettings()) as GameStartTypeExtended | null;
		const frames = nulled(game.getFrames());
		if (!settings || !frames) return;
		settings.isSimulated = true;
		this.stopPauseInterval();
		await this.handleGameFrame(frames[0]);
		await this.handleGameStart(settings);
		const sortedKeys = Object.keys(frames).map(Number).sort((a, b) => a - b);
		try {
			for (const key of sortedKeys) {
				if (this.abortController.signal.aborted) return;
				const frame = frames[key];
				await this.handleGameFrame(frame);
				// Flat 16ms wait after processing: effective ~30fps under load, but a steady rate and
				// lower CPU than chasing 60fps — the preview looks the same and stays consistent.
				await this.waitWithCancel(16);
			}
		} catch (err) {
			// Cancellation is expected (a newer simulation/game start superseded this one).
			if (err instanceof Error && err.message === 'Simulation canceled') return;
			throw err;
		}
		const gameEnd = nulled(game.getGameEnd());
		const latestFrame = nulled(game.getLatestFrame());
		if (!gameEnd) return;
		await this.handleGameEnd(gameEnd, latestFrame, settings);
	}

	simulateGameEnd = async () => {
		const liveStatsScene = this.storeLiveStats.getStatsScene();
		if (liveStatsScene === LiveStatsScene.RankChange) return;
		const game = await this.getRecentReplay();
		if (!game) return;
		const gameEnd = nulled(game.getGameEnd());
		const latestFrame = nulled(game.getLatestFrame());
		const settings = nulled(game.getSettings()) as GameStartTypeExtended | null;
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

	/** The latest replays in the Slippi folder (newest first) — the host can load them into the set. */
	async latestReplayFiles(): Promise<string[]> {
		return ((await this.getGameFiles()) ?? []).slice(0, 10);
	}

	async sendRecentReplays() {
		const summaries: ReplaySummary[] = [];
		for (const file of await this.latestReplayFiles()) {
			try {
				const slp = new SlippiGame(file);
				const settings = slp.getSettings();
				if (!settings) continue;
				const winners = new Set((slp.getGameEnd()?.placements ?? []).filter((pl) => pl.position === 0).map((pl) => pl.playerIndex));
				const winnerTeam = settings.isTeams ? settings.players.find((p) => winners.has(p.playerIndex))?.teamId : undefined;
				const last = slp.getLatestFrame();
				summaries.push({
					path: file,
					startAt: slp.getMetadata()?.startAt ?? null,
					stageId: settings.stageId ?? null,
					isTeams: !!settings.isTeams,
					matchId: settings.matchInfo?.matchId ?? '',
					players: settings.players.filter((p) => p).map((p) => ({
						playerIndex: p.playerIndex,
						port: p.port,
						characterId: p.characterId ?? null,
						teamId: p.teamId ?? null,
						tag: p.displayName || p.connectCode || p.nametag || `Port ${p.port}`,
						won: settings.isTeams ? p.teamId === winnerTeam && winnerTeam != null : winners.has(p.playerIndex),
						stocks: last?.players?.[p.playerIndex]?.post?.stocksRemaining ?? null,
					})),
				});
			} catch (err) {
				this.log.warn('Could not read replay', file, err);
			}
		}
		this.messageHandler.sendHostMessage('RecentReplays', summaries);
	}

	/**
	 * Host: these replays are the set's finished games (Froggi was closed / a new Slippi session).
	 * Score, match stats, fight stats, players and the stage-striking state are rebuilt from them.
	 */
	async loadSetGames(paths: string[], continueNextSession: boolean, swapSides = false) {
		const allowed = await this.latestReplayFiles();
		const files = paths.filter((p) => allowed.includes(p)).sort(); // file names are timestamps → oldest first
		if (!files.length) return;
		this.storeGames.setContinueSetAcrossSessions(continueNextSession);

		const slps = files.map((f) => new SlippiGame(f));
		const firstMatchId = slps[0].getSettings()?.matchInfo?.matchId ?? '';
		if (!firstMatchId) this.storeLiveStats.setLocalSetId(`local-${crypto.randomUUID()}`);
		const setId = firstMatchId || this.storeLiveStats.getLocalSetId() || '';

		const games: GameStats[] = [];
		const fight = [];
		for (const slp of slps) {
			const game = this.createGameStats(slp);
			if (!game?.settings) continue;
			game.settings.matchInfo = { ...game.settings.matchInfo, matchId: setId };
			const startAt = slp.getMetadata()?.startAt;
			game.timestamp = startAt ? new Date(startAt) : new Date(dateTimeNow().getTime() + games.length * 1000);
			const keys = assignKeys(game.settings.players, !!game.settings.isTeams, games.at(-1)?.settings?.players);
			game.settings.players = game.settings.players.map((p) => (p ? ({ ...p, froggiKey: keys[p.playerIndex] ?? null } as typeof p) : p));
			games.push(game);
			fight.push(fightStatsFromFrames(game.settings.players, !!game.settings.isTeams, nulled(slp.getFrames())));
		}
		if (!games.length) return;
		// The host chose which side is Player/Team 1 when picking the games.
		if (swapSides) games[0].sides = { swapped: true, teamOrder: [false, false] };

		await this.storeGames.replaceRecentGames(games);
		this.storeLiveStats.setMatchStats(analyzeMatch(games));
		this.storeLiveStats.setGameStats(games.at(-1)!);
		const running = this.storeLiveStats.getStatsScene() === LiveStatsScene.InGame; // game state can lag after the end
		if (!running) this.storeLiveStats.fightStats.clearGame();
		this.storeLiveStats.fightStats.setFinished(fight);
		this.storeLiveStats.sendFightStats();
		if (!running) await this.applyCurrentPlayers(games.at(-1)!.settings as GameStartType, false);
		this.setService.loadGames(games);
		this.log.info(`Loaded ${games.length} replay(s) into set ${setId}`);
	}

	/** Host: add one of the latest replays to the set's games (Edit Games → From replay). */
	async addSetGameFromReplay(file: string) {
		if (!(await this.latestReplayFiles()).includes(file)) return;
		const slp = new SlippiGame(file);
		const game = this.createGameStats(slp);
		if (!game?.settings) return;
		const games = await this.storeGames.getRecentGames();
		const setId = this.storeGames.getRecentGameId() || game.settings.matchInfo.matchId;
		game.settings.matchInfo = { ...game.settings.matchInfo, matchId: setId };
		const startAt = slp.getMetadata()?.startAt;
		game.timestamp = startAt ? new Date(startAt) : dateTimeNow();
		const keys = assignKeys(game.settings.players, !!game.settings.isTeams, games.at(-1)?.settings?.players);
		game.settings.players = game.settings.players.map((p) => (p ? ({ ...p, froggiKey: keys[p.playerIndex] ?? null } as typeof p) : p));
		await this.storeGames.addMatchGame(game);
		this.storeLiveStats.setMatchStats(analyzeMatch([...games, game]));
		this.log.info('Added a replay to the set:', path.basename(file));
	}

	/** Host fix of who is who (froggiKey per playerIndex): the running game, else the set's last game. */
	async setPlayerKeys(keys: Record<number, string>) {
		const apply = <P extends { playerIndex: number } | null>(players: P[]) =>
			players.map((p) => (p && keys[p.playerIndex] ? ({ ...p, froggiKey: keys[p.playerIndex] } as P) : p));
		const settings = this.storeLiveStats.getGameSettings();
		if (settings) {
			settings.players = apply(settings.players);
			this.storeLiveStats.setGameSettings(settings);
			this.storeLiveStats.fightStats.setPlayers(settings.players);
			this.storeLiveStats.sendFightStats();
		}
		const running = this.storeLiveStats.getStatsScene() === LiveStatsScene.InGame; // game state can lag after the end
		if (!running) {
			const games = await this.storeGames.getRecentGames();
			const last = games.at(-1);
			if (last?.settings) {
				last.settings.players = apply(last.settings.players);
				await this.storeGames.updateRecentGamePlayers(games);
				this.storeLiveStats.setMatchStats(analyzeMatch(games));
			}
		}
		if (settings) await this.applyCurrentPlayers(settings, false);
		this.log.info('Host fixed player identities:', keys);
	}

	private initListeners() {
		this.clientEmitter.on('RecentReplaysRequest', () => this.sendRecentReplays());
		this.clientEmitter.on('LoadSetGames', (paths, continueNext, swapSides) => this.loadSetGames(paths, continueNext, swapSides));
		this.clientEmitter.on('SetPlayerKeys', (keys) => this.setPlayerKeys(keys));
		this.clientEmitter.on('SwapSides', (kind) => void this.swapSides(kind));
		this.clientEmitter.on('AddSetGameFromReplay', (file) => this.addSetGameFromReplay(file));
		this.clientEmitter.on('SimulateGameStart', this.simulateGame.bind(this));
		this.clientEmitter.on('SimulateGameEnd', this.simulateGameEnd.bind(this));
	}
}
