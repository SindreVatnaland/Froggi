import type { ContentTopic } from '../types';

export const obsIntegrationTopics: ContentTopic[] = [
	{
		id: 'obs-connection',
		title: 'Connecting Froggi to OBS',
		category: 'obs',
		summary: 'Froggi connects to OBS over its built-in WebSocket server (obs-websocket v5). One-click auto-setup usually works; manual host/port/password is the fallback.',
		blocks: [
			{
				type: 'paragraph',
				text: 'OBS 28+ ships a built-in WebSocket server (obs-websocket v5) that Froggi connects to as a client. There are two ways to pair them:',
			},
			{
				type: 'list',
				text: 'Setup options:',
				items: [
					'One-click (recommended) — with OBS running, use the "Configure OBS automatically" option. Froggi reads OBS\'s own config to find (and enable, if needed) its WebSocket server, then connects. No values to type.',
					'Manual — enter host/port/password by hand. Use this if auto-detection fails, or OBS is running on a different machine on your network.',
				],
			},
			{
				type: 'note',
				text: 'Enabling OBS\'s WebSocket server via the automatic path edits OBS\'s own config file, which OBS only reads at startup — if it doesn\'t take effect immediately, restart OBS once.',
			},
		],
	},
	{
		id: 'obs-embed-overlay',
		title: 'Adding a Froggi overlay to OBS',
		category: 'obs',
		summary: 'Once connected, Froggi can add any overlay (or a minigame view) into OBS as a browser source automatically, sized to match.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Every overlay you build in Froggi is really just a web page Froggi serves locally. Once Froggi is connected to OBS, it can create a browser source pointed at that page directly — you don\'t need to manually add a Browser Source in OBS and type in the URL yourself, though you always can if you prefer full manual control.',
			},
			{
				type: 'note',
				text: 'For minigames (Bingo, Iron Man), the same applies — Froggi can add the minigame\'s OBS view as a browser source the same way it adds a custom overlay.',
			},
		],
	},
	{
		id: 'obs-dashboard',
		title: 'The Dashboard (running a stream or tournament set)',
		category: 'obs',
		summary: 'OBS → Dashboard is the live control page: players + set score, stage-striking phone links, live game, scenes, OBS automation, replay buffer.',
		blocks: [
			{
				type: 'list',
				text: 'Sections:',
				items: [
					'Match bar — player tags (click to edit), set score (click to edit games), Start Set (stage striking), and per player a "P1/P2 phone · stage striking" QR: each player scans theirs to strike/ban/pick on their phone. Hover = "Copy URL"; click copies it. The QRs need a public link (ngrok "Online" toggle).',
					'Live game + game history — percents, stocks, stage while a game runs; past games of the set.',
					'Share live game — a watch-only /live page link: permanent (Tailscale Funnel, hidden until "Show") or temporary (ngrok).',
					'Connectivity — OBS connected?, Tailscale Funnel, ngrok tunnel (↻ = new URL).',
					'Scenes — click to switch the OBS program scene; ★ pins favourites to the top (saved per device).',
					'Automation — controller commands and auto scene switch toggles. Scene Items / Volume — show/hide sources and set input volume in the current scene.',
					'Replay Buffer — "Enable 30s" turns OBS\'s replay buffer on (30 s) through obs-websocket; if OBS has not applied it yet it asks for an OBS restart once.',
				],
			},
			{
				type: 'note',
				text: 'Explain the relevant section first; only act (switch scenes, start ngrok, start a set) when the user asks you to.',
			},
		],
	},
];
