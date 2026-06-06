// https://www.npmjs.com/package/electron-store
import ip from 'ip';
import Store from 'electron-store';
import type { Url } from '../../../frontend/src/lib/models/types/overlay';
import type { BingoLeaderboardEntry } from '../../../frontend/src/lib/models/types/bingo';
import type { IronManLeaderboardEntry } from '../../../frontend/src/lib/models/types/ironman';
import type { SlippiLauncherSettings } from '../../../frontend/src/lib/models/types/slippiData';
import { inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import getAppDataPath from 'appdata-path';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { NotificationType } from '../../../frontend/src/lib/models/enum';
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
		this.log.info(`Slippi config: rootSlpPath=${config?.rootSlpPath} iso=${config?.isoPath ? 'set' : 'missing'} beta=${config?.useNetplayBeta}`);
		this.store.set('settings.slippiLauncher', config);
	}

	updateSlippiSettings(): SlippiLauncherSettings | undefined {
		try {
			const slippiPath = getAppDataPath('Slippi Launcher');
			const settingsPath = `${slippiPath}/Settings`;
			const rawData = fs.readFileSync(settingsPath, 'utf-8');
			const fullJson = JSON.parse(rawData);
			let settings = (fullJson?.settings ?? {}) as SlippiLauncherSettings;
			settings = this.verifyAndFixDefaultSettings(settings);
			// Write back full JSON preserving all top-level keys (auth, user, etc.)
			fs.writeFileSync(settingsPath, JSON.stringify({ ...fullJson, settings }));
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

		if (settings?.spectateSlpPath === undefined) {
			const defaultSpectatePath = path.join(settings.rootSlpPath, 'Spectate');
			if (!fs.existsSync(defaultSpectatePath)) {
				fs.mkdirSync(defaultSpectatePath, { recursive: true });
			}
			settings.spectateSlpPath = defaultSpectatePath;
		}

		if (settings?.appDataPath === undefined)
			settings.appDataPath = getAppDataPath('Slippi Launcher');
		settings.useMonthlySubfolders = true;
		return settings;
	}

	notifyMissingSpectateConfig() {
		const settings = this.getSlippiLauncherSettings();
		if (!settings?.spectateSlpPath) {
			this.clientEmitter.emit(
				'Notification',
				'Spectate folder not configured. To capture spectated games, open Slippi Launcher → Settings and enable spectating to set a valid folder path.',
				NotificationType.Warning,
			);
		}
	}

	getDolphinSettings(): DolphinSettings | undefined {
		return this.store.get('settings.dolphin') as DolphinSettings;
	}

	setDolphinSettings(config: DolphinSettings | DolphinSettingsMainline | undefined) {
		if (!config) return;
		// The full Dolphin.ini is hundreds of fields — log only what matters for debugging.
		const port = 'Slippi' in config ? config.Slippi?.NetplayPort : config.Core?.SlippiNetplayPort;
		this.log.info(`Dolphin settings loaded (netplay port=${port ?? 'unknown'})`);
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

	getTwitchUsername(): string {
		return (this.store.get('settings.twitchUsername') as string) ?? '';
	}

	setTwitchUsername(username: string) {
		this.store.set('settings.twitchUsername', username);
	}

	getBingoLeaderboard(): Record<string, BingoLeaderboardEntry[]> {
		return (this.store.get('bingo.leaderboard') as Record<string, BingoLeaderboardEntry[]>) ?? {};
	}

	setBingoLeaderboard(records: Record<string, BingoLeaderboardEntry[]>) {
		this.store.set('bingo.leaderboard', records);
	}

	getIronManLeaderboard(): IronManLeaderboardEntry[] {
		return (this.store.get('ironman.leaderboard') as IronManLeaderboardEntry[]) ?? [];
	}

	setIronManLeaderboard(records: IronManLeaderboardEntry[]) {
		this.store.set('ironman.leaderboard', records);
	}

	getIronManFullRosterLeaderboard(): IronManLeaderboardEntry[] {
		return (this.store.get('ironman.fullRosterLeaderboard') as IronManLeaderboardEntry[]) ?? [];
	}

	setIronManFullRosterLeaderboard(records: IronManLeaderboardEntry[]) {
		this.store.set('ironman.fullRosterLeaderboard', records);
	}

	getIronManStandardLeaderboard(): IronManLeaderboardEntry[] {
		return (this.store.get('ironman.standardLeaderboard') as IronManLeaderboardEntry[]) ?? [];
	}

	setIronManStandardLeaderboard(records: IronManLeaderboardEntry[]) {
		this.store.set('ironman.standardLeaderboard', records);
	}

	private initEventListeners() {
		this.clientEmitter.on('AuthorizationKeyUpdate', (key: string) => {
			this.setAuthorizationKey(key);
		});
	}
}
