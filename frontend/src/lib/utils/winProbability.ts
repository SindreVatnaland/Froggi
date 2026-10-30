/**
 * Win chance from what is on screen: stocks and percent (game), plus the set score (set).
 *
 * A side's remaining "life" = stocks left − how far into the current stock it is (percent ÷ the percent THIS
 * player loses stocks at: their average death percent over the set's games, pulled toward KO_PERCENT while
 * they have few deaths). Game chance = Lₐ² / (Lₐ² + L_b²) — squaring makes a lead count for more
 * than a plain ratio. Set chance = this game's chance, then every later game 50/50, against the score
 * needed to win the best-of. Doubles: each team's players are summed.
 *
 * Clock: with a timer, the game chance blends toward the timeout winner (more stocks, then lower percent)
 * by how much of the game still fits in the time left — at the pace stocks have been taken (avg seconds
 * per stock this set). Hard floor: after the leader's current stock, every further stock takes at least
 * an instant SD (SD_STOCK_SECONDS), so a lead that can't be erased in time is a sure win.
 *
 */

/** Percent a stock is typically lost at in Melee. */
export const KO_PERCENT = 120;

export interface SideState {
	stocks: number;
	percent: number;
	/** This player's deaths and summed percent at death over the set so far (live fight stats, match). */
	deaths?: number;
	deathPercent?: number;
}

/** The percent this player loses a stock at: their set average, pulled toward KO_PERCENT by two virtual deaths. */
export function playerKoPercent(s: Pick<SideState, 'deaths' | 'deathPercent'>): number {
	const deaths = Math.max(0, s.deaths ?? 0);
	return ((deaths ? (s.deathPercent ?? 0) : 0) + 2 * KO_PERCENT) / (deaths + 2);
}

/** Stocks left minus how far into the current stock this side is (never below a sliver while alive). */
export function remainingLife(sides: SideState[]): number {
	return sides.reduce((sum, s) => (s.stocks > 0 ? sum + s.stocks - Math.min(Math.max(s.percent, 0) / playerKoPercent(s), 0.95) : sum), 0);
}

/** Chance side A wins the running game (0–1). */
export function gameWinChance(lifeA: number, lifeB: number): number {
	const a = lifeA * lifeA;
	const b = lifeB * lifeB;
	return a + b === 0 ? 0.5 : a / (a + b);
}

/** Fastest a stock can go: respawn + an instant self-destruct. */
export const SD_STOCK_SECONDS = 5;
/** Typical seconds per stock, used until stocks have been taken (pulled toward by two virtual stocks). */
export const DEFAULT_STOCK_SECONDS = 40;

export interface Clock {
	secondsLeft: number;
	/** How long each stock lost so far lasted (this set), seconds. */
	stockSeconds?: number[];
}

/** Seconds left on a counting-down timer (TimerType.DECREASING = 2), else null. Frame 0 = GO. */
export function secondsLeft(settings: { timerType?: number | null; startingTimerSeconds?: number | null } | null | undefined, frame: number | null | undefined): number | null {
	if (settings?.timerType !== 2 || !settings.startingTimerSeconds || frame == null) return null;
	return Math.max(0, settings.startingTimerSeconds - Math.max(0, frame) / 60);
}

/** Avg / min / max seconds per stock lost; avg is pulled toward DEFAULT_STOCK_SECONDS while there is little data. */
export function stockPace(observed: number[] = []) {
	return {
		avg: (observed.reduce((a, b) => a + b, 0) + 2 * DEFAULT_STOCK_SECONDS) / (observed.length + 2),
		min: observed.length ? Math.min(...observed) : null,
		max: observed.length ? Math.max(...observed) : null,
	};
}

const sum = (sides: SideState[], f: (s: SideState) => number) => sides.reduce((n, s) => n + (s.stocks > 0 ? f(s) : 0), 0);

/** Chance side A wins if time ran out now (Melee: more stocks, then lower percent; dead even = sudden death). */
export function timeoutWinChance(sideA: SideState[], sideB: SideState[]): number {
	const lead = sum(sideA, (s) => s.stocks) - sum(sideB, (s) => s.stocks);
	if (lead) return lead > 0 ? 1 : 0;
	const percent = sum(sideA, (s) => s.percent) - sum(sideB, (s) => s.percent);
	return percent < 0 ? 1 : percent > 0 ? 0 : 0.5;
}

/** Game chance for side A with the clock in play (no clock → stocks and percent only). */
export function gameWinChanceWithClock(sideA: SideState[], sideB: SideState[], clock?: Clock | null): number {
	const lifeA = remainingLife(sideA);
	const lifeB = remainingLife(sideB);
	const base = gameWinChance(lifeA, lifeB);
	if (!clock) return base;
	const timeout = timeoutWinChance(sideA, sideB);
	const lead = Math.abs(sum(sideA, (s) => s.stocks) - sum(sideB, (s) => s.stocks));
	// The leader's current stock can go any moment; each one after that takes at least an SD.
	if (lead > 1 && (lead - 1) * SD_STOCK_SECONDS > clock.secondsLeft) return timeout;
	// Share of the game that still fits: stocks expected before time vs stocks until it ends by KOs.
	const stocksToEnd = 2 * Math.min(lifeA, lifeB);
	const fits = stocksToEnd <= 0 ? 1 : Math.min(1, clock.secondsLeft / stockPace(clock.stockSeconds).avg / stocksToEnd);
	return fits * base + (1 - fits) * timeout;
}

/** Chance side A wins the set (0–1): the running game at `gameChance`, later games 50/50. */
export function setWinChance(gameChance: number, score: [number, number], bestOf: number): number {
	const need = Math.ceil(bestOf / 2);
	const later = (a: number, b: number): number => (a >= need ? 1 : b >= need ? 0 : 0.5 * later(a + 1, b) + 0.5 * later(a, b + 1));
	if (score[0] >= need) return 1;
	if (score[1] >= need) return 0;
	return gameChance * later(score[0] + 1, score[1]) + (1 - gameChance) * later(score[0], score[1] + 1);
}

/** Both chances for sides A/B. Without a running game (no live stocks) the game counts as 50/50. */
export function winChances(sideA: SideState[], sideB: SideState[], score: [number, number], bestOf: number, clock?: Clock | null) {
	const live = sideA.length > 0 && sideB.length > 0;
	const game = live ? gameWinChanceWithClock(sideA, sideB, clock) : 0.5;
	const set = setWinChance(game, score, bestOf);
	return { game: [game, 1 - game] as [number, number], set: [set, 1 - set] as [number, number], live };
}
