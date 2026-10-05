import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import Store from 'electron-store';
import { MessageHandler } from '../messageHandler';

import type { StrikeState } from '../../../frontend/src/lib/models/types/stageStriking';

const STORE_KEY = 'strike.state';

@singleton()
export class ElectronStrikeStore {
    constructor(
        @inject('ElectronLog') private log: ElectronLog,
        @inject('ElectronStore') private store: Store,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
    ) {
        this.log.info('Initializing Strike Store');
    }

    getStrikeState(): StrikeState | undefined {
        return this.store.get(STORE_KEY) as StrikeState | undefined;
    }

    /** Per-player secrets in the phone links (never part of the broadcast StrikeState). */
    getPlayerTokens(): { 1: string; 2: string } | undefined {
        return this.store.get('strike.tokens') as { 1: string; 2: string } | undefined;
    }

    setPlayerTokens(tokens: { 1: string; 2: string }) {
        this.store.set('strike.tokens', tokens);
    }

    setStrikeState(state: StrikeState | undefined) {
        if (state) {
            this.store.set(STORE_KEY, state);
        } else {
            this.store.delete(STORE_KEY as any);
        }
        this.messageHandler.sendMessage('StrikeState', state);
    }
}
