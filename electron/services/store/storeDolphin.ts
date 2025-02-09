// https://www.npmjs.com/package/electron-store
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { ConnectionState } from '../../../frontend/src/lib/models/enum';


@singleton()
export class ElectronDolphinStore {
    private dolphinConnectionState: ConnectionState | undefined;
    constructor(
        @inject("ElectronLog") private log: ElectronLog,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
    ) {
        this.log.info("Initializing Dolphin Store")
    }

    getDolphinConnectionState(): ConnectionState | undefined {
        return this.dolphinConnectionState;
    }

    setDolphinConnectionState(state: ConnectionState) {
        this.dolphinConnectionState = state;
        this.messageHandler.sendMessage("DolphinConnectionState", this.dolphinConnectionState);
        return this.dolphinConnectionState;
    }
}
