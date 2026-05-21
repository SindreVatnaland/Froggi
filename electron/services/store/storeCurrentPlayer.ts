// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import type {
	CurrentPlayer,
	Player,
	RankedNetplayProfile,
} from '../../../frontend/src/lib/models/types/slippiData';
import type { RankChangeDiff } from '../../../frontend/src/lib/models/types/webhook';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { ElectronSettingsStore } from './storeSettings';
import { LiveStatsScene } from '../../../frontend/src/lib/models/enum';
import { ElectronLiveStatsStore } from './storeLiveStats';
import { MessageHandler } from '../messageHandler';
import { ElectronSessionStore } from './storeSession';
import { isMatch } from 'lodash';
import { SqliteCurrentPlayer } from './../../services/sqlite/sqliteCurrentPlayer';
import { ElectronPlayersStore } from './storePlayers';

@singleton()
export class ElectronCurrentPlayerStore {
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ElectronStore') private store: Store,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronSessionStore)) private storeSession: ElectronSessionStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => SqliteCurrentPlayer)) private sqliteCurrentPlayer: SqliteCurrentPlayer,
		@inject(delay(() => ElectronPlayersStore)) private playersStore: ElectronPlayersStore,
	) {
		this.log.info('Initializing Current Player Store');
	}

	// Rank
	async getCurrentPlayer(): Promise<CurrentPlayer | undefined> {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		const player = await this.sqliteCurrentPlayer.getCurrentPlayer(connectCode);
		if (!player) return;
		return player;
	}

	async getCurrentPlayerCurrentRankStats(): Promise<RankedNetplayProfile | undefined> {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		const player = await this.sqliteCurrentPlayer.getCurrentPlayer(connectCode);
		return player?.rank?.current;
	}

	async setCurrentPlayerBaseData(basePlayer: Player | undefined) {
		if (!basePlayer) return;
		const player = await this.sqliteCurrentPlayer.addOrUpdateCurrentPlayerBaseData(basePlayer);
		if (!player) return;
		this.messageHandler.sendMessage('CurrentPlayer', player);
	}

	async setCurrentPlayerCurrentRankStats(rankStats: RankedNetplayProfile | undefined) {
		if (!rankStats) return;
		await this.storeSession.updateSessionStats(rankStats as RankedNetplayProfile);
		const player = await this.sqliteCurrentPlayer.addOrUpdateCurrentPlayerCurrentRankStats(rankStats);
		if (!player) return;
		const currentPlayers = this.playersStore.getCurrentPlayers();
		this.messageHandler.sendMessage('CurrentPlayer', player);
		if (!currentPlayers) return;
		for (const currentPlayer of currentPlayers) {
			if (currentPlayer.connectCode === player.connectCode) {
				currentPlayer.rank = {
					...player.rank,
					current: rankStats,
					predictedRating: undefined,
				};
			}
		}
		this.playersStore.setCurrentPlayers(currentPlayers);
	}

	async setCurrentPlayerNewRankStats(rankStats: RankedNetplayProfile | undefined) {
		if (!rankStats) return;
		this.playersStore.setCurrentPlayerRankStats(rankStats);
		const player = await this.sqliteCurrentPlayer.addOrUpdateCurrentPlayerNewRankStats(rankStats);

		if (!player) return;
		this.messageHandler.sendMessage('CurrentPlayer', player);
		await this.handleRankChange();
		if (rankStats.isMock) return;
		this.updateCurrentPlayerRankHistory(rankStats);
	}

	getPlayerRankHistory(): RankedNetplayProfile[] {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return [];
		return [];
		// TODO Move this to sqlite
		return (this.store.get(`player.${connectCode}.rank.history`) ??
			[]) as RankedNetplayProfile[];
	}

	async updateCurrentPlayerRankHistory(rankStats: RankedNetplayProfile) {
		const prevRank = await this.getCurrentPlayerCurrentRankStats();
		if (prevRank?.totalGames === rankStats.totalGames) return;
		return;
		// TODO: Move this to sqlite
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		const history = this.getPlayerRankHistory();
		if (isMatch(history.at(-1) ?? {}, rankStats)) return;
		if (!rankStats || !connectCode || !history) return;
		this.store.set(`player.${connectCode}.rank.history`, [...history, rankStats]);
	}

	private async handleRankChange() {
		const player = await this.getCurrentPlayer();
		if (!player) return;
		this.log.info('Handling rank change');
		this.log.info(`Previous rating: ${player.rank?.current?.rating}. New rating: ${player.rank?.new?.rating}`);
		if (player.rank?.current && player.rank?.new) {
			const diff: RankChangeDiff = {
				connectCode: player.connectCode,
				displayName: player.displayName,
				before: player.rank.current,
				after: player.rank.new,
				diff: {
					rating: (player.rank.new.rating ?? 0) - (player.rank.current.rating ?? 0),
					wins: (player.rank.new.wins ?? 0) - (player.rank.current.wins ?? 0),
					losses: (player.rank.new.losses ?? 0) - (player.rank.current.losses ?? 0),
					rankChanged: player.rank.new.rank !== player.rank.current.rank,
				},
			};
			this.messageHandler.sendMessage('RankChange', diff);
		}
		setTimeout(async () => {
			this.log.info("Setting new rank to current rank");
			await this.setCurrentPlayerCurrentRankStats(player.rank?.new);
		}, 3000);
		const rankSceneTimeout = 8000;
		if (this.storeLiveStats.getStatsScene() === LiveStatsScene.RankChange) {
			this.storeLiveStats.setStatsSceneTimeout(
				LiveStatsScene.RankChange,
				LiveStatsScene.PostSet,
				rankSceneTimeout,
			);
			setTimeout(() => {
				if (this.storeLiveStats.getStatsScene() !== LiveStatsScene.PostSet) return;
				this.storeLiveStats.setStatsSceneTimeout(
					LiveStatsScene.PostSet,
					LiveStatsScene.Menu,
					150000 - rankSceneTimeout - 100,
				);
			}, rankSceneTimeout)
		}
	}
}
