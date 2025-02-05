import Store from 'electron-store';
import type { Player } from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { PlayerType } from '@slippi/slippi-js';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { isNil } from 'lodash';
import { createPlayer } from '../../utils/playerHelp';


@singleton()
export class ElectronPlayersStore {
    private players: Player[] = [];
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
        if (this.players.length === 0) {
            this.players = [
                createPlayer(0),
                createPlayer(1),
            ]
        }
        return this.players;
    }

    setCurrentPlayers(newPlayers: (Player | PlayerType)[]) {
        this.players = newPlayers.filter(player => !isNil(player)).map(player => player as Player);
        this.log.info("Setting current players", this.players);
        this.players.forEach(player => {
            player.connectCode ||= player.rank?.current?.connectCode ?? "";
            player.displayName ||= player.rank?.current?.displayName ?? "";
        });
        this.messageHandler.sendMessage("CurrentPlayers", this.players as Player[]);
    }

    initEventListeners() {
        this.clientEmitter.on("PlayersUpdate", (players: Player[]) => {
            this.setCurrentPlayers(players);
        })
    }

    initListeners() {
        this.store.onDidChange(`stats.currentPlayers`, async (value) => {
            this.messageHandler.sendMessage("CurrentPlayers", value as Player[]);
        })
    }
}
