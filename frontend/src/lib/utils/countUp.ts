/**
 * The "Count" trigger animation: a number element counts from its old value to the new one. Only when
 * BOTH values are pure numbers: an optional minus, digits (optionally grouped as 1,500), optional
 * decimals and an optional trailing %. Anything else just switches without an animation.
 * The count runs at COUNT_TICKS_PER_SECOND over the animation's duration with its easing; the shown
 * value keeps the NEW value's format (decimals, grouping, %).
 */
export const COUNT_TICKS_PER_SECOND = 30;

export interface NumberFormat {
	decimals: number;
	grouped: boolean;
	percent: boolean;
}

/** A pure number shown as text (whitespace ignored), or null. */
export function parsePureNumber(text: string | null | undefined): { value: number; format: NumberFormat } | null {
	const m = /^(-?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(%?)$/.exec((text ?? '').replace(/\s+/g, ''));
	if (!m) return null;
	const [, sign, int, dec = '', percent] = m;
	return {
		value: Number(`${sign}${int.replace(/,/g, '')}${dec ? `.${dec}` : ''}`),
		format: { decimals: dec.length, grouped: int.includes(','), percent: percent === '%' },
	};
}

/** The integer and decimal parts of a value in a format (sign on the integer part). */
export function numberParts(value: number, format: NumberFormat): { int: string; dec: string } {
	const fixed = Math.abs(value).toFixed(format.decimals);
	const [int, dec = ''] = fixed.split('.');
	const grouped = format.grouped ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : int;
	const negative = value < 0 && Number(fixed) !== 0;
	return { int: `${negative ? '-' : ''}${grouped}`, dec };
}

/** A value as text in a format, e.g. 1234.5 → "1,234.5%". */
export const formatNumber = (value: number, format: NumberFormat) => {
	const { int, dec } = numberParts(value, format);
	return `${int}${dec ? `.${dec}` : ''}${format.percent ? '%' : ''}`;
};

/** The value at progress t (0–1) of a count, eased. */
export const countValue = (from: number, to: number, t: number, easing: (t: number) => number = (x) => x) =>
	from + (to - from) * easing(Math.min(1, Math.max(0, t)));

/** Every value a count shows, one per tick (the last one is exactly `to`). */
export function countTicks(from: number, to: number, durationMs: number, easing?: (t: number) => number): number[] {
	const ticks = Math.max(1, Math.round((durationMs / 1000) * COUNT_TICKS_PER_SECOND));
	return Array.from({ length: ticks }, (_, i) => (i === ticks - 1 ? to : countValue(from, to, (i + 1) / ticks, easing)));
}
