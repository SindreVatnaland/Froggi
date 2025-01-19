// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import type { Player } from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { PlayerType } from '@slippi/slippi-js';
import os from 'os';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';


@singleton()
export class ElectronPlayersStore {
    isMac: boolean = os.platform() === 'darwin';
    isWindows: boolean = os.platform() === 'win32';
    isLinux: boolean = os.platform() === 'linux';
    constructor(
        @inject("ElectronLog") private log: ElectronLog,
        @inject("ElectronStore") private store: Store,
        @inject("ClientEmitter") private clientEmitter: TypedEmitter,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
    ) {
        this.log.info("Initializing Players Store")
        this.initEventListeners();
        this.initListeners();
    }

    getCurrentPlayers(): Player[] | undefined {
        return this.store.get('stats.currentPlayers') as Player[];
    }

    setCurrentPlayers(players: (Player | PlayerType)[]) {
        this.log.info("Setting current players")
        this.store.set('stats.currentPlayers', players?.filter(player => player));
    }

    setCurrentPlayersWithRank(players: (Player | PlayerType)[]) {
        this.log.info("Setting current players")
        players.forEach(player => {
            if ('rank' in player) {
                player.connectCode = player.rank?.current?.connectCode ?? player.connectCode;
                player.displayName = player.rank?.current?.displayName ?? player.displayName;
            }
        });
        this.store.set('stats.currentPlayers', players?.filter(player => player));
    }

    initEventListeners() {
        this.clientEmitter.on("PlayersTagUpdate", (players: Player[]) => {
            this.setCurrentPlayers(players);
        })
    }

    initListeners() {
        this.store.onDidChange(`stats.currentPlayers`, async (value) => {
            this.messageHandler.sendMessage("CurrentPlayers", value as Player[]);
        })
    }
}
