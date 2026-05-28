import { inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import WebSocket from 'ws';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';

@singleton()
export class TwitchChatService {
	private ws: WebSocket | null = null;
	private channel: string | null = null;
	private ws2: WebSocket | null = null;
	private channel2: string | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectTimer2: ReturnType<typeof setTimeout> | null = null;
	private intentionalClose = false;
	private intentionalClose2 = false;

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
		this.openConnection(1);
	}

	connectSecond(channel: string) {
		const normalized = channel.toLowerCase().replace(/^#/, '').trim();
		if (!normalized) return;
		if (this.channel2 === normalized && this.ws2?.readyState === WebSocket.OPEN) return;
		this.channel2 = normalized;
		this.intentionalClose2 = false;
		this.openConnection(2);
	}

	disconnect() {
		this.intentionalClose = true;
		this.channel = null;
		if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
		if (this.ws) { this.ws.close(); this.ws = null; }
	}

	disconnectSecond() {
		this.intentionalClose2 = true;
		this.channel2 = null;
		if (this.reconnectTimer2) { clearTimeout(this.reconnectTimer2); this.reconnectTimer2 = null; }
		if (this.ws2) { this.ws2.close(); this.ws2 = null; }
	}

	private openConnection(slot: 1 | 2) {
		const isSecond = slot === 2;
		if (isSecond) {
			if (this.ws2) { this.ws2.close(); this.ws2 = null; }
		} else {
			if (this.ws) { this.ws.close(); this.ws = null; }
		}
		const channel = isSecond ? this.channel2 : this.channel;
		if (!channel) return;
		const nick = `justinfan${Math.floor(10000 + Math.random() * 90000)}`;
		const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
		if (isSecond) this.ws2 = ws; else this.ws = ws;

		ws.on('open', () => {
			ws.send('PASS SCHMOOPIIE');
			ws.send(`NICK ${nick}`);
			ws.send(`JOIN #${channel}`);
			this.log.info(`TwitchChat[${slot}]: joined #${channel}`);
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
					this.localEmitter.emit('TwitchChatMessage', { username: m[1].toLowerCase(), text: m[2].trim(), channel: channel! });
				}
			}
		});

		ws.on('close', () => {
			const intentional = isSecond ? this.intentionalClose2 : this.intentionalClose;
			const ch = isSecond ? this.channel2 : this.channel;
			if (!intentional && ch) {
				this.log.info(`TwitchChat[${slot}]: disconnected, reconnecting in 10s`);
				const timer = setTimeout(() => this.openConnection(slot), 10000);
				if (isSecond) this.reconnectTimer2 = timer; else this.reconnectTimer = timer;
			}
		});

		ws.on('error', (err) => this.log.error(`TwitchChat[${slot}] error:`, err));
	}
}
