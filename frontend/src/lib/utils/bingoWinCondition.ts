import type { BingoBox, BingoWinCondition } from '../models/types/bingo';

export function countLines(boxes: BingoBox[], sz: number, filter: (b: BingoBox) => boolean): number {
	const done = new Set(boxes.map((b, i) => (filter(b) ? i : -1)).filter(i => i >= 0));
	let n = 0;
	for (let r = 0; r < sz; r++) {
		if (Array.from({ length: sz }, (_, c) => r * sz + c).every(i => done.has(i))) n++;
	}
	for (let c = 0; c < sz; c++) {
		if (Array.from({ length: sz }, (_, r) => r * sz + c).every(i => done.has(i))) n++;
	}
	if (Array.from({ length: sz }, (_, i) => i * sz + i).every(i => done.has(i))) n++;
	if (Array.from({ length: sz }, (_, i) => i * sz + (sz - 1 - i)).every(i => done.has(i))) n++;
	return n;
}

export function countControlledLines(boxes: BingoBox[], sz: number, player: 'local' | 'opponent'): number {
	const mine = (b: BingoBox) =>
		player === 'local'
			? b.completedBy === 'local' || b.completedBy === 'both'
			: b.completedBy === 'opponent' || b.completedBy === 'both';
	const required = Math.floor(sz / 2) + 1;
	let n = 0;
	for (let r = 0; r < sz; r++) {
		const line = Array.from({ length: sz }, (_, c) => r * sz + c);
		if (line.filter(i => mine(boxes[i])).length >= required) n++;
	}
	for (let c = 0; c < sz; c++) {
		const line = Array.from({ length: sz }, (_, r) => r * sz + c);
		if (line.filter(i => mine(boxes[i])).length >= required) n++;
	}
	// Main diagonal (top-left → bottom-right)
	const d1 = Array.from({ length: sz }, (_, i) => i * sz + i);
	if (d1.filter(i => mine(boxes[i])).length >= required) n++;
	// Anti-diagonal (top-right → bottom-left)
	const d2 = Array.from({ length: sz }, (_, i) => i * sz + (sz - 1 - i));
	if (d2.filter(i => mine(boxes[i])).length >= required) n++;
	return n;
}

export function hasWon(boxes: BingoBox[], size: number, wc: BingoWinCondition): boolean {
	if (wc === 'full') return boxes.every(b => b.completed);
	if (wc === 'lockout') {
		const total = boxes.length;
		const localCount = boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
		const oppCount = boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
		return localCount > total / 2 || oppCount > total / 2;
	}
	if (wc === 'rowcontrol') {
		return countControlledLines(boxes, size, 'local') >= 3 || countControlledLines(boxes, size, 'opponent') >= 3;
	}
	const n = wc as number;
	const localLines = countLines(boxes, size, b => b.completedBy === 'local' || b.completedBy === 'both');
	const oppLines = countLines(boxes, size, b => b.completedBy === 'opponent' || b.completedBy === 'both');
	return localLines >= n || oppLines >= n;
}

export function scoreTarget(boxes: BingoBox[], _size: number, wc: BingoWinCondition): number {
	if (wc === 'rowcontrol') return 3;
	if (wc === 'lockout') return Math.floor(boxes.length / 2) + 1;
	if (wc === 'full') return boxes.length;
	return wc as number;
}
