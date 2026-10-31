import { applyListOp, fieldValue, itemTokens, listTokens, resolveIndexKey, type ListItem } from '../../frontend/src/lib/utils/flowList';
import { evaluateFormula } from '../../frontend/src/lib/utils/formula';
import { fillTemplate } from '../../frontend/src/lib/utils/flowEngine';

/** What flowService passes as `evaluate`: the formula with {{item.<field>}} keys. */
const evaluate = (formula: string, item: ListItem) => evaluateFormula(formula, itemTokens(item) as Record<string, never>);

describe('flow lists', () => {
	const add = (list: ListItem[], item: ListItem, now: number) => applyListOp(list, 'add', { item, now });

	it('objects: sort by a formula over each item, keep 5, back in the order they happened', () => {
		let game: ListItem[] = [];
		[30, 90, 45, 70, 55, 80, 60].forEach((score, i) => (game = add(game, { id: `h${i}`, score }, i)));
		game = applyListOp(game, 'sort', { formula: '{{item.score}}', order: 'high', evaluate });
		game = applyListOp(game, 'limit', { count: 5 });
		game = applyListOp(game, 'sort', { formula: '{{item.added}}', order: 'low', evaluate });
		expect(game.map((i) => i.id)).toEqual(['h1', 'h3', 'h4', 'h5', 'h6']); // 90, 70, 55, 80, 60
	});

	it('limitPer keeps the first N per field value; positions may come from a key', () => {
		// Daily: best first, at most 3 per game, then the top 20 % with 20–100.
		let day: ListItem[] = Array.from({ length: 40 }, (_, i) => ({ id: `h${i}`, score: 100 - i, game: i < 20 ? 1 : 2 + (i % 10) }));
		day = applyListOp(day, 'limitPer', { field: 'game', count: 3 });
		expect(day.filter((i) => i.game === 1).map((i) => i.id)).toEqual(['h0', 'h1', 'h2']);
		const count = evaluateFormula('max(20, min(100, round(count(dayList) * 0.2)))', {}, { dayList: day });
		expect(count).toBe(20);
		expect(applyListOp(day, 'limit', { count }).length).toBe(20);
		expect(applyListOp(day.slice(0, 7), 'limit', { count }).length).toBe(7); // fewer than 20 today: all of them
		expect(evaluateFormula('max(20, min(100, round(count(d) * 0.2)))', {}, { d: Array.from({ length: 300 }, () => ({})) })).toBe(60);
		expect(evaluateFormula('max(20, min(100, round(count(d) * 0.2)))', {}, { d: Array.from({ length: 900 }, () => ({})) })).toBe(100);
		// {{list[i].field}}: the position from a key (a loop counts i up), 0-based like [0]
		const tokens = { ...listTokens('day', day), i: 2 };
		expect(fillTemplate('{{day[i].id}}', tokens)).toBe(String(day[2].id));
		expect(evaluateFormula('{{day[i].score}} + 1', tokens)).toBe(Number(day[2].score) + 1);
		expect(evaluateFormula('day[i].score', tokens)).toBe(Number(day[2].score));
	});

	it('filter and map with formulas; addList; shuffle', () => {
		const set = applyListOp(applyListOp([], 'addList', { from: [{ id: 'a', score: 30, kill: true }] }), 'addList', { from: [{ id: 'b', score: 80, kill: false }, { id: 'c', score: 50, kill: true }] });
		expect(applyListOp(set, 'filter', { formula: '{{item.kill}} && {{item.score}} >= 40', evaluate }).map((i) => i.id)).toEqual(['c']);
		expect(applyListOp(set, 'map', { field: 'double', formula: '{{item.score}} * 2', evaluate }).map((i) => i.double)).toEqual([60, 160, 100]);
		const shuffled = applyListOp(set, 'shuffle', { random: () => 0 });
		expect(shuffled.map((i) => i.id).sort()).toEqual(['a', 'b', 'c']);
		expect(shuffled.map((i) => i.id)).not.toEqual(['a', 'b', 'c']);
	});

	it('formulas read lists: count / sum / avg / lowest / highest / find', () => {
		const lists = { gameList: [{ id: 'h1', score: 30, game: 1 }, { id: 'h2', score: 90, game: 2 }, { id: 'h3', score: 60, game: 2 }], empty: [] };
		const f = (formula: string) => evaluateFormula(formula, { total: 70 }, lists);
		expect(f('count(gameList)')).toBe(3);
		expect(f('count(gameList, {{item.game}} == 2)')).toBe(2);
		expect(f('sum(gameList, {{item.score}})')).toBe(180);
		expect(f('avg(gameList, {{item.score}})')).toBe(60);
		expect(f('lowest(gameList, {{item.score}})')).toBe(30);
		expect(f('highest(gameList, {{item.score}} * 2)')).toBe(180);
		expect(f('find(gameList, {{item.score}} > {{total}}, {{item.game}})')).toBe(2);
		expect(f('count(empty) + lowest(empty, {{item.score}})')).toBe(0);
		expect(() => f('count(nope)')).toThrow(/unknown list nope/);
		expect(() => f('sum(gameList)')).toThrow(/wrong number/);
	});

	it('field values: numbers and true/false as such, else text', () => {
		expect([fieldValue('42'), fieldValue('4.5'), fieldValue('true'), fieldValue('h12'), fieldValue('')]).toEqual([42, 4.5, true, 'h12', '']);
	});

	it('items by position: .1 (1-based), first / last, and brackets [0] / [-1]', () => {
		const tokens = listTokens('gameList', [{ id: 'h1', score: 30 }, { id: 'h2', score: 90 }, { id: 'h3', score: 60 }]);
		expect(fillTemplate('{{gameList.1.id}} {{gameList.last.score}} {{gameList.first.score}}', tokens)).toBe('h1 60 30');
		expect(fillTemplate('{{gameList[0].id}} {{gameList[-1].id}} {{gameList[-2].score}}', tokens)).toBe('h1 h3 90');
		expect(resolveIndexKey('gameList[-1].score', tokens)).toBe('gameList.3.score');
		expect(evaluateFormula('{{gameList[-1].score}} + {{gameList.1.score}}', tokens)).toBe(90);
		expect(evaluateFormula('{{gameList.last.score}}', listTokens('gameList', []))).toBe(0); // empty list: 0, not an error
	});
});
