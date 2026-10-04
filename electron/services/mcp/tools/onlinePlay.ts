import { z } from 'zod';
import os from 'os';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

// How the user finds and uses the code — explained to the user; the assistant does not hand out or enter codes.
const SHARE_STEPS =
	'Host: in Froggi open Minigames → Host, pick Bingo or Iron Man and the settings — the lobby shows the Share Code with a "Copy Code" button; send it to the friend (e.g. on Discord). Guest: in Froggi open Minigames → Join and paste it into "Paste share code or URL…". The guest does not need ngrok. To show the game on stream, the Minigames page lists a "Game Preview" URL to add as an OBS browser source. Bingo and Iron Man can also be shown in-game: build an overlay with the Bingo Board or Iron Man Roster element and inject it into Dolphin (Windows).';

// Explain-first: each step names where it is in Froggi; the tool is the "do it for me" option.
function nextStep(s: { installed: boolean; authenticated: boolean; running: boolean; url?: string }): string {
	if (!s.installed) return 'Step 1 — install ngrok: Froggi → Settings → Remote Access → "Install ngrok" (runs the package manager or opens ngrok.com/download). Offer ngrok_setup action "install" only if the user wants you to do it.';
	if (!s.authenticated) return 'Step 2 — sign in: create a free account at https://dashboard.ngrok.com/signup, copy the authtoken from https://dashboard.ngrok.com/get-started/your-authtoken, and paste it in Froggi → Settings → Remote Access → "Add authtoken". The token is a secret — recommend pasting it in Froggi rather than in chat (ngrok_setup "set_authtoken" exists if they insist).';
	if (!s.running) return 'Step 3 — start the tunnel: Froggi → Settings → Remote Access → "Enable tunnel" (or ngrok_setup "start" if the user asks you to).';
	if (!s.url) return 'The tunnel is starting — check again in a few seconds.';
	return `ngrok is ready, the user can host. ${SHARE_STEPS}`;
}

export function registerOnlinePlayReadTools(server: McpServer) {
	server.registerTool(
		'get_online_play_status',
		{
			description: 'Status for playing minigames (Bingo / Iron Man) online with a friend: ngrok (installed / signed in / tunnel running), the current lobbies, the next setup step, and how to share/enter the code. Only the HOST needs ngrok. Use it to EXPLAIN the steps to the user; the connect code is found and shared by the user in the Minigames page (you don\'t hand it out or join for them).',
			inputSchema: {},
		},
		async () => {
			const ngrok = mcpContext.ngrokService!.getStatus();
			const bingoLobby = mcpContext.bingoService?.getLobby?.() ?? null;
			const ironmanLobby = mcpContext.ironmanService?.getLobby?.() ?? null;
			return text({
				platform: os.platform(),
				ngrok,
				howToShareAndJoin: SHARE_STEPS,
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
			description: 'Set up ngrok so the user can HOST minigames online — explain the steps first (Settings → Remote Access in Froggi does the same) and only run this when the user asks you to. Actions: "install" (package manager install, or opens the download page), "set_authtoken" (save the user\'s ngrok authtoken — only if they chose to give it to you; otherwise they paste it in Froggi Settings → Remote Access), "start" / "stop" the tunnel. Each action is async — call get_online_play_status afterwards (a few seconds later for install/start) to see the result.',
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
}
