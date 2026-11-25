import type { ContentTopic } from '../types';

export const appTopics: ContentTopic[] = [
	{
		id: 'troubleshooting-no-game-data',
		title: 'Dolphin is connected but overlays show nothing',
		category: 'app',
		summary: 'Froggi connects to Dolphin but no game data arrives (no percent/stocks, scene never leaves Menu) — usually Dolphin was not started from Slippi Launcher, or the replay folder is wrong.',
		blocks: [
			{
				type: 'list',
				text: 'Check in this order (nothing is written to the error log for these, so diagnose_errors will not show them — read_recent_logs with search "Dolphin" shows whether Dolphin was found and reached "Connection State: CONNECTED"):',
				items: [
					'Dolphin started outside Slippi Launcher (a standalone Dolphin, an old shortcut, or opening the .app/.exe directly): Froggi can find and connect to the process, but that Dolphin does not send Slippi game data. Fix: close Dolphin and start it from Slippi Launcher (Play / Watch). The log then shows "Dolphin Found" and "Connection State: CONNECTED", and game start appears when a game begins.',
					'Replay folder: post-game stats and rank changes are read from the replays. If Slippi Launcher → Settings → Replays points at a folder that does not exist (on Windows often OneDrive\\Documents\\Slippi instead of Documents\\Slippi), live data works but post-game stats do not. Set the real folder and restart Froggi.',
					'Still nothing: restart Dolphin from Slippi Launcher after Froggi is open, then start a game (menus alone send no game data).',
				],
			},
		],
	},
	{
		id: 'share-live-game',
		title: 'Share your live game with friends',
		category: 'app',
		summary: 'Send friends a link and they watch your game live in their browser while you play.',
		blocks: [
			{
				type: 'list',
				text: 'How it works:',
				items: [
					'Home → Share live game shows a preview of exactly what friends see: the stage, the characters moving, and a Melee-style HUD (percent and stocks along the bottom by port, centred; timer and set score on top).',
					'"Open live view" opens it in a window on this computer. To share it, use a link: Permanent (Tailscale Funnel — never changes) or Temporary (ngrok — changes when ngrok restarts). Links stay hidden until "Show"; Copy works either way.',
					'If Tailscale or ngrok isn\'t set up, the card says what is missing (not installed / not logged in / Funnel off) and "Set up …" goes to Settings → Remote Access.',
					'Viewers can only watch (up to 5). Controlling Froggi still needs the host password.',
				],
			},
		],
	},
	{
		id: 'discord-rich-presence',
		title: 'Discord Rich Presence',
		category: 'app',
		summary: 'Your Discord profile shows what you play: the mode, the stage, both players, the set score and your rank. Friends join your minigame lobby with one click.',
		blocks: [
			{
				type: 'list',
				text: 'What your profile shows:',
				items: [
					'In a game: the mode (e.g. "Ranked - In Game"), both connect codes with the set score, the stage picture with your rank badge, and the time left. Two buttons show each player\'s tag, character, stocks and percent and open their slippi.gg profile.',
					'In the menus: your rank and rating, or the set score after a game.',
					'Minigames (Bingo, Iron Man): the game and its progress. While you host an online lobby with a free spot, Discord shows a Join button — a friend who clicks it joins your lobby in Froggi.',
					'In the menus and in minigames without a free spot, a "Get Froggi" button links to the download page.',
				],
			},
			{
				type: 'note',
				text: 'It works when the Discord desktop app is running on the same computer. Discord\'s own setting (User Settings → Activity Privacy) decides whether others can see it.',
			},
		],
	},
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
					'Game history — your replays in a local database the AI assistant can query (records, matchups, tech skill; Settings → Game History)',
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
				text: 'The assistant keeps short notes for itself on the overlays, elements and flows it builds or changes (what they are for, what you asked for) so it understands them next time. They are hidden in Froggi and travel with exported overlays and flows. Ask it to show or change them.',
			},
			{
				type: 'note',
				text: 'If the assistant seems to be missing tools after a Froggi update, restart the AI app (or toggle the Froggi extension/server off and on) so it reloads the tool list.',
			},
			{
				type: 'note',
				text: 'Apps on this computer always use the local URL — no Tailscale needed. The local URL and "Expose over Tailscale (HTTPS)" sit under Settings → AI Assistant → Advanced (collapsed); the "Connect an AI app" buttons need neither. "Expose over Tailscale (HTTPS)" is only for an MCP app on ANOTHER of your devices in the same tailnet. Web/cloud apps (claude.ai, the Claude mobile app\'s connectors) run on remote servers and cannot reach a tailnet-only URL, so exposing it does not help them.',
			},
		],
	},
	{
		id: 'game-history',
		title: 'Game history: ask the AI about your play',
		category: 'app',
		summary: 'Froggi imports your Slippi replays into a local game history so the AI assistant can answer questions about your performance — records vs a player, matchups, stages, tech skill, trends.',
		blocks: [
			{
				type: 'list',
				text: 'Settings → Game History:',
				items: [
					'Import replays — imports every replay in the Slippi replay folder that isn\'t in the history yet (the card shows how many), newest first, with a progress bar. It runs in the background (~0.5 s per replay) and pauses while a game is running.',
					'Cancel — stops the import; imported games stay and the next import picks up the rest (Resume import).',
					'Add each game when it ends (on by default) — keeps the history up to date after the first import.',
					'"Me" is the connect code you are signed in to Slippi with — offline games have no connect code, so they are in the history but not in your personal record.',
				],
			},
			{
				type: 'paragraph',
				text: 'Ask the assistant things like "what is my record vs ABC#123 in friendlies", "which matchup do I lose most in ranked", "how is my L-cancel rate this month", "my best stage as Falco". It reads the history with read-only queries (get_game_history_schema → query_game_history); with edits allowed it can also start or cancel an import (import_replays). Doubles games are included: stocks, KOs, damage, tech skill and inputs per player; punish / neutral stats are singles-only (Slippi computes them for two players).',
			},
			{
				type: 'note',
				text: 'The history is a separate local file (history.sqlite in the Froggi app-data folder) built only from your replays — the assistant can\'t read anything else through it. Only replays in the Slippi replay folder are included; deleting history.sqlite rebuilds it from the replays.',
			},
		],
	},
	{
		id: 'troubleshooting-crash-reports',
		title: 'Troubleshooting errors and sending crash reports',
		category: 'app',
		summary: 'Your AI assistant reads Froggi\'s logs, tells you how to fix things and sends a crash report to the developer when you say so.',
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
