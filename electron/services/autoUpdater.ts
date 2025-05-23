import type { ElectronLog } from 'electron-log';
import { ProgressInfo, UpdateDownloadedEvent, UpdateInfo, autoUpdater } from 'electron-updater';
import { delay, inject, injectable } from 'tsyringe';
import { MessageHandler } from './messageHandler';
import { AutoUpdaterStatus, NotificationType } from '../../frontend/src/lib/models/enum';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { App } from 'electron';
import { ElectronFroggiStore } from './store/storeFroggi';

@injectable()
export class AutoUpdater {
	private status: AutoUpdaterStatus;
	constructor(
		@inject('App') private app: App,
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('Dev') private dev: boolean,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(ElectronFroggiStore) private storeFroggi: ElectronFroggiStore,
	) {
		this.log.info('Initializing Auto Updater');
		this.initListeners();

	}

	private async initListeners() {
		if (this.dev) return;
		this.checkBetaOptIn();
		autoUpdater.checkForUpdates();
		autoUpdater.autoInstallOnAppQuit = true;
		autoUpdater.autoRunAppAfterInstall = true;
		autoUpdater.autoDownload = false;
		autoUpdater.autoDownload = false;
		autoUpdater.disableDifferentialDownload = true;
		this.log.verbose('Current Version:', autoUpdater.currentVersion);
		this.messageHandler.sendMessage('AutoUpdaterVersion', autoUpdater.currentVersion.version);

		autoUpdater.on('checking-for-update', () => {
			this.log.verbose('Checking for Update');
			this.messageHandler.sendMessage(
				'AutoUpdaterStatus',
				AutoUpdaterStatus.LookingForUpdate,
			);
		});

		autoUpdater.on('update-not-available', () => {
			this.log.verbose('Update Not Available');
			this.handleUpdateNotAvailable();
		});

		autoUpdater.on('update-available', (info: UpdateInfo) => {
			this.log.verbose(`Update Available: ${info.version}`);
			this.messageHandler.sendMessage(
				'Notification',
				`Update Available - ${info.version}`,
				NotificationType.Success,
			);
			this.messageHandler.sendMessage('AutoUpdaterStatus', AutoUpdaterStatus.UpdateAvailable);
			this.messageHandler.sendMessage(
				'AutoUpdaterDownloadUrl',
				`https://github.com/slprank/Froggi-Launcher/releases/download/${info.releaseName}/${info.files[0].url}`,
			);
		});

		autoUpdater.on('download-progress', (progress: ProgressInfo) => {
			const percent = progress.percent.toFixed(1)
			this.log.verbose(`Downloading: ${percent}`);
			this.messageHandler.sendMessage('AutoUpdaterStatus', AutoUpdaterStatus.Downloading);
			this.messageHandler.sendMessage(
				'AutoUpdaterProgress',
				`${Number(percent)}`,
			);
		});

		autoUpdater.on('update-downloaded', (data: UpdateDownloadedEvent) => {
			this.log.verbose(`Download Complete: ${data.version}`);
			this.log.info(
				`Download Url: https://github.com/slprank/Froggi-Launcher/releases/download/${data.releaseName}/${data.files[0].url}`,
			);
			this.messageHandler.sendMessage(
				'AutoUpdaterStatus',
				AutoUpdaterStatus.DownloadComplete,
			);
			this.messageHandler.sendMessage('AutoUpdaterProgress', '100');
			this.messageHandler.sendMessage(
				'Notification',
				'Update Downloaded',
				NotificationType.Success,
			);
		});

		autoUpdater.on('error', (error) => {
			this.log.error('Error:', error);
			this.handleUpdateNotAvailable();
		});

		autoUpdater.on('update-cancelled', (info) => {
			this.log.error('Update cancelled:', info);
			this.handleUpdateNotAvailable();
		});

		this.clientEmitter.on('AutoUpdaterInstall', async () => {
			if (this.status !== AutoUpdaterStatus.DownloadComplete) return;
			this.log.warn('Quit and install');
			this.messageHandler.sendMessage("Notification", "Installing Update", NotificationType.Success);
			autoUpdater.quitAndInstall();
			setTimeout(this.app.exit.bind(this), 5000)
		});

		this.clientEmitter.on('AutoUpdaterCheckForUpdate', async () => {
			if (this.status !== AutoUpdaterStatus.UpToDate) return;
			autoUpdater.checkForUpdatesAndNotify();
		});

		this.clientEmitter.on('AutoUpdaterDownloadUpdate', async () => {
			if (this.status !== AutoUpdaterStatus.UpdateAvailable) return;
			autoUpdater.downloadUpdate();
		});

		this.localEmitter.on('AutoUpdaterStatus', (status) => {
			this.status = status;
		});
	}

	private handleUpdateNotAvailable() {
		this.messageHandler.sendMessage('AutoUpdaterStatus', AutoUpdaterStatus.UpToDate);
		this.messageHandler.sendMessage(
			'AutoUpdaterVersion',
			autoUpdater.currentVersion.version,
		);
	}

	private checkBetaOptIn() {
		const betaOptIn = Boolean(this.storeFroggi.getFroggiConfig().betaOptIn ?? false);
		autoUpdater.allowPrerelease = betaOptIn;
		this.log.info('Beta Opt In:', betaOptIn);
	}
}
