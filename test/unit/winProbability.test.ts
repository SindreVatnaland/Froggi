import { playerKoPercent, gameWinChance, gameWinChanceWithClock, remainingLife, secondsLeft, setWinChance, stockPace, timeoutWinChance, winChances } from '../../frontend/src/lib/utils/winProbability';

describe('win probability', () => {
	it('remaining life: stocks minus progress into the current stock; teams sum', () => {
		expect(remainingLife([{ stocks: 4, percent: 0 }])).toBe(4);
		expect(remainingLife([{ stocks: 2, percent: 60 }])).toBeCloseTo(1.5);
		expect(remainingLife([{ stocks: 1, percent: 300 }])).toBeCloseTo(0.05); // never 0 while alive
		expect(remainingLife([{ stocks: 0, percent: 50 }, { stocks: 3, percent: 0 }])).toBe(3);
	});

	it('even game is 50/50; a lead counts more than a plain ratio', () => {
		expect(gameWinChance(4, 4)).toBe(0.5);
		expect(gameWinChance(3, 1)).toBeCloseTo(0.9); // 9 / 10
		expect(gameWinChance(1, 0)).toBe(1);
	});

	it('set chance: running game, later games 50/50', () => {
		expect(setWinChance(0.5, [0, 0], 3)).toBe(0.5);
		expect(setWinChance(0.5, [1, 0], 3)).toBe(0.75); // win this (1) or lose and win game 3 (0.5)
		expect(setWinChance(0.9, [1, 1], 3)).toBeCloseTo(0.9); // game 3 decides
		expect(setWinChance(0.2, [2, 0], 3)).toBe(1); // already decided
		expect(setWinChance(0.5, [0, 2], 5)).toBeCloseTo(0.125); // must win 3 in a row: 0.5 · 0.5 · 0.5
	});

	it('no running game → the game counts as 50/50', () => {
		const r = winChances([], [], [1, 0], 3);
		expect(r).toMatchObject({ live: false, game: [0.5, 0.5], set: [0.75, 0.25] });
	});

	it('timer: seconds left only on a counting-down timer', () => {
		expect(secondsLeft({ timerType: 2, startingTimerSeconds: 480 }, 600)).toBe(470);
		expect(secondsLeft({ timerType: 2, startingTimerSeconds: 480 }, -100)).toBe(480);
		expect(secondsLeft({ timerType: 0, startingTimerSeconds: 480 }, 600)).toBeNull();
	});

	it('stock pace: avg pulled toward the default while there is little data', () => {
		expect(stockPace([])).toEqual({ avg: 40, min: null, max: null });
		expect(stockPace([10, 30])).toEqual({ avg: 30, min: 10, max: 30 });
	});

	it('timeout winner: more stocks, then lower percent', () => {
		expect(timeoutWinChance([{ stocks: 2, percent: 150 }], [{ stocks: 1, percent: 0 }])).toBe(1);
		expect(timeoutWinChance([{ stocks: 1, percent: 80 }], [{ stocks: 1, percent: 20 }])).toBe(0);
		expect(timeoutWinChance([{ stocks: 1, percent: 20 }], [{ stocks: 1, percent: 20 }])).toBe(0.5);
	});

	it('clock: plenty of time = stocks only; running out leans to the timeout winner', () => {
		const a = [{ stocks: 2, percent: 0 }];
		const b = [{ stocks: 1, percent: 0 }];
		const base = gameWinChance(2, 1);
		expect(gameWinChanceWithClock(a, b, { secondsLeft: 400 })).toBeCloseTo(base); // 400 / 40 = 10 stocks ≥ 2
		expect(gameWinChanceWithClock(a, b, { secondsLeft: 40 })).toBeCloseTo(0.5 * base + 0.5); // 1 of 2 stocks fits
		expect(gameWinChanceWithClock(a, b, { secondsLeft: 0 })).toBe(1);
		// Lead of 3 with 8 s left: two more SDs (10 s) don't fit → sure win
		expect(gameWinChanceWithClock([{ stocks: 4, percent: 0 }], [{ stocks: 1, percent: 0 }], { secondsLeft: 8 })).toBe(1);
		// Even stocks, percent lead, little time → leader favoured over the stocks-only 50/50... by percent
		expect(gameWinChanceWithClock([{ stocks: 1, percent: 10 }], [{ stocks: 1, percent: 100 }], { secondsLeft: 5 })).toBeGreaterThan(gameWinChance(remainingLife([{ stocks: 1, percent: 10 }]), remainingLife([{ stocks: 1, percent: 100 }])));
	});
});

describe('per-player death percent (set average)', () => {
	it('starts at 120% and moves toward the player\'s own average as they lose stocks', () => {
		expect(playerKoPercent({})).toBe(120);
		expect(playerKoPercent({ deaths: 2, deathPercent: 120 })).toBe(90); // avg 60%, two virtual 120% deaths
		expect(playerKoPercent({ deaths: 10, deathPercent: 600 })).toBeCloseTo(70); // avg 60% dominates
	});

	it('the same percent costs a light character (dies early) more of a stock than a heavy one', () => {
		const light = remainingLife([{ stocks: 2, percent: 60, deaths: 6, deathPercent: 360 }]); // dies ~60%
		const heavy = remainingLife([{ stocks: 2, percent: 60, deaths: 6, deathPercent: 1080 }]); // dies ~180%
		expect(light).toBeLessThan(heavy);
		expect(gameWinChance(heavy, light)).toBeGreaterThan(0.5);
	});
});
