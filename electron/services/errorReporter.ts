import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import type { App } from 'electron';
import { app as electronApp } from 'electron';
import type Store from 'electron-store';
import os from 'os';
import fs from 'fs';
import { scopedLog } from '../utils/logger';
import { BUILD_CRASH_WEBHOOK, BUILD_FEATURE_WEBHOOK } from './reportWebhooks';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from './messageHandler';
import { NotificationType } from '../../frontend/src/lib/models/enum';

/**
 * Sends unhandled errors and process crashes (plus recent logs) to a Discord channel.
 *
 * Two independent gates must both pass before anything is sent:
 *   1. A webhook must exist — either baked in at build time (BUILD_CRASH_WEBHOOK, set
 *      from the DISCORD_USER_CRASH_REPORT_WEBHOOK secret) or provided via the env var for dev.
 *      Builds without it are completely inert.
 *   2. The user must have consented (settings.froggi.crashReportsEnabled === true),
 *      checked live on every report so toggling the setting takes effect immediately.
 *
 * Personal data (home dir, OS username, connect codes, IPs) is scrubbed before sending.
 */
@singleton()
export class ErrorReporter {
	private readonly webhook: string | undefined;        // crashes + bug reports
	private readonly featureWebhook: string | undefined; // feature requests
	private readonly sentSignatures = new Set<string>();
	private sentCount = 0;
	private readonly maxPerSession = 25;
	private readonly homedir = os.homedir();
	private readonly username = os.userInfo().username;
	private readonly rootLog: ElectronLog; // catchErrors lives on the root logger, not a scoped one

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('App') private app: App,
		@inject('ElectronStore') private store: Store,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.rootLog = this.log;
		this.log = scopedLog(this.log, 'ErrorReport');
		this.webhook = process.env.DISCORD_USER_CRASH_REPORT_WEBHOOK?.trim() || BUILD_CRASH_WEBHOOK || undefined;
		this.featureWebhook = process.env.DISCORD_USER_FEATURE_REPORT_WEBHOOK?.trim() || BUILD_FEATURE_WEBHOOK || undefined;

		// User-initiated feedback works regardless of crash-report consent (it's an explicit
		// action), so register it even when automatic crash hooks aren't installed.
		this.clientEmitter.on('SubmitFeedback', (data) => void this.submitFeedback(data.type, data.message, data.includeLogs));

		// Frontend errors are always logged here; reporting is gated inside report().
		this.clientEmitter.on('FrontendError', (data) => this.handleFrontendError(data));

		if (!this.webhook) {
			this.log.info('Crash reporting unavailable (no webhook baked in or set)');
			return;
		}

		this.log.info('Crash reporting available — reports sent when user consents');
		this.installHooks();
	}

	private hasConsent(): boolean {
		return this.store.get('settings.froggi.crashReportsEnabled') === true;
	}

	private installHooks() {
		// uncaughtException + unhandledRejection, handled safely by electron-log.
		this.rootLog.catchErrors({
			showDialog: false,
			onError: (error: Error) => {
				void this.report(error, 'Uncaught exception');
			},
		});

		// Renderer / GPU / utility process crashes.
		this.app.on('render-process-gone', (_event, _webContents, details) => {
			void this.report(
				new Error(`render-process-gone: reason=${details.reason} exitCode=${details.exitCode}`),
				'Renderer crash',
			);
		});
		this.app.on('child-process-gone', (_event, details) => {
			void this.report(
				new Error(`child-process-gone: type=${details.type} reason=${details.reason} exitCode=${details.exitCode}`),
				'Child process crash',
			);
		});
	}

	/** Public so services can report handled-but-notable errors: errorReporter.report(err, 'Bingo peer'). */
	async report(error: unknown, context: string): Promise<void> {
		if (!this.webhook || !this.hasConsent()) return;

		try {
			const err = error instanceof Error ? error : new Error(String(error));
			const stack = this.scrub(err.stack || err.message || 'Unknown error');
			const signature = `${context}:${stack.split('\n').slice(0, 2).join('|')}`;

			// Dedupe identical errors and cap volume so a crash loop can't flood the channel.
			if (this.sentSignatures.has(signature)) return;
			if (this.sentCount >= this.maxPerSession) return;
			this.sentSignatures.add(signature);
			this.sentCount++;

			const payload = {
				username: 'Froggi Errors',
				embeds: [
					{
						title: `🐛 ${context}`,
						description: '```\n' + stack.slice(0, 1800) + '\n```',
						color: 15158332, // red
						fields: [
							{ name: 'Version', value: this.app.getVersion(), inline: true },
							{ name: 'OS', value: `${process.platform} ${os.release()}`, inline: true },
							{ name: 'Electron', value: process.versions.electron ?? 'n/a', inline: true },
						],
						timestamp: new Date().toISOString(),
					},
				],
			};

			// Attach the recent log tail as a file so the surrounding context comes with the error.
			const logTail = this.readLogTail();
			const form = new FormData();
			form.append('payload_json', JSON.stringify(payload));
			if (logTail) {
				form.append('files[0]', new Blob([logTail], { type: 'text/plain' }), 'froggi-log.txt');
			}

			const res = await fetch(this.webhook, { method: 'POST', body: form });
			if (!res.ok) this.log.warn(`Crash report POST failed: HTTP ${res.status}`);
		} catch (postErr) {
			// Never let the reporter throw — it must not become its own crash source.
			this.log.warn('Failed to send crash report:', postErr);
		}
	}

	/** User-submitted feature request or bug report. Always sends (explicit action) when a webhook exists. */
	async submitFeedback(type: 'feature' | 'bug', message: string, includeLogs: boolean): Promise<void> {
		const text = (message ?? '').trim();
		if (!text) return;
		const isBug = type === 'bug';
		// Feature requests go to the feature webhook (falling back to the crash one if unset);
		// bug reports go to the crash/bug webhook.
		const webhook = isBug ? this.webhook : (this.featureWebhook || this.webhook);
		if (!webhook) {
			this.messageHandler.sendMessage('Notification', 'Feedback is unavailable in this build', NotificationType.Warning, 4000);
			return;
		}
		try {
			const payload = {
				username: 'Froggi Feedback',
				embeds: [
					{
						title: isBug ? '🐛 Bug report' : '💡 Feature request',
						description: text.slice(0, 3500),
						color: isBug ? 15158332 : 3447003, // red / blue
						fields: [
							{ name: 'Version', value: this.app.getVersion(), inline: true },
							{ name: 'OS', value: `${process.platform} ${os.release()}`, inline: true },
						],
						timestamp: new Date().toISOString(),
					},
				],
			};

			const form = new FormData();
			form.append('payload_json', JSON.stringify(payload));
			// Logs only attach to bug reports (and only when opted in) — never feature requests.
			if (isBug && includeLogs) {
				const logTail = this.readLogTail();
				if (logTail) form.append('files[0]', new Blob([logTail], { type: 'text/plain' }), 'froggi-log.txt');
			}

			const res = await fetch(webhook, { method: 'POST', body: form });
			if (res.ok) {
				this.messageHandler.sendMessage('Notification', 'Thanks! Your feedback was sent.', NotificationType.Success, 4000);
			} else {
				this.messageHandler.sendMessage('Notification', 'Failed to send feedback', NotificationType.Danger, 4000);
				this.log.warn(`Feedback POST failed: HTTP ${res.status}`);
			}
		} catch (err) {
			this.log.warn('Failed to send feedback:', err);
			this.messageHandler.sendMessage('Notification', 'Failed to send feedback', NotificationType.Danger, 4000);
		}
	}

	/** Log a frontend error always; report it only if it looks like a real issue (not noise). */
	private handleFrontendError(data: { message: string; stack?: string; source?: string; kind: string; device: string }) {
		const loc = data.source ? ` @ ${data.source}` : '';
		this.log.error(`Frontend ${data.kind} (${data.device})${loc}: ${data.message}${data.stack ? '\n' + data.stack : ''}`);

		if (!isReportableFrontendError(data.message, data.stack)) return;
		const err = new Error(`[${data.device}] ${data.message}`);
		if (data.stack) err.stack = data.stack;
		void this.report(err, `Frontend ${data.kind}`);
	}

	/**
	 * Logs for the current session — from the last "Starting app" marker to the end —
	 * scrubbed. Reads a bounded window from the end of the file; if the session is larger
	 * than the window the oldest lines are dropped. Empty string if unavailable.
	 */
	private readLogTail(): string {
		try {
			const path = this.rootLog.transports.file.getFile()?.path;
			if (!path || !fs.existsSync(path)) return '';
			const stat = fs.statSync(path);
			const maxBytes = 256 * 1024; // bound memory + upload size; one session is usually well under this
			const start = Math.max(0, stat.size - maxBytes);
			const fd = fs.openSync(path, 'r');
			let content: string;
			try {
				const len = stat.size - start;
				const buf = Buffer.alloc(len);
				fs.readSync(fd, buf, 0, len, start);
				content = buf.toString('utf8');
			} finally {
				fs.closeSync(fd);
			}

			// Crop to the current session: everything after the last "Starting app".
			const marker = content.lastIndexOf('Starting app');
			if (marker !== -1) {
				content = content.slice(content.lastIndexOf('\n', marker) + 1);
			} else if (start > 0) {
				// Session start is beyond the window — drop the partial first line.
				const nl = content.indexOf('\n');
				if (nl !== -1) content = content.slice(nl + 1);
			}
			return this.scrub(content);
		} catch {
			return '';
		}
	}

	/** Strip machine-identifying data before anything leaves the user's system. */
	private scrub(text: string): string {
		let out = text;
		if (this.homedir) out = out.split(this.homedir).join('~');
		if (this.username) out = out.split(this.username).join('<user>');
		// Slippi connect codes, e.g. SNIDER#0, ABCD#123
		out = out.replace(/\b[A-Z][A-Z0-9]{0,6}#\d{1,5}\b/g, '<code>');
		// IPv4 addresses (keep loopback for context)
		out = out.replace(/\b(?!127\.0\.0\.1)\d{1,3}(?:\.\d{1,3}){3}\b/g, '<ip>');
		return out;
	}
}

/**
 * Filters out benign/expected frontend errors so they're logged but not reported.
 * Network blips, websocket disconnects, dev HMR, and browser noise aren't real bugs.
 */
function isReportableFrontendError(message: string, stack?: string): boolean {
	const m = (message || '').toLowerCase();
	if (!m) return false;
	const ignore = [
		'websocket', 'ws closed', 'connection closed', 'socket',
		'network', 'failed to fetch', 'load failed', 'networkerror',
		'dynamically imported module', // dev HMR
		'resizeobserver loop',          // benign browser warning
		'aborterror', 'the operation was aborted', 'the user aborted',
	];
	if (ignore.some((s) => m.includes(s))) return false;

	const s = stack || '';
	// Browser-extension-injected errors aren't app bugs.
	if (/(chrome|moz|safari)-extension:\/\//.test(s)) return false;
	// Real app errors have a stack referencing a bundled file (http(s):// or file://).
	// Console-typed / eval'd errors only have <anonymous>/eval frames — don't report those.
	if (!/(https?:|file:)\/\//.test(s)) return false;

	return true;
}

/**
 * Standalone reporter for bootstrap failures that happen before the DI container
 * (and the ErrorReporter singleton) exist. Webhook + consent are passed in explicitly.
 */
export function reportStartupError(webhook: string | undefined, consented: boolean, error: unknown): void {
	if (!webhook || !consented) return;
	const err = error instanceof Error ? error : new Error(String(error));
	fetch(webhook, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			username: 'Froggi Errors',
			embeds: [{
				title: '🐛 Startup error',
				description: '```\n' + (err.stack || err.message || 'Unknown').slice(0, 1800) + '\n```',
				color: 15158332,
				fields: [
					{ name: 'Version', value: electronApp?.getVersion?.() ?? 'n/a', inline: true },
					{ name: 'OS', value: `${process.platform} ${os.release()}`, inline: true },
				],
				timestamp: new Date().toISOString(),
			}],
		}),
	}).catch(() => { /* swallow — startup reporter must never throw */ });
}
