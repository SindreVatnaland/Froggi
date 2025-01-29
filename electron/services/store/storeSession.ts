// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import type { RankedNetplayProfile, SessionStats } from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { dateTimeNow, getHoursDifference } from '../../utils/functions';
import { ElectronCurrentPlayerStore } from './storeCurrentPlayer';
import { ElectronSettingsStore } from './storeSettings';


@singleton()
export class ElectronSessionStore {
    private listeners: Function[] = [];
    constructor(
        @inject("ElectronLog") private log: ElectronLog,
        @inject("ElectronStore") private store: Store,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
        @inject(delay(() => ElectronCurrentPlayerStore)) private storeCurrentPlayer: ElectronCurrentPlayerStore,
        @inject(delay(() => ElectronSettingsStore)) private storeSettings: ElectronSettingsStore,
    ) {
        this.log.info("Initializing Session Store");
        this.initPlayerListener();
    }

    getSessionStats(): SessionStats | undefined {
        const player = this.storeCurrentPlayer.getCurrentPlayer();
        if (!player) return;
        return this.store.get(`player.${player.connectCode}.session`) as SessionStats;
    }

    resetSessionStats() {
        const player = this.storeCurrentPlayer.getCurrentPlayer();
        if (!player) return;
        const currentRankedStats = player.rank?.current;
        if (!currentRankedStats) return;
        const session: SessionStats = {
            startRankStats: currentRankedStats,
            startTime: dateTimeNow(),
            currentRankStats: currentRankedStats,
            latestUpdate: dateTimeNow(),
        };
        this.store.set(`player.${player.connectCode}.session`, session);
        return session;
    }

    updateSessionStats(rankStats: RankedNetplayProfile | undefined) {
        this.log.info("Updating Session Stats", rankStats)
        if (!rankStats) return;
        const player = this.storeCurrentPlayer.getCurrentPlayer();
        if (!player) return;
        console.log("Player", `player.${player.connectCode}.session`)
        let session = this.getSessionStats();
        if (!session || (getHoursDifference(new Date(session?.latestUpdate), dateTimeNow()) > 6)) {
            session = this.resetSessionStats();
            return
        }
        session.latestUpdate = dateTimeNow();
        session.currentRankStats = rankStats;
        this.store.set(`player.${player.connectCode}.session`, session);
    }

    private initPlayerListener() {
        this.store.onDidChange(`settings.currentPlayer.connectCode`, async () => {
            this.unsubscribeListeners()
            this.initListeners()
        })
        this.initListeners();
    }

    private initListeners() {
        const connectCode = this.storeSettings.getCurrentPlayerConnectCode();
        if (!connectCode) return;
        this.listeners = [
            this.store.onDidChange(`player.${connectCode}.session`, (value) => {
                console.log("SessionStats", value)
                this.messageHandler.sendMessage("SessionStats", value as SessionStats)
            }),
        ]
    }

    private unsubscribeListeners() {
        this.listeners.forEach(unsubscribe => unsubscribe())
    }
}
