import { ComboHold, comboKey } from '../../electron/utils/comboHold';

describe('ComboHold (hold 0.5s, then 1s cooldown)', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('fires only after the combo is held for 500ms', () => {
		const hold = new ComboHold(500, 1000);
		const fire = jest.fn();
		hold.update('L+R', fire);
		jest.advanceTimersByTime(499);
		expect(fire).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(fire).toHaveBeenCalledTimes(1);
	});

	it('a tap (released before 500ms) does nothing', () => {
		const hold = new ComboHold(500, 1000);
		const fire = jest.fn();
		hold.update('L+R', fire);
		jest.advanceTimersByTime(300);
		hold.update(null, fire);
		jest.advanceTimersByTime(1000);
		expect(fire).not.toHaveBeenCalled();
	});

	it('changing the combo restarts the hold', () => {
		const hold = new ComboHold(500, 1000);
		const fire = jest.fn();
		hold.update('L', fire);
		jest.advanceTimersByTime(400);
		hold.update('L+R', fire);
		jest.advanceTimersByTime(400);
		expect(fire).not.toHaveBeenCalled();
		jest.advanceTimersByTime(100);
		expect(fire).toHaveBeenCalledTimes(1);
	});

	it('cooldown: nothing fires for 1s after a fire', () => {
		const hold = new ComboHold(500, 1000);
		const fire = jest.fn();
		hold.update('L+R', fire);
		jest.advanceTimersByTime(500);
		hold.update(null, fire);
		hold.update('L+R', fire); // pressed again within the cooldown
		jest.advanceTimersByTime(600);
		expect(fire).toHaveBeenCalledTimes(1);
		hold.update(null, fire);
		jest.advanceTimersByTime(500); // cooldown over
		hold.update('L+R', fire);
		jest.advanceTimersByTime(500);
		expect(fire).toHaveBeenCalledTimes(2);
	});

	it('comboKey', () => {
		expect(comboKey({ isRPressed: true, isLPressed: true, isAPressed: false })).toBe('isLPressed+isRPressed');
		expect(comboKey({ isAPressed: false })).toBeNull();
	});
});
