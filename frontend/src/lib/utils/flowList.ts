/**
 * Flow lists (the "List" card): a list of items — objects with named fields (e.g. { id, score, game }) plus
 * `added` (when the item was added, ms). Every change is a visible card: add an item, add all of another
 * list, sort / filter / map with a formula over {{item.<field>}}, keep the first N (per field value), move
 * the first to the end (next — a playlist), shuffle; a Clear values
 * card empties it. Formulas read lists with count / sum / avg / lowest / highest / find (utils/formula.ts).
 */

export type ListValue = string | number | boolean | null;
export type ListItem = Record<string, ListValue>;

export type ListOp = 'add' | 'addList' | 'sort' | 'filter' | 'map' | 'limit' | 'limitPer' | 'shuffle';
/** Sort order of the sort formula's value. */
export type ListOrder = 'high' | 'low';

/** A field of the item an Add card adds: name = {{keys}} text (numbers become numbers). */
export interface ListField {
	name: string;
	value: string;
}

export const LIST_OPS: { value: ListOp; label: string }[] = [
	{ value: 'add', label: 'Add an item' },
	{ value: 'addList', label: 'Add all of another list' },
	{ value: 'sort', label: 'Sort by a formula' },
	{ value: 'filter', label: 'Keep items where a formula holds' },
	{ value: 'map', label: 'Set a field of every item' },
	{ value: 'limit', label: 'Keep the first N' },
	{ value: 'limitPer', label: 'Keep the first N per field value' },
	{ value: 'shuffle', label: 'Shuffle' },
];

/** {{item.<field>}} keys for formulas over one item. */
export const itemTokens = (item: ListItem): Record<string, ListValue> => Object.fromEntries(Object.entries(item).map(([k, v]) => [`item.${k}`, v]));

/** A filled-in field value: numbers as numbers, true/false as booleans, otherwise text. */
export const fieldValue = (text: string): ListValue => {
	const t = text.trim();
	if (t === 'true' || t === 'false') return t === 'true';
	return t !== '' && !Number.isNaN(Number(t)) ? Number(t) : t;
};

/** The list after one List card. `evaluate` runs a formula for one item (with {{item.…}} keys). */
export function applyListOp(
	list: ListItem[],
	op: ListOp,
	args: {
		item?: ListItem;
		from?: ListItem[];
		formula?: string;
		order?: ListOrder;
		field?: string;
		count?: number;
		now?: number;
		random?: () => number;
		evaluate?: (formula: string, item: ListItem) => number;
	},
): ListItem[] {
	const evaluate = (item: ListItem) => args.evaluate?.(args.formula ?? '', item) ?? 0;
	switch (op) {
		case 'add':
			return [...list, { ...args.item, added: args.now ?? Date.now() }];
		case 'addList':
			return [...list, ...(args.from ?? [])];
		case 'sort': {
			// Stable: equal values keep their order.
			const keyed = list.map((item) => ({ item, v: evaluate(item) }));
			return keyed.sort((a, b) => (args.order === 'low' ? a.v - b.v : b.v - a.v)).map((k) => k.item);
		}
		case 'filter':
			return list.filter((item) => evaluate(item) !== 0);
		case 'map':
			return args.field ? list.map((item) => ({ ...item, [args.field!]: evaluate(item) })) : list;
		case 'limit':
			return list.slice(0, Math.max(0, Math.round(args.count ?? list.length)));
		case 'limitPer': {
			// At most N items with the same value of `field` (e.g. 3 highlights per game), in list order.
			const max = Math.max(0, Math.round(args.count ?? list.length));
			const seen = new Map<ListValue, number>();
			return list.filter((item) => {
				const v = args.field ? (item[args.field] ?? null) : null;
				const n = (seen.get(v) ?? 0) + 1;
				seen.set(v, n);
				return n <= max;
			});
		}
		case 'shuffle': {
			const random = args.random ?? Math.random;
			const out = [...list];
			for (let i = out.length - 1; i > 0; i--) {
				const j = Math.floor(random() * (i + 1));
				[out[i], out[j]] = [out[j], out[i]];
			}
			return out;
		}
	}
}

/**
 * A list's keys: {{key.count}}, every item's fields by position {{key.1.score}} (1-based), and
 * {{key.first.…}} / {{key.last.…}}. Brackets work too — see resolveIndexKey.
 */
export const listTokens = (key: string, items: ListItem[]) => {
	const tokens: Record<string, ListValue> = { [`${key}.count`]: items.length };
	const put = (at: string, item: ListItem) => Object.entries(item).forEach(([f, v]) => (tokens[`${key}.${at}.${f}`] = v));
	items.forEach((item, i) => put(String(i + 1), item));
	if (items.length) (put('first', items[0]), put('last', items[items.length - 1]));
	return tokens;
};

/** {{list[0].score}} → {{list.1.score}}, {{list[-1].score}} → the last item (0-based, negative = from the end);
 *  the position may be a key: {{list[i].score}} with {{i}} = 2 → the 3rd item (loops count i up). */
export function resolveIndexKey(key: string, tokens: Record<string, unknown>): string {
	return key.replace(/^([A-Za-z_]\w*)\[(-?\d+|[A-Za-z_]\w*)\]/, (_m, name: string, index: string) => {
		const n = /^-?\d+$/.test(index) ? Number(index) : Math.round(Number(tokens[index]) || 0);
		const count = Number(tokens[`${name}.count`] ?? 0);
		return `${name}.${n < 0 ? count + n + 1 : n + 1}`;
	});
}
