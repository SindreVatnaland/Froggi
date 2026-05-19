import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import type { StrikeState } from '../../../frontend/src/lib/models/types/stageStriking';

@singleton()
export class ElectronStrikeStore {
    private strikeState: StrikeState | undefined = undefined;

    constructor(
        @inject('ElectronLog') private log: ElectronLog,
        @inject('ClientEmitter') private clientEmitter: TypedEmitter,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
    ) {
        this.log.info('Initializing Strike Store');
        this.initListeners();
    }

    getStrikeState(): StrikeState | undefined {
        return this.strikeState;
    }

    setStrikeState(state: StrikeState | undefined) {
        this.strikeState = state;
        this.messageHandler.sendMessage('StrikeState', state);
    }

    private initListeners() {
        this.clientEmitter.on('StrikeStateUpdate', (state: StrikeState | undefined) => {
            this.setStrikeState(state);
        });
    }
}
