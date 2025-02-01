// https://www.npmjs.com/package/electron-store
import ip from 'ip';
import Store from 'electron-store';
import type { Url } from '../../../frontend/src/lib/models/types/overlay';
import type { SlippiLauncherSettings } from '../../../frontend/src/lib/models/types/slippiData';
import { inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import getAppDataPath from 'appdata-path';
import fs from 'fs';
import os from 'os';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { BACKEND_PORT } from '../../../frontend/src/lib/models/const';
import { getDolphinSettings } from './../../utils/dolphinSettings';
import { DolphinSettings, DolphinSettingsMainline } from '../../../frontend/src/lib/models/types/dolphinTypes';

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
	) {
		this.log.info('Initializing Settings Store');
		this.initEventListeners();
		this.updateSlippiSettings();
		this.updateDolphinSettings();
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

	setSlippiLauncherSettings(config: SlippiLauncherSettings) {
		this.log.info("Slippi Config: ", config)
		this.store.set('settings.slippiLauncher', config);
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

	getDolphinSettings(): DolphinSettings | DolphinSettingsMainline | undefined {
		return this.store.get('settings.dolphin') as DolphinSettings | DolphinSettingsMainline;
	}

	setDolphinSettings(config: DolphinSettings | DolphinSettingsMainline | undefined) {
		if (!config) return;
		this.log.info("Dolphin settings: ", config)
		this.store.set('settings.dolphin', config);
	}

	updateDolphinSettings(): SlippiLauncherSettings | undefined {
		const slippiLauncherSettings = this.getSlippiLauncherSettings();
		const isBeta = slippiLauncherSettings?.useNetplayBeta ?? false;
		try {
			const settings = getDolphinSettings(isBeta);
			this.setDolphinSettings(settings);
		} catch (err) {
			this.log.error(err);
		}
		return;
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

	private initEventListeners() {
		this.clientEmitter.on('AuthorizationKeyUpdate', (key: string) => {
			this.setAuthorizationKey(key);
		});
	}
}
