import { LiveStatsScene } from '../models/enum';
import type { Flow } from '../models/types/flow';
import { WebhookEvent } from '../models/types/webhook';

/**
 * Ready-made flows shown under "Demo flows" — "Use" copies one into your flows (disabled) so you can
 * set your own URL / OBS scene names and turn it on. URLs and scene names are placeholders.
 */
export const DEMO_FLOWS: (Flow & { description: string })[] = [
	{
		id: 'demo-replay-combo',
		name: 'Save a replay with L + R + D↓',
		description: 'Hold L + R + D-pad down for half a second to save the OBS replay buffer.',
		enabled: false,
		format: 'any',
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
		format: 'any',
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
		format: 'any',
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
		description: 'Switches OBS to your 1v1 game scene when a game starts. Copy it as a Doubles flow for your teams layout.',
		enabled: false,
		format: 'singles',
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'sceneChange', scene: LiveStatsScene.InGame } },
			{ id: 'a', kind: 'action', position: { x: 300, y: 120 }, data: { type: 'obsScene', sceneName: 'Game' } },
		],
		edges: [{ id: 'e1', source: 't', target: 'a' }],
	},
	{
		id: 'demo-doubles-scene',
		name: 'Game scene (doubles)',
		description: 'Switches OBS to a 4-camera scene when a teams game starts.',
		enabled: false,
		format: 'doubles',
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'sceneChange', scene: LiveStatsScene.InGame } },
			{ id: 'a', kind: 'action', position: { x: 300, y: 120 }, data: { type: 'obsScene', sceneName: 'Game (Doubles)' } },
		],
		edges: [{ id: 'e1', source: 't', target: 'a' }],
	},
	{
		id: 'demo-strike-display',
		name: 'Tell a display whose turn it is to strike',
		description: 'Posts the full stage-striking state (who must ban/pick, stage states) to another screen or tool whenever it changes — offline/direct sets only.',
		enabled: false,
		format: 'any',
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'strikeChange', action: 'any' } },
			{ id: 'c', kind: 'condition', position: { x: 300, y: 120 }, data: { type: 'gameMode', modes: ['local', 'direct'] } },
			{ id: 'a', kind: 'action', position: { x: 560, y: 120 }, data: { type: 'httpPost', url: 'http://192.168.1.50:8080/froggi', body: WebhookEvent.StrikeState } },
		],
		edges: [{ id: 'e1', source: 't', target: 'c' }, { id: 'e2', source: 'c', target: 'a' }],
	},
];
