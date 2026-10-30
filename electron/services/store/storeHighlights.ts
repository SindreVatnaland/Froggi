import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { MessageHandler } from '../messageHandler';
import { videoDuration } from '../../utils/videoDuration';
import { placeClips, type HighlightMoment, type HighlightReel, type HighlightReels, type SavedBuffer } from '../../../frontend/src/lib/utils/highlightReel';
import { SqliteOrm } from '../sqlite/initiSqlite';
import { HighlightEntity } from '../sqlite/entities/highlight/highlightEntity';
import { SlippiGame } from '@slippi/slippi-js/node';
import { nulled } from '../../../frontend/src/lib/models/types/slippiTypes';
import { slimFrame, slimSettings } from '../../../frontend/src/lib/utils/viewer/slimFrames';
import type { ViewerFrame } from '../../../frontend/src/lib/utils/viewer/renderData';
import type { HighlightFrames } from '../../../frontend/src/lib/utils/highlightReel';

/** Formats a browser (OBS browser source) can play. */
const PLAYABLE = ['.mp4', '.webm', '.mov', '.m4v'];
/** Images a media key can show. */
const IMAGE = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
/** A Mark highlight id ({{highlight}}). */
export const HIGHLIGHT_ID = /^h-[0-9a-f]{8}$/;
/** How long Build reel waits for replay saves Froggi asked for that OBS hasn't written yet. */
const SAVE_WAIT_MS = 15000;

interface Buffer extends SavedBuffer {
	file: string;
}

/** Where a highlight sits in an OBS replay-buffer file: the file, seconds before its end. */
interface Footage {
	file: string;
	fromEnd: number;
	toEnd: number;
}

type Moment = HighlightMoment & { id: string; footage?: Footage };

/**
 * Highlight moments, the replay-buffer files OBS saved, and the reels built from them (see
 * utils/highlightReel.ts). Files stay where OBS saved them; Froggi serves only registered ids at
 * /highlights/<id>. Nothing is cleared or deleted on its own: a reel changes when a flow builds it again.
 */
@singleton()
export class ElectronHighlightStore {
	private moments: Moment[] = [];
	private buffers: Buffer[] = [];
	private reels: HighlightReels = {};
	/** Request times of saves Froggi asked OBS for, oldest first (OBS saves in order). */
	private pendingSaves: number[] = [];
	private saveWaiters: (() => void)[] = [];
	private gameStartedAt = 0;
	/** Volume (0–100) set by the flow card "Set video volume" — overrides the element's own volume. */
	private volumes: Record<string, number> = {};

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		// Optional: without it (unit tests) highlights live in memory only.
		@inject(delay(() => SqliteOrm)) private sqlite?: SqliteOrm,
	) {}

	// ── Saved highlights (SQLite) ────────────────────────────────────────────────────────────────
	private async repo() {
		if (!this.sqlite) return null;
		await this.sqlite.initializing;
		return this.sqlite.getRepository(HighlightEntity);
	}

	private persist(id: string, fields: Partial<HighlightEntity>, insert = false) {
		void this.repo()
			.then(async (r) => {
				if (!r) return;
				if (insert) await r.save({ id, ...fields });
				else await r.update(id, fields);
			})
			.catch((err) => this.log.warn(`Could not save highlight ${id}`, err));
	}

	/** A highlight by id: this session's, else a saved one (e.g. Daily after a restart). */
	private async lookup(id: string): Promise<Moment | undefined> {
		const known = this.moments.find((m) => m.id === id);
		if (known) return known;
		const row = await (await this.repo())?.findOne({ where: { id } }).catch(() => null);
		if (!row) return undefined;
		return {
			id: row.id,
			start: row.start,
			end: row.end,
			score: row.score,
			...(row.startFrame !== null && row.endFrame !== null ? { frames: { start: row.startFrame, end: row.endFrame } } : {}),
			...(row.file && row.fromEnd !== null && row.toEnd !== null ? { footage: { file: row.file, fromEnd: row.fromEnd, toEnd: row.toEnd } } : {}),
		};
	}

	/** Froggi asked OBS to save its replay buffer at `at` — the saved file ends then. */
	requestedSave(at = Date.now()) {
		this.pendingSaves.push(at);
	}

	/** OBS wrote a replay-buffer file. */
	saved(file: string) {
		// A request OBS never answered (over a minute ago) must not time this file.
		this.pendingSaves = this.pendingSaves.filter((at) => Date.now() - at < 60000);
		const requested = this.pendingSaves.shift();
		// ponytail: a save Froggi didn't ask for (OBS hotkey) is timed by this event, ~0.6 s late per 20 MB.
		const buffer = this.register(file, requested ?? Date.now());
		this.attachFootage(buffer);
		if (!this.pendingSaves.length) this.saveWaiters.splice(0).forEach((done) => done());
	}

	/** Highlights this file holds (that have no footage yet) get it — kept, so they play after a restart. */
	private attachFootage(buffer: Buffer) {
		for (const m of this.moments) {
			if (m.footage) continue;
			const clip = placeClips([m], [buffer])[0];
			if (!clip) continue;
			m.footage = { file: buffer.file, fromEnd: clip.fromEnd, toEnd: clip.toEnd };
			this.persist(m.id, { file: buffer.file, fromEnd: clip.fromEnd, toEnd: clip.toEnd });
		}
	}

	private register(file: string, end: number): Buffer {
		const known = this.buffers.find((b) => b.file === file);
		if (known) return known;
		let duration: number | null = null;
		try {
			duration = videoDuration(file);
		} catch (err) {
			this.log.warn('Could not read the length of', file, err);
		}
		const buffer = { id: `${crypto.randomUUID()}${path.extname(file).toLowerCase()}`, file, end, duration };
		this.buffers = [...this.buffers, buffer].slice(-200);
		return buffer;
	}

	gameStarted(at = Date.now()) {
		this.gameStartedAt = at;
		this.emit();
	}

	/** Remember a moment worth showing (window from momentWindow); higher score = better. */
	/** Remember a moment worth showing; returns its id ({{highlight}} — List cards store it). */
	mark(window: { start: number; end: number; frames?: { start: number; end: number } }, score: number): string {
		// Unique across sessions: saved highlights (Daily) keep their ids after a restart.
		const id = `h-${crypto.randomUUID().slice(0, 8)}`;
		this.moments = [...this.moments, { ...window, score, id }].slice(-2000);
		this.persist(id, { start: window.start, end: window.end, score, startFrame: window.frames?.start ?? null, endFrame: window.frames?.end ?? null }, true);
		this.log.info(`Highlight ${id}: score ${score}, ${((window.end - window.start) / 1000).toFixed(1)} s`);
		return id;
	}

	private framesCache = new Map<string, HighlightFrames>();

	/**
	 * A highlight's frames from its game's replay, slimmed to what the game view draws (the highlight
	 * replay element plays these — sent once, every client plays them on the shared clock). Null when
	 * the game isn't stored yet or its replay is gone.
	 */
	async replayFrames(id: string): Promise<HighlightFrames | null> {
		const cached = this.framesCache.get(id);
		if (cached) return cached;
		const row = await (await this.repo())?.findOne({ where: { id } }).catch(() => null);
		if (!row?.replayPath || row.startFrame === null || row.endFrame === null || !fs.existsSync(row.replayPath)) return null;
		const slp = new SlippiGame(row.replayPath);
		const settings = nulled(slp.getSettings());
		const all = nulled(slp.getFrames());
		if (!settings || !all) return null;
		const frames: ViewerFrame[] = [];
		for (let f = row.startFrame; f <= row.endFrame; f++) if (all[f]) frames.push(slimFrame(all[f] as never));
		const out = { id, settings: slimSettings(settings), frames };
		this.framesCache.set(id, out);
		if (this.framesCache.size > 50) this.framesCache.delete(this.framesCache.keys().next().value!);
		return out;
	}

	/** The stored game's replay + set for this game's highlights (ended after `since`). */
	linkGame(since: number, replayPath: string | null, setId: string | null) {
		for (const m of this.moments.filter((x) => x.end >= since)) this.persist(m.id, { replayPath, setId });
	}

	/** Highlights for the replay element on `key` (their frames, in this order, looping); empty = cleared. */
	setReplayList(key: string, ids: string[]) {
		if (!ids.length) this.reels = Object.fromEntries(Object.entries(this.reels).filter(([k]) => k !== key));
		else this.reels = { ...this.reels, [key]: { id: crypto.randomUUID(), key, kind: 'video', clips: [], highlights: ids, startedAt: null } };
		this.emit();
	}

	/** A highlight with its footage: waits (≤ 15 s) for a replay save Froggi asked for that OBS is still writing. */
	private async withFootage(id: string): Promise<Moment | undefined> {
		let m = await this.lookup(id);
		if (m && !m.footage && this.pendingSaves.length) {
			await new Promise<void>((done) => {
				this.saveWaiters.push(done);
				setTimeout(done, SAVE_WAIT_MS);
			});
			m = await this.lookup(id);
		}
		return m;
	}

	/**
	 * Where a highlight sits in its OBS replay-buffer file, in seconds from the file's START — what the card
	 * "OBS: save replay" (with a highlight) hands on as {{path}} {{start}} {{end}} {{seconds}}. Null = not in a file.
	 */
	async clipFor(id: string): Promise<{ path: string; start: number; end: number; seconds: number } | null> {
		const m = await this.withFootage(id);
		if (!m?.footage) return null;
		const duration = this.register(m.footage.file, 0).duration;
		if (!duration) return null;
		const r2 = (n: number) => Math.round(n * 100) / 100;
		const start = r2(Math.max(0, duration - m.footage.fromEnd));
		const end = r2(Math.max(start, duration - m.footage.toEnd));
		return { path: m.footage.file, start, end, seconds: r2(end - start) };
	}

	/**
	 * Put ONE thing on media key `key` (the flow card "Set media"): a file path, a web link (http/https) or a
	 * highlight id (its replay-buffer clip; its id also lets the replay view show it). `start` / `end` =
	 * seconds from the start of the video (empty = all of it). Images show as images. Nothing → cleared.
	 * `delay` = seconds the stream video runs behind the game (highlights only).
	 */
	async setMedia(key: string, source: string, range: { start?: number | null; end?: number | null } = {}, delay = 0): Promise<HighlightReel | null> {
		const src = source.trim();
		const set = (reel: HighlightReel) => {
			this.reels = { ...this.reels, [key]: reel };
			this.emit();
			return reel;
		};
		if (!src) {
			this.reels = Object.fromEntries(Object.entries(this.reels).filter(([k]) => k !== key));
			this.emit();
			return null;
		}
		const id = crypto.randomUUID();
		const start = range.start ?? null;
		const end = range.end ?? null;
		if (HIGHLIGHT_ID.test(src)) {
			const m = await this.withFootage(src);
			if (!m) throw new Error(`No highlight ${src}`);
			const f = m.footage && fs.existsSync(m.footage.file) ? m.footage : null;
			const clips = f ? [{ url: `/highlights/${this.register(f.file, 0).id}`, fromEnd: Math.max(0, f.fromEnd - delay), toEnd: Math.max(0, f.toEnd - delay) }] : [];
			return set({ id, key, kind: 'video', clips, startedAt: null, highlight: m.id });
		}
		const kind = IMAGE.includes(path.extname(src.split('?')[0]).toLowerCase()) ? 'image' : 'video';
		if (/^https?:\/\//i.test(src)) return set({ id, key, kind, clips: [{ url: src, fromEnd: 0, toEnd: 0, start, end }], startedAt: null });
		const ext = path.extname(src).toLowerCase();
		if (!fs.existsSync(src)) throw new Error(`No file at ${src}`);
		if (kind === 'image') return set({ id, key, kind, clips: [{ url: `/highlights/${this.register(src, 0).id}`, fromEnd: 0, toEnd: 0 }], startedAt: null });
		if (!PLAYABLE.includes(ext)) throw new Error(`${ext || 'This format'} can't play in a browser source — set OBS → Settings → Output → Recording format to MP4 or Hybrid MP4`);
		const buffer = this.register(src, 0);
		// Local MP4/MOV: Froggi knows the length, so the range becomes the end-based offsets every clip uses.
		const duration = buffer.duration;
		const clip = duration
			? { url: `/highlights/${buffer.id}`, fromEnd: Math.max(0, duration - (start ?? 0)), toEnd: Math.max(0, duration - (end ?? duration)) }
			: { url: `/highlights/${buffer.id}`, fromEnd: 0, toEnd: 0, start, end };
		return set({ id, key, kind, clips: [clip], startedAt: null });
	}

	/**
	 * Build video `key` from these highlight ids, in this order (a List card's values). Waits for replay
	 * saves still being written. Ids without a moment or footage are skipped; no clips → the reel is cleared.
	 */
	async build(key: string, ids: string[], delaySeconds = 0): Promise<HighlightReel | null> {
		if (this.pendingSaves.length) await new Promise<void>((done) => {
			this.saveWaiters.push(done);
			setTimeout(done, SAVE_WAIT_MS);
		});
		const byId = new Map(this.moments.map((m) => [m.id, m]));
		const moments = ids.flatMap((id) => byId.get(id) ?? []);
		const clips = placeClips(moments, this.buffers.filter((b) => fs.existsSync(b.file)), delaySeconds).map(({ url, fromEnd, toEnd }) => ({ url, fromEnd, toEnd }));
		if (clips.length) this.reels = { ...this.reels, [key]: { id: crypto.randomUUID(), key, clips, startedAt: null } };
		else this.reels = Object.fromEntries(Object.entries(this.reels).filter(([k]) => k !== key));
		this.log.info(`Highlight reel "${key}": ${clips.length} clip(s) from ${ids.length} highlight(s)`, clips);
		this.emit();
		return this.reels[key] ?? null;
	}

	/** Show one whole video file as reel `key`. Throws with a readable reason. */
	show(key: string, file: string): HighlightReel {
		const ext = path.extname(file).toLowerCase();
		if (!fs.existsSync(file)) throw new Error(`No file at ${file}`);
		if (!PLAYABLE.includes(ext)) throw new Error(`${ext || 'This format'} can't play in a browser source — set OBS → Settings → Output → Recording format to MP4 or Hybrid MP4`);
		// end 0: when this file was recorded is unknown, so it is never footage for marked moments.
		const buffer = this.register(file, 0);
		if (!buffer.duration) throw new Error(`Could not read how long ${path.basename(file)} is (MP4 / MOV only)`);
		const reel = { id: crypto.randomUUID(), key, clips: [{ url: `/highlights/${buffer.id}`, fromEnd: buffer.duration, toEnd: 0 }], startedAt: null };
		this.reels = { ...this.reels, [key]: reel };
		this.emit();
		return reel;
	}

	setVolume(key: string, volume: number) {
		this.volumes = { ...this.volumes, [key]: Math.min(100, Math.max(0, Math.round(volume))) };
		this.emit();
	}

	/** A client shows reel `key` — the shared clock starts once (first client wins). */
	started(key: string, id: string) {
		const reel = this.reels[key];
		if (!reel || reel.id !== id || reel.startedAt !== null) return;
		this.reels = { ...this.reels, [key]: { ...reel, startedAt: Date.now() } };
		this.emit();
	}

	/** This game's moments as game highlights (frames + score), when the game is stored. */
	gameHighlights(): { startFrame: number; endFrame: number; score: number }[] {
		return this.moments.filter((m) => m.end >= this.gameStartedAt && m.frames).map((m) => ({ startFrame: m.frames!.start, endFrame: m.frames!.end, score: m.score }));
	}

	/** When the current game started (wall clock ms). */
	get gameStart() {
		return this.gameStartedAt;
	}

	/** File behind a served id, or undefined (unknown ids are refused). */
	file(id: string): string | undefined {
		return this.buffers.find((b) => b.id === id)?.file;
	}

	current(): HighlightReels {
		return this.reels;
	}

	currentVolumes(): Record<string, number> {
		return this.volumes;
	}

	emit() {
		this.messageHandler.sendMessage('HighlightReels', this.reels, Date.now(), this.volumes);
	}
}
