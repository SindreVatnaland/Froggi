import type { Tutorial } from './types';

export const flowsTutorial: Tutorial = {
	id: 'flows',
	title: 'Flows',
	description: 'When something happens in game, and conditions hold, then control OBS or your smart home.',
	icon: 'Workflow',
	path: '/obs/tutorial/flows',
	pages: [
		{
			title: 'What are flows?',
			blocks: [
				{ type: 'text', text: 'A flow is a small rule: **WHEN** something happens in the game, **AND** your conditions hold, **THEN** Froggi acts. You build it by connecting cards on a canvas.' },
				{ type: 'list', items: ['**WHEN** a game starts or ends, a player loses a stock, stage striking moves on', '**AND** singles or doubles, the game mode, a player\'s stocks or percent', '**THEN** switch an OBS scene, flash your lights, post to Discord, save a replay'] },
			],
		},
		{
			title: 'Build a flow',
			blocks: [
				{ type: 'list', ordered: true, items: ['Go to **Stream** → **Automation** → **Flows** and click **+ New flow** — or press **Use** on a demo flow.', 'Add a **WHEN** block, then any **AND** blocks, then one or more **THEN** blocks, and connect them left to right.', 'Click a block to set it up — which player, how many stocks, which OBS scene.', 'Choose singles, doubles or both.', 'Press **Test** to run the actions once, then switch the flow on. New flows start **off**.'] },
				{ type: 'heading', text: 'Controller combos' },
				{ type: 'list', items: ['A combo fires after you **hold it for half a second**, then waits a second before it can fire again — no accidents mid-game.', 'Dolphin must be open so Froggi can read your controller.'] },
				{ type: 'note', text: '⚠️ **Windows only** — Froggi can\'t read controllers on macOS or Linux, so controller combos aren\'t available there.' },
			],
		},
		{
			title: 'Example: your smart home',
			blocks: [
				{ type: 'text', text: 'Most smart home systems — **Homey**, **Home Assistant**, **IFTTT** — can start an automation from a **webhook** (a web address you POST to). Froggi\'s **Send web request** action calls it.' },
				{ type: 'list', ordered: true, items: ['In your smart home app, create an automation started by a webhook and copy its URL.', 'In Froggi: **WHEN** "A player loses a stock" → **AND** "Player stocks ≤ 1" → **THEN** "Send web request" with that URL.', 'Pick what to send: the event, a game-state snapshot, or your own text with keys — like `{"player": "{{playerName}}", "stocks": {{stocksLeft}}}`. **Game state…** adds live values such as `{{state.score.1}}`.', 'Press **Test** — Froggi sends it once and shows the answer it got back.'] },
				{ type: 'text', text: 'Now your lights flash red on your last stock. More ideas: dim the room when a game starts, a sound when a set ends, a light in the winner\'s colour.' },
			],
		},
		{
			title: 'Share flows, and let the AI build them',
			blocks: [
				{ type: 'list', items: ['**Demo flows** — ready-made at the bottom of the Flows page: save a replay with a combo, lights on a lost stock, game scenes for singles and doubles, whose turn it is to strike.', '**Share** — **Export** saves a flow as a `.froggi` file; **Import .froggi** loads one. Passwords and tokens are removed on export, and imported flows start off.', '**Ask the AI** — "make a flow that switches OBS to my Game scene when a game starts, and to my big camera scene when it ends". It explains the flow first and saves it switched off for you to test.'] },
				{ type: 'text', text: 'Want every event sent somewhere, no conditions? [Webhooks](/obs/tutorial/webhook) (Stream → Automation → Webhooks) post all game events to one address.' },
			],
		},
	],
};
