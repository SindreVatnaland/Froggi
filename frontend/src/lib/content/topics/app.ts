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
];
