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
import { dateTimeNow } from '../../utils/functions';

@singleton()
export class ElectronGamesStore {
	private gameScore: number[] = [0, 0];
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
	}

	getGameScore(): number[] {
		return this.gameScore;
	}

	setGameScore(score: number[] | undefined) {
		this.gameScore = score ?? [0, 0];
		console.log('Game Score:', this.gameScore);
		this.messageHandler.sendMessage('GameScore', this.gameScore);
	}

	async setGameMatch(gameStats: GameStats | null) {
		if (!gameStats) return;
		await this.setRecentGameId(gameStats.settings?.matchInfo.matchId ?? "");
		await this.addMatchGame(gameStats);
	}

	getRecentGameId(): string {
		return (this.store.get('game.recent.matchId') ?? "") as string;
	}

	async setRecentGameId(matchId: string) {
		const recentGameId = this.getRecentGameId();
		if (recentGameId === matchId) return;
		await this.clearRecentGames();
		this.store.set('game.recent.matchId', matchId);
	}

	async getRecentGames(): Promise<GameStats[]> {
		const recentGameId = this.getRecentGameId();
		if (isNil(recentGameId)) return [];
		const recentGames = await this.sqliteGame.getGamesById(recentGameId);
		if (!recentGames) return [];
		return recentGames
	}

	async addMatchGame(newGame: GameStats) {
		if (hasGameBombRain(newGame)) return;
		let games = await this.sqliteGame.getGamesById(newGame.settings?.matchInfo.matchId ?? "", newGame.settings?.matchInfo.mode ?? "local");
		if (!games) return;
		games = [...games, newGame].sort((a, b) => (new Date(a.timestamp ?? 0).getTime()) - (new Date(b.timestamp ?? 0).getTime()));
		this.applyGamesScore(games);
		await this.sqliteGame.addGameStats(games.at(-1) ?? newGame);
	}

	async insertMockGame(newGame: GameStats, index: number) {
		const recentGames = await this.getRecentGames()
		const recentGame = recentGames.at(-1) ?? null

		newGame = { ...newGame, isMock: true, settings: { ...newGame.settings, matchInfo: { ...(recentGame?.settings?.matchInfo ?? { gameNumber: null, matchId: "", tiebreakerNumber: 0, mode: "local" }), ...{ gameNumber: null, bestOf: this.storeLiveStats.getBestOf(), id: undefined } } } as GameStartTypeExtended }
		let games = [...recentGames.slice(0, index), newGame, ...recentGames.slice(index)];

		await this.sqliteGame.deleteGameStatsByMatchId(recentGame?.settings?.matchInfo.matchId ?? "");

		games = this.applyGamesScore(games);

		const timestamp = dateTimeNow();

		games.forEach((game, index) => {
			game.timestamp = new Date(timestamp.getTime() + index * 3 * 60 * 1000);
		});

		await this.sqliteGame.addGameStatsBatch(games)
	}

	async clearRecentGames() {
		await this.sqliteGame.deleteLocalGameStats();
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
		this.sqliteGame.deleteLocalGameStats();
		if (!games) return;
		games.splice(gameIndex, 1);
		games = this.applyGamesScore(games);
		await this.sqliteGame.addGameStatsBatch(games);
	}

	private initEventListeners() {
		this.clientEmitter.on('RecentGamesDelete', this.deleteRecentGame.bind(this));
		this.clientEmitter.on('RecentGamesReset', this.clearRecentGames.bind(this));
		this.clientEmitter.on('RecentGamesMock', this.insertMockGame.bind(this));
	}
}
