/** Game history import (history.sqlite, read by the AI): progress for Settings → Game history and the MCP. */
export interface HistoryStatus {
	state: 'idle' | 'scanning' | 'importing' | 'paused' | 'error';
	/** Replays in the folder that aren't imported yet (null = not counted yet). */
	pending: number | null;
	/** Replays found to import in this run, and how many are done / failed. */
	total: number;
	done: number;
	failed: number;
	/** Games in the history. */
	games: number;
	/** The signed-in connect code the history calls "me" (null = not signed in). */
	me: string | null;
	/** Add each game to the history right after it ends. */
	importOnGameEnd: boolean;
	replayRoot: string | null;
	error?: string;
}
