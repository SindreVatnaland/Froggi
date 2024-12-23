// https://www.npmjs.com/package/electron-store
import ip from 'ip';
import Store from 'electron-store';
import type { Url } from '../../../frontend/src/lib/models/types/overlay';
import type { SlippiLauncherSettings } from '../../../frontend/src/lib/models/types/slippiData';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import getAppDataPath from 'appdata-path';
import fs from 'fs';
import os from 'os';
import { ElectronCurrentPlayerStore } from './storeCurrentPlayer';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { BACKEND_PORT } from '../../../frontend/src/lib/models/const';
import { MessageHandler } from './../messageHandler';

@singleton()
export class ElectronSettingsStore {
	isMac: boolean = os.platform() === 'darwin';
	isWindows: boolean = os.platform() === 'win32';
	isLinux: boolean = os.platform() === 'linux';
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('Port') private port: string,
		@inject('ElectronStore') private store: Store,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(delay(() => ElectronCurrentPlayerStore))
		private storeCurrentPlayer: ElectronCurrentPlayerStore,
	) {
		this.log.info('Initializing Settings Store');
		this.initStoreListeners();
		this.initEventListeners();
		this.updateSlippiSettings();
	}

	getAuthorizationKey(): string {
		return (this.store.get('settings.authorization.key') as string) ?? '';
	}

	setAuthorizationKey(key: string) {
		this.store.set('settings.authorization.key', key);
	}

	getCurrentPlayerConnectCode(): string | undefined {
		return this.store.get('settings.currentPlayer.connectCode') as string;
	}

	setCurrentPlayerConnectCode(connectCode: string) {
		this.store.set('settings.currentPlayer.connectCode', connectCode);
	}

	getSlippiLauncherSettings(): SlippiLauncherSettings | undefined {
		return this.store.get('settings.slippiLauncher') as SlippiLauncherSettings;
	}

	setSlippiLauncherSettings(dir: SlippiLauncherSettings) {
		this.store.set('settings.slippiLauncher', dir);
	}

	updateSlippiSettings(): SlippiLauncherSettings | undefined {
		try {
			const slippiPath = getAppDataPath('Slippi Launcher');
			const rawData = fs.readFileSync(`${slippiPath}/Settings`, 'utf-8');
			let settings = JSON.parse(rawData)?.settings as SlippiLauncherSettings;
			settings = this.verifyAndFixDefaultSettings(settings);
			this.setSlippiLauncherSettings(settings);
			return settings;
		} catch (err) {
			this.log.error(err);
		}
		return;
	}

	verifyAndFixDefaultSettings(settings: SlippiLauncherSettings): SlippiLauncherSettings {
		const defaultPath = this.getSlippiDefaultPath();
		if (settings?.rootSlpPath === undefined) settings.rootSlpPath = defaultPath;
		if (settings?.spectateSlpPath === undefined)
			settings.spectateSlpPath = `${settings.rootSlpPath}/Spectate`;
		if (settings?.appDataPath === undefined)
			settings.appDataPath = getAppDataPath('Slippi Launcher');
		settings.useMonthlySubfolders = true;
		fs.writeFileSync(
			`${getAppDataPath('Slippi Launcher')}/Settings`,
			JSON.stringify({ settings: settings }),
		);
		return settings;
	}

	getSlippiDefaultPath(): string {
		const username = os.userInfo().username;
		if (this.isWindows) return `C:/Users/${username}/Documents/Slippi`;
		if (this.isMac) return `/Users/${username}/Slippi`;
		if (this.isLinux) return `/Users/${username}/Slippi`;
		throw new Error('No valid OS');
	}

	getLocalUrl(): Url {
		return {
			external: `http://${ip.address()}:${this.port}`,
			externalResource: `http://${ip.address()}:${BACKEND_PORT}`,
			local: `http://localhost:${this.port}`,
			localResource: `http://localhost:${BACKEND_PORT}`,
		};
	}

	initStoreListeners() {
		this.store.onDidChange(`settings.currentPlayer`, async () => {
			this.storeCurrentPlayer.updateCurrentPlayerConnectCode();
		});
		this.store.onDidChange(`settings.authorization.key`, async () => {
			this.messageHandler.sendMessage("Authorize", false)
		});
	}

	initEventListeners() {
		this.clientEmitter.on('AuthorizationKeyUpdate', (key: string) => {
			this.setAuthorizationKey(key);
		});
	}
}
