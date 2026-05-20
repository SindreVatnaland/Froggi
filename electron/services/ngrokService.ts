import { inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { exec, spawn, ChildProcess } from 'child_process';
import os from 'os';
import http from 'http';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { NotificationType } from '../../frontend/src/lib/models/enum';
import { BACKEND_PORT } from '../../frontend/src/lib/models/const';
import openurl from 'openurl';

type NgrokStatus = {
	installed: boolean;
	authenticated: boolean;
	running: boolean;
	url?: string;
	installMethod?: string;
};

const NGROK_DOWNLOAD_URL = 'https://ngrok.com/download';

const NGROK_CANDIDATES = [
	'ngrok',
	'/usr/local/bin/ngrok',
	'/opt/homebrew/bin/ngrok',
	'/snap/bin/ngrok',
];

@singleton()
export class NgrokService {
	private ngrokBin: string | undefined;
	private ngrokProcess: ChildProcess | undefined;
	private ngrokPid: number | undefined;
	private urlPollInterval: NodeJS.Timeout | undefined;
	private monitorInterval: NodeJS.Timeout | undefined;
	private status: NgrokStatus = { installed: false, authenticated: false, running: false };

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
	) {
		this.log.info('Initializing Ngrok Service');
		this.initListeners();
		this.detect();
		this.startContinuousMonitor();
	}

	private send(status: NgrokStatus) {
		this.status = status;
		this.clientEmitter.emit('NgrokStatus', status);
	}

	private async detect() {
		const bin = await this.findBin();
		this.ngrokBin = bin;

		if (!bin) {
			const installMethod = await this.detectInstallMethod();
			this.send({ installed: false, authenticated: false, running: false, installMethod });
			return;
		}

		const authenticated = await this.checkAuth(bin);
		const installMethod = await this.detectInstallMethod();
		this.send({ installed: true, authenticated, running: !!this.ngrokProcess, installMethod });
	}

	private async findBin(): Promise<string | undefined> {
		for (const candidate of NGROK_CANDIDATES) {
			const found = await new Promise<boolean>((resolve) => {
				exec(`"${candidate}" version`, { timeout: 2000 }, (err) => resolve(!err));
			});
			if (found) return candidate;
		}
		return undefined;
	}

	private async checkAuth(bin: string): Promise<boolean> {
		return new Promise((resolve) => {
			exec(`"${bin}" config check`, { timeout: 3000 }, (err) => resolve(!err));
		});
	}

	private async detectInstallMethod(): Promise<string> {
		const platform = os.platform();

		if (platform === 'darwin') {
			const hasBrew = await this.hasCmd('brew');
			return hasBrew ? 'brew' : 'download';
		}

		if (platform === 'win32') {
			const hasWinget = await this.hasCmd('winget');
			if (hasWinget) return 'winget';
			const hasChoco = await this.hasCmd('choco');
			if (hasChoco) return 'choco';
			const hasScoop = await this.hasCmd('scoop');
			if (hasScoop) return 'scoop';
			return 'download';
		}

		if (platform === 'linux') {
			const hasSnap = await this.hasCmd('snap');
			if (hasSnap) return 'snap';
			const hasBrew = await this.hasCmd('brew');
			if (hasBrew) return 'brew';
			return 'download';
		}

		return 'download';
	}

	private hasCmd(cmd: string): Promise<boolean> {
		const check = os.platform() === 'win32' ? `where ${cmd}` : `which ${cmd}`;
		return new Promise((resolve) => {
			exec(check, { timeout: 2000 }, (err) => resolve(!err));
		});
	}

	private async install() {
		const method = this.status.installMethod ?? await this.detectInstallMethod();

		if (method === 'download') {
			openurl.open(NGROK_DOWNLOAD_URL);
			this.clientEmitter.emit('Notification', 'Opening ngrok download page', NotificationType.Info, 3000);
			return;
		}

		const commands: Record<string, string> = {
			brew:   'brew install ngrok/ngrok/ngrok',
			winget: 'winget install ngrok.ngrok',
			choco:  'choco install ngrok',
			scoop:  'scoop install ngrok',
			snap:   'snap install ngrok',
		};

		const cmd = commands[method];
		if (!cmd) { openurl.open(NGROK_DOWNLOAD_URL); return; }

		this.clientEmitter.emit('Notification', `Installing ngrok via ${method}…`, NotificationType.Info, 5000);
		this.log.info('NgrokService install:', cmd);

		exec(cmd, { timeout: 120000 }, async (err, _stdout, stderr) => {
			if (err) {
				this.log.error('NgrokService install failed:', stderr || err.message);
				this.clientEmitter.emit('Notification', `Install failed — ${(stderr || err.message).split('\n')[0].slice(0, 80)}`, NotificationType.Danger, 5000);
				openurl.open(NGROK_DOWNLOAD_URL);
				return;
			}
			this.clientEmitter.emit('Notification', 'ngrok installed!', NotificationType.Success, 3000);
			await this.detect();
		});
	}

	private async setAuthtoken(token: string) {
		const bin = this.ngrokBin;
		if (!bin) {
			this.clientEmitter.emit('Notification', 'ngrok not installed', NotificationType.Danger, 3000);
			return;
		}

		this.log.info('NgrokService: setting authtoken');
		exec(`"${bin}" config add-authtoken ${token}`, { timeout: 10000 }, async (err) => {
			if (err) {
				this.log.error('NgrokService authtoken failed:', err.message);
				this.clientEmitter.emit('Notification', 'Invalid authtoken', NotificationType.Danger, 3000);
				return;
			}
			this.clientEmitter.emit('Notification', 'ngrok authtoken saved', NotificationType.Success, 2000);
			await this.detect();
		});
	}

	private startTunnel() {
		if (this.ngrokProcess) return;
		const bin = this.ngrokBin;
		if (!bin) {
			this.clientEmitter.emit('Notification', 'ngrok not installed', NotificationType.Danger, 3000);
			return;
		}

		this.log.info(`NgrokService: starting tunnel on port ${BACKEND_PORT}`);
		this.ngrokProcess = spawn(bin, ['http', String(BACKEND_PORT)], { stdio: 'ignore' });
		this.ngrokPid = this.ngrokProcess.pid;
		this.log.info('NgrokService: spawned PID', this.ngrokPid);

		this.ngrokProcess.on('error', (err) => {
			this.log.error('NgrokService process error:', err.message);
			this.ngrokProcess = undefined;
			this.ngrokPid = undefined;
			this.stopUrlPoll();
			this.send({ ...this.status, running: false, url: undefined });
			this.clientEmitter.emit('RemoteAccessStatus', undefined, 'ngrok');
		});

		this.ngrokProcess.on('exit', (code) => {
			this.log.info('NgrokService process exited, code=', code);
			this.ngrokProcess = undefined;
			this.ngrokPid = undefined;
			this.stopUrlPoll();
			this.send({ ...this.status, running: false, url: undefined });
			this.clientEmitter.emit('RemoteAccessStatus', undefined, 'ngrok');
		});

		this.send({ ...this.status, running: true, url: undefined });
		this.startUrlPoll();
	}

	private async stopTunnel(): Promise<void> {
		this.log.info('NgrokService: stopping tunnel');
		this.stopUrlPoll();
		const proc = this.ngrokProcess;
		this.ngrokProcess = undefined;
		if (proc) {
			try { proc.kill('SIGKILL'); } catch {}
		}
		await this.killAllNgrokProcesses();
		this.log.info('NgrokService: tunnel stopped');
		this.send({ ...this.status, running: false, url: undefined });
		this.clientEmitter.emit('RemoteAccessStatus', undefined, 'ngrok');
	}

	private async killAllNgrokProcesses(): Promise<void> {
		// Kill stored PID directly via Node — most reliable
		if (this.ngrokPid) {
			try { process.kill(this.ngrokPid, 'SIGKILL'); this.log.info('NgrokService: killed PID', this.ngrokPid); } catch {}
			this.ngrokPid = undefined;
		}

		// Also sweep for any stray ngrok processes via pgrep
		await new Promise<void>((resolve) => {
			if (os.platform() === 'win32') {
				exec('taskkill /F /IM ngrok.exe', { timeout: 3000 }, () => resolve());
				return;
			}
			exec('pgrep -x ngrok', { timeout: 2000 }, (_err, stdout) => {
				const pids = stdout.trim().split('\n').filter(Boolean).map(Number).filter(n => n > 0 && !isNaN(n));
				for (const pid of pids) {
					try { process.kill(pid, 'SIGKILL'); this.log.info('NgrokService: killed stray PID', pid); } catch {}
				}
				resolve();
			});
		});
	}

	private async restartTunnel(): Promise<void> {
		this.clientEmitter.emit('Notification', 'Restarting ngrok…', NotificationType.Info, 2000);
		await this.stopTunnel();
		await this.waitForApiDown();
		this.startTunnel();
	}

	private waitForApiDown(maxMs = 6000): Promise<void> {
		return new Promise((resolve) => {
			const deadline = Date.now() + maxMs;
			const check = async () => {
				const url = await this.fetchNgrokUrl();
				if (!url || Date.now() >= deadline) { resolve(); return; }
				setTimeout(check, 400);
			};
			setTimeout(check, 400);
		});
	}

	private startUrlPoll() {
		this.stopUrlPoll();
		let attempts = 0;
		const poll = async () => {
			attempts++;
			const url = await this.fetchNgrokUrl();
			if (url) {
				this.stopUrlPoll();
				this.send({ ...this.status, running: true, url });
				this.clientEmitter.emit('RemoteAccessStatus', url, 'ngrok');
				this.log.info('NgrokService: tunnel url=', url);
			} else if (attempts >= 20) {
				this.stopUrlPoll();
				this.clientEmitter.emit('Notification', 'ngrok tunnel failed to start', NotificationType.Danger, 4000);
				this.stopTunnel();
			}
		};
		this.urlPollInterval = setInterval(poll, 1000);
	}

	private stopUrlPoll() {
		clearInterval(this.urlPollInterval);
		this.urlPollInterval = undefined;
	}

	private fetchNgrokUrl(): Promise<string | undefined> {
		return new Promise((resolve) => {
			const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
				let data = '';
				res.on('data', (c) => (data += c));
				res.on('end', () => {
					try {
						const parsed = JSON.parse(data);
						const tunnel = parsed?.tunnels?.find((t: any) => t.proto === 'https');
						resolve(tunnel?.public_url);
					} catch { resolve(undefined); }
				});
			});
			req.on('error', () => resolve(undefined));
			req.setTimeout(1000, () => { req.destroy(); resolve(undefined); });
		});
	}

	private startContinuousMonitor() {
		if (this.monitorInterval) return;
		this.monitorInterval = setInterval(async () => {
			const url = await this.fetchNgrokUrl();
			if (url) {
				if (url !== this.status.url) {
					this.send({ ...this.status, running: true, url });
					this.clientEmitter.emit('RemoteAccessStatus', url, 'ngrok');
				}
			} else if (this.status.url) {
				this.ngrokProcess = undefined;
				this.ngrokPid = undefined;
				this.send({ ...this.status, running: false, url: undefined });
				this.clientEmitter.emit('RemoteAccessStatus', undefined, 'ngrok');
			}
		}, 5000);
	}

	private initListeners() {
		this.clientEmitter.on('NgrokInstall', () => this.install());
		this.clientEmitter.on('NgrokSetAuthtoken', (token) => this.setAuthtoken(token));
		this.clientEmitter.on('NgrokStart', () => this.startTunnel());
		this.clientEmitter.on('NgrokStop', () => this.stopTunnel());
		this.clientEmitter.on('NgrokRestart', () => this.restartTunnel());

		// On refresh, re-detect and send status
		this.clientEmitter.on('RemoteAccessRefresh', async () => {
			await this.detect();
			if (this.ngrokProcess) {
				const url = await this.fetchNgrokUrl();
				if (url) this.send({ ...this.status, running: true, url });
			}
		});
	}

	// Called by messageHandler initData so status is sent on connect
	getStatus(): NgrokStatus {
		return this.status;
	}
}
