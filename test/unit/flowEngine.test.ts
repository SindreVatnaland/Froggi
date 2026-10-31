import { actionsToRun, keyOrigins, keysBefore, knownKeyCheck, stepsAfter, stepsToRun, compareValues, conditionPasses, fillTemplate, flowForImport, flowForSharing, migrateFlow, prettifyTemplate, triggerMatches, validateFlow } from '../../frontend/src/lib/utils/flowEngine';
import type { Flow, FlowContext, FlowEventWithTokens } from '../../frontend/src/lib/models/types/flow';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import { DEMO_FLOWS } from '../../frontend/src/lib/content/demoFlows';
import { HIGHLIGHTS_FLOW } from '../../frontend/src/lib/content/highlightsFlow';
import { SCENE_SWITCHING_FLOW } from '../../frontend/src/lib/content/sceneFlow';
import { flowProblems } from '../../frontend/src/lib/utils/flowProblems';

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
	nodes: [
		{ id: 't', kind: 'trigger', position: { x: 0, y: 0 }, data: { type: 'damageTaken', player: 'current', minDamage: 20 } },
		{ id: 'c', kind: 'condition', position: { x: 0, y: 0 }, data: { type: 'playerStocks', player: 'current', compare: '<=', value: 2 } },
		{ id: 'a1', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'httpPost', url: 'http://homey.local/flash', body: 'trigger' } },
		{ id: 'a2', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'obsScene', sceneName: 'Close-up' } },
	],
	edges: [
		{ id: 'e1', source: 't', target: 'c' },
		{ id: 'e2', source: 'c', target: 'a1' },
		{ id: 'e3', source: 'c', target: 'a2' }, // both from the condition (a card after a web request waits for its result)
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

	it('legacy flow format migrates to a "Game format is" condition after the trigger; disabled flows never run', () => {
		const singles = migrateFlow(flow({ format: 'singles' }));
		expect(singles.format).toBeUndefined();
		expect(singles.nodes.find((n) => n.id === 'format-t')?.data).toEqual({ type: 'gameFormat', format: 'singles' });
		expect(singles.edges).toEqual(expect.arrayContaining([expect.objectContaining({ source: 't', target: 'format-t' }), expect.objectContaining({ source: 'format-t', target: 'c' })]));
		expect(actionsToRun(singles, hit(25), ctx({ isTeams: true }))).toEqual([]);
		expect(actionsToRun(singles, hit(25), ctx())).toHaveLength(2);
		const doubles = migrateFlow(flow({ format: 'doubles' }));
		expect(actionsToRun(doubles, hit(25), ctx())).toEqual([]);
		expect(actionsToRun(doubles, hit(25), ctx({ isTeams: true }))).toHaveLength(2);
		expect(migrateFlow(flow({ format: 'any' })).nodes).toHaveLength(4);
		expect(flowForImport(flow({ format: 'doubles' }), [], () => 'x').nodes).toHaveLength(5);
		expect(actionsToRun(flow({ enabled: false }), hit(25), ctx())).toEqual([]);
	});

	it('compare condition: numbers as numbers, else text; keys filled from trigger + state', () => {
		expect(compareValues('9', '<', '10')).toBe(true); // not text order
		expect(compareValues('Fox', '==', 'fox')).toBe(true);
		expect(compareValues('Battlefield', 'contains', 'field')).toBe(true);
		expect(compareValues('', '>=', '0')).toBe(false); // empty is text, '' < '0'
		const c = { type: 'compare' as const, left: '{{state.players.1.percent}}', op: '>=' as const, right: '100' };
		expect(conditionPasses(c, ctx(), { 'state.players.1.percent': 120.5 })).toBe(true);
		expect(conditionPasses(c, ctx(), { 'state.players.1.percent': 99 })).toBe(false);
		expect(conditionPasses(c, ctx(), {})).toBe(false);
		const f = flow();
		f.nodes.splice(1, 1, { id: 'c', kind: 'condition', position: { x: 0, y: 0 }, data: { type: 'compare', left: '{{playerName}}', op: '==', right: 'Mango' } });
		expect(actionsToRun(f, { ...hit(25), tokens: { playerName: 'mango' } }, ctx())).toHaveLength(2);
		expect(actionsToRun(f, { ...hit(25), tokens: { playerName: 'Zain' } }, ctx())).toEqual([]);
	});

	it('game format condition', () => {
		expect(conditionPasses({ type: 'gameFormat', format: 'doubles' }, ctx({ isTeams: true }))).toBe(true);
		expect(conditionPasses({ type: 'gameFormat', format: 'doubles' }, ctx())).toBe(false);
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
		const strike = (event: string) => ({ type: 'strikeAction', event } as FlowEventWithTokens);
		expect(triggerMatches({ type: 'strikeAction', event: 'ban' }, strike('ban'))).toBe(true);
		expect(triggerMatches({ type: 'strikeAction', event: 'ban' }, strike('pick'))).toBe(false);
		// "Any player choice" (any / unset) skips other changes; "Any change" (all) takes everything
		expect(triggerMatches({ type: 'strikeAction' }, strike('pick'))).toBe(true);
		expect(triggerMatches({ type: 'strikeAction', event: 'any' }, strike('change'))).toBe(false);
		expect(triggerMatches({ type: 'strikeAction', event: 'all' }, strike('change'))).toBe(true);
		// the old "whose turn (any change)" trigger becomes Stage Striking
		const old = { id: 'o', name: 'old', enabled: true, nodes: [{ id: 't', kind: 'trigger', position: { x: 0, y: 0 }, data: { type: 'strikeChange', action: 'ban' } }, { id: 'u', kind: 'trigger', position: { x: 0, y: 0 }, data: { type: 'strikeChange' } }], edges: [] } as unknown as Flow;
		expect(migrateFlow(old).nodes.map((n) => n.data)).toEqual([{ type: 'strikeAction', event: 'ban' }, { type: 'strikeAction', event: 'all' }]);
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

	it('OBS conditions', () => {
		expect(conditionPasses({ type: 'obsScene', sceneName: 'Game' }, ctx({ obsScene: 'Game' }))).toBe(true);
		expect(conditionPasses({ type: 'obsScene', sceneName: 'Game' }, ctx({ obsScene: 'Menu' }))).toBe(false);
		expect(conditionPasses({ type: 'obsReplayBuffer', active: true }, ctx({ replayBufferActive: false }))).toBe(false);
	});

	it('custom body templates use the trigger keys', () => {
		expect(fillTemplate('{"who": "{{playerName}}", "hit": {{ damage }}, "pct": {{percent}}, "x": {{missing}}}', { playerName: 'Mango', damage: 23.5, percent: 104 }))
			.toBe('{"who": "Mango", "hit": 23.5, "pct": 104, "x": null}');
	});

	it('sharing strips bearer tokens; imports get a fresh id when it clashes and start disabled', () => {
		const f = flow();
		(f.nodes[2].data as any).bearerToken = 'secret';
		const shared = flowForSharing(f);
		expect(JSON.stringify(shared)).not.toContain('secret');
		expect(flowForImport(shared, ['f1'], () => 'f2')).toMatchObject({ id: 'f2', enabled: false });
		expect(flowForImport(shared, [], () => 'f2')).toMatchObject({ id: 'f1', enabled: false });
	});

	it('custom bodies may be any text; unknown keys are problems; state keys are always known', () => {
		const f = flow();
		(f.nodes[2].data as any).body = 'custom';
		(f.nodes[2].data as any).template = '{"pct": {{percent}}, "who": "{{playerName}}", "score": {{state.score.1}}}';
		expect(validateFlow(f)).toEqual([]);
		(f.nodes[2].data as any).template = 'plain text {{playerName}}';
		expect(validateFlow(f)).toEqual([]);
		(f.nodes[2].data as any).template = '{{stocksLeft}} {{state.nope}}'; // stocksLeft belongs to "loses a stock"
		expect(validateFlow(f).join()).toContain('Unknown keys: {{stocksLeft}}, {{state.nope}}');
		(f.nodes[2].data as any).method = 'GET'; // GET has no body — the template is ignored
		expect(validateFlow(f)).toEqual([]);
		(f.nodes[2].data as any).method = 'PATCH'; // custom methods carry the body again
		expect(validateFlow(f).join()).toContain('Unknown keys');
		(f.nodes[2].data as any).method = 'PUT /x';
		expect(validateFlow(f).join()).toContain('Request method may only use letters');
	});

	it('headers: names validated, {{keys}} in values checked, secret values stripped when sharing', () => {
		const f = flow();
		(f.nodes[2].data as any).headers = [{ name: 'X-Api-Key', value: 'abc' }, { name: 'X-Who', value: '{{playerName}}' }];
		expect(validateFlow(f)).toEqual([]);
		expect((flowForSharing(f).nodes[2].data as any).headers).toEqual([{ name: 'X-Api-Key', value: '' }, { name: 'X-Who', value: '{{playerName}}' }]);
		(f.nodes[2].data as any).headers = [{ name: 'Bad Name', value: '{{nope}}' }];
		expect(validateFlow(f).join()).toMatch(/Header names.*Unknown key: \{\{nope\}\}/);
	});

	it('OAuth: validated; the client secret is left out when sharing', () => {
		const f = flow();
		(f.nodes[2].data as any).oauth = { tokenUrl: 'https://auth.example/token', clientId: 'id', clientSecret: 's3cret' };
		expect(validateFlow(f)).toEqual([]);
		expect(JSON.stringify(flowForSharing(f))).not.toContain('s3cret');
		(f.nodes[2].data as any).oauth = { tokenUrl: 'auth.example', clientId: '', clientSecret: '' };
		expect(validateFlow(f)).toEqual(expect.arrayContaining(['OAuth needs a http(s) token URL', 'OAuth needs a client ID']));
	});

	it('state keys and URL encoding when filling', () => {
		expect(fillTemplate('{{state.players.1.name}} {{state.score.1}}-{{state.score.2}}', { 'state.players.1.name': 'Mango', 'state.score.1': 2, 'state.score.2': 1 })).toBe('Mango 2-1');
		expect(fillTemplate('https://x/?who={{playerName}}', { playerName: 'A & B' }, '', encodeURIComponent)).toBe('https://x/?who=A%20%26%20B');
	});

	it('prettify keeps keys, quoted or bare; null when not JSON', () => {
		expect(prettifyTemplate('{"who":"{{playerName}}","pct":{{percent}},"s":[{{state.score.1}}]}')).toBe(
			'{\n  "who": "{{playerName}}",\n  "pct": {{percent}},\n  "s": [\n    {{state.score.1}}\n  ]\n}',
		);
		expect(prettifyTemplate('hello {{playerName}}')).toBeNull();
	});

	it('every demo flow is valid (and ships disabled)', () => {
		for (const demo of DEMO_FLOWS) {
			expect([demo.name, validateFlow(demo)]).toEqual([demo.name, []]);
			expect(demo.enabled).toBe(false);
		}
	});
});

describe('timer cards and the scene switching flow', () => {
	const sceneFlow = { ...SCENE_SWITCHING_FLOW, enabled: true };
	const scenesOf = (steps: { action: { type: string; scene?: string; seconds?: number | string } }[]) =>
		steps.map((s) => (s.action.type === 'setScene' ? s.action.scene : s.action.type === 'timer' ? `timer ${s.action.seconds}` : s.action.type));
	const end = (state: Record<string, unknown>) => ({ type: 'gameEnd' as const, tokens: state as never });

	it('the shipped flow is valid', () => {
		expect(validateFlow(sceneFlow)).toEqual([]);
	});

	it('a timer stops the path; what follows runs when it fires, with conditions checked then', () => {
		const steps = stepsToRun(sceneFlow, end({ 'state.set.isComplete': false, 'state.set.isActive': true }), ctx());
		expect(scenesOf(steps)).toEqual(['postGame', 'timer 15']);
		const timer = steps.find((s) => s.action.type === 'timer')!;
		expect(scenesOf(stepsAfter(sceneFlow, timer.nodeId, ctx(), { 'state.scene': 'postGame' }))).toEqual(['strikePhase']);
		expect(stepsAfter(sceneFlow, timer.nodeId, ctx(), { 'state.scene': 'inGame' })).toEqual([]); // a new game started
	});

	it('routes a game end like the built-in rules', () => {
		expect(scenesOf(stepsToRun(sceneFlow, end({ 'state.set.isComplete': false, 'state.set.isActive': false }), ctx()))).toEqual(['postGame', 'timer 150']);
		expect(scenesOf(stepsToRun(sceneFlow, end({ 'state.set.isComplete': true, 'state.mode': 'direct' }), ctx()))).toEqual(['postSet', 'timer 150']);
		expect(scenesOf(stepsToRun(sceneFlow, end({ 'state.set.isComplete': true, 'state.mode': 'ranked' }), ctx()))).toEqual(['rankChange']);
		expect(scenesOf(stepsToRun(sceneFlow, { type: 'gameStart', tokens: {} }, ctx()))).toEqual(['cancelTimer', 'inGame']);
		expect(scenesOf(stepsToRun(sceneFlow, { type: 'dolphinConnection', connected: false, tokens: {} }, ctx()))).toEqual(['waitingForDolphin']);
		expect(scenesOf(stepsToRun(sceneFlow, { type: 'rankChange', tokens: {} }, ctx()))).toEqual(['rankChange', 'timer 8']);
		expect(scenesOf(stepsToRun(sceneFlow, { type: 'strikeAction', event: 'strike', tokens: { 'state.scene': 'postGame' } }, ctx()))).toEqual(['strikePhase']);
		expect(stepsToRun(sceneFlow, { type: 'strikeAction', event: 'pick', tokens: { 'state.scene': 'inGame' } }, ctx())).toEqual([]); // never over a game
	});

	it('timer and cancel-timer cards need a key', () => {
		const f = flow();
		f.nodes.push({ id: 'w', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'timer', key: ' ', seconds: 5 } });
		expect(validateFlow(f).join()).toContain('Timer needs a key');
	});
});

describe('outputs: And cards Yes / No, actions Continue / Error', () => {
	// When damage → If percent >= 100 → Yes: POST / No: log; the POST's Continue → notify, Error → log
	const branching = (): Flow => ({
		id: 'b', name: 'Branching', enabled: true,
		nodes: [
			{ id: 't', kind: 'trigger', position: { x: 0, y: 0 }, data: { type: 'damageTaken', player: 'any' } },
			{ id: 'c', kind: 'condition', position: { x: 0, y: 0 }, data: { type: 'playerPercent', player: 'p1', compare: '>=', value: 100 } },
			{ id: 'post', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'httpPost', url: 'http://x', body: 'trigger' } },
			{ id: 'low', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'log', message: 'low' } },
			{ id: 'ok', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'notify', message: 'sent' } },
			{ id: 'fail', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'log', message: 'failed: {{error}}' } },
		],
		edges: [
			{ id: 'e1', source: 't', target: 'c' },
			{ id: 'e2', source: 'c', target: 'post' },
			{ id: 'e3', source: 'c', target: 'low', sourceHandle: 'false' },
			{ id: 'e4', source: 'post', target: 'ok' },
			{ id: 'e5', source: 'post', target: 'fail', sourceHandle: 'error' },
		],
	});
	const ids = (steps: { nodeId: string }[]) => steps.map((s) => s.nodeId);

	it('a condition runs its Yes path when it holds and its No path when it does not', () => {
		expect(ids(stepsToRun(branching(), hit(10), ctx({ players: [{ stocks: 2, percent: 120 }, { stocks: 4, percent: 0 }] })))).toEqual(['post']);
		expect(ids(stepsToRun(branching(), hit(10), ctx({ players: [{ stocks: 2, percent: 40 }, { stocks: 4, percent: 0 }] })))).toEqual(['low']);
	});

	it('a card that can fail waits: Continue after it worked, Error when it failed ({{error}} is a known key)', () => {
		expect(ids(stepsAfter(branching(), 'post', ctx(), {}, 'continue'))).toEqual(['ok']);
		expect(ids(stepsAfter(branching(), 'post', ctx(), {}, 'error'))).toEqual(['fail']);
		expect(validateFlow(branching())).toEqual([]);
	});

	it('Calculate cards wait, so a condition after them sees their new {{key}}', () => {
		const f: Flow = {
			id: 's', name: 'Score', enabled: true,
			nodes: [
				{ id: 't', kind: 'trigger', position: { x: 0, y: 0 }, data: { type: 'sequence', kind: 'punish', player: 'any' } },
				{ id: 'kill', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'calculate', key: 'total', formula: '{{didKill}} * 50' } },
				{ id: 'gate', kind: 'condition', position: { x: 0, y: 0 }, data: { type: 'compare', left: '{{total}}', op: '>=', right: '40' } },
				{ id: 'mark', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'log', message: 'score {{total}}' } },
			],
			edges: [
				{ id: 'e1', source: 't', target: 'kill' },
				{ id: 'e2', source: 'kill', target: 'gate' },
				{ id: 'e3', source: 'gate', target: 'mark' },
			],
		};
		const seq = { type: 'sequence', kind: 'punish', player: 1, isCurrentPlayer: false, tokens: { didKill: true } } as FlowEventWithTokens;
		expect(ids(stepsToRun(f, seq, ctx()))).toEqual(['kill']);
		expect(ids(stepsAfter(f, 'kill', ctx(), { total: 50 }))).toEqual(['mark']);
		expect(ids(stepsAfter(f, 'kill', ctx(), { total: 0 }))).toEqual([]);
		expect(stepsToRun(f, { ...seq, kind: 'combo' } as FlowEventWithTokens, ctx())).toEqual([]); // trigger wants punishes
		expect(validateFlow(f)).toEqual([]);
		expect(validateFlow({ ...f, nodes: f.nodes.map((n) => (n.id === 'kill' ? { ...n, data: { type: 'calculate', key: 'total', formula: '{{didKill}} * (50' } } : n)) as Flow['nodes'] })).toEqual([expect.stringMatching(/missing \)/)]);
		// chained: a later Calculate uses an earlier key; keys are plain names
		const chained = { ...f, nodes: [...f.nodes, { id: 'double', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'calculate', key: 'double', formula: '{{total}} * 2' } }] } as Flow;
		expect(validateFlow(chained)).toEqual([]);
		expect(knownKeyCheck(chained)('double')).toBe(true);
		expect(knownKeyCheck(chained)('nope')).toBe(false);
		expect(validateFlow({ ...f, nodes: f.nodes.map((n) => (n.id === 'kill' ? { ...n, data: { type: 'calculate', key: 'my total', formula: '1' } } : n)) as Flow['nodes'] })).toEqual(expect.arrayContaining([expect.stringMatching(/key name/)]));
	});

	it('old ✓/✕ edges on actions are migrated (once)', () => {
		const old: Flow = {
			...branching(),
			nodes: [...branching().nodes, { id: 'reel', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'setHighlightVideo', key: 'game', path: '' } }, { id: 'cancel', kind: 'action', position: { x: 0, y: 0 }, data: { type: 'cancelTimer', key: 'x' } }],
			edges: [
				{ id: 'e4', source: 'post', target: 'ok', sourceHandle: 'true' as never },
				{ id: 'e5', source: 'post', target: 'fail', sourceHandle: 'false' },
				{ id: 'e6', source: 'reel', target: 'ok', sourceHandle: 'true' as never },
				{ id: 'e6b', source: 'reel', target: 'low', sourceHandle: 'false' },
				{ id: 'e7', source: 'cancel', target: 'low', sourceHandle: 'false' },
				{ id: 'e8', source: 'c', target: 'low', sourceHandle: 'false' },
			],
		};
		const migrated = migrateFlow(old);
		const handles = migrated.edges.map((e) => `${e.source}>${e.target}:${e.sourceHandle ?? '-'}`);
		// actions never answer yes/no: ✓/Yes → Continue, ✕/No → Error on cards that can fail; And cards keep No
		expect(handles).toEqual(['post>ok:-', 'post>fail:error', 'reel>ok:-', 'reel>low:error', 'cancel>low:-', 'c>low:false']);
		expect(migrateFlow(migrated)).toBe(migrated);
	});
});

describe('flow problems', () => {
	it('lists scenes nothing switches to, invalid enabled flows and failures; the default scene flow covers every scene', () => {
		expect(flowProblems([{ ...SCENE_SWITCHING_FLOW, enabled: true }]).filter((p) => p.kind === 'scene')).toEqual([]);
		const problems = flowProblems([{ ...SCENE_SWITCHING_FLOW, enabled: false }, flow({ name: '' })], [{ at: 'now', flowId: 'f1', flowName: 'X', action: 'httpPost', message: '500' }]);
		expect(problems.filter((p) => p.kind === 'scene')).toHaveLength(7);
		expect(problems.map((p) => p.kind)).toEqual(expect.arrayContaining(['invalid', 'failure']));
	});
});

describe('keys a card can use (editor chips)', () => {
	it('only from the cards before it: When keys, Calculate / List values, {{file}} after OBS: save replay, {{error}} behind Error', () => {
		const f = HIGHLIGHTS_FLOW;
		const at = (id: string) => keysBefore(f, id);
		expect(at('calc-kill')).toEqual(expect.arrayContaining(['didKill', 'damage', 'kill']));
		expect(at('calc-kill')).not.toContain('total'); // set later in the chain
		expect(at('calc-total')).toEqual(expect.arrayContaining(['kill', 'damage', 'speed', 'swing', 'multi', 'long']));
		expect(at('replay-add-Game')).toEqual(expect.arrayContaining(['total', 'fromFrame', 'toFrame']));
		expect(at('replay-add-Game')).not.toContain('file'); // only after OBS: save replay
		expect(at('video-add-Game')).toEqual(expect.arrayContaining(['file', 'fileSeconds', 'savedAt', 'clipStart', 'clipEnd']));
		expect(at('replay-add-Game')).not.toContain('newSet'); // a Game starts key — not on this path
		expect(at('new-set')).toContain('newSet');
		expect(at('save-failed')).toContain('error');
		expect(at('save')).not.toContain('error');
		expect(at('slippiReplay-game-sort')).toEqual(expect.arrayContaining(['item.replay', 'item.startFrame', 'item.score', 'item.added'])); // its list's item fields
		expect(at('replayBuffer-daily-sort')).toEqual(expect.arrayContaining(['item.file', 'item.seconds'])); // fields come along with addList
		expect(at('game-wait')).toEqual(expect.arrayContaining(['replayBufferGame.count', 'iGame'])); // the loop's timer reads the list + index
	});

	it('tooltips name the card that makes a key and what it means (nearest before)', () => {
		const origins = keyOrigins(HIGHLIGHTS_FLOW, 'video-add-Game');
		expect(origins.total).toMatchObject({ kind: 'action', type: 'calculate', detail: expect.stringMatching(/^total = /) });
		expect(origins.file).toMatchObject({ type: 'obsSaveReplay', meaning: expect.stringMatching(/id of the file/) });
		expect(origins.didKill).toEqual({ kind: 'trigger', type: 'sequence' }); // When keys: meaning from KEY_INFO
		expect(keyOrigins(HIGHLIGHTS_FLOW, 'slippiReplay-game-sort')['item.score'].meaning).toMatch(/Each item's "score"/);
		expect(keyOrigins(HIGHLIGHTS_FLOW, 'calc-kill').total).toBeUndefined();
		const described = { ...HIGHLIGHTS_FLOW, nodes: HIGHLIGHTS_FLOW.nodes.map((n) => (n.id === 'calc-total' && n.kind === 'action' && n.data.type === 'calculate' ? { ...n, data: { ...n.data, description: 'How good the moment is' } } : n)) };
		expect(keyOrigins(described, 'replay-add-Game').total.meaning).toBe('How good the moment is');
	});
});
