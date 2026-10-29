import type * as Slp from '@slippi/slippi-js';

/**
 * The null boundary (slippi-js 9). slippi-js 9 reports a missing value as `undefined`; Froggi (and slippi-js 7)
 * use `null` — in the app types, the SQLite entities, every `=== null` check, and in what is sent to the overlays
 * (JSON keeps `null` but drops `undefined` fields). So every slippi value is converted with `nulled()` where it
 * enters Froggi, and Froggi code imports slippi's DATA types from here instead of from slippi-js.
 * Enums, constants and classes (Character, Stage, SlippiGame, SlpParser…) still come from slippi-js.
 */
type Primitive = string | number | boolean | bigint | symbol | null;
type NulledDefined<T> = T extends Primitive | ((...args: any[]) => any)
	? T
	: T extends readonly (infer U)[]
		? Nulled<U>[]
		: { [K in keyof T]: Nulled<T[K]> };
/** T with every `undefined` (deeply) replaced by `null`. */
export type Nulled<T> = undefined extends T ? NulledDefined<Exclude<T, undefined>> | null : NulledDefined<T>;

/** Deep copy of a slippi value with `undefined` → `null` (plain objects and arrays; other objects kept as they are). */
export function nulled<T>(value: T): Nulled<T> {
	if (value === undefined || value === null) return null as Nulled<T>;
	if (Array.isArray(value)) return value.map((v) => nulled(v)) as Nulled<T>;
	if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value as Nulled<T>;
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = nulled(v);
	return out as Nulled<T>;
}

/** Some fields keep slippi-js 7's shape (optional, or a plain string) so stored games and entities still fit. */
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** The other way: a Froggi value handed back to slippi-js (its stats computers) as slippi-js 9 shapes it. */
export function unnulled<T>(value: unknown): T {
	if (value === null || value === undefined) return undefined as T;
	if (Array.isArray(value)) return value.map((v) => unnulled(v)) as T;
	if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value as T;
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = unnulled(v);
	return out as T;
}

export type FrameEntryType = Optional<Nulled<Slp.FrameEntryType>, 'start' | 'items' | 'stageEvents'>;
export type FrameStartType = Nulled<Slp.FrameStartType>;
export type PreFrameUpdateType = Nulled<Slp.PreFrameUpdateType>;
export type PostFrameUpdateType = Nulled<Slp.PostFrameUpdateType>;
export type ItemUpdateType = Nulled<Slp.ItemUpdateType>;
export type PlayerType = Omit<Nulled<Slp.PlayerType>, 'nametag' | 'controllerFix'> & { nametag: string | null; controllerFix: string | null };
export type GameStartType = Omit<Nulled<Slp.GameStartType>, 'players'> & { players: PlayerType[] };
export type GameEndType = Nulled<Slp.GameEndType>;
export type PlacementType = Nulled<Slp.PlacementType>;
export type OverallType = Nulled<Slp.OverallType>;
/** tauntCount is new in slippi-js 9.1 — absent in games stored before. */
export type ActionCountsType = Optional<Nulled<Slp.ActionCountsType>, 'tauntCount'>;
export type ConversionType = Optional<Nulled<Slp.ConversionType>, 'endFrame' | 'endPercent'>;
export type ComboType = Optional<Nulled<Slp.ComboType>, 'endFrame' | 'endPercent'>;
export type StockType = Optional<Nulled<Slp.StockType>, 'endFrame' | 'endPercent' | 'deathAnimation'>;
export type StatsType = Omit<Nulled<Slp.StatsType>, 'stocks' | 'conversions' | 'combos' | 'actionCounts'> & {
	stocks: StockType[];
	conversions: ConversionType[];
	combos: ComboType[];
	actionCounts: ActionCountsType[];
};
