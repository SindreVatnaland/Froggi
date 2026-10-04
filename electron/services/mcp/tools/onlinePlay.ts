import { z } from 'zod';
import { app } from 'electron';
import os from 'os';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { encryptUrl } from '../../../../frontend/src/lib/utils/urlCrypto';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

// Same landing page lobbyService uses for Discord invites: it bounces to froggi://join/<code>.
const FROGGI_LANDING = 'https://sindrevatnaland.github.io/Froggi/';

/** Connect code = encrypted ngrok URL (ngrok only — must match the Share Code, froggi:// link and Discord join). */
function connectInfo(ngrokUrl: string | undefined) {
	if (!ngrokUrl) return undefined;
	const code = encryptUrl(ngrokUrl.replace(/\/$/, ''), app.getVersion());
	return { connectCode: code, joinLink: `${FROGGI_LANDING}join.html?code=${encodeURIComponent(code)}` };
}

function nextStep(s: { installed: boolean; authenticated: boolean; running: boolean; url?: string }): string {
	if (!s.installed) return 'Install ngrok: ngrok_setup action "install" (uses the system package manager when available, otherwise opens ngrok.com/download — the user installs it and you call get_online_play_status again).';
	if (!s.authenticated) return 'The user needs a free ngrok account: sign up at https://dashboard.ngrok.com/signup, copy the authtoken from https://dashboard.ngrok.com/get-started/your-authtoken, then either paste it into Froggi (Settings → Remote Access → ngrok) or give it to you for ngrok_setup action "set_authtoken". Mention the token is a secret; pasting it in Froggi keeps it out of the chat.';
	if (!s.running) return 'Start the tunnel: ngrok_setup action "start", then check status again for the URL.';
	if (!s.url) return 'Tunnel is starting — check status again in a few seconds.';
	return 'Ready. Host: open Minigames in Froggi, pick Bingo or Iron Man → Host, choose settings, and share the connect code / join link with the friend. Guest: the friend pastes the code in Minigames → Join (or you call join_minigame with it).';
}

export function registerOnlinePlayReadTools(server: McpServer) {
	server.registerTool(
		'get_online_play_status',
		{
			description: 'Everything needed to play minigames (Bingo / Iron Man) online with a friend: ngrok status (installed / signed in / tunnel running / public URL), the connect code + join link for this machine (from the ngrok URL), the current Bingo/Iron Man lobby, and the next setup step. Only the HOST needs ngrok; a guest just needs Froggi and the host\'s code. Use this to guide setup step by step — the user plays in the Minigames page, you only help with setup.',
			inputSchema: {},
		},
		async () => {
			const ngrok = mcpContext.ngrokService!.getStatus();
			const bingoLobby = mcpContext.bingoService?.getLobby?.() ?? null;
			const ironmanLobby = mcpContext.ironmanService?.getLobby?.() ?? null;
			return text({
				platform: os.platform(),
				ngrok,
				connect: connectInfo(ngrok.running ? ngrok.url : undefined) ?? null,
				lobby: {
					bingo: bingoLobby && { opponentConnected: bingoLobby.opponentConnected, opponentName: bingoLobby.opponentName },
					ironman: ironmanLobby && { opponentConnected: ironmanLobby.opponentConnected, opponentName: ironmanLobby.opponentName },
				},
				nextStep: nextStep(ngrok),
				tutorial: 'Froggi has a step-by-step page: OBS → Tutorials → Minigames online (/obs/tutorial/minigames-online).',
			});
		},
	);
}

export function registerOnlinePlayWriteTools(server: McpServer) {
	server.registerTool(
		'ngrok_setup',
		{
			description: 'Set up ngrok so the user can HOST minigames online. Actions: "install" (package manager install, or opens the download page), "set_authtoken" (save the user\'s ngrok authtoken — only if they chose to give it to you; otherwise they paste it in Froggi Settings → Remote Access), "start" / "stop" the tunnel. Each action is async — call get_online_play_status afterwards (a few seconds later for install/start) to see the result.',
			inputSchema: {
				action: z.enum(['install', 'set_authtoken', 'start', 'stop']),
				authtoken: z.string().min(10).max(200).optional().describe('Required for set_authtoken'),
			},
		},
		async ({ action, authtoken }) => {
			const emitter = mcpContext.clientEmitter!;
			if (action === 'install') emitter.emit('NgrokInstall');
			if (action === 'set_authtoken') {
				if (!authtoken || !/^[A-Za-z0-9_-]+$/.test(authtoken)) return error('Provide the authtoken exactly as shown on the ngrok dashboard (letters, digits, _ and - only).');
				emitter.emit('NgrokSetAuthtoken', authtoken);
			}
			if (action === 'start') emitter.emit('NgrokStart');
			if (action === 'stop') emitter.emit('NgrokStop');
			return text(`ngrok ${action} requested. Check get_online_play_status in a few seconds.`);
		},
	);

	server.registerTool(
		'join_minigame',
		{
			description: 'Join a friend\'s Bingo / Iron Man lobby with their connect code (or join link — the code is extracted). Froggi opens the Minigames page and connects; the guest does not need ngrok.',
			inputSchema: { code: z.string().min(8).max(2000) },
		},
		async ({ code }) => {
			const m = /[?&]code=([^&]+)/.exec(code) ?? /froggi:\/\/join\/(.+)$/.exec(code);
			const finalCode = m ? decodeURIComponent(m[1]) : code.trim();
			mcpContext.messageHandler!.sendMessage('JoinWithCode', finalCode);
			return text('Opening Minigames and joining with that code. If it fails, the host should check their ngrok tunnel is running and the code is current (it changes when their ngrok URL changes).');
		},
	);
}
