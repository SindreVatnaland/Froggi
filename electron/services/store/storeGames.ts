// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import type {
	GameStartMode,
	GameStartTypeExtended,
	GameStats,
	Sets,
} from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { PlayerType } from '@slippi/slippi-js';
import { ElectronSettingsStore } from './storeSettings';
import { ElectronCurrentPlayerStore } from './storeCurrentPlayer';
import {
	getGameScore,
	hasGameBombRain,
	isTiedGame,
} from '../../../frontend/src/lib/utils/gamePredicates';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { ElectronLiveStatsStore } from './storeLiveStats';

@singleton()
export class ElectronGamesStore {
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => ElectronCurrentPlayerStore)) private storeCurrentPlayer: ElectronCurrentPlayerStore,
		@inject('ElectronStore') private store: Store,
	) {
		this.log.info('Initializing Game Store');
		this.initEventListeners();
		this.initStoreListeners();
		// Move this to SQLite
	}

	getRecentDirectSets() {
		return this.getRecentSetsByMode('direct');
	}

	getRecentUnankedSets() {
		return this.getRecentSetsByMode('unranked');
	}

	getRecentRankedSets() {
		return this.getRecentSetsByMode('ranked');
	}

	// GAME
	getGameScore(): number[] {
		return (this.store.get('stats.game.score') ?? [0, 0]) as number[];
	}

	setGameScore(score: number[] | undefined) {
		this.store.set('stats.game.score', score ?? [0, 0]);
	}

	async setGameMatch(gameStats: GameStats | null) {
		if (!gameStats) return;
		this.addRecentGames(gameStats);
		const player = await this.storeCurrentPlayer.getCurrentPlayer();
		if (
			!player ||
			!gameStats?.settings?.players.some(
				(p: PlayerType) => p.connectCode === player?.connectCode,
			)
		)
			return;
		if (!gameStats.settings.matchInfo?.matchId || !gameStats?.settings.matchInfo.gameNumber)
			return;
		const matches = this.getGameMatch(gameStats.settings.matchInfo.matchId);
		this.store.set(
			`player.${player.connectCode}.game.${gameStats.settings.matchInfo.mode}.${gameStats.settings.matchInfo.matchId}`,
			[...matches, gameStats],
		);
	}

	getGameMatch(matchId: string | undefined | null): GameStats[] {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode || !matchId) return [];
		const games = Object.assign(
			this.getAllSetsByMode('ranked') ?? {},
			this.getAllSetsByMode('unranked') ?? {},
			this.getAllSetsByMode('direct') ?? {},
		);
		return games[matchId] ?? [];
	}

	getGameMatchGame(matchId: string, gameNumber: number): GameStats | undefined {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		const games = Object.assign(
			this.getAllSetsByMode('ranked') ?? {},
			this.getAllSetsByMode('unranked') ?? {},
			this.getAllSetsByMode('direct') ?? {},
		);
		return games[matchId].find((game) => game.settings?.matchInfo?.gameNumber === gameNumber);
	}

	getAllSetsByMode(mode: GameStartMode): { [matchId: string]: GameStats[] } {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return {};
		const playerGame = this.store.get(`player.${connectCode}.game`) as any;
		if (!playerGame) return {};
		return playerGame[mode];
	}

	getRecentGames(): GameStats[][] {
		const recentGames = (this.store.get(`player.any.game.recent`) ?? []) as GameStats[][];
		return recentGames
	}

	addRecentGames(newGame: GameStats) {
		if (newGame.settings?.matchInfo.matchId) this.handleOnlineGame(newGame);
		if (!newGame.settings?.matchInfo.matchId) this.handleOfflineGame(newGame);
	}

	deleteRecentGame(gameIndex: number) {
		const recentGames = this.getRecentGames();
		this.store.set('player.any.game.recent', this.applyRecentGameScore(recentGames.filter((_, index) => index !== gameIndex)));
	}

	insertMockGame(newGame: GameStats, index: number) {
		let recentGames = this.getRecentGames()
		const recentGame = recentGames.at(-1)?.at(-1) ?? null
		newGame = { ...newGame, isMock: true, settings: { ...newGame.settings, matchInfo: { ...(recentGame?.settings?.matchInfo ?? { gameNumber: null, matchId: "", tiebreakerNumber: 0, mode: "local", }), ...{ gameNumber: null, bestOf: this.storeLiveStats.getBestOf() } } } as GameStartTypeExtended }
		recentGames = [...recentGames.slice(0, index), [newGame], ...recentGames.slice(index)];
		this.store.set('player.any.game.recent', this.applyRecentGameScore(recentGames));
	}

	private handleOnlineGame(newGame: GameStats) {
		const prevGames = this.getRecentGames();
		const currentGame = prevGames.find((prevGame) =>
			prevGame.some(
				(game) =>
					game.settings?.matchInfo.gameNumber === newGame.settings?.matchInfo.gameNumber,
			),
		);

		const remainingGames = prevGames.filter(
			(game) =>
				game.at(0)?.settings?.matchInfo.matchId !==
				currentGame?.at(0)?.settings?.matchInfo.matchId,
		);
		if (newGame.settings?.matchInfo.tiebreakerNumber !== 0) {
			return this.store.set('player.any.game.recent', [
				[...(currentGame ?? []), newGame],
				...(remainingGames ?? []),
			].slice(0, 10));
		}
		return this.store.set('player.any.game.recent', this.applyRecentGameScore([...prevGames, [newGame]]));
	}

	private handleOfflineGame(newGame: GameStats) {
		if (hasGameBombRain(newGame)) return;

		const prevGames = this.getRecentGames();
		const currentGame = prevGames.at(0);

		const filteredGames = prevGames.slice(1);
		if (this.isRematchGame(currentGame, newGame)) {
			return this.store.set(`player.any.game.recent`, [
				[...(currentGame ?? []), newGame],
				...(filteredGames ?? []),
			].slice(0, 10));
		}
		return this.store.set(`player.any.game.recent`, this.applyRecentGameScore([...prevGames, [newGame]]));
	}

	private isRematchGame(currentGame: GameStats[] | undefined, game: GameStats): boolean {
		if (!game.settings) return true;
		if (currentGame && isTiedGame(currentGame.at(-1))) return true;
		return false;
	}

	clearRecentGames() {
		this.store.set(`player.any.game.recent`, this.applyRecentGameScore([]));
	}

	private getAllSets(): Sets | undefined {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		return this.store.get(`player.${connectCode}.game`) as Sets | undefined;
	}

	// TODO: Test
	getRecentSetsByMode(mode: GameStartMode, number = 10): GameStats[] {
		const sets = this.getAllSets();
		if (!sets) return [];
		return (
			Object.values(sets[mode])
				?.sort(
					(a: GameStats, b: GameStats) => (a.timestamp?.valueOf() ?? 0) - (b.timestamp?.valueOf() ?? 0),
				)
				.slice(0, number) ?? []
		);
	}

	private applyRecentGameScore(games: GameStats[][]) {
		for (let [i, game] of games.entries()) {
			const score = getGameScore(games.slice(0, i + 1));
			for (let g of game) {
				g.score = score;
			}
		}
		this.setGameScore(games.at(-1)?.at(-1)?.score ?? [0, 0]);
		return games;
	}

	private initEventListeners() {
		this.clientEmitter.on('RecentGamesDelete', this.deleteRecentGame.bind(this));
		this.clientEmitter.on('RecentGamesReset', this.clearRecentGames.bind(this));
		this.clientEmitter.on('RecentGamesMock', this.insertMockGame.bind(this));
	}

	private initStoreListeners() {
		this.store.onDidChange(`stats.game.score`, async (value) => {
			this.messageHandler.sendMessage('GameScore', value as number[]);
		});
		this.store.onDidChange('player.any.game.recent', async (value) => {
			const recentGames = (value ?? []) as GameStats[][];
			this.messageHandler.sendMessage('RecentGames', recentGames);
		});
	}
}
