import { actionsToRun, conditionPasses, triggerMatches, validateFlow } from '../../frontend/src/lib/utils/flowEngine';
import type { Flow, FlowContext } from '../../frontend/src/lib/models/types/flow';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';

const ctx = (over: Partial<FlowContext> = {}): FlowContext => ({
	scene: LiveStatsScene.InGame,
	mode: 'local',
	isTeams: false,
	players: [{ stocks: 2, percent: 80 }, { stocks: 4, percent: 10 }],
	currentPlayerSlot: 0,
	strikePhase: undefined,
	...over,
});

// When I take ≥ 20 damage AND I'm on my last 2 stocks → POST + switch scene
const flow = (over: Partial<Flow> = {}): Flow => ({
	id: 'f1',
	name: 'Lights on big hits',
	enabled: true,
	format: 'any',
	nodes: [
		{ id: 't', kind: 'trigger', position: { x: 0, y: 0 }, data: { type: 'damageTaken', player: 'current', minDamage: 20 } },
		{ id: 'c', kind: 'condition', position: { x: 0, y: 0 }, data: { type: 'playerStocks', player: 'current', compare: '<=', value: 2 } },
		{ id: 'a1', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'httpPost', url: 'http://homey.local/flash', body: 'trigger' } },
		{ id: 'a2', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'obsScene', sceneName: 'Close-up' } },
	],
	edges: [
		{ id: 'e1', source: 't', target: 'c' },
		{ id: 'e2', source: 'c', target: 'a1' },
		{ id: 'e3', source: 'a1', target: 'a2' },
	],
	...over,
});

const hit = (damage: number, isCurrentPlayer = true) => ({ type: 'damageTaken' as const, player: 1 as const, isCurrentPlayer, damage });

describe('flow engine', () => {
	it('runs every action on a passing path', () => {
		expect(actionsToRun(flow(), hit(25), ctx()).map((a) => a.type)).toEqual(['httpPost', 'obsScene']);
	});

	it('stops at a failing condition', () => {
		expect(actionsToRun(flow(), hit(25), ctx({ players: [{ stocks: 4, percent: 0 }, { stocks: 4, percent: 0 }] }))).toEqual([]);
	});

	it('trigger options: player and minimum damage', () => {
		expect(actionsToRun(flow(), hit(10), ctx())).toEqual([]);
		expect(actionsToRun(flow(), hit(25, false), ctx())).toEqual([]);
	});

	it('format: singles flows skip doubles games and vice versa; disabled flows never run', () => {
		expect(actionsToRun(flow({ format: 'singles' }), hit(25), ctx({ isTeams: true }))).toEqual([]);
		expect(actionsToRun(flow({ format: 'doubles' }), hit(25), ctx())).toEqual([]);
		expect(actionsToRun(flow({ format: 'doubles' }), hit(25), ctx({ isTeams: true }))).toHaveLength(2);
		expect(actionsToRun(flow({ enabled: false }), hit(25), ctx())).toEqual([]);
	});

	it('controller combo matches when every chosen button is held', () => {
		const t = { type: 'controllerCombo' as const, buttons: { isLPressed: true, isRPressed: true } };
		expect(triggerMatches(t, { type: 'controllerCombo', buttons: { isLPressed: true, isRPressed: true, isAPressed: true } })).toBe(true);
		expect(triggerMatches(t, { type: 'controllerCombo', buttons: { isLPressed: true } })).toBe(false);
		expect(triggerMatches({ type: 'controllerCombo', buttons: {} }, { type: 'controllerCombo', buttons: { isAPressed: true } })).toBe(false);
	});

	it('scene and strike triggers with and without a filter', () => {
		expect(triggerMatches({ type: 'sceneChange' }, { type: 'sceneChange', scene: LiveStatsScene.Menu })).toBe(true);
		expect(triggerMatches({ type: 'sceneChange', scene: LiveStatsScene.PostGame }, { type: 'sceneChange', scene: LiveStatsScene.Menu })).toBe(false);
		expect(triggerMatches({ type: 'strikeChange', action: 'ban' }, { type: 'strikeChange', action: 'ban' })).toBe(true);
		expect(triggerMatches({ type: 'strikeChange', action: 'ban' }, { type: 'strikeChange', action: 'pick' })).toBe(false);
	});

	it('conditions: game mode, scene, percent', () => {
		expect(conditionPasses({ type: 'gameMode', modes: ['ranked', 'unranked'] }, ctx())).toBe(false);
		expect(conditionPasses({ type: 'scene', scene: LiveStatsScene.InGame }, ctx())).toBe(true);
		expect(conditionPasses({ type: 'playerPercent', player: 'p2', compare: '>=', value: 50 }, ctx())).toBe(false);
		expect(conditionPasses({ type: 'playerStocks', player: 'current', compare: '==', value: 2 }, ctx({ currentPlayerSlot: undefined }))).toBe(false);
	});

	it('validation', () => {
		expect(validateFlow(flow())).toEqual([]);
		expect(validateFlow(flow({ nodes: [], edges: [] }))).toEqual(expect.arrayContaining(['Flow needs a When (trigger) node']));
		const bad = flow();
		bad.edges.push({ id: 'x', source: 'a2', target: 't' });
		expect(validateFlow(bad)).toContain('Nothing can connect into a When (trigger) node');
	});
});
