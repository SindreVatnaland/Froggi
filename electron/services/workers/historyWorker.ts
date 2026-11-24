import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import type { HistoryStatus } from '../../../frontend/src/lib/models/types/history';
import { type Db, getMeta, markFile, openHistoryDb, openHistoryReader, runQuery, setMeta, storeReplay } from '../history/historyDb';
import { readReplay } from '../history/historyRows';

/**
 * Game history import + the AI's queries, off the main thread. `count` only lists the replay folder (how many
 * replays aren't imported yet); `import` imports them one at a time (newest first), yielding between files so
 * queries and pause / cancel messages get through. Cancelling keeps what was imported — the next import picks up
 * the rest (the files table remembers every file). The main thread restarts this worker when a query runs too long.
 */
export type HistoryWorkerIn =
	| { type: 'count'; root: string }
	| { type: 'import'; root: string }
	| { type: 'cancel' }
	| { type: 'importFile'; root: string; file: string }
	| { type: 'pause'; paused: boolean }
	| { type: 'setMe'; code: string | null }
	| { type: 'query'; id: number; sql: string; limit: number };
export type HistoryWorkerOut =
	| { type: 'status'; status: Partial<HistoryStatus> }
	| { type: 'queryResult'; id: number; result?: ReturnType<typeof runQuery>; error?: string };

const { dbPath } = workerData as { dbPath: string };
const db: Db = openHistoryDb(dbPath);
const reader: Db = openHistoryReader(dbPath);
const post = (msg: HistoryWorkerOut) => parentPort?.postMessage(msg);

// Files written in the last minute may still be a game in progress — the game-end import or the next scan gets them.
const SETTLE_MS = 60_000;

let queue: { abs: string; rel: string; mtime: number }[] = [];
let total = 0;
let done = 0;
let failed = 0;
let paused = false;
let pumping = false;
let lastSent = 0;
/** Replays not imported yet (null = not counted yet). */
let pending: number | null = null;
/** A user-started import of the whole folder is running (vs only a finished game being added). */
let backfilling = false;

const gameCount = () => Number(reader.prepare('SELECT count(*) AS n FROM games').get()?.n ?? 0);
const relative = (root: string, file: string) => {
	const rel = path.relative(root, file);
	return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.split(path.sep).join('/') : file;
};

function sendStatus(force = false) {
	const now = Date.now();
	if (!force && now - lastSent < 250) return;
	lastSent = now;
	const state = paused && queue.length ? 'paused' : queue.length ? 'importing' : 'idle';
	post({ type: 'status', status: { state, total, done, failed, pending: backfilling ? queue.length : pending, games: gameCount(), me: getMeta(db, 'me_code') ?? null } });
}

function listReplays(dir: string, out: string[] = []): string[] {
	let entries: fs.Dirent[] = [];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) listReplays(full, out);
		else if (e.isFile() && e.name.toLowerCase().endsWith('.slp')) out.push(full);
	}
	return out;
}

/** Replays in the folder that aren't imported (or changed since), newest first. */
function findNew(root: string) {
	const known = new Map(db.prepare('SELECT path, mtime FROM files').all().map((r) => [r.path as string, Number(r.mtime)]));
	const queued = new Set(queue.map((q) => q.rel));
	const now = Date.now();
	const found: typeof queue = [];
	for (const abs of listReplays(root)) {
		let mtime = 0;
		try {
			mtime = Math.trunc(fs.statSync(abs).mtimeMs);
		} catch {
			continue;
		}
		const rel = relative(root, abs);
		if (known.get(rel) === mtime || queued.has(rel) || now - mtime < SETTLE_MS) continue;
		found.push({ abs, rel, mtime });
	}
	found.sort((a, b) => b.mtime - a.mtime);
	return found;
}

function count(root: string) {
	if (queue.length) return; // importing: the queue is the count
	post({ type: 'status', status: { state: 'scanning' } });
	pending = findNew(root).length;
	sendStatus(true);
}

function startImport(root: string) {
	post({ type: 'status', status: { state: 'scanning' } });
	const found = findNew(root);
	backfilling = true;
	if (!queue.length) {
		total = 0;
		done = 0;
		failed = 0;
	}
	queue.push(...found);
	total += found.length;
	if (!queue.length) {
		backfilling = false;
		pending = 0;
	}
	sendStatus(true);
	pump();
}

function importOne(item: { abs: string; rel: string; mtime: number }) {
	try {
		storeReplay(db, readReplay(item.abs, item.rel, item.mtime));
	} catch (e) {
		failed++;
		markFile(db, item.rel, item.mtime, 'error', String((e as Error)?.message ?? e).slice(0, 300));
	}
}

function pump() {
	if (pumping) return;
	pumping = true;
	const step = () => {
		if (paused || !queue.length) {
			pumping = false;
			sendStatus(true);
			return;
		}
		importOne(queue.shift()!);
		done++;
		if (!queue.length && backfilling) {
			backfilling = false;
			pending = 0;
		}
		sendStatus();
		setImmediate(step); // let queries / pause messages in between files
	};
	setImmediate(step);
}

parentPort?.on('message', (msg: HistoryWorkerIn) => {
	switch (msg.type) {
		case 'count':
			count(msg.root);
			break;
		case 'import':
			startImport(msg.root);
			break;
		case 'cancel':
			pending = queue.length;
			queue = [];
			backfilling = false;
			sendStatus(true);
			break;
		case 'importFile': {
			let mtime = 0;
			try {
				mtime = Math.trunc(fs.statSync(msg.file).mtimeMs);
			} catch {
				break;
			}
			const rel = relative(msg.root, msg.file);
			queue = queue.filter((q) => q.rel !== rel);
			if (!queue.length) {
				total = 0;
				done = 0;
				failed = 0;
			}
			queue.unshift({ abs: msg.file, rel, mtime });
			total++;
			pump();
			break;
		}
		case 'pause':
			paused = msg.paused;
			if (!paused) pump();
			sendStatus(true);
			break;
		case 'setMe':
			setMeta(db, 'me_code', msg.code);
			sendStatus(true);
			break;
		case 'query':
			try {
				post({ type: 'queryResult', id: msg.id, result: runQuery(reader, msg.sql, msg.limit) });
			} catch (e) {
				post({ type: 'queryResult', id: msg.id, error: String((e as Error)?.message ?? e) });
			}
			break;
	}
});

sendStatus(true);
