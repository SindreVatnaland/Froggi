import type { Flow, FlowAction, FlowCompare, FlowCondition, FlowContext, FlowEvent, FlowPlayer, FlowTokens, FlowTrigger } from '../models/types/flow';

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
		case 'strikeChange':
			return !trigger.action || trigger.action === 'any' || trigger.action === (event as Extract<FlowEvent, { type: 'strikeChange' }>).action;
		default:
			return true; // gameStart / gameEnd / rankChange — no options
	}
}

const compare = (a: number | undefined, op: FlowCompare, b: number) =>
	a !== undefined && (op === '<=' ? a <= b : op === '>=' ? a >= b : a === b);

const slotOf = (player: 'p1' | 'p2' | 'current', ctx: FlowContext) =>
	player === 'current' ? ctx.currentPlayerSlot : player === 'p1' ? 0 : 1;

export function conditionPasses(condition: FlowCondition, ctx: FlowContext): boolean {
	switch (condition.type) {
		case 'gameMode':
			return !!ctx.mode && condition.modes.includes(ctx.mode);
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

/**
 * Actions to run for this event: the flow must be enabled and match the game format; from every
 * trigger node that matches, follow edges — condition nodes only pass the path on when they hold.
 * Each action runs at most once per event.
 */
export function actionsToRun(flow: Flow, event: FlowEvent, ctx: FlowContext): FlowAction[] {
	if (!flow.enabled) return [];
	if (flow.format === 'singles' && ctx.isTeams) return [];
	if (flow.format === 'doubles' && !ctx.isTeams) return [];

	const byId = new Map(flow.nodes.map((n) => [n.id, n]));
	const next = (id: string) => flow.edges.filter((e) => e.source === id).map((e) => byId.get(e.target)).filter(Boolean);
	const actions = new Map<string, FlowAction>();
	const visited = new Set<string>();

	const walk = (id: string) => {
		if (visited.has(id)) return;
		visited.add(id);
		for (const node of next(id)) {
			if (!node) continue;
			if (node.kind === 'condition') {
				if (conditionPasses(node.data, ctx)) walk(node.id);
			} else if (node.kind === 'action') {
				actions.set(node.id, node.data);
				walk(node.id); // actions may chain to more actions
			}
		}
	};
	for (const node of flow.nodes) {
		if (node.kind === 'trigger' && triggerMatches(node.data, event)) walk(node.id);
	}
	return [...actions.values()];
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
	for (const n of flow.nodes) {
		if (n.kind === 'action' && n.data.type === 'httpPost' && !/^https?:\/\//.test(n.data.url ?? '')) problems.push('HTTP POST needs a http(s) URL');
		if (n.kind === 'action' && n.data.type === 'httpPost' && n.data.body === 'custom') {
			// Every key filled with a number must give valid JSON (string keys belong inside quotes).
			const sample = fillTemplate(n.data.template ?? '', new Proxy({}, { get: () => 0 }) as FlowTokens);
			try {
				JSON.parse(sample);
			} catch {
				problems.push('Custom body is not valid JSON (put text keys in quotes: "{{playerName}}")');
			}
		}
	}
	return problems;
}

/** Keys each trigger provides to its actions (shown in the editor, documented for the AI). */
export const TRIGGER_TOKENS: Record<FlowTrigger['type'], string[]> = {
	sceneChange: ['scene'],
	controllerCombo: ['buttons'],
	gameStart: ['stage', 'mode'],
	gameEnd: ['stage', 'method', 'score'],
	damageTaken: ['player', 'playerName', 'isCurrentPlayer', 'damage', 'percent'],
	stockLost: ['player', 'playerName', 'isCurrentPlayer', 'stocksLeft'],
	rankChange: ['playerName', 'rank', 'rating', 'ratingChange'],
	strikeChange: ['action', 'playerName', 'phase'],
};

/** Fill {{key}} placeholders. Strings are inserted as-is (put quotes in the template for JSON strings). */
export function fillTemplate(template: string, tokens: FlowTokens = {}): string {
	return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
		const value = tokens[key];
		return value === undefined || value === null ? 'null' : String(value);
	});
}

/** A flow made safe to share: secrets (bearer tokens) removed. */
export function flowForSharing(flow: Flow): Flow {
	return {
		...flow,
		updatedAt: undefined,
		nodes: flow.nodes.map((n) =>
			n.kind === 'action' && n.data.type === 'httpPost' ? { ...n, data: { ...n.data, bearerToken: undefined } } : n,
		),
	};
}

/** An imported/copied flow: fresh id when it would clash, and disabled until the user turns it on
 *  (it may POST your game data somewhere — check it first). */
export function flowForImport(flow: Flow, existingIds: string[], newId: () => string): Flow {
	return { ...flow, id: existingIds.includes(flow.id) ? newId() : flow.id, enabled: false, updatedAt: undefined };
}
