import type { ContentTopic } from '../types';

export const appTopics: ContentTopic[] = [
	{
		id: 'app-overview',
		title: 'What Froggi does',
		category: 'app',
		summary: 'Froggi reads live Slippi (Melee) replay data from Dolphin and drives OBS overlays in real time.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Froggi is a desktop app that connects to Slippi Dolphin while you play, reads the live game state (players, stocks, percent, stage, rank), and pushes that data to overlays you build and place in OBS as browser sources. It also handles player rank tracking, session stats, replay simulation, remote/co-op minigames (Bingo, Iron Man), and controller-combo or game-state automation for OBS.',
			},
			{
				type: 'list',
				text: 'Core pieces:',
				items: [
					'Overlay editor — build custom HUDs from draggable/resizable elements on a grid',
					'OBS integration — connect via obs-websocket, embed overlays as browser sources, automate scene switching',
					'Overlay injection (Windows only) — render an overlay directly over the Dolphin game window, not just in OBS',
					'Minigames — Bingo and Iron Man, playable solo, local co-op, or remote with a friend',
					'Remote access — Tailscale or ngrok let you (or a friend) reach Froggi from outside your local network',
				],
			},
		],
	},
	{
		id: 'os-limitations',
		title: 'Platform differences (Windows / macOS / Linux)',
		category: 'app',
		summary: 'Overlay injection into the game window is Windows-only. Everything else — overlays in OBS, minigames, remote access — works on all three platforms.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Froggi runs on Windows, macOS, and Linux. The one platform-specific feature is overlay injection: rendering an overlay directly over the Dolphin window (as opposed to inside OBS as a browser source). That uses @asdf-overlay, a Windows-only native DLL injection mechanism — it is not available on macOS or Linux. Everything else — building overlays, embedding them in OBS as browser sources, remote access via Tailscale/ngrok, minigames, and automation — works identically across all three platforms.',
			},
			{
				type: 'note',
				text: 'If injection reports "unavailable — failed to load native module," that is expected on macOS/Linux; on Windows it usually means the native module failed to load in the packaged build (check the "AI Assistant" logs tool, or main.log, for the underlying error) or antivirus is blocking the DLL.',
			},
		],
	},
	{
		id: 'connect-ai-app',
		title: 'Connecting an AI app to Froggi',
		category: 'app',
		summary: 'Settings → AI Assistant → "Connect an AI app": pick your app and press the button — Claude Desktop, Claude Code, Cursor, VS Code, or any other MCP app.',
		blocks: [
			{
				type: 'list',
				text: 'Turn on the AI Assistant toggles (read, and optionally edits), then pick your app:',
				items: [
					'Claude Desktop — "Add to Claude Desktop" installs the local Froggi extension (.mcpb); nothing leaves this computer',
					'Claude Code — "Copy command" copies `claude mcp add --transport http froggi http://127.0.0.1:3300/froggi/mcp`; run it in a terminal, then /mcp',
					'Cursor / VS Code — opens the app and asks you to confirm adding the Froggi server',
					'Other app — "Copy config" copies the server config (HTTP URL) to paste into any app that supports MCP',
				],
			},
			{
				type: 'note',
				text: 'If the assistant seems to be missing tools after a Froggi update, restart the AI app (or toggle the Froggi extension/server off and on) so it reloads the tool list.',
			},
		],
	},
	{
		id: 'troubleshooting-crash-reports',
		title: 'Troubleshooting errors and sending crash reports',
		category: 'app',
		summary: 'Froggi logs every error. The AI assistant can read the last few sessions, tell whether a problem is fixable locally or a bug, and — only if you agree — send a crash report to the developer.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Logs live in main.log in the Froggi app-data folder (Windows: %APPDATA%\\froggi\\main.log; macOS: ~/Library/Application Support/Froggi/main.log). With Settings → AI Assistant → read access on, Claude can call diagnose_errors: it reads the last few app sessions (so a crash that closed Froggi is still visible), groups repeated errors, and labels known causes as local (you can fix it — e.g. Slippi replay folder missing, OBS WebSocket off, port already in use), benign, or dev (a bug).',
			},
			{
				type: 'list',
				text: 'Sending a crash report:',
				items: [
					'Through Claude: with write access on, Claude asks before sending and only sends after you agree. The report contains its summary plus the log lines around the chosen errors.',
					'Manually: Settings → Feedback → Bug report, optionally with logs attached.',
					'Automatic crash reports only go out if "Crash reports" is enabled in Settings.',
					'Everything sent is scrubbed: your home folder, username, Slippi connect codes and IP addresses are removed.',
				],
			},
		],
	},
];
