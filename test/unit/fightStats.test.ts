import path from 'path';
import { SlippiGame } from '@slippi/slippi-js/node';
import { FightStatsTracker, avgDeathPercent, avgKoPercent, sumFightStats } from '../../frontend/src/lib/utils/fightStats';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';

type P = [stocks: number, percent: number, lastHitBy?: number];
const frame = (players: Record<number, P>) =>
	({ players: Object.fromEntries(Object.entries(players).map(([i, [stocks, percent, lastHitBy]]) => [i, { post: { stocksRemaining: stocks, percent, lastHitBy: lastHitBy ?? null } }])) }) as any;

const singles = [
	{ playerIndex: 0, connectCode: 'A#1' },
	{ playerIndex: 1, connectCode: 'B#2' },
];
// red: 0 + 2, blue: 1 + 3
const doubles = [
	{ playerIndex: 0, teamId: 0, connectCode: 'R1#1' },
	{ playerIndex: 1, teamId: 1, connectCode: 'B1#1' },
	{ playerIndex: 2, teamId: 0, connectCode: 'R2#1' },
	{ playerIndex: 3, teamId: 1, connectCode: 'B2#1' },
];

describe('fight stats', () => {
	it('stock durations per game and set (seconds from GO or the previous loss)', () => {
		const t = new FightStatsTracker();
		const at = (f: number, players: Record<number, P>) => t.frame({ ...frame(players), frame: f });
		t.startGame(singles, false, true);
		at(0, { 0: [4, 0], 1: [4, 0] });
		at(1800, { 0: [4, 0], 1: [3, 0] }); // B's first stock: 30 s
		at(2400, { 0: [3, 0], 1: [3, 0] }); // A's first stock: 40 s
		at(3000, { 0: [3, 0], 1: [2, 0] }); // B's second: 20 s
		expect(t.snapshot().stockSeconds).toEqual({ game: [30, 40, 20], match: [30, 40, 20] });
		t.startGame(singles, false, false);
		at(0, { 0: [4, 0], 1: [4, 0] });
		at(600, { 0: [3, 0], 1: [4, 0] });
		expect(t.snapshot().stockSeconds).toEqual({ game: [10], match: [30, 40, 20, 10] });
		t.startGame(singles, false, true);
		expect(t.snapshot().stockSeconds).toEqual({ game: [], match: [] });
	});

	it('damage, KO and death percent (singles)', () => {
		const t = new FightStatsTracker();
		t.startGame(singles, false, true);
		t.frame(frame({ 0: [4, 0], 1: [4, 0] }));
		t.frame(frame({ 0: [4, 0], 1: [4, 30, 0] }));
		t.frame(frame({ 0: [4, 12, 1], 1: [4, 90, 0] }));
		t.frame(frame({ 0: [4, 12, 1], 1: [3, 90, 0] })); // B dies at 90
		t.frame(frame({ 0: [4, 12, 1], 1: [3, 0, 0] })); // respawn: no negative damage
		t.frame(frame({ 0: [3, 12, 1], 1: [3, 0] })); // A SDs at 12 (last hit by B → B scores)
		const a = t.game['A#1'];
		const b = t.game['B#2'];
		expect(a).toEqual({ damage: 90, kos: 1, koPercent: 90, deaths: 1, deathPercent: 12 });
		expect(b).toEqual({ damage: 12, kos: 1, koPercent: 12, deaths: 1, deathPercent: 90 });
		expect(avgKoPercent(a)).toBe(90);
		expect(avgDeathPercent(b)).toBe(90);
	});

	it('doubles: teammate hits and KOs do not count', () => {
		const t = new FightStatsTracker();
		t.startGame(doubles, true, true);
		t.frame(frame({ 0: [4, 0], 1: [4, 0], 2: [4, 0], 3: [4, 0] }));
		t.frame(frame({ 0: [4, 20, 2], 1: [4, 40, 0], 2: [4, 0], 3: [4, 10, 2] }));
		t.frame(frame({ 0: [3, 20, 2], 1: [4, 40, 0], 2: [4, 0], 3: [4, 10, 2] })); // teammate KO
		expect(t.game['R1#1']).toEqual({ damage: 40, kos: 0, koPercent: 0, deaths: 1, deathPercent: 20 });
		expect(t.game['R2#1'].damage).toBe(10);
		expect(sumFightStats([t.game['R1#1'], t.game['R2#1']]).damage).toBe(50);
	});

	it('match: finished games + current; a new set resets', () => {
		const t = new FightStatsTracker();
		t.startGame(singles, false, true);
		t.frame(frame({ 0: [4, 0], 1: [4, 0] }));
		t.frame(frame({ 0: [4, 0], 1: [4, 50, 0] }));
		// game 2 with swapped ports: stats follow the connect code
		t.startGame([{ playerIndex: 1, connectCode: 'A#1' }, { playerIndex: 0, connectCode: 'B#2' }], false, false);
		t.frame(frame({ 0: [4, 0], 1: [4, 0] }));
		t.frame(frame({ 0: [4, 25, 1], 1: [4, 0] }));
		expect(t.game['A#1'].damage).toBe(25);
		expect(t.snapshot().match['A#1'].damage).toBe(75);
		t.startGame(singles, false, true);
		expect(t.snapshot().match['A#1'].damage).toBe(0);
	});

	it('matches slippi-js on a real replay (every frame)', () => {
		const game = new SlippiGame(path.join(__dirname, '../sample-games/direct-set-1/Replay 1 [W].slp'));
		const settings = nulled(game.getSettings())!;
		const t = new FightStatsTracker();
		t.startGame(settings.players, false, true);
		const frames = nulled(game.getFrames());
		for (const key of Object.keys(frames).map(Number).sort((a, b) => a - b)) t.frame(frames[key]);
		const overall = game.getStats()!.overall;
		for (const p of settings.players) {
			const mine = t.game[p.connectCode];
			const ref = overall.find((o) => o.playerIndex === p.playerIndex)!;
			expect(mine.kos).toBe(ref.killCount);
			// slippi-js sums conversion damage; frame deltas (incl. hits Slippi names a few frames late) land within ~3%
			expect(Math.abs(mine.damage - ref.totalDamage)).toBeLessThan(ref.totalDamage * 0.03);
		}
	});
});

describe('fight stats: host fixes and loaded games', () => {
	it('host fix: setPlayers moves the current game\'s stats to the new identities', () => {
		const t = new FightStatsTracker();
		t.startGame([{ playerIndex: 0, froggiKey: 'Red-1' }, { playerIndex: 1, froggiKey: 'Red-2' }], false, true);
		t.frame(frame({ 0: [4, 0], 1: [4, 0] }));
		t.frame(frame({ 0: [4, 0], 1: [4, 30, 0] }));
		expect(t.game['Red-1'].damage).toBe(30);
		t.setPlayers([{ playerIndex: 0, froggiKey: 'Red-2' }, { playerIndex: 1, froggiKey: 'Red-1' }]);
		expect(t.game['Red-2'].damage).toBe(30);
		expect(t.game['Red-1'].damage).toBe(0);
	});

	it('loaded games count toward the match', () => {
		const t = new FightStatsTracker();
		t.startGame([{ playerIndex: 0, connectCode: 'A#1' }], false, true);
		t.setFinished([{ 'A#1': { damage: 100, kos: 2, koPercent: 200, deaths: 1, deathPercent: 90 } }, { 'A#1': { damage: 50, kos: 1, koPercent: 120, deaths: 0, deathPercent: 0 } }]);
		expect(t.snapshot().match['A#1']).toEqual({ damage: 150, kos: 3, koPercent: 320, deaths: 1, deathPercent: 90 });
	});
});

describe('fight stats: late lastHitBy', () => {
	it('damage that lands before Slippi names the attacker still counts (doubles: once named)', () => {
		const t = new FightStatsTracker();
		t.startGame([{ playerIndex: 0, teamId: 0, connectCode: 'R#1' }, { playerIndex: 1, teamId: 1, connectCode: 'B#1' }, { playerIndex: 2, teamId: 0, connectCode: 'R#2' }, { playerIndex: 3, teamId: 1, connectCode: 'B#2' }], true, true);
		t.frame(frame({ 0: [4, 0], 1: [4, 0], 2: [4, 0], 3: [4, 0] }));
		t.frame(frame({ 0: [4, 12, 6], 1: [4, 0], 2: [4, 0], 3: [4, 0] })); // lastHitBy 6 = nobody yet
		expect(t.game['B#1'].damage).toBe(0);
		t.frame(frame({ 0: [4, 12, 1], 1: [4, 0], 2: [4, 0], 3: [4, 0] }));
		expect(t.game['B#1'].damage).toBe(12);
	});

	it('singles: the only opponent gets it straight away; a KO uses the last known attacker', () => {
		const t = new FightStatsTracker();
		t.startGame(singles, false, true);
		t.frame(frame({ 0: [4, 0], 1: [4, 0] }));
		t.frame(frame({ 0: [4, 0], 1: [4, 20, 6] }));
		expect(t.game['A#1'].damage).toBe(20);
		t.frame(frame({ 0: [4, 0], 1: [3, 20, 6] }));
		expect(t.game['A#1'].kos).toBe(1);
	});
});
