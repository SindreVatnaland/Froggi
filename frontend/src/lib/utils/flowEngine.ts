import type { Flow, FlowAction, FlowCompare, FlowCondition, FlowContext, FlowEvent, FlowPlayer, FlowTrigger } from '../models/types/flow';

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
	}
	return problems;
}
