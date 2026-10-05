import Store from 'electron-store';
import type { WebhookProfile } from '../../../frontend/src/lib/models/types/webhook';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from '../messageHandler';
import { SqliteOrm } from '../sqlite/initiSqlite';
import { WebhookProfileEntity } from '../sqlite/entities/automation/automationEntities';

const LEGACY_PROFILES_KEY = 'webhook.profiles';
const ENABLED_KEY = 'webhook.enabled';
const MIGRATED_KEY = 'migrations.webhookProfilesSqlite';

/**
 * Webhook profiles live in SQLite (WebhookProfileEntity); kept in memory for the synchronous callers
 * (webhookService dispatch). The global on/off switch stays in electron-store. Profiles saved by
 * older versions in electron-store are copied over once (the old key is left as a backup).
 */
@singleton()
export class ElectronWebhookStore {
	private profiles: WebhookProfile[] = [];

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ElectronStore') private store: Store,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(SqliteOrm) private sqlite: SqliteOrm,
	) {
		this.log.info('Initializing Webhook Store');
		this.initEventListeners();
		void this.load();
	}

	private repo() {
		return this.sqlite.getRepository(WebhookProfileEntity);
	}

	private async load() {
		await this.sqlite.initializing;
		try {
			if (!this.store.get(MIGRATED_KEY)) {
				const legacy = (this.store.get(LEGACY_PROFILES_KEY) ?? []) as WebhookProfile[];
				for (const p of legacy) await this.repo().save(this.repo().create({ ...p, id: p.id || crypto.randomUUID() }));
				this.store.set(MIGRATED_KEY, true);
				if (legacy.length) this.log.info(`Moved ${legacy.length} webhook profile(s) to SQLite`);
			}
			this.profiles = ((await this.repo().find()) ?? []) as WebhookProfile[];
		} catch (err) {
			this.log.error('Could not load webhook profiles:', err);
			this.profiles = (this.store.get(LEGACY_PROFILES_KEY) ?? []) as WebhookProfile[];
		}
		this.messageHandler.sendMessage('WebhookProfiles', this.profiles);
	}

	getProfiles(): WebhookProfile[] {
		return this.profiles;
	}

	setProfile(profile: WebhookProfile) {
		const saved = { ...profile, id: profile.id || crypto.randomUUID() };
		const idx = this.profiles.findIndex((p) => p.id === saved.id);
		this.profiles = idx >= 0 ? this.profiles.map((p, i) => (i === idx ? saved : p)) : [...this.profiles, saved];
		void this.repo().save(this.repo().create(saved)).catch((err) => this.log.error('Saving webhook profile failed:', err));
		this.messageHandler.sendMessage('WebhookProfiles', this.profiles);
	}

	deleteProfile(id: string) {
		this.profiles = this.profiles.filter((p) => p.id !== id);
		void this.repo().delete({ id }).catch((err) => this.log.error('Deleting webhook profile failed:', err));
		this.messageHandler.sendMessage('WebhookProfiles', this.profiles);
	}

	getEnabled(): boolean {
		return (this.store.get(ENABLED_KEY) ?? true) as boolean;
	}

	setEnabled(enabled: boolean) {
		this.store.set(ENABLED_KEY, enabled);
		this.messageHandler.sendMessage('WebhooksEnabled', enabled);
	}

	private initEventListeners() {
		this.clientEmitter.on('SetWebhookProfile', (profile) => {
			this.setProfile(profile);
		});
		this.clientEmitter.on('DeleteWebhookProfile', (id) => {
			this.deleteProfile(id);
		});
		this.clientEmitter.on('SetWebhooksEnabled', (enabled) => {
			this.setEnabled(enabled);
		});
	}
}
