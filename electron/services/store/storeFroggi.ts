// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import type { Froggi } from '../../../frontend/src/lib/models/types/froggiConfigTypes';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import EventEmitter2 from 'eventemitter2';
import { MessageHandler } from './../../services/messageHandler';
import { NotificationType } from '../../../frontend/src/lib/models/enum';


@singleton()
export class ElectronFroggiStore {
    constructor(
        @inject("ElectronLog") private log: ElectronLog,
        @inject("ElectronStore") private store: Store,
        @inject("ClientEmitter") private clientEmitter: EventEmitter2,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
    ) {
        this.log.info("Initializing Players Store")
        this.initStoreListeners();
        this.initEventListeners();
        this.initVersion();
    }

    getFroggiConfig(): Froggi {
        return (this.store.get("settings.froggi") ?? {}) as Froggi
    }

    setFroggiBeta(betaOptIn: boolean) {
        this.store.set("settings.froggi.betaOptIn", betaOptIn)
    }

    private initVersion() {
        const version = this.store.get("__internal__.migrations.version") as string;
        this.log.info("Froggi Version", version);
        this.store.set("settings.froggi.version", version);
    }

    private initStoreListeners() {
        this.store.onDidChange(`settings.froggi`, async (value) => {
            this.log.info("Froggi Settings Changed", value)
            this.messageHandler.sendMessage("FroggiSettings", value as Froggi);
        });
    }

    private initEventListeners() {
        this.clientEmitter.on('BetaOptIn', (optIn: boolean) => {
            this.messageHandler.sendMessage("Notification", "Restart required to apply changes", NotificationType.Info, 3000);
            this.setFroggiBeta(optIn);
        });
    }

}
