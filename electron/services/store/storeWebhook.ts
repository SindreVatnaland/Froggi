import Store from 'electron-store';
import type { WebhookProfile } from '../../../frontend/src/lib/models/types/webhook';
import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from '../messageHandler';

const PROFILES_KEY = 'webhook.profiles';
const ENABLED_KEY = 'webhook.enabled';

@singleton()
export class ElectronWebhookStore {
	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ElectronStore') private store: Store,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log.info('Initializing Webhook Store');
		this.initEventListeners();
	}

	getProfiles(): WebhookProfile[] {
		return (this.store.get(PROFILES_KEY) ?? []) as WebhookProfile[];
	}

	setProfile(profile: WebhookProfile) {
		const profiles = this.getProfiles();
		const idx = profiles.findIndex((p) => p.id === profile.id);
		if (idx >= 0) {
			profiles[idx] = profile;
		} else {
			profiles.push({ ...profile, id: profile.id || crypto.randomUUID() });
		}
		this.store.set(PROFILES_KEY, profiles);
		this.messageHandler.sendMessage('WebhookProfiles', profiles);
	}

	deleteProfile(id: string) {
		const profiles = this.getProfiles().filter((p) => p.id !== id);
		this.store.set(PROFILES_KEY, profiles);
		this.messageHandler.sendMessage('WebhookProfiles', profiles);
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
