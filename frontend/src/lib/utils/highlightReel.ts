/**
 * Media keys and highlight replays. A flow's "Set media" card puts ONE thing on a key: a file (served by id at
 * /media/<id>, never by path) or a web link, with an optional window (seconds into the video). Every client
 * plays the same position: (server now − startedAt) mod the window length. The Highlight Replay element plays
 * a flow list of {replay, startFrame, endFrame} items, redrawn from frames Froggi reads from the .slp.
 */

export interface HighlightClip {
	/** /media/<id>, or a web link. */
	url: string;
	/** Seconds into the video; null = from the start / to the end. */
	start?: number | null;
	end?: number | null;
}

export interface HighlightReel {
	id: string;
	key: string;
	clips: HighlightClip[];
	/** What the key shows: a video (default) or an image. */
	kind?: 'video' | 'image';
	/** Server time (ms) the first client showed it; null until then. */
	startedAt: number | null;
}

export type HighlightReels = Record<string, HighlightReel>;

/** One highlight of a replay list (the fields the Highlight Replay element reads from a flow list item). */
export interface ReplayListItem {
	/** The .slp's file id ({{state.replay.file}}). */
	replay: string;
	startFrame: number;
	endFrame: number;
}

/** A flow list for Highlight Replay elements: its replay items and when it last changed (server ms — the clock). */
export interface ReplayList {
	name: string;
	items: ReplayListItem[];
	changedAt: number;
}

/** Frames of one replay window (slimmed), sent once per window. */
export interface HighlightFrames {
	settings: import('./viewer/renderData').ViewerSettings;
	frames: import('./viewer/renderData').ViewerFrame[];
}

/** A window's cache key. */
export const framesKey = (i: ReplayListItem) => `${i.replay}:${i.startFrame}:${i.endFrame}`;

/** A file id Froggi hands out ({{file}}, {{state.replay.file}}). */
export const MEDIA_ID = /^[0-9a-f]{12}$/;

/** At most this many frames per window (60 s). */
export const MAX_REPLAY_FRAMES = 3600;

/** Only well-formed replay items (an overlay may ask for any list — only these fields leave Froggi). */
export function replayItems(list: Record<string, unknown>[]): ReplayListItem[] {
	return list.flatMap((i) => {
		const replay = String(i.replay ?? '');
		const startFrame = Math.round(Number(i.startFrame));
		const endFrame = Math.round(Number(i.endFrame));
		if (!MEDIA_ID.test(replay) || !Number.isFinite(startFrame) || !Number.isFinite(endFrame) || endFrame <= startFrame) return [];
		return [{ replay, startFrame, endFrame: Math.min(endFrame, startFrame + MAX_REPLAY_FRAMES) }];
	});
}
