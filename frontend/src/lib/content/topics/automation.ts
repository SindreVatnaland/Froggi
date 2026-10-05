import type { ContentTopic } from '../types';

export const automationTopics: ContentTopic[] = [
	{
		id: 'automation-overview',
		title: 'Automating OBS from Froggi',
		category: 'automation',
		summary: 'Two ways to trigger OBS actions automatically: a physical controller button combo, or a Froggi game-state change (e.g. the game ending).',
		blocks: [
			{
				type: 'list',
				text: 'Two trigger types:',
				items: [
					'Controller combo — hold a set of buttons on your GameCube controller (e.g. L+R+Start) to fire an OBS action instantly',
					'Game-state trigger — an OBS action fires automatically when Froggi\'s tracked game state reaches a given scene (Menu, In Game, Post Game, Post Set, Rank Change, Strike Phase, Waiting for Dolphin)',
				],
			},
			{
				type: 'paragraph',
				text: 'Both map to the same set of OBS actions: switch the current program scene, save the replay buffer, set an input\'s volume, or toggle a scene item\'s visibility. "Switch OBS scene to Menu when the game ends" is a game-state trigger on the Post Game scene; "switch to my Game scene when I press L+R+Start" is a controller combo.',
			},
			{
				type: 'note',
				text: 'Each trigger type can be checked for existing bindings before adding a new one, so you don\'t accidentally rebind a combo or double up a trigger on the same scene.',
			},
		],
	},
	{
		id: 'tournament-automation',
		title: 'Tournament & stream automation (lights, scene switching, other devices)',
		category: 'automation',
		summary: 'What Froggi can automate today and how: OBS scenes follow the game, lights/devices follow webhooks, OBS on another PC is reachable by IP. Anything beyond that is a feature request.',
		blocks: [
			{
				type: 'list',
				text: 'Built in:',
				items: [
					'OBS scene switching from game state — Scene Commands (OBS → Settings → Scene Commands) / the Auto scene switch toggle on the Dashboard. Each command is Global, Singles or Doubles (format-specific overrides Global).',
					'Flows (OBS → Flows) — WHEN/AND/THEN automations with POST and OBS actions; see "automation-flows".',
					'OBS on another computer — OBS → Settings → WebSocket: enter that PC\'s IP, port (4455) and password; Froggi controls it over the network (both on the same LAN, or reachable via Tailscale).',
					'Lights / smart home (Homey, Home Assistant, Node-RED, Streamer.bot) — webhooks: game start/end, percent, stock loss, set score, stage striking phase. Example: tournament stage lighting goes "match" on GameStart, flashes on StockChange, resets on GameEnd. Use get_webhook_reference for exact payloads.',
					'Another app reacting live — the WebSocket stream (ws://<host>:3100) carries every event with no auth for read-only listeners.',
				],
			},
			{
				type: 'note',
				text: 'Not built (suggest the user requests it with submit feedback if they need it): driving SEVERAL OBS instances at once, inbound webhooks (other tools triggering Froggi actions), flow conditions beyond the basic set, and per-setup automation across multiple Froggi installs in a tournament. Explain the workaround first (a flow that POSTs to Home Assistant/Node-RED which calls each OBS), then offer to file the feature request.',
			},
		],
	},
	{
		id: 'automation-flows',
		title: 'Flows: WHEN → AND → THEN automation',
		category: 'automation',
		summary: 'OBS → Flows: build automations on a canvas like Homey flows — WHEN a game event happens, AND conditions hold, THEN send an HTTP POST or control OBS. Per flow: singles, doubles or both.',
		blocks: [
			{
				type: 'list',
				text: 'Building blocks:',
				items: [
					'WHEN (one per flow): scene changes, controller button combo, game starts/ends, a player takes damage (min %), a player loses a stock, rank changes, stage striking changes (e.g. "time to ban").',
					'AND (any number, on the path): game mode is local/direct/unranked/ranked, scene is X, a player\'s stocks or percent compared to a number (Player 1/2 or You), striking phase is X.',
					'THEN: HTTP POST (URL, optional bearer token; body = the event that fired, a game-state snapshot, or the latest payload of any webhook event — same shapes as the webhooks), OBS switch scene, show/hide a source, set volume, save replay.',
					'Format: Singles + Doubles, Singles only, or Doubles only (doubles = Slippi teams game). New flows start disabled; "Test" runs the actions once.',
				],
			},
			{
				type: 'paragraph',
				text: 'Examples: lights flash (POST to Homey/Home Assistant) when you lose a stock on your last two stocks; switch OBS to a close-up scene on GameEnd in doubles only; POST the StrikeState payload to a tournament display whenever a ban is due. The AI assistant can build flows (save_flow) — it explains the flow first.',
			},
			{
				type: 'note',
				text: 'Simple Scene Commands and Controller Commands have a format too: Global runs in singles and doubles; a Singles or Doubles command for the same trigger (same scene / same button combo) overrides the Global one in that format.',
			},
		],
	},
];
