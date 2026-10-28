import { COUNT_TICKS_PER_SECOND, countValue, numberParts, parsePureNumber, type NumberFormat } from '$lib/utils/countUp';

/**
 * Runs a Count animation on an element's DOM (see utils/countUp.ts). The number may be split over text
 * nodes (percent elements: "57" + ".3%"), so each tick rewrites only the digits and keeps the rest.
 * While counting, the element's published value (elementValue) is held at the real value through
 * `data-trigger-value`, so element triggers see real changes only — never the counting in between.
 * A real new value mid-count (the element re-rendered) retargets: it counts on from the shown number.
 */

const textNodes = (root: Node): Text[] => {
	const out: Text[] = [];
	const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let n = walk.nextNode(); n; n = walk.nextNode()) if ((n.nodeValue ?? '').trim()) out.push(n as Text);
	return out;
};

/** Writes a value into the element's text: the whole number where it is in one node, else int + decimals. */
function writeNumber(root: Node, value: number, format: NumberFormat) {
	const { int, dec } = numberParts(value, format);
	let intDone = false;
	for (const node of textNodes(root)) {
		const text = node.nodeValue ?? '';
		if (!intDone) {
			const m = /-?[\d,]*\d(?:\.\d+)?/.exec(text);
			if (!m) continue;
			const whole = m[0].includes('.');
			node.nodeValue = text.slice(0, m.index) + (whole ? `${int}${dec ? `.${dec}` : ''}` : int) + text.slice(m.index + m[0].length);
			intDone = true;
			if (whole || !dec) return;
			continue;
		}
		const d = /\.\d+/.exec(text);
		if (d) {
			node.nodeValue = text.slice(0, d.index) + `.${dec}` + text.slice(d.index + d[0].length);
			return;
		}
	}
}

const shownText = (root: Element) => (root.textContent ?? '').trim();

export interface CountRun {
	stop: () => void;
	readonly running: boolean;
}

/**
 * Counts the element under `root` from `fromText` to `toText` (both must be pure numbers, else nothing
 * happens and null is returned). `holder` = the element whose data-trigger-value freezes the published value.
 */
export function startCount(
	root: Element,
	holder: Element | null,
	fromText: string,
	toText: string,
	durationMs: number,
	delayMs: number,
	easing: (t: number) => number,
): CountRun | null {
	const from = parsePureNumber(fromText);
	const first = parsePureNumber(toText);
	if (!from || !first || durationMs <= 0) return null;
	let target: { value: number; format: NumberFormat } = first;
	let start = from.value;
	let shown = from.value;
	let startedAt = performance.now() + Math.max(0, delayMs);
	let lastWritten: string | null = null;
	let running = true;
	holder?.setAttribute('data-trigger-value', toText);

	const finish = () => {
		clearInterval(timer);
		watcher.disconnect();
		running = false;
		holder?.removeAttribute('data-trigger-value');
	};
	const tick = () => {
		if (!root.isConnected) return finish();
		const now = performance.now();
		// The element re-rendered with a newer real value: count on from what is shown towards it.
		const current = shownText(root);
		if (lastWritten !== null && current !== lastWritten) {
			const real = parsePureNumber(current);
			if (!real) return finish();
			target = real;
			holder?.setAttribute('data-trigger-value', current);
			start = shown;
			startedAt = now;
		}
		if (now < startedAt) {
			writeNumber(root, start, target.format);
			lastWritten = shownText(root);
			return;
		}
		const t = (now - startedAt) / durationMs;
		shown = t >= 1 ? target.value : countValue(start, target.value, t, easing);
		writeNumber(root, shown, target.format);
		lastWritten = shownText(root);
		if (t >= 1) finish();
	};
	const timer = setInterval(tick, 1000 / COUNT_TICKS_PER_SECOND);
	// A real new value (the element re-rendered) is handled right away, before it is painted — not on
	// the next tick, which would flash the new value for a frame. Our own writes match lastWritten.
	const watcher = new MutationObserver(() => {
		if (running && shownText(root) !== lastWritten) tick();
	});
	watcher.observe(root, { subtree: true, childList: true, characterData: true });
	tick();
	return {
		stop: finish,
		get running() {
			return running;
		},
	};
}
