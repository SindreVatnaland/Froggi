import { nextRadarSide } from '../../frontend/src/lib/utils/radarSide';

const on = { offStage: false, side: 'left' as const };
const offLeft = { offStage: true, side: 'left' as const };
const offRight = { offStage: true, side: 'right' as const };

describe('nextRadarSide (Ultimate radar)', () => {
	it('appears on the side the fighter went off', () => {
		expect(nextRadarSide(null, [offRight, on])).toBe('right');
		expect(nextRadarSide(null, [on, offLeft])).toBe('left');
	});
	it('stays put while active — a second fighter off the other side never adds a second radar', () => {
		expect(nextRadarSide('right', [offRight, offLeft])).toBe('right');
		expect(nextRadarSide('right', [on, offLeft])).toBe('right'); // first one returned, other still off
	});
	it('stays on its side even if the fighter crosses under the stage', () => {
		expect(nextRadarSide('left', [offRight, on])).toBe('left');
	});
	it('hides when everyone is back, then re-picks the side next time', () => {
		expect(nextRadarSide('left', [on, on])).toBeNull();
		expect(nextRadarSide(null, [offRight, on])).toBe('right');
	});
});
