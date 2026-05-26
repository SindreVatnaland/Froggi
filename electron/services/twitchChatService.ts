import { inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import WebSocket from 'ws';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';

@singleton()
export class TwitchChatService {
	private ws: WebSocket | null = null;
	private channel: string | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private intentionalClose = false;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
	) {}

	connect(channel: string) {
		const normalized = channel.toLowerCase().replace(/^#/, '').trim();
		if (!normalized) return;
		if (this.channel === normalized && this.ws?.readyState === WebSocket.OPEN) return;
		this.channel = normalized;
		this.intentionalClose = false;
		this.openConnection();
	}

	disconnect() {
		this.intentionalClose = true;
		this.channel = null;
		if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
		if (this.ws) { this.ws.close(); this.ws = null; }
	}

	private openConnection() {
		if (this.ws) { this.ws.close(); this.ws = null; }
		const nick = `justinfan${Math.floor(10000 + Math.random() * 90000)}`;
		const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
		this.ws = ws;

		ws.on('open', () => {
			ws.send('PASS SCHMOOPIIE');
			ws.send(`NICK ${nick}`);
			ws.send(`JOIN #${this.channel}`);
			this.log.info(`TwitchChat: joined #${this.channel}`);
		});

		ws.on('message', (data: Buffer | string) => {
			const text = data.toString();
			for (const line of text.split('\r\n')) {
				if (!line) continue;
				if (line.startsWith('PING')) {
					ws.send('PONG :tmi.twitch.tv');
					continue;
				}
				// :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
				const m = line.match(/^:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #\S+ :(.+)$/);
				if (m) {
					this.localEmitter.emit('TwitchChatMessage', { username: m[1].toLowerCase(), text: m[2].trim() });
				}
			}
		});

		ws.on('close', () => {
			if (!this.intentionalClose && this.channel) {
				this.log.info('TwitchChat: disconnected, reconnecting in 10s');
				this.reconnectTimer = setTimeout(() => this.openConnection(), 10000);
			}
		});

		ws.on('error', (err) => this.log.error('TwitchChat error:', err));
	}
}
