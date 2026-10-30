import { LiveStatsScene } from '$lib/models/enum';
import { REPLAY_FORMATS, type FlowAction, type FlowCondition, type FlowNode, type FlowTrigger } from '$lib/models/types/flow';
import { WebhookEvent } from '$lib/models/types/webhook';

/** Labels + defaults for the flow editor (the AI assistant gets the same schema from the MCP tools). */
export const TRIGGERS: { type: FlowTrigger['type']; group: string; label: string; make: () => FlowTrigger }[] = [
	{ type: 'sceneChange', group: 'Froggi', label: 'Scene changes', make: () => ({ type: 'sceneChange', scene: LiveStatsScene.InGame }) },
	{ type: 'controllerCombo', group: 'Controller', label: 'Controller button combo', make: () => ({ type: 'controllerCombo', buttons: { isLPressed: true, isRPressed: true } }) },
	{ type: 'gameStart', group: 'Game', label: 'Game starts', make: () => ({ type: 'gameStart' }) },
	{ type: 'gameEnd', group: 'Game', label: 'Game ends', make: () => ({ type: 'gameEnd' }) },
	{ type: 'damageTaken', group: 'Game', label: 'A player takes damage', make: () => ({ type: 'damageTaken', player: 'any', minDamage: 0 }) },
	{ type: 'stockLost', group: 'Game', label: 'A player loses a stock', make: () => ({ type: 'stockLost', player: 'any' }) },
	{ type: 'sequence', group: 'Game', label: 'A sequence ends (punish / combo)', make: () => ({ type: 'sequence', kind: 'punish', player: 'any' }) },
	{ type: 'rankChange', group: 'Game', label: 'Rank changes', make: () => ({ type: 'rankChange' }) },
	{ type: 'setStart', group: 'Froggi', label: 'A set starts (Dashboard)', make: () => ({ type: 'setStart' }) },
	{ type: 'obsReplaySaved', group: 'OBS', label: 'OBS saved a replay', make: () => ({ type: 'obsReplaySaved' }) },
	{ type: 'strikeAction', group: 'Froggi', label: 'Stage Striking', make: () => ({ type: 'strikeAction', event: 'any' }) },
	{ type: 'dolphinConnection', group: 'Froggi', label: 'Dolphin connects / disconnects', make: () => ({ type: 'dolphinConnection', connected: true }) },
];

export const CONDITIONS: { type: FlowCondition['type']; group: string; label: string; make: () => FlowCondition }[] = [
	{ type: 'gameFormat', group: 'Game state', label: 'Game format is (singles / doubles)', make: () => ({ type: 'gameFormat', format: 'singles' }) },
	{ type: 'gameMode', group: 'Game state', label: 'Game mode is', make: () => ({ type: 'gameMode', modes: ['local'] }) },
	{ type: 'scene', group: 'Froggi', label: 'Scene is', make: () => ({ type: 'scene', scene: LiveStatsScene.InGame }) },
	{ type: 'playerStocks', group: 'Game state', label: 'Player stocks', make: () => ({ type: 'playerStocks', player: 'current', compare: '<=', value: 1 }) },
	{ type: 'playerPercent', group: 'Game state', label: 'Player percent', make: () => ({ type: 'playerPercent', player: 'current', compare: '>=', value: 100 }) },
	{ type: 'strikePhase', group: 'Froggi', label: 'Stage striking phase is', make: () => ({ type: 'strikePhase', phase: 'stageBan' }) },
	{ type: 'obsScene', group: 'OBS', label: 'OBS scene is', make: () => ({ type: 'obsScene', sceneName: '' }) },
	{ type: 'obsReplayBuffer', group: 'OBS', label: 'OBS replay buffer is', make: () => ({ type: 'obsReplayBuffer', active: true }) },
	{ type: 'compare', group: 'Compare', label: 'Compare values (if … is …)', make: () => ({ type: 'compare', left: '{{state.players.1.percent}}', op: '>=', right: '100' }) },
];

export const ACTIONS: { type: FlowAction['type']; group: string; label: string; make: () => FlowAction }[] = [
	{ type: 'httpPost', group: 'Send', label: 'Send web request', make: () => ({ type: 'httpPost', method: 'POST', url: 'https://', body: 'trigger' }) },

	{ type: 'obsScene', group: 'OBS', label: 'OBS: switch scene', make: () => ({ type: 'obsScene', sceneName: '' }) },
	{ type: 'obsToggleSource', group: 'OBS', label: 'OBS: show/hide source', make: () => ({ type: 'obsToggleSource', sourceName: '' }) },
	{ type: 'obsVolume', group: 'OBS', label: 'OBS: set volume', make: () => ({ type: 'obsVolume', inputName: '', volume: 1 }) },
	{ type: 'obsSaveReplay', group: 'OBS', label: 'OBS: save replay', make: () => ({ type: 'obsSaveReplay', highlight: '' }) },
	{ type: 'obsReplayBufferSettings', group: 'OBS', label: 'OBS: replay buffer settings', make: () => ({ type: 'obsReplayBufferSettings', seconds: 30, format: 'hybrid_mp4' }) },
	{ type: 'calculate', group: 'Math', label: 'Calculate', make: () => ({ type: 'calculate', key: 'total', formula: '{{damage}} * 2' }) },
	{ type: 'markHighlight', group: 'Highlights', label: 'Mark highlight moment', make: () => ({ type: 'markHighlight', before: 2, after: 2, maxSeconds: 10, score: '{{total}}' }) },
	{ type: 'setReplayList', group: 'Highlights', label: 'Set replay list (animated replay ← list)', make: () => ({ type: 'setReplayList', key: 'game', list: 'gameList', field: 'id' }) },
	{ type: 'list', group: 'Math', label: 'List', make: () => ({ type: 'list', key: 'gameList', op: 'add', fields: [{ name: 'id', value: '{{highlight}}' }, { name: 'score', value: '{{total}}' }] }) },
	{ type: 'clearValues', group: 'Math', label: 'Clear values', make: () => ({ type: 'clearValues', keys: '' }) },
	{ type: 'setHighlightVideo', group: 'Media', label: 'Set media (key ← file / link / highlight)', make: () => ({ type: 'setHighlightVideo', key: 'game', path: '{{clipPath}}', start: '', end: '' }) },
	{ type: 'setVideoVolume', group: 'Media', label: 'Set media volume', make: () => ({ type: 'setVideoVolume', key: 'game', volume: 50 }) },
	{ type: 'setScene', group: 'Froggi', label: 'Set Froggi scene', make: () => ({ type: 'setScene', scene: LiveStatsScene.InGame }) },
	{ type: 'timer', group: 'Timer', label: 'Timer — wait, then continue', make: () => ({ type: 'timer', key: 'timer', seconds: 10 }) },
	{ type: 'cancelTimer', group: 'Timer', label: 'Cancel timer', make: () => ({ type: 'cancelTimer', key: 'timer' }) },
	{ type: 'notify', group: 'Debug', label: 'Show a notification in Froggi', make: () => ({ type: 'notify', message: 'Score {{state.score.1}}-{{state.score.2}}' }) },
	{ type: 'log', group: 'Debug', label: 'Write to the log', make: () => ({ type: 'log', message: 'Score {{state.score.1}}-{{state.score.2}}' }) },
];

export const COMPARE_OPS: { value: string; label: string }[] = [
	{ value: '==', label: 'is' }, { value: '!=', label: 'is not' }, { value: '>', label: '>' }, { value: '>=', label: '≥' },
	{ value: '<', label: '<' }, { value: '<=', label: '≤' }, { value: 'contains', label: 'contains' },
];
export const SCENES = Object.values(LiveStatsScene);
/** Readable scene names (the same words as the scene bar). */
export const SCENE_LABEL: Record<LiveStatsScene, string> = {
	[LiveStatsScene.WaitingForDolphin]: 'Waiting',
	[LiveStatsScene.Menu]: 'Menu',
	[LiveStatsScene.InGame]: 'In Game',
	[LiveStatsScene.PostGame]: 'Post Game',
	[LiveStatsScene.PostSet]: 'Post Set',
	[LiveStatsScene.RankChange]: 'Rank Change',
	[LiveStatsScene.StrikePhase]: 'Stage Striking',
};
/** Events of the "Stage Striking" trigger (a player's choice on their phone). */
export const STRIKE_EVENTS: { value: string; label: string }[] = [
	{ value: 'any', label: 'Any player choice' },
	{ value: 'all', label: 'Any change' },
	{ value: 'rps', label: 'RPS selected' },
	{ value: 'order', label: 'Strike order chosen' },
	{ value: 'strike', label: 'Stage struck' },
	{ value: 'ban', label: 'Stage banned' },
	{ value: 'pick', label: 'Stage picked' },
	{ value: 'character', label: 'Character picked' },
	{ value: 'agreement', label: 'Stage agreement asked / answered' },
	{ value: 'change', label: 'Other change (game reported, set start…)' },
];
export const STRIKE_PHASES = ['charSelect', 'rps', 'rpsResult', 'striking', 'stageBan', 'stagePick', 'charLock', 'charPick', 'playing', 'setComplete'];
export const BUTTONS: { key: string; label: string }[] = [
	{ key: 'isAPressed', label: 'A' }, { key: 'isBPressed', label: 'B' }, { key: 'isXPressed', label: 'X' }, { key: 'isYPressed', label: 'Y' },
	{ key: 'isZPressed', label: 'Z' }, { key: 'isLPressed', label: 'L' }, { key: 'isRPressed', label: 'R' }, { key: 'isStartPressed', label: 'Start' },
	{ key: 'isDPadUpPressed', label: 'D↑' }, { key: 'isDPadDownPressed', label: 'D↓' }, { key: 'isDPadLeftPressed', label: 'D←' }, { key: 'isDPadRightPressed', label: 'D→' },
];
export const POST_BODIES: { value: string; label: string }[] = [
	{ value: 'trigger', label: 'The event that started the flow' },
	{ value: 'gameState', label: 'Game state snapshot' },
	{ value: 'custom', label: 'Custom text / JSON (use {{keys}})' },
	...Object.values(WebhookEvent).map((e) => ({ value: e, label: `Latest ${e} payload` })),
];

const who = (p?: string) => (p === 'current' ? 'You' : p === 'p1' ? 'Player 1' : p === 'p2' ? 'Player 2' : 'Any player');

/** One-line summary shown on a node. */
export function describe(node: FlowNode): string {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const d = node.data as Record<string, any>;
	switch (d.type) {
		case 'sceneChange': return d.scene ? `Scene → ${SCENE_LABEL[d.scene as LiveStatsScene] ?? d.scene}` : 'Any scene change';
		case 'controllerCombo': return `Hold ${BUTTONS.filter((b) => (d.buttons as Record<string, boolean>)?.[b.key]).map((b) => b.label).join(' + ') || '…'}`;
		case 'gameStart': return 'Game starts';
		case 'gameEnd': return 'Game ends';
		case 'damageTaken': return `${who(d.player as string)} takes ≥ ${d.minDamage ?? 0}% damage`;
		case 'stockLost': return `${who(d.player as string)} loses a stock`;
		case 'rankChange': return 'Rank changes';
		case 'setStart': return 'A set starts';
		case 'obsReplaySaved': return 'OBS saved a replay';
		case 'setHighlightVideo': return d.path ? `Media "${d.key || 'game'}" ← ${d.path}${d.start || d.end ? ` (${d.start || '0'}–${d.end || 'end'} s)` : ''}` : `Clear media "${d.key || 'game'}"`;
		case 'setReplayList': return `Replay "${d.key || 'replay'}" ← highlights in ${d.list || '…'}`;
		case 'setVideoVolume': return `Media "${d.key || 'game'}" volume ${d.volume ?? 0}`;
		case 'calculate': return `${d.key || '…'} = ${d.formula || '…'}`;
		case 'clearValues': return `Clear ${d.keys || '…'}`;
		case 'sequence': return `${who(d.player as string)} ${d.kind === 'combo' ? 'combo' : 'punish'} ends`;
		case 'markHighlight': return `Mark highlight (${d.before ?? 0} s before, ${d.after ?? 0} s after${d.maxSeconds ? `, max ${d.maxSeconds} s` : ''}) · score ${d.score || '0'}`;
		case 'buildHighlightReel': return `Video "${d.key || '…'}" ← highlights in ${d.list || '…'}`;
		case 'list': {
			const fields = ((d.fields as { name: string; value: string }[] | undefined) ?? []).filter((f) => f.name).map((f) => `${f.name}: ${f.value}`).join(', ');
			const what =
				d.op === 'add' ? `+ { ${fields || '…'} }`
				: d.op === 'addList' ? `+ all of ${d.from || '…'}`
				: d.op === 'sort' ? `sort by ${d.formula || '…'} (${d.order === 'low' ? 'low → high' : 'high → low'})`
				: d.op === 'filter' ? `keep where ${d.formula || '…'}`
				: d.op === 'map' ? `every item: ${d.field || '…'} = ${d.formula || '…'}`
				: d.op === 'limit' ? `keep the first ${d.count ?? 0}`
				: d.op === 'limitPer' ? `keep the first ${d.count ?? 0} per ${d.field || '…'}`
				: d.op === 'next' ? 'next (first → end)'
				: 'shuffle';
			return `${d.key || '…'}: ${what}`;
		}
		case 'obsReplayBufferSettings': return `Replay buffer ${d.seconds ? `${d.seconds} s` : ''}${d.seconds && d.format ? ' · ' : ''}${d.format ? (REPLAY_FORMATS[d.format as string] ?? d.format) : ''}`;
		case 'strikeAction': return `Stage Striking · ${STRIKE_EVENTS.find((e) => e.value === (d.event ?? 'any'))?.label ?? 'Any event'}`;
		case 'dolphinConnection': return d.connected === undefined ? 'Dolphin connects or disconnects' : d.connected ? 'Dolphin connects' : 'Dolphin disconnects';
		case 'setScene': return `Scene → ${SCENE_LABEL[d.scene as LiveStatsScene] ?? d.scene}`;
		case 'timer': return `Wait ${d.seconds ?? 0} s · key "${d.key || '…'}"`;
		case 'cancelTimer': return `Cancel timer "${d.key || '…'}"`;
		case 'gameMode': return `Mode is ${(d.modes as string[]).join(' / ')}`;
		case 'gameFormat': return d.format === 'doubles' ? 'Doubles games' : 'Singles games';
		case 'compare': return `If ${d.left || '…'} ${d.op} ${d.right || '…'}`;
		case 'notify': return `Notify: ${d.message || '…'}`;
		case 'log': return `Log: ${d.message || '…'}`;
		case 'scene': return `Scene is ${SCENE_LABEL[d.scene as LiveStatsScene] ?? d.scene}`;
		case 'playerStocks': return `${who(d.player as string)} stocks ${d.compare} ${d.value}`;
		case 'playerPercent': return `${who(d.player as string)} percent ${d.compare} ${d.value}`;
		case 'strikePhase': return `Striking phase is ${d.phase}`;
		case 'obsScene': return node.kind === 'condition' ? `OBS scene is "${d.sceneName || '…'}"` : `Switch to "${d.sceneName || '…'}"`;
		case 'obsReplayBuffer': return `Replay buffer is ${d.active ? 'on' : 'off'}`;
		// Host only — webhook URLs often carry a secret in the path (and the canvas may be on stream).
		case 'httpPost': return `${(d.method || 'POST').toUpperCase()} ${(d.url as string)?.match(/^https?:\/\/([^/?#]+)/)?.[1] || '…'}`;
		case 'obsToggleSource': return `Toggle "${d.sourceName || '…'}"`;
		case 'obsVolume': return `Volume "${d.inputName || '…'}" → ${Math.round((d.volume as number) * 100)}%`;
		case 'obsSaveReplay': return d.highlight ? `Save replay buffer · clip of ${d.highlight}` : 'Save replay buffer';
		case 'note': return (d.text as string) || '…';
	}
	return '';
}

/** Options grouped for <optgroup>s, in the order the groups first appear. */
export function grouped<T extends { group: string }>(items: T[]): { group: string; items: T[] }[] {
	const out: { group: string; items: T[] }[] = [];
	for (const item of items) {
		const g = out.find((x) => x.group === item.group);
		if (g) g.items.push(item);
		else out.push({ group: item.group, items: [item] });
	}
	return out;
}
