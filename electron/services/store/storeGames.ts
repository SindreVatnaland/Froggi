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

	/** A new Slippi session with the same players continues the running set (default on). */
	getContinueSetAcrossSessions(): boolean {
		return (this.store.get('game.continueSetAcrossSessions') ?? true) as boolean;
	}

	setContinueSetAcrossSessions(enabled: boolean) {
		this.store.set('game.continueSetAcrossSessions', enabled);
		this.messageHandler.sendMessage('ContinueSetAcrossSessions', enabled);
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
		// The set's first game carries a swap the host made before it was stored.
		if (!games.length && this.pendingSides) {
			newGame.sides = this.pendingSides;
			this.pendingSides = null;
		}
		games = [...games, newGame].sort((a, b) => (new Date(a.timestamp ?? 0).getTime()) - (new Date(b.timestamp ?? 0).getTime()));
		const before = games.map((g) => JSON.stringify(g.score));
		this.applyGamesScore(games);
		// A tiebreaker unscores the tied game before it: save that game's corrected score too.
		const changed = games.filter((g, i) => g !== newGame && JSON.stringify(g.score) !== before[i]);
		if (changed.length) await this.sqliteGame.updateGameScores(changed);
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

	/** Make `games` the set's games (host loaded them from replays): replaces any stored copy. */
	async replaceRecentGames(games: GameStats[]) {
		const matchId = games[0]?.settings?.matchInfo.matchId ?? '';
		await this.sqliteGame.deleteGameStatsByMatchId(matchId);
		await this.clearRecentGames();
		this.store.set('game.recent.matchId', matchId);
		this.applyGamesScore(games);
		await this.sqliteGame.addGameStatsBatch(games);
	}

	/** Host fixed who is who in stored games: save the identities and recount the score. */
	async updateRecentGamePlayers(games: GameStats[]) {
		await this.sqliteGame.updatePlayerKeys(games);
		this.applyGamesScore(games);
		await this.sqliteGame.updateGamesBatch(games);
	}

	/**
	 * Host swap (Fix set…): store it on the set's first game, flip results set by hand (they name the side
	 * as shown) and re-score — RecentGames goes out, so the score and the striking set follow.
	 * Returns false without a stored game (nothing decides the sides yet).
	 */
	/** A swap made before the set's first game was stored. */
	private pendingSides: GameStats['sides'] = null;

	async swapSides(kind: 'sides' | 'team1' | 'team2'): Promise<boolean> {
		const games = await this.getRecentGames();
		const first = games.find((g) => g?.settings?.players?.length) as (GameStats & { id?: number }) | undefined;
		const current = first?.id ? first.sides : this.pendingSides;
		const order: [boolean, boolean] = [...(current?.teamOrder ?? [false, false])] as [boolean, boolean];
		let swapped = !!current?.swapped;
		if (kind === 'sides') {
			swapped = !swapped;
			order.reverse(); // the within-team swaps travel with their team
			for (const g of games) {
				const w = g.resultOverride?.winnerSlot;
				if (g.resultOverride && (w === 0 || w === 1)) g.resultOverride = { ...g.resultOverride, winnerSlot: w === 0 ? 1 : 0 };
			}
		} else {
			const t = kind === 'team1' ? 0 : 1;
			order[t] = !order[t];
		}
		if (!first?.id) {
			// No stored game yet: the set's first game gets it when it is stored.
			this.pendingSides = { swapped, teamOrder: order };
			return false;
		}
		first.sides = { swapped, teamOrder: order };
		await this.sqliteGame.setGameSides(first.id, first.sides);
		this.applyGamesScore(games);
		await this.sqliteGame.updateGamesBatch(games);
		return true;
	}

	/** Save the highlights marked in a stored game (no RecentGames re-send). */
	async setGameHighlights(game: GameStats, highlights: GameStats['highlights']) {
		const id = (game as { id?: number }).id;
		if (id) await this.sqliteGame.setGameHighlights(id, highlights);
	}

	async clearRecentGames() {
		this.pendingSides = null;
		await this.sqliteGame.deleteLocalGameStats();
		this.setGameScore([0, 0]);
		this.messageHandler.sendMessage('RecentGames', []);
	}

	private applyGamesScore(games: GameStats[]) {
		for (let i = 0; i < games.length; i++) {
			games[i].score = getGameScore(games.slice(0, i + 1), games);
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

	/** Host override of game i's result (winner side or null = doesn't count) with a note; null clears it. */
	private async setGameResult(gameIndex: number, override: GameStats['resultOverride']) {
		const games = await this.getRecentGames();
		const game = games[gameIndex];
		if (!game) return;
		game.resultOverride = override ?? null;
		this.applyGamesScore(games);
		await this.sqliteGame.updateGamesBatch(games);
	}

	private async reorderRecentGame(fromIndex: number, toIndex: number) {
		let games = await this.getRecentGames();
		if (!games?.length || fromIndex === toIndex) return;
		if (fromIndex < 0 || fromIndex >= games.length || toIndex < 0 || toIndex >= games.length) return;
		const [moved] = games.splice(fromIndex, 1);
		games.splice(toIndex, 0, moved);
		games = this.applyGamesScore(games);
		const timestamp = dateTimeNow();
		games.forEach((game, index) => {
			game.timestamp = new Date(timestamp.getTime() + index * 3 * 60 * 1000);
		});
		await this.sqliteGame.updateGamesBatch(games);
	}

	private initEventListeners() {
		this.clientEmitter.on('SetContinueSetAcrossSessions', (enabled) => this.setContinueSetAcrossSessions(enabled));
		this.clientEmitter.on('RecentGamesDelete', this.deleteRecentGame.bind(this));
		this.clientEmitter.on('RecentGamesReset', this.clearRecentGames.bind(this));
		this.clientEmitter.on('RecentGamesMock', this.insertMockGame.bind(this));
		this.clientEmitter.on('RecentGamesReorder', this.reorderRecentGame.bind(this));
		this.clientEmitter.on('RecentGamesSetResult', this.setGameResult.bind(this));
	}
}
