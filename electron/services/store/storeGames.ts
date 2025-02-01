// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import type {
	GameStartTypeExtended,
	GameStats,
} from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import {
	getGameScore,
	hasGameBombRain,
} from '../../../frontend/src/lib/utils/gamePredicates';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { ElectronLiveStatsStore } from './storeLiveStats';
import { SqliteGame } from './../../services/sqlite/sqliteGames';

@singleton()
export class ElectronGamesStore {
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => SqliteGame)) private sqliteGame: SqliteGame,
		@inject('ElectronStore') private store: Store,
	) {
		this.log.info('Initializing Game Store');
		this.initEventListeners();
		this.initStoreListeners();
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
		this.setRecentGameId(gameStats.settings?.matchInfo.matchId ?? null);
		this.addRecentGames(gameStats);
	}

	private getRecentGameId(): string | null {
		return (this.store.get('game.recent.matchId') ?? "") as string;
	}

	private setRecentGameId(matchId: string | null) {
		const recentGameId = this.getRecentGameId();
		if (recentGameId === matchId) return;
		this.sqliteGame.deleteGameStatsWithoutMatchId();
		this.store.set('game.recent.matchId', matchId);
	}

	async getRecentGames(): Promise<GameStats[]> {
		const recentGameId = this.getRecentGameId();
		if (!recentGameId) return [];
		const recentGames = await this.sqliteGame.getGamesById(recentGameId);
		if (!recentGames) return [];
		return recentGames
	}

	addRecentGames(newGame: GameStats) {
		if (newGame.settings?.matchInfo.matchId) this.handleOnlineGame(newGame);
		if (!newGame.settings?.matchInfo.matchId) this.handleOfflineGame(newGame);
	}

	async insertMockGame(newGame: GameStats) {
		let recentGames = await this.getRecentGames()
		const recentGame = recentGames.at(-1) ?? null
		newGame = { ...newGame, isMock: true, settings: { ...newGame.settings, matchInfo: { ...(recentGame?.settings?.matchInfo ?? { gameNumber: null, matchId: "", tiebreakerNumber: 0, mode: "local", }), ...{ gameNumber: null, bestOf: this.storeLiveStats.getBestOf() } } } as GameStartTypeExtended }
		this.sqliteGame.addGameStats(newGame)
	}

	private async handleOnlineGame(newGame: GameStats) {
		let games = await this.sqliteGame.getGamesById(newGame.settings?.matchInfo.matchId ?? "");
		if (!games) return;
		games = this.applyRecentGameScore(games);
		this.sqliteGame.addGameStats(newGame);
	}

	private async handleOfflineGame(newGame: GameStats) {
		if (hasGameBombRain(newGame)) return;
		this.sqliteGame.addGameStats(newGame);
	}

	clearRecentGames() {
		this.store.set(`player.any.game.recent`, this.applyRecentGameScore([]));
	}

	private applyRecentGameScore(games: GameStats[]) {
		for (let i = 0; i < games.length; i++) {
			games[i].score = getGameScore(games.slice(0, i + 1));
		}
		this.setGameScore(games.at(-1)?.score ?? [0, 0]);
		return games;
	}

	private deleteRecentGame() {
		this.sqliteGame.deleteGameStatsWithoutMatchId();
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
			const recentGames = (value ?? []) as GameStats[];
			this.messageHandler.sendMessage('RecentGames', recentGames);
		});
	}
}
