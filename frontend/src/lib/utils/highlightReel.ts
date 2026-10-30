/**
 * Highlight reels: clips cut out of OBS replay-buffer files WITHOUT re-encoding — a clip is a file plus
 * a time window counted back from the END of the file (the buffer always ends when Froggi asked OBS to
 * save it; measured ~25 ms early on OBS 32). The browser reads the file length from the video metadata,
 * so start = length − fromEnd. Every client plays the same position: (server now − startedAt) mod total.
 */

export interface HighlightClip {
	/** Served path, /highlights/<id>. */
	url: string;
	/** Seconds before the end of the file where the clip starts / stops. */
	fromEnd: number;
	toEnd: number;
	/** Web links (length unknown to Froggi): seconds from the start instead; null = from the start / to the end. */
	start?: number | null;
	end?: number | null;
}

export interface HighlightReel {
	id: string;
	key: string;
	clips: HighlightClip[];
	/** The highlight on this key (Set media with a highlight) — the replay view plays its frames. */
	highlight?: string;
	/** What the key shows: a video (default) or an image (Set media with an image file / link). */
	kind?: 'video' | 'image';
	/** Set replay list: the highlights the replay element plays, in order (their frames). */
	highlights?: string[];
	/** Server time (ms) the first client showed it; null until then. */
	startedAt: number | null;
}

export type HighlightReels = Record<string, HighlightReel>;

/** A highlight's frames from its replay (slimmed), for the highlight replay element — sent once per highlight. */
export interface HighlightFrames {
	id: string;
	settings: import('./viewer/renderData').ViewerSettings;
	frames: import('./viewer/renderData').ViewerFrame[];
}

/** A moment worth showing: the wall-clock window (ms) to show, and how good it is. */
export interface HighlightMoment {
	/** {{highlight}} — what List cards store. */
	id?: string;
	start: number;
	end: number;
	score: number;
	/** The same window in game frames (saved with the game, so the .slp can show it later). */
	frames?: { start: number; end: number };
}

/** The window of a Mark highlight card: around the sequence that fired it ({{startTime}}/{{endTime}},
 *  wall-clock ms) or around now; `maxSeconds` keeps only the end of a long one (e.g. a long edgeguard). */
export function momentWindow(tokens: Record<string, unknown>, before: number, after: number, maxSeconds?: number, now = Date.now(), currentFrame?: number | null) {
	const seq = typeof tokens.startTime === 'number' && typeof tokens.endTime === 'number';
	const end = (seq ? (tokens.endTime as number) : now) + after * 1000;
	let start = (seq ? (tokens.startTime as number) : now) - before * 1000;
	if (maxSeconds && maxSeconds > 0 && end - start > maxSeconds * 1000) start = end - maxSeconds * 1000;
	// Frames (60 per second; the game's first frame is -123): from {{startFrame}}/{{endFrame}}, else the current frame.
	const seqFrames = typeof tokens.startFrame === 'number' && typeof tokens.endFrame === 'number';
	const from = seqFrames ? (tokens.startFrame as number) : currentFrame;
	const to = seqFrames ? (tokens.endFrame as number) : currentFrame;
	if (from == null || to == null) return { start, end };
	const endFrame = Math.round(to + after * 60);
	let startFrame = Math.round(from - before * 60);
	if (maxSeconds && maxSeconds > 0 && endFrame - startFrame > maxSeconds * 60) startFrame = endFrame - Math.round(maxSeconds * 60);
	return { start, end, frames: { start: Math.max(-123, startFrame), end: endFrame } };
}

/** A saved replay-buffer file: when it ends (ms, wall clock) and how long it is (s). */
export interface SavedBuffer {
	id: string;
	end: number;
	duration: number | null;
}

export const clipSeconds = (c: HighlightClip) => Math.max(0, c.fromEnd - c.toEnd);
export const reelSeconds = (clips: HighlightClip[]) => clips.reduce((n, c) => n + clipSeconds(c), 0);

/** Which clip and how far into it a looping reel is after `elapsed` seconds. */
export function reelPosition(clips: HighlightClip[], elapsed: number): { index: number; offset: number } | null {
	const total = reelSeconds(clips);
	if (!clips.length || total <= 0) return null;
	let t = ((elapsed % total) + total) % total;
	for (let index = 0; index < clips.length; index++) {
		const len = clipSeconds(clips[index]);
		if (t < len) return { index, offset: t };
		t -= len;
	}
	return { index: clips.length - 1, offset: 0 };
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Clips for these moments, in the given order (a List card decided which and in what order).
 * `delay` = seconds the stream video runs behind the game (capture latency) — shifts every window later.
 * A moment uses the buffer that ends soonest after its window (else any buffer holding its middle); a
 * moment no saved buffer covers is skipped. Back-to-back overlapping clips from one file are merged.
 */
export function placeClips(moments: HighlightMoment[], buffers: SavedBuffer[], delay = 0): (HighlightClip & { bufferId: string })[] {
	const clips: (HighlightClip & { bufferId: string })[] = [];
	for (const m of moments) {
		const start = m.start + delay * 1000;
		const stop = m.end + delay * 1000;
		const mid = (start + stop) / 2;
		const holding = buffers.filter((b) => b.duration && b.end >= mid && b.end - b.duration * 1000 <= mid);
		const b = [...holding].sort((x, y) => Number(y.end >= stop) - Number(x.end >= stop) || x.end - y.end)[0];
		if (!b) continue;
		const fromEnd = round(Math.min(b.duration!, (b.end - start) / 1000));
		const toEnd = round(Math.max(0, (b.end - stop) / 1000));
		const prev = clips.at(-1);
		if (prev && prev.bufferId === b.id && fromEnd >= prev.toEnd && fromEnd <= prev.fromEnd) {
			prev.toEnd = Math.min(prev.toEnd, toEnd);
			continue;
		}
		clips.push({ url: `/highlights/${b.id}`, bufferId: b.id, fromEnd, toEnd });
	}
	return clips;
}
