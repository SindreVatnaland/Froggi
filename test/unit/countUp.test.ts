import { COUNT_TICKS_PER_SECOND, countTicks, countValue, formatNumber, parsePureNumber } from '../../frontend/src/lib/utils/countUp';

describe('Count animation (numbers count from the old to the new value)', () => {
	it('only pure numbers count: sign, digits, 1,500 grouping, decimals, trailing %', () => {
		expect(parsePureNumber('57')).toEqual({ value: 57, format: { decimals: 0, grouped: false, percent: false } });
		expect(parsePureNumber(' 57 %')).toEqual({ value: 57, format: { decimals: 0, grouped: false, percent: true } }); // percent elements: "57" + "%" spans
		expect(parsePureNumber('57.3%')?.value).toBe(57.3);
		expect(parsePureNumber('1,500')).toEqual({ value: 1500, format: { decimals: 0, grouped: true, percent: false } });
		expect(parsePureNumber('-12.50')?.format.decimals).toBe(2);
		for (const text of ['Mango', '2 - 0', '1500 (+12)', '', '%', '12%%', '1,50', 'P1']) expect(parsePureNumber(text)).toBeNull();
	});

	it('shows the new value\'s format while counting', () => {
		const pct = parsePureNumber('57.3%')!.format;
		expect(formatNumber(12.345, pct)).toBe('12.3%');
		expect(formatNumber(1234.5, { decimals: 1, grouped: true, percent: false })).toBe('1,234.5');
		expect(formatNumber(-0.04, { decimals: 1, grouped: false, percent: false })).toBe('0.0');
	});

	it(`ticks: ${COUNT_TICKS_PER_SECOND} per second over the duration, eased, ending exactly on the new value`, () => {
		const linear = countTicks(0, 60, 1000);
		expect(linear).toHaveLength(COUNT_TICKS_PER_SECOND);
		expect(linear[0]).toBeCloseTo(2);
		expect(linear.at(-1)).toBe(60);
		const easeOut = countTicks(0, 60, 1000, (t) => 1 - (1 - t) ** 3);
		expect(easeOut[4]).toBeGreaterThan(linear[4]); // eased: fast start
		expect(countTicks(57, 0, 300)).toHaveLength(9); // counts down too
		expect(countValue(10, 20, 2)).toBe(20); // clamped
	});
});
