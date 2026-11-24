import path from 'path';
import { SlippiGame } from '@slippi/slippi-js/node';
import type { FrameEntryType } from '../../frontend/src/lib/models/types/slippiTypes';
import { SequenceTracker, type SequenceEvent } from '../../electron/utils/sequenceTracker';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';

/** Play a replay frame by frame through the tracker, as Froggi does live. */
const play = (file: string) => {
	const game = new SlippiGame(path.join(__dirname, '../sample-games', file));
	const frames = nulled(game.getFrames());
	let clock = 0;
	const events: SequenceEvent[] = [];
	const tracker = new SequenceTracker((e) => events.push(e), () => clock);
	tracker.start(nulled(game.getSettings())!);
	const numbers = Object.keys(frames).map(Number).sort((a, b) => a - b);
	for (const n of numbers) {
		clock = 1_000_000 + (n * 1000) / 60;
		tracker.frame(frames[n] as FrameEntryType);
	}
	return { game, events };
};

describe('live sequences', () => {
	it('reports every finished punish like Slippi\'s own stats, with wall-clock times', () => {
		const { game, events } = play('direct-set-1/Replay 1 [W].slp');
		const punishes = events.filter((e) => e.kind === 'punish');
		const conversions = game.getStats()!.conversions.filter((c) => c.endFrame != null && c.moves.length);
		expect(punishes.length).toBe(conversions.length);
		expect(punishes.filter((e) => e.didKill).length).toBe(conversions.filter((c) => c.didKill).length);
		for (const e of punishes) {
			expect(e.endFrame).toBeGreaterThanOrEqual(e.startFrame);
			expect(e.endTime - e.startTime).toBeCloseTo(((e.endFrame - e.startFrame) * 1000) / 60, 0);
			expect(e.hits).toBe(e.moves.length);
			expect(['neutral-win', 'counter-attack', 'trade']).toContain(e.openingType);
		}
		expect(punishes.filter((e) => e.didKill && !e.offstage).length).toBeGreaterThan(0); // not every kill is an edgeguard
		const kill = punishes.find((e) => e.didKill)!;
		expect(kill.after[kill.victimIndex].stocks).toBe(kill.before[kill.victimIndex].stocks - 1);
		expect(events.some((e) => e.kind === 'combo')).toBe(true);
	});

	it('doubles: KOs by the same team within 5 s count as a multi-kill', () => {
		const { events } = play('direct-doubles-set-1/Replay 1 [W].slp');
		const kills = events.filter((e) => e.kind === 'punish' && e.didKill);
		expect(kills.length).toBeGreaterThan(0);
		for (const k of kills) expect(k.teamKills).toBeGreaterThanOrEqual(1);
	});

	it('victim activity: people playing have inputs, an idle controller has none; CPUs are flagged', () => {
		const { events } = play('ranked-set-1/Replay 1 [W].slp');
		const punishes = events.filter((e) => e.kind === 'punish');
		expect(punishes.length).toBeGreaterThan(0);
		for (const e of punishes) {
			expect(e.victimIsCpu).toBe(false);
			expect(e.victimInputsPerSecond).toBeGreaterThan(1); // humans in the samples: median ~7/s
		}

		// The same game with the victims' controllers frozen (nobody touching them) and marked as CPUs.
		const game = new SlippiGame(path.join(__dirname, '../sample-games/ranked-set-1/Replay 1 [W].slp'));
		const settings = nulled(game.getSettings())!;
		const frames = nulled(game.getFrames());
		const idle: SequenceEvent[] = [];
		const tracker = new SequenceTracker((e) => idle.push(e), () => 0);
		tracker.start({ ...settings, players: settings.players.map((p) => ({ ...p, type: 1 })) });
		for (const n of Object.keys(frames).map(Number).sort((a, b) => a - b)) {
			const f = frames[n] as FrameEntryType;
			const players = Object.fromEntries(Object.entries(f.players ?? {}).map(([i, d]) => [i, d && { ...d, pre: { ...d.pre, physicalButtons: 0, joystickX: 0, joystickY: 0, cStickX: 0, cStickY: 0, physicalLTrigger: 0, physicalRTrigger: 0 } }]));
			tracker.frame({ ...f, players } as FrameEntryType);
		}
		expect(idle.length).toBeGreaterThan(0);
		for (const e of idle) {
			expect(e.victimInputsPerSecond).toBe(0);
			expect(e.victimIsCpu).toBe(true);
		}
	});
});
