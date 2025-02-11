// https://www.npmjs.com/package/electron-store
import Store from 'electron-store';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { MessageHandler } from '../messageHandler';
import { Obs, ObsAuth, ObsConnection, ObsInputs, ObsScenes } from '../../../frontend/src/lib/models/types/obsTypes';
import { OBSResponseTypes } from 'obs-websocket-js';
import { ConnectionState } from '../../../frontend/src/lib/models/enum';



@singleton()
export class ElectronObsStore {
    private store: Store = new Store();
    private obsConnectionState: ConnectionState = ConnectionState.Disconnected;
    constructor(
        @inject("ElectronLog") private log: ElectronLog,
        @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
    ) {
        this.log.info("Initializing Obs Store")
        this.initListeners();
    }

    setDefaultObsAuth() {
        const auth = this.getAuth();
        if (!auth) this.store.set('obs.auth', { ipAddress: '127.0.0.1', port: 4455, password: '' });
    }

    getObs(): Obs | undefined {
        return this.store.get('obs') as Obs;
    }

    getAuth(): ObsAuth | undefined {
        return this.store.get('obs.auth') as ObsAuth;
    }

    getPassword(): string | undefined {
        return this.store.get('obs.auth.password') as string;
    }

    setPassword(password: string) {
        this.store.set('obs.auth.password', password);
    }

    getIpAddress(): string {
        return (this.store.get('obs.auth.ipAddress') ?? "localhost") as string;
    }

    setIpAddress(ip: string) {
        this.store.set('obs.auth.ipAddress', ip);
    }

    getPort(): string {
        return (this.store.get('obs.auth.port') ?? "4455") as string;
    }

    setPort(port: string) {
        this.store.set('obs.auth.port', port);
    }

    getConnection(): ObsConnection {
        return (this.store.get('obs.connection') ?? {}) as ObsConnection;
    }

    getConnectionState(): ConnectionState {
        return this.obsConnectionState;
    }

    setConnectionState(state: ConnectionState) {
        this.obsConnectionState = state;
        this.store.set('obs.connection.state', state);
    }

    setInputs(inputs: ObsInputs[]) {
        this.store.set('obs.connection.inputs', inputs);
    }

    setItems<Type extends keyof OBSResponseTypes>(items: OBSResponseTypes[Type][]) {
        this.store.set('obs.connection.items', items);
    }

    setReplayBufferState<Type extends keyof OBSResponseTypes>(state: OBSResponseTypes[Type]) {
        this.store.set('obs.connection.replayBufferState', state);
    }


    setScenes(scenes: ObsScenes) {
        this.store.set('obs.connection.scenes', scenes);
    }

    private initListeners() {
        this.store.onDidChange("obs.connection", (connection) => {
            this.messageHandler.sendMessage("ObsConnection", { ...(connection as ObsConnection), auth: undefined } as ObsConnection);
        })
    }
}
