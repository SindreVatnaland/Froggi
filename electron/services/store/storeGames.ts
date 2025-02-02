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
import { isNil } from 'lodash';

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

	getGameScore(): number[] {
		return (this.store.get('stats.game.score') ?? [0, 0]) as number[];
	}

	setGameScore(score: number[] | undefined) {
		this.store.set('stats.game.score', score ?? [0, 0]);
	}

	async setGameMatch(gameStats: GameStats | null) {
		if (!gameStats) return;
		this.setRecentGameId(gameStats.settings?.matchInfo.matchId ?? "");
		this.addRecentGames(gameStats);
	}

	private getRecentGameId(): string | null {
		return (this.store.get('game.recent.matchId') ?? "") as string;
	}

	private setRecentGameId(matchId: string) {
		const recentGameId = this.getRecentGameId();
		if (recentGameId === matchId) return;
		this.clearRecentGames();
		this.store.set('game.recent.matchId', matchId);
	}

	async getRecentGames(): Promise<GameStats[]> {
		const recentGameId = this.getRecentGameId();
		if (isNil(recentGameId)) return [];
		const recentGames = await this.sqliteGame.getGamesById(recentGameId);
		if (!recentGames) return [];
		return recentGames
	}

	async addRecentGames(newGame: GameStats) {
		const isOnline = Boolean(newGame.settings?.matchInfo.matchId);
		let games = isOnline ? await this.getOnlineGames(newGame) : await this.getOfflineGames(newGame);
		if (!games) return;
		games = [...games, newGame].sort((a, b) => (new Date(a.timestamp ?? 0).getTime()) - (new Date(b.timestamp ?? 0).getTime()));
		this.applyGamesScore(games);
		this.sqliteGame.addGameStats(games.at(-1) ?? newGame);
	}

	async insertMockGame(newGame: GameStats) {
		let recentGames = await this.getRecentGames()
		const recentGame = recentGames.at(-1) ?? null
		newGame = { ...newGame, isMock: true, settings: { ...newGame.settings, matchInfo: { ...(recentGame?.settings?.matchInfo ?? { gameNumber: null, matchId: "", tiebreakerNumber: 0, mode: "local", }), ...{ gameNumber: null, bestOf: this.storeLiveStats.getBestOf() } } } as GameStartTypeExtended }
		this.sqliteGame.addGameStats(newGame)
	}

	private async getOnlineGames(newGame: GameStats) {
		let games = await this.sqliteGame.getGamesById(newGame.settings?.matchInfo.matchId ?? "");
		return games;
	}

	private async getOfflineGames(newGame: GameStats): Promise<GameStats[]> {
		if (hasGameBombRain(newGame)) return [];
		let games = await this.getRecentGames();
		return games;
	}

	clearRecentGames() {
		this.sqliteGame.deleteGameStatsWithoutMatchId();
		this.setGameScore([0, 0]);
	}

	private applyGamesScore(games: GameStats[]) {
		for (let i = 0; i < games.length; i++) {
			games[i].score = getGameScore(games.slice(0, i + 1));
		}
		this.setGameScore(games.at(-1)?.score ?? [0, 0]);
		return games;
	}

	private async deleteRecentGame(gameIndex: number) {
		let games = await this.getRecentGames();
		this.sqliteGame.deleteGameStatsWithoutMatchId();
		if (!games) return;
		games.splice(gameIndex, 1);
		games = this.applyGamesScore(games);
		games.forEach((game) => this.sqliteGame.addGameStats(game));
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
	}
}
