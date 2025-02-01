// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import type {
	CurrentPlayer,
	RankedNetplayProfile,
} from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { ElectronSettingsStore } from './storeSettings';
import { LiveStatsScene } from '../../../frontend/src/lib/models/enum';
import { ElectronLiveStatsStore } from './storeLiveStats';
import { MessageHandler } from '../messageHandler';
import { ElectronSessionStore } from './storeSession';
import { isMatch } from 'lodash';
import { SqliteCurrentPlayer } from './../../services/sqlite/sqliteCurrentPlayer';

@singleton()
export class ElectronCurrentPlayerStore {
	private listeners: Function[];
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ElectronStore') private store: Store,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronSessionStore)) private storeSession: ElectronSessionStore,
		@inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => SqliteCurrentPlayer)) private sqliteCurrentPlayer: SqliteCurrentPlayer,
	) {
		this.log.info('Initializing Current Player Store');
		this.initPlayerListener();
		this.initListeners();
	}

	// Rank
	async getCurrentPlayer(): Promise<CurrentPlayer | undefined> {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		const player = await this.sqliteCurrentPlayer.getCurrentPlayer(connectCode);
		if (!player) return;
		return player;
	}

	updateCurrentPlayerConnectCode() {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		this.log.info('Setting current connect code', connectCode);
		this.store.set(`player.${connectCode}.connectCode`, connectCode);
	}

	async getCurrentPlayerCurrentRankStats(): Promise<RankedNetplayProfile | undefined> {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		const player = await this.sqliteCurrentPlayer.getCurrentPlayer(connectCode);
		return player?.rank?.current;
	}

	async setCurrentPlayerCurrentRankStats(rankStats: RankedNetplayProfile | undefined) {
		if (!rankStats) return;
		this.log.info('Setting current rank stats', rankStats);
		this.storeSession.updateSessionStats(rankStats as RankedNetplayProfile);
		const player = await this.sqliteCurrentPlayer.addOrUpdateCurrentPlayerCurrentRankStats(rankStats);
		if (!player) return;
		this.messageHandler.sendMessage('CurrentPlayer', player);
	}

	async setCurrentPlayerNewRankStats(rankStats: RankedNetplayProfile | undefined) {
		if (!rankStats) return;
		this.log.info('Setting new rank stats', rankStats);
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
		let history = this.getPlayerRankHistory();
		if (isMatch(history.at(-1) ?? {}, rankStats)) return;
		if (!rankStats || !connectCode || !history) return;
		this.store.set(`player.${connectCode}.rank.history`, [...history, rankStats]);
	}

	private async handleRankChange() {
		const player = await this.getCurrentPlayer();
		if (!player) return;
		this.log.info('Handling rank change');
		this.log.info(`Previous rating: ${player.rank?.current?.rating}. New rating: ${player.rank?.new?.rating}`);
		setTimeout(() => {
			this.log.info("Setting new rank to current rank");
			this.setCurrentPlayerCurrentRankStats(player.rank?.new);
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

	private initPlayerListener() {
		this.store.onDidChange(`settings.currentPlayer.connectCode`, async () => {
			this.unsubscribeListeners();
			this.initListeners();
		});
		this.initListeners();
	}

	private initListeners() {
		const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
		if (!connectCode) return;
		this.listeners = [
			this.store.onDidChange(`player.${connectCode}`, (value) => {
				this.messageHandler.sendMessage('CurrentPlayer', value as CurrentPlayer);
			}),
		];
	}

	private unsubscribeListeners() {
		this.listeners?.forEach((unsubscribe) => unsubscribe());
	}
}
