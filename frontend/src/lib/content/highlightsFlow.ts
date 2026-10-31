import type { Flow, FlowAction, FlowEdge, FlowNode } from '../models/types/flow';

/** Id of the shipped highlights flow (installed once, disabled — turn it on in Flows). */
export const HIGHLIGHTS_FLOW_ID = 'highlights';

/**
 * Highlights for videos AND replays, built only from generic cards — every rule and list is a card the user
 * (or the AI) can read and change:
 *  - a punish ends → Calculate cards score it → total ≥ 40 → its frames go into the slippiReplay lists
 *    (Highlight Replay elements) → 1.5 s later OBS saves its replay buffer → where the moment is in that file
 *    goes into the replayBuffer lists (Media elements)
 *  - game end → each kind: game = best 5, set = best 15 (time order), daily = today's top 20 % (20–100, at
 *    most 5 per game, best first); Media keys game / set / daily loop their list with an index
 *  - a game start stops the loops and clears the game lists; a new set clears the set lists
 */

const X = (col: number) => 40 + col * 300;
const ROW = 120;

/** The rules: one Calculate each. */
const RULES: { key: string; formula: string; note: string }[] = [
	{ key: 'kill', formula: '{{didKill}} * 50 + {{gameEnding}} * 25', note: 'Kill: kills weigh the most (50); the game-ending kill 25 more.' },
	{ key: 'damage', formula: 'min({{damage}}, 120) / 4', note: 'Damage done in the sequence, up to 30.' },
	{ key: 'speed', formula: 'clamp({{hitsPerSecond}} * 8, 0, 25)', note: 'Speed always counts: hits per second × 8, up to 25.' },
	{ key: 'swing', formula: 'max({{winChanceSwing}}, 0) * 0.8', note: 'Win-chance swing: how much the attacker\'s chance to win went up (percent points × 0.8). Self-destructs are no sequence, so they never score.' },
	{ key: 'multi', formula: '({{teamKills}} >= 2) * 40', note: 'Multi-kill (doubles): two KOs by the same team within 5 s, 40.' },
	{ key: 'long', formula: '-max({{seconds}} - 8, 0) * 3', note: 'Long sequences (e.g. a slow off-stage chase) lose 3 per second after 8 s.' },
	{ key: 'depth', formula: '1 + 0.2 * (1 - {{gameStocksLeft}} / max({{gameStocksTotal}}, 1)) + 0.1 * ({{state.match.gameNumber}} - 1) / max({{state.match.bestOf}} - 1, 1)', note: 'Depth: later counts a bit more — up to +20 % for the last stocks of a game, up to +10 % for the last game of a set (a last-stock clutch beats the same combo on the first stock).' },
	{ key: 'total', formula: '({{kill}} + {{damage}} + {{speed}} + {{swing}} + {{multi}} + {{long}}) * {{depth}}', note: 'Total: the rules above added up, times depth — the highlight\'s score.' },
];

type Step = { id: string; data: FlowAction | Extract<FlowNode, { kind: 'condition' }>['data']; kind?: 'condition'; note?: string };
/** A vertical chain of cards in column `col` from row `row`, a note beside the cards that have one. */
const column = (steps: Step[], col: number, row: number): FlowNode[] =>
	steps.flatMap((s, i) => [
		{ id: s.id, kind: s.kind ?? 'action', position: { x: X(col), y: (row + i) * ROW }, data: s.data } as FlowNode,
		...(s.note ? [{ id: `note-${s.id}`, kind: 'note', position: { x: X(col + 1), y: (row + i) * ROW }, data: { type: 'note', text: s.note } } as FlowNode] : []),
	]);
const chain = (ids: string[]): FlowEdge[] => ids.slice(1).map((id, i) => ({ id: `e-${ids[i]}-${id}`, source: ids[i], target: id }));
const list = (id: string, key: string, card: Extract<FlowAction, { type: 'list' }>, note?: string): Step => ({ id, data: { ...card, key }, note });
const add = (key: string, fields: Record<string, string>) => ({ type: 'list', key, op: 'add', fields: Object.entries(fields).map(([name, value]) => ({ name, value })) }) as Extract<FlowAction, { type: 'list' }>;
const op = (o: Partial<Extract<FlowAction, { type: 'list' }>>) => ({ type: 'list', key: '', ...o }) as Extract<FlowAction, { type: 'list' }>;

/** The two kinds of highlight list: frames of the game's .slp (Highlight Replay) and replay-buffer clips (Media). */
const KINDS = [
	{ prefix: 'slippiReplay', what: 'replay windows (Highlight Replay elements)' },
	{ prefix: 'replayBuffer', what: 'replay-buffer clips (Media elements)' },
];

// ── A game starts ─────────────────────────────────────────────────────────────────────────────────
const LOOP_KEYS = ['game', 'set', 'daily'];
const START: Step[] = [
	...LOOP_KEYS.map((k, i): Step => ({ id: `stop-${k}`, data: { type: 'cancelTimer', key: `loop-${k}` }, note: i === 0 ? 'A game starts: stop the Media loops and empty their keys (nothing to show in game).' : undefined })),
	...LOOP_KEYS.map((k): Step => ({ id: `empty-${k}`, data: { type: 'setHighlightVideo', key: k, path: '' } })),
	{ id: 'clear-game', data: { type: 'clearValues', keys: 'slippiReplayGame, replayBufferGame' }, note: 'This game\'s lists start over.' },
	{ id: 'new-set', kind: 'condition', data: { type: 'compare', left: '{{newSet}}', op: '==', right: 'true' } },
	{ id: 'clear-set', data: { type: 'clearValues', keys: 'slippiReplaySet, replayBufferSet' }, note: 'A new set (or a set started on the Dashboard): the set lists start over.' },
];

// ── A punish ends ─────────────────────────────────────────────────────────────────────────────────
const SEQ_ROW = START.length + 2;
const SEQUENCE: Step[] = [
	...RULES.map((r): Step => ({ id: `calc-${r.key}`, data: { type: 'calculate', key: r.key, formula: r.formula, description: r.note }, note: r.note })),
	{ id: 'gate', kind: 'condition', data: { type: 'compare', left: '{{total}}', op: '>=', right: '40' }, note: 'A candidate from 40: every kill passes; other punishes need damage, speed or a big swing.' },
	{ id: 'calc-to', data: { type: 'calculate', key: 'toFrame', formula: '{{endFrame}} + 60', description: 'The last frame to show: 1 s after the punish.' } },
	{ id: 'calc-from', data: { type: 'calculate', key: 'fromFrame', formula: 'max({{startFrame}} - 150, {{toFrame}} - 600)', description: 'The first frame to show: 2.5 s before the first hit, at most 10 s in all.' }, note: 'The window: 2.5 s before the first hit to 1 s after the end (at most the last 10 s of a long one), in game frames (60 per second).' },
	...['Game', 'Set', 'Today'].map((scope, i): Step => list(`replay-add-${scope}`, `slippiReplay${scope}`, add('', { replay: '{{state.replay.file}}', startFrame: '{{fromFrame}}', endFrame: '{{toFrame}}', score: '{{total}}', game: '{{state.replay.file}}' }), i === 0 ? 'Into the replay lists (game, set, today): the game\'s .slp, the frames and the score — Highlight Replay elements draw these.' : undefined)),
	{ id: 'wait-save', data: { type: 'timer', key: 'save-{{startFrame}}', seconds: 1.5 }, note: 'Wait until the 1 s after the punish is recorded (+ a little margin). The key holds {{startFrame}}, so every punish has its own timer.' },
	{ id: 'save', data: { type: 'obsSaveReplay' }, note: 'OBS saves its replay buffer: {{file}} (its id), {{fileSeconds}} (its length), {{savedAt}} (when it ends).' },
	{ id: 'calc-end', data: { type: 'calculate', key: 'clipEnd', formula: 'min({{fileSeconds}}, {{fileSeconds}} - ({{savedAt}} - {{endTime}}) / 1000 + 1)', description: 'Where the moment ends in the file (seconds).' } },
	{ id: 'calc-start', data: { type: 'calculate', key: 'clipStart', formula: 'max(0, {{fileSeconds}} - ({{savedAt}} - {{startTime}}) / 1000 - 2.5, {{clipEnd}} - 10)', description: 'Where the moment starts in the file (seconds).' }, note: 'Where the moment is in the file: the file ends at {{savedAt}}, so a moment at {{startTime}} is ({{savedAt}} − {{startTime}}) / 1000 s before its end.' },
	{ id: 'calc-seconds', data: { type: 'calculate', key: 'clipSeconds', formula: '{{clipEnd}} - {{clipStart}}', description: 'How long the clip plays (seconds).' } },
	...['Game', 'Set', 'Today'].map((scope, i): Step => list(`video-add-${scope}`, `replayBuffer${scope}`, add('', { file: '{{file}}', start: '{{clipStart}}', end: '{{clipEnd}}', seconds: '{{clipSeconds}}', score: '{{total}}', game: '{{state.replay.file}}' }), i === 0 ? 'Into the video lists (game, set, today): the file, where the moment is in it, and the score — Media elements play these.' : undefined)),
];

// ── A game ends: pick the best ────────────────────────────────────────────────────────────────────
const END_ROW = SEQ_ROW + SEQUENCE.length + 2;
const picks = (prefix: string, first: boolean): Step[] => [
	list(`${prefix}-game-sort`, `${prefix}Game`, op({ op: 'sort', formula: '{{item.score}}', order: 'high' }), first ? 'Game: the best 5, in the order they happened.' : undefined),
	list(`${prefix}-game-limit`, `${prefix}Game`, op({ op: 'limit', count: '5' })),
	list(`${prefix}-game-time`, `${prefix}Game`, op({ op: 'sort', formula: '{{item.added}}', order: 'low' })),
	list(`${prefix}-set-sort`, `${prefix}Set`, op({ op: 'sort', formula: '{{item.score}}', order: 'high' }), first ? 'Set: the best 15, in the order they happened.' : undefined),
	list(`${prefix}-set-limit`, `${prefix}Set`, op({ op: 'limit', count: '15' })),
	list(`${prefix}-set-time`, `${prefix}Set`, op({ op: 'sort', formula: '{{item.added}}', order: 'low' })),
	list(`${prefix}-today`, `${prefix}Today`, op({ op: 'filter', formula: '{{item.added}} >= {{state.time.today}}' }), first ? 'Today only: drop the ones from before midnight.' : undefined),
	{ id: `${prefix}-daily-clear`, data: { type: 'clearValues', keys: `${prefix}Daily` }, note: first ? 'Daily: today\'s top 20 % — at least 20 (fewer only when today has fewer), at most 100, at most 5 per game — best first.' : undefined },
	list(`${prefix}-daily-add`, `${prefix}Daily`, op({ op: 'addList', from: `${prefix}Today` })),
	list(`${prefix}-daily-sort`, `${prefix}Daily`, op({ op: 'sort', formula: '{{item.score}}', order: 'high' })),
	list(`${prefix}-daily-per-game`, `${prefix}Daily`, op({ op: 'limitPer', field: 'game', count: '5' })),
	list(`${prefix}-daily-limit`, `${prefix}Daily`, op({ op: 'limit', count: `max(20, min(100, round(count(${prefix}Today) * 0.2)))` })),
];
const GAME_END: Step[] = [
	{ id: 'wait-picks', data: { type: 'timer', key: 'highlight-picks', seconds: 5 }, note: 'Wait 5 s: the last punish\'s replay buffer is saved by then.' },
	...KINDS.flatMap((k, i) => picks(k.prefix, i === 0)),
];

// ── Media loops: one per key, counting an index through its list ─────────────────────────────────
const LOOPS = [
	{ key: 'game', list: 'replayBufferGame', i: 'iGame', shuffle: false },
	{ key: 'set', list: 'replayBufferSet', i: 'iSet', shuffle: false },
	{ key: 'daily', list: 'replayBufferDaily', i: 'iDaily', shuffle: true },
];
const loopSteps = (l: (typeof LOOPS)[number]): Step[] => [
	{ id: `${l.key}-i0`, data: { type: 'calculate', key: l.i, formula: '0', description: `Which item of ${l.list} Media "${l.key}" shows (0 = the first).` }, note: `Media "${l.key}": start at item 0 (pick any start).` },
	{ id: `${l.key}-has`, kind: 'condition', data: { type: 'compare', left: `{{${l.list}.count}}`, op: '>', right: '0' } },
	{ id: `${l.key}-show`, data: { type: 'setHighlightVideo', key: l.key, path: `{{${l.list}[${l.i}].file}}`, start: `{{${l.list}[${l.i}].start}}`, end: `{{${l.list}[${l.i}].end}}` }, note: 'Show item i — the file and where the moment is in it.' },
	{ id: `${l.key}-wait`, data: { type: 'timer', key: `loop-${l.key}`, seconds: `max({{${l.list}[${l.i}].seconds}}, 1)` }, note: 'Wait as long as it plays.' },
	{ id: `${l.key}-next`, data: { type: 'calculate', key: l.i, formula: `{{${l.i}}} + 1` } },
	{ id: `${l.key}-end`, kind: 'condition', data: { type: 'compare', left: `{{${l.i}}}`, op: '>=', right: `{{${l.list}.count}}` }, note: l.shuffle ? 'At the end: shuffle, then from the start again.' : 'At the end: from the start again (No → the next one).' },
	...(l.shuffle ? [list(`${l.key}-shuffle`, l.list, op({ op: 'shuffle' }))] : []),
	{ id: `${l.key}-restart`, data: { type: 'calculate', key: l.i, formula: '0' } },
];
const LOOP_ROW = END_ROW;

const startIds = START.map((s) => s.id);
const seqIds = SEQUENCE.map((s) => s.id);
const endIds = GAME_END.map((s) => s.id);
const log = (id: string, col: number, row: number, message: string): FlowNode => ({ id, kind: 'action', position: { x: X(col), y: row * ROW }, data: { type: 'log', message } });
const saveRow = SEQ_ROW + seqIds.indexOf('save');

export const HIGHLIGHTS_FLOW: Flow = {
	id: HIGHLIGHTS_FLOW_ID,
	name: 'Highlights',
	enabled: false,
	nodes: [
		{
			id: 'about', kind: 'note', position: { x: 40, y: -300 },
			data: { type: 'note', text: 'Highlights for videos and replays — every rule is a card you can change (or ask the AI assistant). Media elements with key "game", "set" or "daily" play the replay-buffer clips; Highlight Replay elements with list slippiReplayGame, slippiReplaySet or slippiReplayDaily redraw them from the replays (no OBS needed). Froggi never deletes the replay files.' },
		},
		{ id: 't-start', kind: 'trigger', position: { x: X(0), y: 0 }, data: { type: 'gameStart' } },
		...column([{ id: 'settings', data: { type: 'obsReplayBufferSettings', seconds: 30, format: 'hybrid_mp4', fileName: 'Froggi game {{state.match.gameNumber}}' }, note: 'OBS replay buffer: 30 s, Hybrid MP4 — started if it is off.' }], 3, 0),
		log('settings-failed', 5, 0, 'Highlights: could not set the replay buffer — {{error}}'),
		...column(START, 1, 0),
		{ id: 't-set', kind: 'trigger', position: { x: X(0), y: (START.length - 1) * ROW }, data: { type: 'setStart' } },

		{ id: 't-seq', kind: 'trigger', position: { x: X(0), y: SEQ_ROW * ROW }, data: { type: 'sequence', kind: 'punish', player: 'any' } },
		...column(SEQUENCE, 1, SEQ_ROW),
		log('save-failed', 3, saveRow + 1, 'Highlights: replay buffer not saved (the replay lists still got it) — {{error}}'),

		{ id: 't-end', kind: 'trigger', position: { x: X(0), y: END_ROW * ROW }, data: { type: 'gameEnd' } },
		...column(GAME_END, 1, END_ROW),
		...LOOPS.flatMap((l, i) => column(loopSteps(l), 3 + i * 2, LOOP_ROW)),
	],
	edges: [
		{ id: 'e-start', source: 't-start', target: 'settings' },
		{ id: 'e-start-err', source: 'settings', target: 'settings-failed', sourceHandle: 'error' },
		{ id: 'e-start-stop', source: 't-start', target: startIds[0] },
		...chain(startIds),
		{ id: 'e-set-clear', source: 't-set', target: 'clear-set' },
		{ id: 'e-seq', source: 't-seq', target: seqIds[0] },
		...chain(seqIds),
		{ id: 'e-save-err', source: 'save', target: 'save-failed', sourceHandle: 'error' },
		{ id: 'e-end', source: 't-end', target: endIds[0] },
		...chain(endIds),
		...LOOPS.flatMap((l): FlowEdge[] => {
			const ids = loopSteps(l).map((s) => s.id);
			return [
				{ id: `e-loop-${l.key}`, source: endIds[endIds.length - 1], target: `${l.key}-i0` },
				...chain(ids.slice(0, ids.indexOf(`${l.key}-end`) + 1)),
				// Not at the end yet (No) → show the next one; at the end (Yes) → [shuffle →] i = 0 → again.
				{ id: `e-${l.key}-more`, source: `${l.key}-end`, target: `${l.key}-has`, sourceHandle: 'false' },
				...chain(ids.slice(ids.indexOf(`${l.key}-end`))),
				{ id: `e-${l.key}-again`, source: `${l.key}-restart`, target: `${l.key}-has` },
				// A clip that can't play: still wait its turn, then go on.
				{ id: `e-${l.key}-show-err`, source: `${l.key}-show`, target: `${l.key}-wait`, sourceHandle: 'error' },
			];
		}),
	],
};
