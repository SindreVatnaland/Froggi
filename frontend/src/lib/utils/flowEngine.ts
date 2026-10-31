import { flattenState, isStateKey, SAMPLE_GAME_STATE, type FlowGameState } from './flowState';
import { formulaKeys, formulaProblem } from './formula';
import { resolveIndexKey } from './flowList';
import { RUN_KEY_INFO } from './flowKeys';
import { CALC_KEY, SAVE_KEYS, FLOW_ERROR_ACTIONS, FLOW_RUN_KEYS, FLOW_TOKEN_ACTIONS, type Flow, type FlowAction, type FlowCompare, type FlowCompareOp, type FlowCondition, type FlowContext, type FlowEdge, type FlowEvent, type FlowEventWithTokens, type FlowNode, type FlowPlayer, type FlowTokens, type FlowTrigger } from '../models/types/flow';

const playerMatches = (wanted: FlowPlayer | undefined, player: 1 | 2, isCurrentPlayer: boolean) =>
	!wanted || wanted === 'any' || (wanted === 'current' ? isCurrentPlayer : wanted === `p${player}`);

export function triggerMatches(trigger: FlowTrigger, event: FlowEvent): boolean {
	if (trigger.type !== event.type) return false;
	switch (trigger.type) {
		case 'sceneChange':
			return !trigger.scene || trigger.scene === (event as Extract<FlowEvent, { type: 'sceneChange' }>).scene;
		case 'controllerCombo': {
			const pressed = (event as Extract<FlowEvent, { type: 'controllerCombo' }>).buttons;
			const wanted = Object.entries(trigger.buttons).filter(([, on]) => on);
			return wanted.length > 0 && wanted.every(([button]) => pressed[button as keyof typeof pressed]);
		}
		case 'damageTaken': {
			const e = event as Extract<FlowEvent, { type: 'damageTaken' }>;
			return playerMatches(trigger.player, e.player, e.isCurrentPlayer) && e.damage >= (trigger.minDamage ?? 0);
		}
		case 'stockLost': {
			const e = event as Extract<FlowEvent, { type: 'stockLost' }>;
			return playerMatches(trigger.player, e.player, e.isCurrentPlayer);
		}
		case 'sequence': {
			const e = event as Extract<FlowEvent, { type: 'sequence' }>;
			return (trigger.kind ?? 'punish') === e.kind && playerMatches(trigger.player, e.player, e.isCurrentPlayer);
		}
		case 'strikeAction': {
			const happened = (event as Extract<FlowEvent, { type: 'strikeAction' }>).event;
			if (trigger.event === 'all') return true;
			if (!trigger.event || trigger.event === 'any') return happened !== 'change'; // any player choice
			return trigger.event === happened;
		}
		case 'dolphinConnection':
			return trigger.connected === undefined || trigger.connected === (event as Extract<FlowEvent, { type: 'dolphinConnection' }>).connected;
		default:
			return true; // gameStart / gameEnd / rankChange — no options
	}
}

const compare = (a: number | undefined, op: FlowCompare, b: number) =>
	a !== undefined && (op === '<=' ? a <= b : op === '>=' ? a >= b : a === b);

const slotOf = (player: 'p1' | 'p2' | 'current', ctx: FlowContext) =>
	player === 'current' ? ctx.currentPlayerSlot : player === 'p1' ? 0 : 1;

const isNumber = (v: string) => v.trim() !== '' && !isNaN(Number(v));
export function compareValues(left: string, op: FlowCompareOp, right: string): boolean {
	if (op === 'contains') return left.toLowerCase().includes(right.toLowerCase());
	const numeric = isNumber(left) && isNumber(right);
	const a = numeric ? Number(left) : left.toLowerCase();
	const b = numeric ? Number(right) : right.toLowerCase();
	switch (op) {
		case '==': return a === b;
		case '!=': return a !== b;
		case '<': return a < b;
		case '<=': return a <= b;
		case '>': return a > b;
		case '>=': return a >= b;
	}
}

/** `tokens` = the trigger's keys + {{state.…}} (filled into compare conditions). */
export function conditionPasses(condition: FlowCondition, ctx: FlowContext, tokens: FlowTokens = {}): boolean {
	switch (condition.type) {
		case 'gameMode':
			return !!ctx.mode && condition.modes.includes(ctx.mode);
		case 'gameFormat':
			return condition.format === (ctx.isTeams ? 'doubles' : 'singles');
		case 'compare':
			return compareValues(fillTemplate(condition.left ?? '', tokens, ''), condition.op, fillTemplate(condition.right ?? '', tokens, ''));
		case 'scene':
			return ctx.scene === condition.scene;
		case 'playerStocks':
		case 'playerPercent': {
			const slot = slotOf(condition.player, ctx);
			if (slot === undefined) return false;
			const p = ctx.players[slot];
			return compare(condition.type === 'playerStocks' ? p?.stocks : p?.percent, condition.compare, condition.value);
		}
		case 'strikePhase':
			return ctx.strikePhase === condition.phase;
		case 'obsScene':
			return !!ctx.obsScene && ctx.obsScene === condition.sceneName;
		case 'obsReplayBuffer':
			return !!ctx.replayBufferActive === condition.active;
	}
}

/** One action to run, with its node (a Timer card's node is where its delayed path continues). */
export interface FlowStep {
	nodeId: string;
	action: FlowAction;
}

/** What an action's result picks among its outputs (see FlowEdge.sourceHandle). */
export type FlowOutcome = 'continue' | 'error';

/** Must the walk wait for this action's result before going on? (Timer: its time; yes/no and
 *  failing actions: their result; Calculate cards: their new {{key}}.) */
export const waitsForResult = (action: FlowAction) =>
	action.type === 'timer' || FLOW_ERROR_ACTIONS.includes(action.type) || FLOW_TOKEN_ACTIONS.includes(action.type);

/**
 * Walk the graph from the given nodes' outputs: condition cards follow Yes or No, action cards are
 * collected, and the walk goes on past an action right away only when it can't change anything for the
 * cards after it (notify, log, set scene…). Other actions stop the walk — stepsAfter continues from them
 * with their result. Each action runs at most once per walk.
 */
type EdgeFilter = (e: FlowEdge) => boolean;
/** Plain outputs: the right-hand handle (no sourceHandle) — a condition's Yes, an action's Continue. */
const plain: EdgeFilter = (e) => !e.sourceHandle;

function walkFrom(flow: Flow, starts: { id: string; filter: EdgeFilter }[], ctx: FlowContext, tokens: FlowTokens): FlowStep[] {
	const byId = new Map(flow.nodes.map((n) => [n.id, n]));
	const steps = new Map<string, FlowStep>();
	const visited = new Set<string>();
	const walk = (id: string, filter: EdgeFilter) => {
		for (const edge of flow.edges) {
			if (edge.source !== id || !filter(edge)) continue;
			const node = byId.get(edge.target);
			if (!node || visited.has(node.id)) continue;
			visited.add(node.id);
			if (node.kind === 'condition') {
				const holds = conditionPasses(node.data, ctx, tokens);
				walk(node.id, (e) => (e.sourceHandle ?? 'true') === (holds ? 'true' : 'false'));
			} else if (node.kind === 'action') {
				steps.set(node.id, { nodeId: node.id, action: node.data });
				if (!waitsForResult(node.data)) walk(node.id, plain);
			}
		}
	};
	starts.forEach((s) => walk(s.id, s.filter));
	return [...steps.values()];
}

/** What this event runs: the flow must be enabled, then from every matching When card.
 *  (Legacy flow.format is migrated to a condition by migrateFlow.) */
export function stepsToRun(flow: Flow, event: FlowEventWithTokens, ctx: FlowContext): FlowStep[] {
	if (!flow.enabled) return [];
	const triggers = flow.nodes.filter((n) => n.kind === 'trigger' && triggerMatches(n.data, event)).map((n) => ({ id: n.id, filter: () => true }));
	return walkFrom(flow, triggers, ctx, event.tokens ?? {});
}

/** What runs after an action that waited: a Timer fired (outcome undefined → its Continue), or the
 *  action's result picked an output. Conditions on the way are checked now (with the current keys). */
export function stepsAfter(flow: Flow, nodeId: string, ctx: FlowContext, tokens: FlowTokens = {}, outcome: FlowOutcome = 'continue'): FlowStep[] {
	if (!flow.enabled) return [];
	const filter: EdgeFilter = outcome === 'continue' ? plain : (e) => e.sourceHandle === outcome;
	return walkFrom(flow, [{ id: nodeId, filter }], ctx, tokens);
}

/** The actions an event runs right away (up to and including cards that wait for a result). */
export function actionsToRun(flow: Flow, event: FlowEventWithTokens, ctx: FlowContext): FlowAction[] {
	return stepsToRun(flow, event, ctx).map((s) => s.action);
}

/** Light validation for flows coming from the editor or the AI assistant. Returns problems (empty = ok). */
export function validateFlow(flow: Flow): string[] {
	const problems: string[] = [];
	if (!flow.name?.trim()) problems.push('Flow needs a name');
	if (!flow.nodes.some((n) => n.kind === 'trigger')) problems.push('Flow needs a When (trigger) node');
	if (!flow.nodes.some((n) => n.kind === 'action')) problems.push('Flow needs at least one Then (action) node');
	const ids = new Set(flow.nodes.map((n) => n.id));
	for (const e of flow.edges) {
		if (!ids.has(e.source) || !ids.has(e.target)) problems.push(`Edge ${e.id} points at a missing node`);
		const target = flow.nodes.find((n) => n.id === e.target);
		if (target?.kind === 'trigger') problems.push('Nothing can connect into a When (trigger) node');
	}
	if (ids.size < flow.nodes.length) problems.push(`Two cards share an id: ${[...new Set(flow.nodes.map((n) => n.id).filter((id, i, all) => all.indexOf(id) !== i))].join(', ')}`);
	const isKnown = knownKeyCheck(flow);
	for (const n of flow.nodes) {
		if (n.kind === 'action' && n.data.type === 'httpPost' && !/^https?:\/\//.test(n.data.url ?? '')) problems.push('HTTP request needs a http(s) URL');
		// A time: a number over 0, or a formula (checked when it runs) — e.g. {{clips.first.seconds}}.
		if (n.kind === 'action' && n.data.type === 'timer' && (!n.data.key?.trim() || (typeof n.data.seconds === 'number' ? !(n.data.seconds > 0) : !String(n.data.seconds ?? '').trim()))) problems.push('Timer needs a key and a time over 0 seconds');
		if (n.kind === 'action' && n.data.type === 'cancelTimer' && !n.data.key?.trim()) problems.push('Cancel timer needs the key of the timer to cancel');
		if (n.kind === 'action' && n.data.type === 'calculate' && !CALC_KEY.test(n.data.key ?? '')) problems.push(`Calculate needs a key name (letters, digits, _): "${n.data.key ?? ''}"`);
		if (n.kind === 'action' && n.data.type === 'calculate' && !n.data.formula?.trim()) problems.push(`Calculate ${n.data.key || ''} needs a formula`);
		if (n.kind === 'action' && n.data.type === 'list') {
			const d = n.data;
			if (!CALC_KEY.test(d.key ?? '')) problems.push(`List needs a name (letters, digits, _): "${d.key ?? ''}"`);
			if (d.op === 'add' && !(d.fields ?? []).some((f) => f.name?.trim())) problems.push(`List ${d.key}: add needs at least one field`);
			for (const f of d.op === 'add' ? d.fields ?? [] : []) if (f.name?.trim() && !CALC_KEY.test(f.name.trim())) problems.push(`List ${d.key}: field name "${f.name}" (letters, digits, _)`);
			if (d.op === 'addList' && !CALC_KEY.test(d.from ?? '')) problems.push(`List ${d.key}: name the list to add from`);
			if ((d.op === 'limit' || d.op === 'limitPer') && !String(d.count ?? '').trim()) problems.push(`List ${d.key}: how many to keep`);
			if (d.op === 'limitPer' && !d.field?.trim()) problems.push(`List ${d.key}: name the field to group by`);
			if (d.op === 'map' && !CALC_KEY.test(d.field ?? '')) problems.push(`List ${d.key}: name the field to set`);
			if ((d.op === 'sort' || d.op === 'filter' || d.op === 'map') && !d.formula?.trim()) problems.push(`List ${d.key}: ${d.op} needs a formula`);
			const problem = (d.op === 'sort' || d.op === 'filter' || d.op === 'map') && d.formula?.trim() ? formulaProblem(d.formula, templateKeys(d.formula)) : null;
			if (problem) problems.push(problem);
		}
		if (n.kind === 'action' && n.data.type === 'clearValues') {
			const keys = clearKeys(n.data.keys);
			if (!keys.length) problems.push('Clear values needs the names to clear');
			const known = new Set(calcKeys(flow));
			for (const k of keys) if (!known.has(k)) problems.push(`Clear values: no Calculate or List card in this flow sets "${k}"`);
		}
		for (const f of n.kind === 'action' && n.data.type === 'calculate' ? [n.data.formula] : []) {
			const problem = f?.trim() ? formulaProblem(f, templateKeys(f)) : null;
			if (problem) problems.push(problem);
		}
		if (n.kind === 'action' && (n.data.type === 'notify' || n.data.type === 'log') && !n.data.message?.trim()) problems.push(`${n.data.type === 'log' ? 'Log' : 'Notification'} needs a message`);
		if (n.kind === 'action' && n.data.type === 'httpPost' && n.data.method && !/^[A-Za-z]+$/.test(n.data.method)) problems.push('Request method may only use letters (e.g. PUT, PATCH, DELETE)');
		if (n.kind === 'action' && n.data.type === 'httpPost' && n.data.oauth) {
			if (!/^https?:\/\//.test(n.data.oauth.tokenUrl ?? '')) problems.push('OAuth needs a http(s) token URL');
			if (!n.data.oauth.clientId?.trim()) problems.push('OAuth needs a client ID');
		}
		if (n.kind === 'action' && n.data.type === 'httpPost' && n.data.headers?.some((h) => !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(h.name ?? ''))) problems.push('Header names may only use letters, numbers and - _ .');
		// Formulas may also name keys JavaScript-style (total, item.score) — check those too.
		const formulas = n.kind !== 'action' ? [] : n.data.type === 'calculate' ? [n.data.formula] : n.data.type === 'list' ? [n.data.formula, typeof n.data.count === 'string' ? n.data.count : ''] : n.data.type === 'timer' && typeof n.data.seconds === 'string' ? [n.data.seconds] : n.data.type === 'setHighlightVideo' ? [String(n.data.start ?? ''), String(n.data.end ?? '')] : [];
		const unknown = [...nodeTexts(n).flatMap((t) => templateKeys(t)), ...formulas.flatMap((f) => (f?.trim() ? formulaKeys(f) : []))].filter((k) => !isKnown(k));
		if (unknown.length) problems.push(`Unknown key${unknown.length > 1 ? 's' : ''}: ${[...new Set(unknown)].map((k) => `{{${k}}}`).join(', ')}`);
	}
	return problems;
}

/** Keys each trigger provides to its actions (shown in the editor, documented for the AI). */
/** Keys of "A sequence ends" (flowService.sequenceTokens). Win chance in percent for the attacker's side. */
export const SEQUENCE_KEYS = [
	'kind', 'player', 'playerName', 'character', 'isCurrentPlayer', 'victim', 'victimName', 'victimCharacter',
	'hits', 'damage', 'startPercent', 'endPercent', 'seconds', 'hitsPerSecond', 'didKill', 'gameEnding', 'teamKills',
	'openingType', 'moves', 'lastMove', 'offstage', 'victimStocksLeft', 'gameStocksLeft', 'gameStocksTotal',
	'winChanceBefore', 'winChanceAfter', 'winChanceSwing', 'setChanceSwing', 'startTime', 'endTime', 'startFrame', 'endFrame',
];

export const TRIGGER_TOKENS: Record<FlowTrigger['type'], string[]> = {
	sceneChange: ['scene'],
	controllerCombo: ['buttons'],
	gameStart: [
		'stage', 'mode', 'isTeams', 'bestOf', 'gameNumber', 'newSet',
		...[1, 2, 3, 4].flatMap((n) => ['name', 'character', 'connectCode', 'port', 'team'].map((f) => `players.${n}.${f}`)),
		'rules.stocks', 'rules.timerMinutes', 'rules.friendlyFire',
	],
	gameEnd: ['stage', 'method', 'score'],
	damageTaken: ['player', 'playerName', 'isCurrentPlayer', 'damage', 'percent'],
	stockLost: ['player', 'playerName', 'isCurrentPlayer', 'stocksLeft'],
	sequence: SEQUENCE_KEYS,
	rankChange: [
		'playerName', 'connectCode', 'rank', 'rating', 'ratingChange', 'rankChanged',
		...['before', 'after'].flatMap((side) => ['rank', 'rating', 'wins', 'losses', 'leaderboardPlacement'].map((f) => `${side}.${f}`)),
	],
	setStart: ['p1Name', 'p2Name', 'bestOf', 'ruleset'],
	dolphinConnection: ['connected'],
	strikeAction: ['event', 'player', 'playerName', 'phase', 'stage', 'character', 'rps'],
	obsReplaySaved: ['path', 'fileName'],
};

/** Methods that never carry a body. */
export const hasNoBody = (method: string | undefined) => /^(GET|HEAD)$/i.test(method ?? 'POST');

/** {{key}}, {{a.b.1}}, and list positions {{list[-1].score}}. */
const KEY_RE = /\{\{\s*([\w.]+(?:\[(?:-?\d+|[A-Za-z_]\w*)\][\w.]*)?)\s*\}\}/g;

/** Fill {{key}} placeholders. Strings are inserted as-is (put quotes in the template for JSON strings).
 *  `missing` = what an unknown/empty key becomes (null for JSON bodies). */
export function fillTemplate(template: string, tokens: FlowTokens = {}, missing = 'null', encode?: (v: string) => string): string {
	return template.replace(KEY_RE, (_, key: string) => {
		const value = tokens[resolveIndexKey(key, tokens)];
		const text = value === undefined || value === null ? missing : String(value);
		return encode ? encode(text) : text;
	});
}

/** The {{keys}} a template uses. */
export const templateKeys = (template: string | undefined): string[] => [...(template ?? '').matchAll(KEY_RE)].map((m) => m[1]);

/** Texts in a node that may hold {{keys}}. */
const nodeTexts = (n: FlowNode): string[] => {
	const d = n.data as Record<string, unknown>;
	if (d.type === 'httpPost') return [d.url as string, d.body === 'custom' && !hasNoBody(d.method as string | undefined) ? (d.template as string) : '', ...((d.headers as { value: string }[] | undefined) ?? []).map((h) => h.value)];
	if (d.type === 'notify' || d.type === 'log') return [d.message as string];
	if (d.type === 'setHighlightVideo') return [d.path as string, String(d.start ?? ''), String(d.end ?? '')];
	if (d.type === 'timer') return [String(d.seconds ?? ''), d.key as string];
	if (d.type === 'cancelTimer') return [d.key as string];
	if (d.type === 'calculate') return [d.formula as string];
	if (d.type === 'list') return d.op === 'add' ? ((d.fields as { value: string }[] | undefined) ?? []).map((f) => f.value) : [d.formula as string, String(d.count ?? '')];
	if (d.type === 'obsReplayBufferSettings') return [d.fileName as string];
	if (d.type === 'compare') return [d.left as string, d.right as string];
	return [];
};

/** Keys the flow's Calculate cards set. */
/**
 * The keys a card can use, from the cards before it (its ancestors): the When cards' keys, the values of
 * Calculate / List cards ({{list}}, {{list.count}}), {{file}} etc. after OBS: save replay, {{error}} behind
 * an Error output. A Calculate card also sees its own key (its value from the last run).
 */
export function keysBefore(flow: Pick<Flow, 'nodes' | 'edges'>, nodeId: string): string[] {
	const byId = new Map(flow.nodes.map((n) => [n.id, n]));
	const keys = new Set<string>();
	const produced = (n: FlowNode | undefined) => {
		if (!n) return;
		if (n.kind === 'trigger') (TRIGGER_TOKENS[n.data.type] ?? []).forEach((k) => keys.add(k));
		else if (n.kind === 'action' && n.data.type === 'calculate' && n.data.key) keys.add(n.data.key.trim());
		else if (n.kind === 'action' && n.data.type === 'list' && n.data.key) (keys.add(n.data.key.trim()), keys.add(`${n.data.key.trim()}.count`));
		else if (n.kind === 'action' && n.data.type === 'obsSaveReplay') SAVE_KEYS.forEach((k) => keys.add(k));
	};
	const self = byId.get(nodeId);
	if (self?.kind === 'action' && self.data.type === 'calculate') produced(self);
	// A List card that sorts / filters / maps: the fields of its list's items ({{item.<field>}}).
	if (self?.kind === 'action' && self.data.type === 'list') listFields(flow, self.data.key).forEach((f) => keys.add(`item.${f}`));
	const seen = new Set([nodeId]);
	const queue = [nodeId];
	while (queue.length) {
		const id = queue.shift()!;
		for (const e of flow.edges) {
			if (e.target !== id) continue;
			if (e.sourceHandle === 'error') keys.add('error');
			if (seen.has(e.source)) continue;
			seen.add(e.source);
			produced(byId.get(e.source));
			queue.push(e.source);
		}
	}
	return [...keys];
}

/** The fields of a list's items: what its Add / Map cards set (and those of lists added into it), plus `added`. */
export function listFields(flow: Pick<Flow, 'nodes'>, list: string, seen = new Set<string>()): string[] {
	if (seen.has(list)) return [];
	seen.add(list);
	const fields = new Set(['added']);
	for (const n of flow.nodes) {
		if (n.kind !== 'action' || n.data.type !== 'list' || n.data.key?.trim() !== list.trim()) continue;
		if (n.data.op === 'add') (n.data.fields ?? []).forEach((f) => f.name?.trim() && fields.add(f.name.trim()));
		if (n.data.op === 'map' && n.data.field) fields.add(n.data.field.trim());
		if (n.data.op === 'addList' && n.data.from) listFields(flow, n.data.from, seen).forEach((f) => fields.add(f));
	}
	return [...fields];
}

/** Where a key a card can use comes from: the card (kind + type), a detail of it, and what the value means. */
export interface KeyOrigin {
	kind: FlowNode['kind'];
	type: string;
	/** e.g. the formula of a Calculate card. */
	detail?: string;
	/** What the value means — the card's own description when it has one. Unset for When keys (KEY_INFO has them). */
	meaning?: string;
}

/**
 * Where every key the card `nodeId` can use comes from — the nearest card before it that makes it
 * (When cards, Calculate, List, OBS: save replay; item fields: the List cards that set them). Chip tooltips.
 */
export function keyOrigins(flow: Pick<Flow, 'nodes' | 'edges'>, nodeId: string): Record<string, KeyOrigin> {
	const byId = new Map(flow.nodes.map((n) => [n.id, n]));
	const out: Record<string, KeyOrigin> = {};
	const put = (key: string, origin: KeyOrigin) => (out[key] ??= origin);
	const made = (n: FlowNode | undefined) => {
		if (!n) return;
		if (n.kind === 'trigger') {
			for (const k of TRIGGER_TOKENS[n.data.type] ?? []) put(k, { kind: 'trigger', type: n.data.type });
			return;
		}
		if (n.kind !== 'action') return;
		const d = n.data;
		if (d.type === 'calculate' && d.key) {
			put(d.key.trim(), { kind: 'action', type: 'calculate', detail: `${d.key.trim()} = ${d.formula || '…'}`, meaning: d.description?.trim() || 'The result of this formula. Kept by this flow — also for its next runs — until a Clear values card clears it.' });
		}
		if (d.type === 'list' && d.key) {
			const list = d.key.trim();
			put(list, { kind: 'action', type: 'list', detail: `"${list}"`, meaning: d.description?.trim() || 'A list of items kept by this flow until a Clear values card clears it.' });
			put(`${list}.count`, { kind: 'action', type: 'list', detail: `"${list}"`, meaning: `How many items "${list}" has.` });
		}
		if (d.type === 'obsSaveReplay') for (const k of SAVE_KEYS) put(k, { kind: 'action', type: 'obsSaveReplay', meaning: RUN_KEY_INFO[k] });
	};
	const self = byId.get(nodeId);
	if (self?.kind === 'action' && self.data.type === 'calculate') made(self);
	if (self?.kind === 'action' && self.data.type === 'list' && self.data.key) {
		const list = self.data.key.trim();
		for (const n of flow.nodes) {
			if (n.kind !== 'action' || n.data.type !== 'list' || n.data.key?.trim() !== list) continue;
			if (n.data.op === 'add')
				for (const f of n.data.fields ?? []) if (f.name?.trim()) put(`item.${f.name.trim()}`, { kind: 'action', type: 'list', detail: `"${list}", add`, meaning: `Each item's "${f.name.trim()}" — set to ${f.value || '…'} when the item was added.` });
			if (n.data.op === 'map' && n.data.field) put(`item.${n.data.field.trim()}`, { kind: 'action', type: 'list', detail: `"${list}", set a field`, meaning: `Each item's "${n.data.field.trim()}" — set to ${n.data.formula || '…'}.` });
		}
		put('item.added', { kind: 'action', type: 'list', detail: `"${list}"`, meaning: 'When the item was added (ms).' });
	}
	const seen = new Set([nodeId]);
	const queue = [nodeId];
	while (queue.length) {
		const id = queue.shift()!;
		for (const e of flow.edges) {
			if (e.target !== id) continue;
			if (e.sourceHandle === 'error') put('error', { kind: 'action', type: byId.get(e.source)?.data.type ?? '', detail: 'Error output', meaning: 'Why that card failed.' });
			if (seen.has(e.source)) continue;
			seen.add(e.source);
			made(byId.get(e.source));
			queue.push(e.source);
		}
	}
	return out;
}

/** Names a Clear values card lists. */
export const clearKeys = (text: string | undefined): string[] => (text ?? '').split(',').map((k) => k.trim()).filter(Boolean);

export const calcKeys = (flow: Pick<Flow, 'nodes'>): string[] =>
	[...new Set(flow.nodes.flatMap((n) => (n.kind === 'action' && n.data.type === 'calculate' && n.data.key ? [n.data.key] : n.kind === 'action' && n.data.type === 'list' && n.data.key ? [n.data.key, `${n.data.key}.count`] : [])))];

/** Whether a {{key}} can be filled in this flow: one of its triggers' keys, or a game-state path. */
export function knownKeyCheck(flow: Pick<Flow, 'nodes'>): (key: string) => boolean {
	const triggers = new Set(flow.nodes.flatMap((n) => (n.kind === 'trigger' ? TRIGGER_TOKENS[n.data.type] ?? [] : [])));
	const calculated = calcKeys(flow);
	const lists = flow.nodes.flatMap((n) => (n.kind === 'action' && n.data.type === 'list' && n.data.key ? [n.data.key.trim()] : []));
	// {{item.<field>}}: one list item inside List formulas / list functions; a list item by position:
	// {{gameList.1.score}}, {{gameList.last.score}}, {{gameList[-1].score}}.
	const listItem = (key: string) => lists.some((l) => key.startsWith(`${l}.`) || key.startsWith(`${l}[`));
	return (key) => triggers.has(key) || calculated.includes(key) || FLOW_RUN_KEYS.includes(key) || key.startsWith('item.') || listItem(key) || isStateKey(key);
}

/** Game-start keys taken from the game state (players in slot order, rules). */
export const gameStartTokens = (state: FlowGameState): FlowTokens => ({
	stage: state.stage?.name ?? null,
	mode: state.mode,
	isTeams: state.isTeams,
	bestOf: state.match.bestOf,
	gameNumber: state.match.gameNumber,
	...Object.fromEntries(
		Object.entries(state.players).flatMap(([n, p]) =>
			(['name', 'character', 'connectCode', 'port', 'team'] as const).map((f) => [`players.${n}.${f}`, p[f]]),
		),
	),
	'rules.stocks': state.rules.stocks,
	'rules.timerMinutes': state.rules.timerMinutes,
	'rules.friendlyFire': state.rules.friendlyFire,
});

/** Example values for every trigger key + the sample game state — Test fills templates with these
 *  where the live state has nothing. */
export const SAMPLE_TOKENS: FlowTokens = {
	scene: 'InGame', buttons: 'L+R', method: 'GAME', score: '1-0', total: 120, newSet: false, error: 'OBS did not accept the command — is OBS connected?',
	kind: 'punish', character: 'Fox', victim: 2, victimName: 'Zain', victimCharacter: 'Marth', hits: 5, startPercent: 32, endPercent: 118, seconds: 3.2, hitsPerSecond: 1.6,
	didKill: true, gameEnding: false, teamKills: 1, openingType: 'neutral-win', moves: 'Nair, Uthrow, Uair, Uair, Uair', lastMove: 'Uair', offstage: false, victimStocksLeft: 1, gameStocksLeft: 3, gameStocksTotal: 8,
	winChanceBefore: 52, winChanceAfter: 71, winChanceSwing: 19, setChanceSwing: 12, startTime: 1791753170000, endTime: 1791753173200, startFrame: 4210, endFrame: 4402,
	player: 1, playerName: 'Mango', isCurrentPlayer: true, damage: 14.2, percent: 87.5, stocksLeft: 2,
	p1Name: 'Mango', p2Name: 'Zain', bestOf: 3, ruleset: 'singles', connected: true, path: 'C:/Users/me/Videos/Replay 2026-10-11 21-30-02.mp4', fileName: 'Replay 2026-10-11 21-30-02.mp4',
	rank: 'Platinum 1', rating: 1662.7, ratingChange: 12.3, rankChanged: true, connectCode: 'MANGO#123',
	'before.rank': 'Gold 3', 'before.rating': 1650.4, 'before.wins': 41, 'before.losses': 30, 'before.leaderboardPlacement': null,
	'after.rank': 'Platinum 1', 'after.rating': 1662.7, 'after.wins': 42, 'after.losses': 30, 'after.leaderboardPlacement': null, action: 'strike', event: 'strike', phase: 'striking', rps: 'rock',
	...gameStartTokens(SAMPLE_GAME_STATE),
	...flattenState(SAMPLE_GAME_STATE, 'state'),
};

/** Pretty-printed JSON template ({{keys}} kept), or null when it is not JSON. */
export function prettifyTemplate(template: string): string | null {
	const keys: string[] = [];
	// Keys inside "strings" stay as they are; bare keys (numbers) become placeholder strings while parsing.
	const masked = template.replace(/("(?:[^"\\]|\\.)*")|\{\{\s*([\w.]+)\s*\}\}/g, (_m, str: string | undefined, key: string) =>
		str ? str : `"@@K${keys.push(key) - 1}@@"`,
	);
	try {
		return JSON.stringify(JSON.parse(masked), null, 2).replace(/"@@K(\d+)@@"/g, (_, i: string) => `{{${keys[Number(i)]}}}`);
	} catch {
		return null;
	}
}

/**
 * Old flows had a flow-level singles/doubles format; it is now a "Game format is" condition. Inserts
 * that condition right after every trigger (trigger → format → what the trigger pointed at).
 */
/** Renamed {{state.…}} keys (old → new), rewritten in saved flows. */
const RENAMED_KEYS: [RegExp, string][] = [
	[/\{\{\s*state\.set\.over\s*\}\}/g, '{{state.set.isComplete}}'],
	[/\{\{\s*state\.set\.active\s*\}\}/g, '{{state.set.isActive}}'],
	// {{state.strike}} became a structured object (utils/strikeFlowState.ts).
	[/\{\{\s*state\.strike\.p1Name\s*\}\}/g, '{{state.strike.p1.name}}'],
	[/\{\{\s*state\.strike\.p2Name\s*\}\}/g, '{{state.strike.p2.name}}'],
	[/\{\{\s*state\.strike\.gameNum\s*\}\}/g, '{{state.strike.gameNumber}}'],
	[/\{\{\s*state\.strike\.finalStage\.name\s*\}\}/g, '{{state.strike.stage}}'],
	[/\{\{\s*state\.strike\.currentStriker\s*\}\}/g, '{{state.strike.turn.player}}'],
];
const renameKeys = (flow: Flow): Flow => {
	const json = JSON.stringify(flow.nodes);
	const renamed = RENAMED_KEYS.reduce((t, [re, to]) => t.replace(re, to), json);
	return renamed === json ? flow : { ...flow, nodes: JSON.parse(renamed) };
};

/**
 * Old ✓/✕ (or Yes/No) outputs on actions → Continue / Error (idempotent): on an action that can fail
 * ✓ → Continue and ✕ → Error; on any other action both → Continue. Only And cards have Yes / No.
 */
/** The old "Stage striking: whose turn (any change)" trigger → "Stage Striking" (its actions mapped). */
const OLD_STRIKE_ACTIONS: Record<string, string> = { pickCharacter: 'character', rps: 'rps', chooseStrikeOrder: 'order', strike: 'strike', ban: 'ban', pick: 'pick', answerAgreement: 'agreement' };
function migrateStrikeTrigger(flow: Flow): Flow {
	if (!flow.nodes.some((n) => n.kind === 'trigger' && (n.data.type as string) === 'strikeChange')) return flow;
	return {
		...flow,
		nodes: flow.nodes.map((n) => {
			if (n.kind !== 'trigger' || (n.data.type as string) !== 'strikeChange') return n;
			const action = (n.data as { action?: string }).action;
			return { ...n, data: { type: 'strikeAction', event: (action && OLD_STRIKE_ACTIONS[action]) || 'all' } as FlowTrigger };
		}),
	};
}

function migrateOutputs(flow: Flow): Flow {
	const kind = new Map(flow.nodes.map((n) => [n.id, n.kind === 'action' ? n.data.type : null]));
	const edges = flow.edges.flatMap((e): FlowEdge[] => {
		const type = kind.get(e.source);
		if (!type) return [e];
		const { sourceHandle: h, ...rest } = e;
		if (FLOW_ERROR_ACTIONS.includes(type)) return h === 'false' ? [{ ...rest, sourceHandle: 'error' }] : h === 'true' ? [rest] : [e];
		return h === 'true' || h === 'false' ? [rest] : [e];
	});
	const seen = new Set<string>();
	const unique = edges.filter((e) => {
		const k = `${e.source}>${e.target}>${e.sourceHandle ?? ''}`;
		return seen.has(k) ? false : (seen.add(k), true);
	});
	return unique.length === flow.edges.length && unique.every((e, i) => e === flow.edges[i]) ? flow : { ...flow, edges: unique };
}

export function migrateFlow(input: Flow): Flow {
	const flow = migrateStrikeTrigger(migrateOutputs(renameKeys(input)));
	if (!flow.format || flow.format === 'any') return flow.format ? { ...flow, format: undefined } : flow;
	const format = flow.format;
	const nodes: FlowNode[] = [...flow.nodes];
	let edges: FlowEdge[] = [...flow.edges];
	for (const t of flow.nodes.filter((n) => n.kind === 'trigger')) {
		const id = `format-${t.id}`;
		nodes.push({ id, kind: 'condition', position: { x: t.position.x, y: t.position.y + 130 }, data: { type: 'gameFormat', format } });
		edges = edges.map((e) => (e.source === t.id ? { ...e, source: id } : e));
		edges.push({ id: `e-${t.id}-${id}`, source: t.id, target: id });
	}
	return { ...flow, format: undefined, nodes, edges };
}

/** Header names whose values are secrets — left out when sharing. */
export const SECRET_HEADER = /auth|token|key|secret|cookie|session|password/i;

/** A flow made safe to share: secrets (bearer tokens, OAuth client secrets, secret-looking header values) removed. */
export function flowForSharing(flow: Flow): Flow {
	return {
		...flow,
		updatedAt: undefined,
		nodes: flow.nodes.map((n) =>
			n.kind === 'action' && n.data.type === 'httpPost'
				? { ...n, data: { ...n.data, bearerToken: undefined, oauth: n.data.oauth && { ...n.data.oauth, clientSecret: '' }, headers: n.data.headers?.map((h) => (SECRET_HEADER.test(h.name) ? { ...h, value: '' } : h)) } }
				: n,
		),
	};
}

/** An imported/copied flow: fresh id when it would clash, and disabled until the user turns it on
 *  (it may POST your game data somewhere — check it first). */
export function flowForImport(flow: Flow, existingIds: string[], newId: () => string): Flow {
	return { ...migrateFlow(flow), id: existingIds.includes(flow.id) ? newId() : flow.id, enabled: false, updatedAt: undefined };
}
