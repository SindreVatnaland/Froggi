import type { FlowTokens } from '../models/types/flow';
import { itemTokens, resolveIndexKey, type ListItem } from './flowList';

/**
 * Flow formulas (Calculate, Timer seconds, List sort / filter / map / count, Set media From / To). Two ways to write the same:
 *   Froggi style  {{total}} >= 40 && {{didKill}}          JavaScript style  total >= 40 && didKill
 * Numbers, keys ({{key}} or a bare name / path: total, state.players.1.percent, gameList[-1].score,
 * gameList.length), "text" / 'text', + − * / %, ( ), == != === !== < <= > >= (→ 1 / 0; text compares as
 * text), && || !, a ? b : c, true / false / null, min max abs round floor ceil clamp(x, lo, hi) nth(k, …)
 * (also as Math.min …). Lists: count(list[, where]), sum / avg / lowest / highest(list, value),
 * find(list, where, value) — where / value run per item: {{item.score}}, item.score or a lambda
 * `it => it.score`. A whole formula may be a lambda too: `item => item.score * 2`.
 *
 * SAFE: a small recursive-descent parser — never eval / Function. Names only read the flow's own keys
 * (own properties, no prototype), and only the functions listed here can be called.
 */
type Val = number | string;

export interface FormulaOptions {
	/** Syntax check: unknown keys read as 1 instead of failing. */
	anyKey?: boolean;
	/** Collects every key the formula reads (for validation / editor chips). */
	collect?: Set<string>;
}

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const IDENT = /^[A-Za-z_$][\w$]*(?:\.(?:[A-Za-z_$][\w$]*|\d+)|\[(?:-?\d+|[A-Za-z_$][\w$]*)\])*/;
const LAMBDA = /^\s*(?:\(\s*([A-Za-z_$][\w$]*)\s*\)|([A-Za-z_$][\w$]*))\s*=>/;

/** `lists`: the flow's lists by name (undefined = only check the syntax; list functions give 0). */
export function evaluateFormula(formula: string, tokens: FlowTokens = {}, lists?: Record<string, ListItem[]>, opts: FormulaOptions = {}): number {
	let src = formula.trim();
	// `x => …` / `(x) => …`: x is the current item (list formulas) — x.score reads {{item.score}}.
	let alias: string | null = null;
	const lambda = LAMBDA.exec(src);
	if (lambda) {
		alias = lambda[1] ?? lambda[2];
		src = src.slice(lambda[0].length).trim();
	}
	let i = 0;
	const fail = (msg: string): never => {
		throw new Error(`Formula "${formula.trim()}": ${msg}`);
	};
	const space = () => {
		while (/\s/.test(src[i] ?? '')) i++;
	};
	const eat = (s: string) => {
		space();
		if (src.startsWith(s, i)) {
			i += s.length;
			return true;
		}
		return false;
	};
	const num = (v: Val): number => {
		if (typeof v === 'number') return v;
		const n = Number(v);
		return v.trim() !== '' && !Number.isNaN(n) ? n : fail(`"${v}" is text, not a number`);
	};
	const truthy = (v: Val) => (typeof v === 'string' ? v !== '' : v !== 0);

	const keyValue = (raw: string): Val => {
		let key = resolveIndexKey(raw, tokens);
		if (key.endsWith('.length') && own(tokens, `${key.slice(0, -7)}.count`)) key = `${key.slice(0, -7)}.count`;
		opts.collect?.add(key);
		// A list position that doesn't exist (yet): empty, like an unset value.
		if (!own(tokens, key) && own(tokens, `${key.split('.')[0]}.count`)) return 0;
		if (!own(tokens, key)) return opts.anyKey ? 1 : fail(`unknown key ${raw}`);
		const v = tokens[key];
		if (v === null || v === undefined || v === '') return 0;
		if (typeof v === 'boolean') return v ? 1 : 0;
		if (typeof v === 'number') return v;
		if (typeof v !== 'string') return fail(`${key} is not a value`);
		const n = Number(v);
		return v.trim() !== '' && !Number.isNaN(n) ? n : v;
	};
	const FUNCS: Record<string, (...a: number[]) => number> = {
		min: Math.min,
		max: Math.max,
		abs: Math.abs,
		round: Math.round,
		floor: Math.floor,
		ceil: Math.ceil,
		clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
		nth: (k, ...values) => [...values].sort((a, b) => b - a)[Math.round(k) - 1] ?? 0,
	};

	/** One raw argument (up to the next , or the closing ) at this depth) — evaluated per item later. */
	const rawArg = (): string => {
		const start = i;
		let depth = 0;
		let quote: string | null = null;
		while (i < src.length) {
			const ch = src[i];
			if (quote) {
				if (ch === quote) quote = null;
				i++;
				continue;
			}
			if (ch === '"' || ch === "'") quote = ch;
			else if (src.startsWith('{{', i)) {
				const end = src.indexOf('}}', i);
				i = end < 0 ? src.length : end + 2;
				continue;
			} else if (ch === '(') depth++;
			else if (ch === ')') {
				if (depth === 0) break;
				depth--;
			} else if (ch === ',' && depth === 0) break;
			i++;
		}
		return src.slice(start, i).trim();
	};
	const LIST_ARGS: Record<string, [number, number]> = { count: [0, 1], sum: [1, 1], avg: [1, 1], lowest: [1, 1], highest: [1, 1], find: [2, 2] };
	const listFunction = (fn: string): number => {
		if (!eat('(')) fail(`${fn} needs (list, …)`);
		space();
		const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))?.[0] ?? fail(`${fn} needs a list name first`);
		i += name.length;
		const args: string[] = [];
		while (eat(',')) args.push(rawArg());
		if (!eat(')')) fail('missing )');
		const [lo, hi] = LIST_ARGS[fn];
		if (args.length < lo || args.length > hi) fail(`${fn}(list${fn === 'find' ? ', where, value' : fn === 'count' ? '[, where]' : ', value'}) — wrong number of parts`);
		if (args.some((a) => !a)) fail(`${fn}: an empty part`);
		if (!lists) {
			args.forEach((a) => evaluateFormula(a, tokens, undefined, { ...opts, anyKey: true })); // syntax only
			return 0;
		}
		const items = (own(lists, name) ? lists[name] : undefined) ?? fail(`unknown list ${name}`);
		const per = (f: string, item: ListItem) => evaluateFormula(f, { ...tokens, ...itemTokens(item) } as FlowTokens, lists, opts);
		switch (fn) {
			case 'count':
				return args[0] ? items.filter((it) => per(args[0], it) !== 0).length : items.length;
			case 'sum':
				return items.reduce((n, it) => n + per(args[0], it), 0);
			case 'avg':
				return items.length ? items.reduce((n, it) => n + per(args[0], it), 0) / items.length : 0;
			case 'lowest':
				return items.length ? Math.min(...items.map((it) => per(args[0], it))) : 0;
			case 'highest':
				return items.length ? Math.max(...items.map((it) => per(args[0], it))) : 0;
			default: {
				const hit = items.find((it) => per(args[0], it) !== 0);
				return hit ? per(args[1], hit) : 0;
			}
		}
	};

	const primary = (): Val => {
		space();
		if (eat('(')) {
			const v = ternary();
			if (!eat(')')) fail('missing )');
			return v;
		}
		if (eat('{{')) {
			const end = src.indexOf('}}', i);
			if (end < 0) fail('missing }}');
			const key = src.slice(i, end).trim();
			i = end + 2;
			return keyValue(key);
		}
		const quote = src[i];
		if (quote === '"' || quote === "'") {
			const end = src.indexOf(quote, i + 1);
			if (end < 0) fail('missing closing quote');
			const text = src.slice(i + 1, end);
			i = end + 1;
			return text;
		}
		const number = /^\d+(\.\d+)?|^\.\d+/.exec(src.slice(i));
		if (number) {
			i += number[0].length;
			return Number(number[0]);
		}
		const name = IDENT.exec(src.slice(i))?.[0];
		if (name) {
			i += name.length;
			const lower = name.toLowerCase();
			if (lower === 'true') return 1;
			if (lower === 'false' || lower === 'null' || lower === 'undefined') return 0;
			space();
			if (src[i] === '(') {
				const fnName = lower.startsWith('math.') ? lower.slice(5) : lower;
				if (fnName in LIST_ARGS && !lower.startsWith('math.')) return listFunction(fnName);
				const fn = own(FUNCS, fnName) ? FUNCS[fnName] : fail(`unknown function ${name}`);
				eat('(');
				const args = [num(ternary())];
				while (eat(',')) args.push(num(ternary()));
				if (!eat(')')) fail('missing )');
				return fn(...args);
			}
			if (alias && (name === alias || name.startsWith(`${alias}.`) || name.startsWith(`${alias}[`))) {
				if (name === alias) fail(`use ${alias}.<field>`);
				return keyValue(`item${name.slice(alias.length)}`);
			}
			return keyValue(name);
		}
		return fail(i >= src.length ? 'ends too early' : `unexpected "${src[i]}"`);
	};
	const unary = (): Val => (eat('-') ? -num(unary()) : eat('!') ? Number(!truthy(unary())) : eat('+') ? num(unary()) : primary());
	const product = (): Val => {
		let v = unary();
		for (;;) {
			if (eat('*')) v = num(v) * num(unary());
			else if (eat('/')) {
				const d = num(unary());
				v = d === 0 ? 0 : num(v) / d; // ponytail: x/0 = 0 so a missing count doesn't break a score
			} else if (eat('%')) v = num(v) % num(unary());
			else return v;
		}
	};
	const sum = (): Val => {
		let v = product();
		for (;;) {
			if (eat('+')) v = num(v) + num(product());
			else if (eat('-')) v = num(v) - num(product());
			else return v;
		}
	};
	const same = (a: Val, b: Val) => (typeof a === 'string' || typeof b === 'string' ? String(a).toLowerCase() === String(b).toLowerCase() : a === b);
	const compare = (): Val => {
		const v = sum();
		if (eat('===') || eat('==')) return Number(same(v, sum()));
		if (eat('!==') || eat('!=')) return Number(!same(v, sum()));
		if (eat('<=')) return Number(num(v) <= num(sum()));
		if (eat('>=')) return Number(num(v) >= num(sum()));
		if (eat('<')) return Number(num(v) < num(sum()));
		if (eat('>')) return Number(num(v) > num(sum()));
		return v;
	};
	const and = (): Val => {
		let v = compare();
		while (eat('&&')) {
			const right = compare();
			v = Number(truthy(v) && truthy(right));
		}
		return v;
	};
	const or = (): Val => {
		let v = and();
		while (eat('||')) {
			const right = and();
			v = Number(truthy(v) || truthy(right));
		}
		return v;
	};
	const ternary = (): Val => {
		const c = or();
		if (!eat('?')) return c;
		const a = ternary();
		if (!eat(':')) fail('missing : after ?');
		const b = ternary();
		return truthy(c) ? a : b;
	};

	if (!src) return 0;
	const value = num(ternary());
	space();
	if (i < src.length) fail(`unexpected "${src[i]}"`);
	return Number.isFinite(value) ? value : fail('result is not a number');
}

/** Problem with a formula's syntax (unknown keys read as 1), or null. */
export function formulaProblem(formula: string, keys: string[] = []): string | null {
	try {
		evaluateFormula(formula, Object.fromEntries(keys.map((k) => [k, 1])), undefined, { anyKey: true });
		return null;
	} catch (err) {
		return err instanceof Error ? err.message : String(err);
	}
}

/** Every key a formula reads — {{key}} and JavaScript-style names (item fields as item.<field>). */
export function formulaKeys(formula: string): string[] {
	const collect = new Set<string>();
	try {
		evaluateFormula(formula, {}, undefined, { anyKey: true, collect });
	} catch {
		/* syntax errors are reported by formulaProblem */
	}
	return [...collect];
}
