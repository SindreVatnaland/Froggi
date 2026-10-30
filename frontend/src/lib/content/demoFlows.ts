import { LiveStatsScene } from '../models/enum';
import type { Flow } from '../models/types/flow';
import { WebhookEvent } from '../models/types/webhook';
import { SCENE_SWITCHING_FLOW } from './sceneFlow';
import { HIGHLIGHTS_FLOW } from './highlightsFlow';

/**
 * Ready-made flows shown under "Demo flows" — "Use" copies one into your flows (disabled) so you can
 * set your own URL / OBS scene names and turn it on. URLs and scene names are placeholders.
 */
export const DEMO_FLOWS: (Flow & { description: string })[] = [
	{
		...SCENE_SWITCHING_FLOW,
		id: 'demo-scene-switching',
		name: 'Scene switching',
		description: 'The default scene rules (game start/end, Post Game → Stage Striking, rank change, Dolphin). Use it to get a copy to work from.',
		enabled: false,
	},
	{
		id: 'demo-replay-combo',
		name: 'Save a replay with L + R + D↓',
		description: 'Hold L + R + D-pad down for half a second to save the OBS replay buffer.',
		enabled: false,
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'controllerCombo', buttons: { isLPressed: true, isRPressed: true, isDPadDownPressed: true } } },
			{ id: 'a', kind: 'action', position: { x: 300, y: 120 }, data: { type: 'obsSaveReplay' } },
		],
		edges: [{ id: 'e1', source: 't', target: 'a' }],
	},
	{
		id: 'demo-stock-lights',
		name: 'Flash the lights when you lose a stock',
		description: 'Sends your stocks left to a smart-home webhook (Homey, Home Assistant…) when you lose a stock in a game.',
		enabled: false,
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'stockLost', player: 'current' } },
			{
				id: 'a', kind: 'action', position: { x: 300, y: 120 },
				data: { type: 'httpPost', url: 'http://homey.local/api/manager/logic/webhook/froggi', body: 'custom', template: '{ "event": "stock_lost", "player": "{{playerName}}", "stocksLeft": {{stocksLeft}} }' },
			},
		],
		edges: [{ id: 'e1', source: 't', target: 'a' }],
	},
	{
		id: 'demo-big-hit',
		name: 'Big hit on the last stock',
		description: 'When you take 30%+ in one hit while on your last stock, POST the damage and your new percent.',
		enabled: false,
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'damageTaken', player: 'current', minDamage: 30 } },
			{ id: 'c', kind: 'condition', position: { x: 300, y: 120 }, data: { type: 'playerStocks', player: 'current', compare: '==', value: 1 } },
			{
				id: 'a', kind: 'action', position: { x: 560, y: 120 },
				data: { type: 'httpPost', url: 'http://homey.local/api/manager/logic/webhook/froggi', body: 'custom', template: '{ "event": "big_hit", "damage": {{damage}}, "percent": {{percent}} }' },
			},
		],
		edges: [{ id: 'e1', source: 't', target: 'c' }, { id: 'e2', source: 'c', target: 'a' }],
	},
	{
		id: 'demo-singles-scene',
		name: 'Game scene (singles)',
		description: 'Switches OBS to your 1v1 game scene when a game starts. Pairs with the doubles version below (Game format is Doubles).',
		enabled: false,
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'sceneChange', scene: LiveStatsScene.InGame } },
			{ id: 'c', kind: 'condition', position: { x: 300, y: 120 }, data: { type: 'gameFormat', format: 'singles' } },
			{ id: 'a', kind: 'action', position: { x: 560, y: 120 }, data: { type: 'obsScene', sceneName: 'Game' } },
		],
		edges: [{ id: 'e1', source: 't', target: 'c' }, { id: 'e2', source: 'c', target: 'a' }],
	},
	{
		id: 'demo-doubles-scene',
		name: 'Game scene (doubles)',
		description: 'Switches OBS to a 4-camera scene when a teams game starts.',
		enabled: false,
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'sceneChange', scene: LiveStatsScene.InGame } },
			{ id: 'c', kind: 'condition', position: { x: 300, y: 120 }, data: { type: 'gameFormat', format: 'doubles' } },
			{ id: 'a', kind: 'action', position: { x: 560, y: 120 }, data: { type: 'obsScene', sceneName: 'Game (Doubles)' } },
		],
		edges: [{ id: 'e1', source: 't', target: 'c' }, { id: 'e2', source: 'c', target: 'a' }],
	},
	{
		id: 'demo-strike-display',
		name: 'Tell a display whose turn it is to strike',
		description: 'Posts the full stage-striking state (who must ban/pick, stage states) to another screen or tool whenever it changes — offline/direct sets only.',
		enabled: false,
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'strikeAction', event: 'all' } },
			{ id: 'c', kind: 'condition', position: { x: 300, y: 120 }, data: { type: 'gameMode', modes: ['local', 'direct'] } },
			{ id: 'a', kind: 'action', position: { x: 560, y: 120 }, data: { type: 'httpPost', url: 'http://192.168.1.50:8080/froggi', body: WebhookEvent.StrikeState } },
		],
		edges: [{ id: 'e1', source: 't', target: 'c' }, { id: 'e2', source: 'c', target: 'a' }],
	},
	{
		...HIGHLIGHTS_FLOW,
		id: 'demo-highlights',
		description: 'Highlights: every punish is scored by Calculate cards (kill, damage, speed, win-chance swing, multi-kill, long-sequence penalty); those from 40 are marked and the OBS replay buffer is saved. At every game end: game = best 5, set = best 15 (time order), daily = today\'s top 5 % (10–30, at most 3 per game). Media elements (keys "game" / "set" / "daily") loop the clips one by one (Set media → Timer → List next); Highlight Replay elements ("replay-game" / "replay-set" / "replay-daily") redraw them from the replays. A game start stops the loops. The same flow is installed (off) as "Highlights". Tell the AI assistant your own rules and it edits the cards.',
	},
];
