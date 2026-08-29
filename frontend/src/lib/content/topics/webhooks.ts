import type { ContentTopic } from '../types';

export const webhookTopics: ContentTopic[] = [
	{
		id: 'webhooks-overview',
		title: 'Game-event webhooks (outbound)',
		category: 'automation',
		summary: 'Froggi POSTs live match events (game start/end, percent, stock, rank, minigame updates) to any URL you configure. Use them to drive external systems off what happens in-game.',
		blocks: [
			{
				type: 'paragraph',
				text: 'A webhook profile is an outbound HTTP target: Settings → Webhooks, give it a name and a URL, tick which events it should receive, and enable it. From then on Froggi POSTs a JSON body to that URL every time one of those events fires. Multiple profiles can run at once (e.g. one for a stream bot, one for smart-home).',
			},
			{
				type: 'list',
				text: 'Events you can subscribe to:',
				items: [
					'GameStart / GameEnd — a match begins/ends (players, characters, stage, mode, score)',
					'GameScore — set score changed',
					'PercentChange — a player\'s damage % changed (throttled to ~300ms)',
					'StockChange — a player lost/started a stock (includes death direction)',
					'RankChange — ranked rank went up/down',
					'PlayerInfo — resolved player info (characters, connect codes, rank)',
					'StrikeState — stage-striking state',
					'BingoUpdate / BingoBoardState / IronManUpdate — minigame progress',
				],
			},
			{
				type: 'list',
				text: 'Every POST body has the same envelope:',
				items: [
					'eventName — the event id (e.g. "PercentChange")',
					'timestamp — ISO time the event fired',
					'payload — event-specific data (see the per-event shape below)',
				],
			},
			{
				type: 'note',
				text: 'Auth per profile: none, bearer token, or OAuth2 (client id/secret/login URL). High-frequency events are throttled leading+trailing so you get the latest value without being flooded — PercentChange ~300ms, StockChange/GameStart/GameEnd/RankChange fire instantly.',
			},
		],
	},
	{
		id: 'webhooks-percent-payload',
		title: 'PercentChange payload shape',
		category: 'automation',
		summary: 'What Froggi sends when a player\'s damage percent changes — the fields you map onto lights, sounds, or overlays.',
		blocks: [
			{
				type: 'paragraph',
				text: 'PercentChange payload carries three views: p1, p2, and currentPlayer (whichever port is you, when known). Each is: { connectCode, displayName, isCurrentPlayer, prev, current, diff } where prev/current are the damage percent before/after and diff is the change.',
			},
			{
				type: 'list',
				text: 'Example body:',
				items: [
					'{ "eventName": "PercentChange", "timestamp": "…",',
					'  "payload": { "p1": { "displayName": "You", "isCurrentPlayer": true, "prev": 45.3, "current": 67.8, "diff": 22.5 },',
					'               "p2": { "displayName": "Opp", "isCurrentPlayer": false, "prev": 23.1, "current": 28.9, "diff": 5.8 },',
					'               "currentPlayer": { … same as whichever port is you … } } }',
				],
			},
		],
	},
	{
		id: 'webhooks-smart-home',
		title: 'Drive smart-home lights from game events (Homey / Home Assistant)',
		category: 'automation',
		summary: 'Point a webhook profile at your smart-home hub\'s webhook endpoint, then map a game field (e.g. player percent) to a device (e.g. light brightness/color) in the hub.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Froggi only sends the event; the mapping (what a value does to a device) lives in your smart-home hub. The pattern is always: (1) create a webhook/automation trigger in the hub that gives you a URL, (2) add a Froggi webhook profile pointing at that URL with the events you want, (3) in the hub, read a field from the JSON body and act on a device.',
			},
			{
				type: 'list',
				text: 'Example — room lights follow YOUR damage percent:',
				items: [
					'Home Assistant: add a Webhook trigger automation → copy its URL (…/api/webhook/<id>). In Froggi, make a profile with that URL and the PercentChange event enabled. In the automation, read trigger.json.payload.currentPlayer.current (0–200ish) and map it to a light: e.g. light.turn_on with brightness/color scaled from green (low %) to red (high %).',
					'Homey: use the "Logic"/HomeyScript or a Webhook flow card to receive the POST, parse payload.currentPlayer.current, then a Flow sets the bulb hue/dim from that number.',
					'Rule of thumb for percent→color: hue = 120 - (percent/200)*120 (120=green at 0%, 0=red at high %); brightness = 30% + (percent/200)*70%.',
				],
			},
			{
				type: 'list',
				text: 'Other useful mappings:',
				items: [
					'StockChange → flash the lights red when payload.currentPlayer loses a stock (deathDirection tells you which blast zone)',
					'GameStart → set a "match" lighting scene; GameEnd → restore normal',
					'RankChange → celebratory color pulse on rank up',
				],
			},
			{
				type: 'note',
				text: 'PercentChange is throttled ~300ms, so lights update smoothly without a request per frame. Test without playing: the Webhooks settings page can send a dummy payload for each event so you can build the hub-side mapping first.',
			},
		],
	},
];
