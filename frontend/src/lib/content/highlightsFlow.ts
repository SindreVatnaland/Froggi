import type { Flow, FlowAction, FlowEdge, FlowNode } from '../models/types/flow';

/** Id of the shipped highlights flow (installed once, disabled — turn it on in Flows). */
export const HIGHLIGHTS_FLOW_ID = 'highlights';

/**
 * Highlights, built only from visible cards — every rule, list and step is a card the user (or the AI) can
 * read and change:
 *  - a punish ends → one Calculate per rule → total ≥ 40? → Mark highlight → add it to gameList → save the
 *    OBS replay buffer (its footage is kept with the highlight)
 *  - game end → setList / dayList get the game's candidates; gameList = best 5 (time order), setBest = best 15
 *    of the set (time order), dailyBest = today's top 5 % (10–30, at most 3 per game, best first)
 *  - each list → "Set replay list" (Highlight Replay elements, from the replays) and a loop for Media
 *    elements: Set media (the first item) → Timer (its length) → List "next" → again
 *  - a game starts → the loops stop and the media keys clear; gameList clears; a new set clears the set lists
 *  - values stay until a Clear values card clears them (dayList: only today's are kept, by a Filter card)
 */

const X = (col: number) => 40 + col * 300;
const ROW = 120;

/** The rules: one Calculate each, a note beside it. */
const RULES: { key: string; formula: string; note: string }[] = [
	{ key: 'kill', formula: '{{didKill}} * 50 + {{gameEnding}} * 25', note: 'Kill: kills weigh the most (50); the game-ending kill 25 more.' },
	{ key: 'damage', formula: 'min({{damage}}, 120) / 4', note: 'Damage done in the sequence, up to 30.' },
	{ key: 'speed', formula: 'clamp({{hitsPerSecond}} * 8, 0, 25)', note: 'Speed always counts: hits per second × 8, up to 25.' },
	{ key: 'swing', formula: 'max({{winChanceSwing}}, 0) * 0.8', note: 'Win-chance swing: how much the attacker\'s chance to win went up (percent points × 0.8). Self-destructs are no sequence, so they never score.' },
	{ key: 'multi', formula: '({{teamKills}} >= 2) * 40', note: 'Multi-kill (doubles): two KOs by the same team within 5 s, 40.' },
	{ key: 'long', formula: '-max({{seconds}} - 8, 0) * 3', note: 'Long sequences (e.g. a slow off-stage chase) lose 3 per second after 8 s.' },
	{ key: 'total', formula: '{{kill}} + {{damage}} + {{speed}} + {{swing}} + {{multi}} + {{long}}', note: 'Total: the rules above added up — the highlight\'s score.' },
];

/** A vertical chain of cards in column `col` starting at row `y`, each with an optional note beside it. */
type Step = { id: string; data: FlowAction | Extract<FlowNode, { kind: 'condition' }>['data']; kind?: 'condition'; note?: string };
const column = (steps: Step[], col: number, y: number): FlowNode[] =>
	steps.flatMap((s, i) => [
		{ id: s.id, kind: s.kind ?? 'action', position: { x: X(col), y: y + i * ROW }, data: s.data } as FlowNode,
		...(s.note ? [{ id: `note-${s.id}`, kind: 'note', position: { x: X(col + 1), y: y + i * ROW }, data: { type: 'note', text: s.note } } as FlowNode] : []),
	]);
const chain = (ids: string[]): FlowEdge[] => ids.slice(1).map((id, i) => ({ id: `e-${ids[i]}-${id}`, source: ids[i], target: id }));

const SEQ_Y = 11 * ROW;
const SEQUENCE: Step[] = [
	...RULES.map((r) => ({ id: `calc-${r.key}`, data: { type: 'calculate', key: r.key, formula: r.formula, description: r.note } as FlowAction, note: r.note })),
	{ id: 'gate', kind: 'condition', data: { type: 'compare', left: '{{total}}', op: '>=', right: '40' }, note: 'A candidate from 40: every kill passes; other punishes need damage, speed or a big swing. The game end keeps only the best.' },
	{ id: 'mark', data: { type: 'markHighlight', before: 2, after: 2, maxSeconds: 10, score: '{{total}}' }, note: 'Mark: 2 s before the first hit to 2 s after the end (at most the last 10 s), score = total. Gives {{highlight}} (its id), {{highlightSeconds}} (its length) and {{highlightGame}}; saved with the game (frames in its replay).' },
	{ id: 'add-game', data: { type: 'list', key: 'gameList', description: "This game's highlight candidates (id, score, seconds, game, kill).", op: 'add', fields: [{ name: 'id', value: '{{highlight}}' }, { name: 'score', value: '{{total}}' }, { name: 'seconds', value: '{{highlightSeconds}}' }, { name: 'game', value: '{{highlightGame}}' }, { name: 'kill', value: '{{didKill}}' }] }, note: 'Every candidate goes into this game\'s list: id (the highlight), score, length, game, kill.' },
	{ id: 'wait-save', data: { type: 'timer', key: 'highlight-save', seconds: 2.5 }, note: 'Wait until the 2 s after the sequence have been recorded (sequences close together share one save).' },
	{ id: 'save', data: { type: 'obsSaveReplay' }, note: 'OBS saves its replay buffer — Froggi keeps where each highlight is in the file (Set media with a highlight plays that clip). No OBS? The Highlight Replay element redraws them from the replays instead.' },
];

const END_Y = SEQ_Y + SEQUENCE.length * ROW + 2 * ROW;
const GAME_END: Step[] = [
	{ id: 'wait-reel', data: { type: 'timer', key: 'highlight-reel', seconds: 4 }, note: 'Wait 4 s so the last save is written.' },
	{ id: 'add-set', data: { type: 'list', key: 'setList', description: "The set's highlight candidates.", op: 'addList', from: 'gameList' }, note: 'Every candidate of the game also goes into the set\'s list…' },
	{ id: 'add-day', data: { type: 'list', key: 'dayList', description: "Today's highlight candidates.", op: 'addList', from: 'gameList' }, note: '…and into today\'s list.' },
	{ id: 'day-today', data: { type: 'list', key: 'dayList', op: 'filter', formula: '{{item.added}} >= {{state.time.today}}' }, note: 'Today only: drop the ones from before midnight.' },
	{ id: 'sort-score', data: { type: 'list', key: 'gameList', op: 'sort', formula: '{{item.score}}', order: 'high' }, note: 'Game: best first (score, high → low)…' },
	{ id: 'limit', data: { type: 'list', key: 'gameList', op: 'limit', count: '5' }, note: '…keep the best 5…' },
	{ id: 'sort-time', data: { type: 'list', key: 'gameList', op: 'sort', formula: '{{item.added}}', order: 'low' }, note: '…in the order they happened.' },
	{ id: 'replay-game', data: { type: 'setReplayList', key: 'replay-game', list: 'gameList', field: 'id' }, note: 'Highlight Replay "replay-game": the game\'s best 5, redrawn from the replay.' },
	{ id: 'set-clear', data: { type: 'clearValues', keys: 'setBest' }, note: 'Set: start the pick over…' },
	{ id: 'set-add', data: { type: 'list', key: 'setBest', description: 'The best 15 of the set, in time order.', op: 'addList', from: 'setList' }, note: '…from every candidate of the set…' },
	{ id: 'set-sort', data: { type: 'list', key: 'setBest', op: 'sort', formula: '{{item.score}}', order: 'high' }, note: '…best first…' },
	{ id: 'set-limit', data: { type: 'list', key: 'setBest', op: 'limit', count: '15' }, note: '…keep the best 15…' },
	{ id: 'set-time', data: { type: 'list', key: 'setBest', op: 'sort', formula: '{{item.added}}', order: 'low' }, note: '…in the order they happened.' },
	{ id: 'replay-set', data: { type: 'setReplayList', key: 'replay-set', list: 'setBest', field: 'id' }, note: 'Highlight Replay "replay-set": the set\'s best 15.' },
	{ id: 'daily-clear', data: { type: 'clearValues', keys: 'dailyBest' }, note: 'Daily: start the pick over…' },
	{ id: 'daily-add', data: { type: 'list', key: 'dailyBest', description: "Today's top 5 % (10–30, at most 3 per game), best first.", op: 'addList', from: 'dayList' }, note: '…from today\'s candidates…' },
	{ id: 'daily-sort', data: { type: 'list', key: 'dailyBest', op: 'sort', formula: '{{item.score}}', order: 'high' }, note: '…best first…' },
	{ id: 'daily-per-game', data: { type: 'list', key: 'dailyBest', op: 'limitPer', field: 'game', count: '3' }, note: '…at most 3 from one game…' },
	{ id: 'daily-limit', data: { type: 'list', key: 'dailyBest', op: 'limit', count: 'max(10, min(30, round(count(dayList) * 0.05)))' }, note: '…the top 5 % of today, at least 10 and at most 30 (~3 minutes).' },
	{ id: 'replay-daily', data: { type: 'setReplayList', key: 'replay-daily', list: 'dailyBest', field: 'id' }, note: 'Highlight Replay "replay-daily": today\'s best.' },
];

/** A loop for Media elements on `key`: show the list's first highlight, wait its length, next, again. */
const LOOPS = [
	{ key: 'game', list: 'gameList', col: 3 },
	{ key: 'set', list: 'setBest', col: 5 },
	{ key: 'daily', list: 'dailyBest', col: 7 },
];
const LOOP_Y = END_Y + GAME_END.length * ROW;
const loopSteps = (l: (typeof LOOPS)[number]): Step[] => [
	{ id: `has-${l.key}`, kind: 'condition', data: { type: 'compare', left: `{{${l.list}.count}}`, op: '>', right: '0' }, note: `Anything in ${l.list}?` },
	{ id: `show-${l.key}`, data: { type: 'setHighlightVideo', key: l.key, path: `{{${l.list}.first.id}}`, start: '', end: '' }, note: `Media "${l.key}" shows the first highlight's clip (from the replay buffer).` },
	{ id: `wait-${l.key}`, data: { type: 'timer', key: `loop-${l.key}`, seconds: `max({{${l.list}.first.seconds}}, 2)` }, note: 'Wait as long as it plays.' },
	{ id: `next-${l.key}`, data: { type: 'list', key: l.list, op: 'next' }, note: 'Next: the first goes to the end — then back to the top. A game start stops the loop.' },
];

const STOP: Step[] = [
	...LOOPS.map((l) => ({ id: `stop-${l.key}`, data: { type: 'cancelTimer', key: `loop-${l.key}` } as FlowAction, note: l.key === 'game' ? 'A game starts: stop the media loops…' : undefined })),
	...LOOPS.map((l) => ({ id: `empty-${l.key}`, data: { type: 'setHighlightVideo', key: l.key, path: '' } as FlowAction, note: l.key === 'game' ? '…and empty the Media keys (nothing to show in game).' : undefined })),
	{ id: 'clear-game', data: { type: 'clearValues', keys: 'gameList' }, note: 'A new game: its list starts over.' },
	{ id: 'new-set', kind: 'condition', data: { type: 'compare', left: '{{newSet}}', op: '==', right: 'true' }, note: 'Does this game start a new set?' },
	{ id: 'clear-set', data: { type: 'clearValues', keys: 'setList, setBest' }, note: 'Then the set lists start over too. dayList keeps only today\'s (its Filter card).' },
];

const seqIds = SEQUENCE.map((s) => s.id);
const endIds = GAME_END.map((s) => s.id);
const stopIds = STOP.map((s) => s.id);
const log = (id: string, x: number, y: number, message: string): FlowNode => ({ id, kind: 'action', position: { x, y }, data: { type: 'log', message } });

export const HIGHLIGHTS_FLOW: Flow = {
	id: HIGHLIGHTS_FLOW_ID,
	name: 'Highlights',
	enabled: false,
	nodes: [
		{
			id: 'about', kind: 'note', position: { x: 40, y: -300 },
			data: { type: 'note', text: 'Highlights — every step is a card you can read and change (or tell the AI assistant what a highlight is for you). Media elements (keys "game", "set", "daily") play the replay-buffer clips one by one; Highlight Replay elements (keys "replay-game", "replay-set", "replay-daily") redraw them from the game replays — no OBS needed. Game = best 5, set = best 15 (both in time order), daily = today\'s top 5 % (10–30, at most 3 per game, best first). Froggi never deletes the replay files.' },
		},
		{ id: 't-start', kind: 'trigger', position: { x: X(0), y: 0 }, data: { type: 'gameStart' } },
		...column([{ id: 'settings', data: { type: 'obsReplayBufferSettings', seconds: 30, format: 'hybrid_mp4', fileName: 'Froggi game {{state.match.gameNumber}}' }, note: 'OBS replay buffer: 30 s, Hybrid MP4, files named "Froggi game N …" (nothing happens when already set).' }], 3, 0),
		log('settings-failed', X(5), 0, 'Highlights: could not set the replay buffer — {{error}}'),
		...column(STOP, 1, 0),
		{ id: 't-set', kind: 'trigger', position: { x: X(0), y: (STOP.length - 1) * ROW }, data: { type: 'setStart' } },

		{ id: 't-seq', kind: 'trigger', position: { x: X(0), y: SEQ_Y }, data: { type: 'sequence', kind: 'punish', player: 'any' } },
		...column(SEQUENCE, 1, SEQ_Y),
		log('save-failed', X(3), SEQ_Y + (SEQUENCE.length - 1) * ROW, 'Highlights: replay buffer not saved — {{error}}'),

		{ id: 't-end', kind: 'trigger', position: { x: X(0), y: END_Y }, data: { type: 'gameEnd' } },
		...column(GAME_END, 1, END_Y),
		...LOOPS.flatMap((l) => column(loopSteps(l), l.col, LOOP_Y)),
	],
	edges: [
		{ id: 'e-start', source: 't-start', target: 'settings' },
		{ id: 'e-start-err', source: 'settings', target: 'settings-failed', sourceHandle: 'error' },
		{ id: 'e-start-stop', source: 't-start', target: stopIds[0] },
		...chain(stopIds),
		{ id: 'e-set-clear', source: 't-set', target: 'clear-set' },
		{ id: 'e-seq', source: 't-seq', target: seqIds[0] },
		...chain(seqIds),
		{ id: 'e-save-err', source: 'save', target: 'save-failed', sourceHandle: 'error' },
		{ id: 'e-end', source: 't-end', target: endIds[0] },
		...chain(endIds),
		...LOOPS.flatMap((l): FlowEdge[] => [
			{ id: `e-loop-${l.key}`, source: endIds[endIds.length - 1], target: `has-${l.key}` },
			...chain([`has-${l.key}`, `show-${l.key}`, `wait-${l.key}`, `next-${l.key}`]),
			// A clip that can't play: still wait its turn, then go on.
			{ id: `e-show-err-${l.key}`, source: `show-${l.key}`, target: `wait-${l.key}`, sourceHandle: 'error' },
			{ id: `e-again-${l.key}`, source: `next-${l.key}`, target: `has-${l.key}` },
		]),
	],
};
