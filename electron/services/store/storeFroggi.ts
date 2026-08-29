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

    getCrashReportsEnabled(): boolean {
        return this.getFroggiConfig().crashReportsEnabled === true;
    }

    setCrashReportsEnabled(enabled: boolean) {
        this.store.set("settings.froggi.crashReportsEnabled", enabled);
    }

    getMcpReadEnabled(): boolean {
        return this.getFroggiConfig().mcpReadEnabled === true;
    }

    setMcpReadEnabled(enabled: boolean) {
        this.store.set("settings.froggi.mcpReadEnabled", enabled);
    }

    getMcpWriteEnabled(): boolean {
        return this.getFroggiConfig().mcpWriteEnabled === true;
    }

    setMcpWriteEnabled(enabled: boolean) {
        this.store.set("settings.froggi.mcpWriteEnabled", enabled);
    }

    getMcpTailscaleEnabled(): boolean {
        return this.getFroggiConfig().mcpTailscaleEnabled === true;
    }

    setMcpTailscaleEnabled(enabled: boolean) {
        this.store.set("settings.froggi.mcpTailscaleEnabled", enabled);
    }

    // App version the demo overlays were last synced for. Kept outside settings.froggi
    // so it doesn't trigger FroggiSettings pushes. Lets startup skip the expensive
    // demo delete+reupload when nothing changed.
    getDemosSyncedVersion(): string | undefined {
        return this.store.get("overlays.demosSyncedVersion") as string | undefined;
    }

    setDemosSyncedVersion(version: string) {
        this.store.set("overlays.demosSyncedVersion", version);
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
        this.clientEmitter.on('SetCrashReportsEnabled', (enabled: boolean) => {
            this.setCrashReportsEnabled(enabled);
        });
        this.clientEmitter.on('SetMcpReadEnabled', (enabled: boolean) => {
            this.setMcpReadEnabled(enabled);
        });
        this.clientEmitter.on('SetMcpWriteEnabled', (enabled: boolean) => {
            this.setMcpWriteEnabled(enabled);
        });
        this.clientEmitter.on('SetMcpTailscaleEnabled', (enabled: boolean) => {
            this.setMcpTailscaleEnabled(enabled);
        });
        this.clientEmitter.on('SetCloseAction', (action: 'minimize' | 'quit' | null) => {
            if (action) {
                this.store.set('settings.froggi.closeAction', action);
            } else {
                this.store.delete('settings.froggi.closeAction');
            }
        });
    }

}
