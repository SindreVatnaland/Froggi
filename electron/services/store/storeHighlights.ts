import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { MessageHandler } from '../messageHandler';
import { videoDuration } from '../../utils/videoDuration';
import { MAX_REPLAY_FRAMES, MEDIA_ID, type HighlightFrames, type HighlightReel, type HighlightReels } from '../../../frontend/src/lib/utils/highlightReel';
import { SqliteOrm } from '../sqlite/initiSqlite';
import { MediaFileEntity } from '../sqlite/entities/media/mediaFileEntity';
import { SlippiGame } from '@slippi/slippi-js/node';
import { nulled } from '../../../frontend/src/lib/models/types/slippiTypes';
import { slimFrame, slimSettings } from '../../../frontend/src/lib/utils/viewer/slimFrames';
import type { ViewerFrame } from '../../../frontend/src/lib/utils/viewer/renderData';

/** Formats a browser (OBS browser source) can play. */
const PLAYABLE = ['.mp4', '.webm', '.mov', '.m4v'];
/** Images a media key can show. */
const IMAGE = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
/** Fountain of Dreams (moving side platforms). */
const FOD_STAGE_ID = 2;
/** How long "OBS: save replay" waits for OBS's file. */
const SAVE_WAIT_MS = 15000;

/** A replay-buffer file OBS wrote after Froggi asked: when Froggi asked (= when the file ends). */
interface Save {
	file: string;
	requestedAt: number;
}

/**
 * Files flows use, by id (/media/<id>, replay windows): OBS replay-buffer clips, the games' .slp files and
 * anything Set media shows. Also what each media key shows and the "OBS: save replay" hand-over. Files stay
 * where they are — Froggi never deletes them — and only registered ids are served.
 */
@singleton()
export class ElectronHighlightStore {
	private paths = new Map<string, string>();
	private reels: HighlightReels = {};
	/** Save requests OBS hasn't answered yet, oldest first (OBS saves in order). */
	private pendingSaves: number[] = [];
	private saves: Save[] = [];
	private saveWaiters: (() => void)[] = [];
	/** Volume (0–100) set by "Set media volume" — overrides the element's own volume. */
	private volumes: Record<string, number> = {};
	/** The running game's .slp ({{state.replay.file}}). */
	private liveReplay: string | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		// Optional: without it (unit tests) ids live in memory only.
		@inject(delay(() => SqliteOrm)) private sqlite?: SqliteOrm,
	) {}

	private async repo() {
		if (!this.sqlite) return null;
		await this.sqlite.initializing;
		return this.sqlite.getRepository(MediaFileEntity);
	}

	// ── Files by id ──────────────────────────────────────────────────────────────────────────────
	/** The file's id (the same path always gets the same id), kept in SQLite. */
	register(file: string): string {
		const id = crypto.createHash('sha1').update(path.resolve(file)).digest('hex').slice(0, 12);
		if (this.paths.get(id) === file) return id;
		this.paths.set(id, file);
		// One INSERT OR IGNORE, no transaction: a save() transaction started while a game is being stored
		// (same better-sqlite3 connection) can stall every query after it.
		void this.repo()
			.then((r) => r?.createQueryBuilder().insert().values({ id, path: file }).orIgnore().execute())
			.catch((err) => this.log.warn(`Could not save media file ${id}`, err));
		return id;
	}

	/** The file behind an id, or undefined (unknown ids are refused). */
	async path(id: string): Promise<string | undefined> {
		if (!MEDIA_ID.test(id)) return undefined;
		const known = this.paths.get(id);
		if (known) return known;
		const row = await (await this.repo())?.findOne({ where: { id } }).catch(() => null);
		if (row) this.paths.set(id, row.path);
		return row?.path;
	}

	/** The running game's .slp (found at game start) — {{state.replay.file}}. */
	setLiveReplay(file: string | null) {
		this.liveReplay = file ? this.register(file) : null;
	}

	get liveReplayFile() {
		return this.liveReplay;
	}

	// ── OBS: save replay ─────────────────────────────────────────────────────────────────────────
	/** Froggi asked OBS to save its replay buffer at `at` — the saved file ends then. */
	requestedSave(at = Date.now()) {
		this.pendingSaves.push(at);
	}

	/** OBS wrote a replay-buffer file. */
	saved(file: string) {
		// A request OBS never answered (over a minute ago) must not time this file.
		this.pendingSaves = this.pendingSaves.filter((at) => Date.now() - at < 60000);
		// ponytail: a save Froggi didn't ask for (OBS hotkey) is timed by this event, ~0.6 s late per 20 MB.
		const requestedAt = this.pendingSaves.shift() ?? Date.now();
		this.saves = [...this.saves, { file, requestedAt }].slice(-50);
		this.saveWaiters.splice(0).forEach((done) => done());
	}

	/** The file of the save Froggi requested at or after `since` (waits for OBS). Null when none comes. */
	async savedFile(since: number): Promise<{ file: string; path: string; fileSeconds: number | null; savedAt: number } | null> {
		const deadline = Date.now() + SAVE_WAIT_MS;
		for (;;) {
			const save = this.saves.find((s) => s.requestedAt >= since);
			if (save) {
				let fileSeconds: number | null = null;
				try {
					fileSeconds = videoDuration(save.file);
				} catch (err) {
					this.log.warn('Could not read the length of', save.file, err);
				}
				return { file: this.register(save.file), path: save.file, fileSeconds, savedAt: save.requestedAt };
			}
			const left = deadline - Date.now();
			if (left <= 0) return null;
			await new Promise<void>((done) => {
				this.saveWaiters.push(done);
				setTimeout(done, left);
			});
		}
	}

	// ── Media keys ───────────────────────────────────────────────────────────────────────────────
	/**
	 * Put ONE thing on media key `key` (the flow card "Set media"): a file id ({{file}}), a file path or a web
	 * link, with `start` / `end` = seconds into the video (empty = all of it). Images show as images.
	 * Nothing → the key is cleared. Throws with a readable reason.
	 */
	async setMedia(key: string, source: string, range: { start?: number | null; end?: number | null } = {}): Promise<HighlightReel | null> {
		const src = source.trim();
		if (!src) {
			this.reels = Object.fromEntries(Object.entries(this.reels).filter(([k]) => k !== key));
			this.emit();
			return null;
		}
		const window = { start: range.start ?? null, end: range.end ?? null };
		const set = (url: string, kind: 'video' | 'image') => {
			const reel: HighlightReel = { id: crypto.randomUUID(), key, kind, clips: [{ url, ...window }], startedAt: null };
			this.reels = { ...this.reels, [key]: reel };
			this.emit();
			return reel;
		};
		const kindOf = (name: string) => (IMAGE.includes(path.extname(name.split('?')[0]).toLowerCase()) ? 'image' : 'video');
		if (/^https?:\/\//i.test(src)) return set(src, kindOf(src));
		const file = MEDIA_ID.test(src) ? await this.path(src) : src;
		if (!file) throw new Error(`No file with id ${src}`);
		if (!fs.existsSync(file)) throw new Error(`No file at ${file}`);
		const ext = path.extname(file).toLowerCase();
		if (!IMAGE.includes(ext) && !PLAYABLE.includes(ext)) throw new Error(`${ext || 'This format'} can't play in a browser source — set OBS → Settings → Output → Recording format to MP4 or Hybrid MP4`);
		return set(`/media/${this.register(file)}`, kindOf(file));
	}

	setVolume(key: string, volume: number) {
		this.volumes = { ...this.volumes, [key]: Math.min(100, Math.max(0, Math.round(volume))) };
		this.emit();
	}

	/** A client shows key `key` — the shared clock starts once (first client wins). */
	started(key: string, id: string) {
		const reel = this.reels[key];
		if (!reel || reel.id !== id || reel.startedAt !== null) return;
		this.reels = { ...this.reels, [key]: { ...reel, startedAt: Date.now() } };
		this.emit();
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

	// ── Replay windows ───────────────────────────────────────────────────────────────────────────
	private framesCache = new Map<string, HighlightFrames>();
	/** Parsed replays (a list holds several windows of one game): the 3 newest, re-read when the file grew. */
	private games = new Map<string, { size: number; game: SlippiGame }>();

	private game(file: string): SlippiGame {
		const size = fs.statSync(file).size;
		const known = this.games.get(file);
		if (known?.size === size) return known.game;
		const game = new SlippiGame(file);
		this.games.delete(file);
		this.games.set(file, { size, game });
		if (this.games.size > 3) this.games.delete(this.games.keys().next().value!);
		return game;
	}

	private lastFrames = new Map<string, { size: number; last: number | null }>();

	/** The last frame of a finished game's .slp (its metadata — cheap); null while the game is still written. */
	async lastFrame(id: string): Promise<number | null> {
		const file = await this.path(id);
		if (!file || !fs.existsSync(file)) return null;
		const size = fs.statSync(file).size;
		const known = this.lastFrames.get(id);
		if (known?.size === size) return known.last;
		let last: number | null = null;
		try {
			last = nulled(new SlippiGame(file).getMetadata())?.lastFrame ?? null;
		} catch {
			last = null;
		}
		this.lastFrames.set(id, { size, last });
		return last;
	}

	/**
	 * Frames `from`…`to` of a .slp by id, slimmed to what the game view draws (the Highlight Replay element
	 * plays them — read once, every client plays them on the shared clock). Null: unknown id / no replay.
	 */
	async replayFrames(id: string, from: number, to: number): Promise<HighlightFrames | null> {
		const key = `${id}:${from}:${to}`;
		const cached = this.framesCache.get(key);
		if (cached) return cached;
		const file = await this.path(id);
		if (!file || path.extname(file).toLowerCase() !== '.slp' || !fs.existsSync(file) || !(to > from)) return null;
		const slp = this.game(file);
		const settings = nulled(slp.getSettings());
		const all = nulled(slp.getFrames());
		if (!settings || !all) return null;
		const frames: ViewerFrame[] = [];
		const last = Math.min(to, from + MAX_REPLAY_FRAMES);
		for (let f = from; f <= last; f++) if (all[f]) frames.push(slimFrame(all[f] as never));
		// Fountain of Dreams: the replay only notes a side platform when it moves, so a window starting mid-game
		// (or a skipped frame) would show them at their start height — every frame gets both heights instead.
		if (settings.stageId === FOD_STAGE_ID) {
			const heights: Record<number, number> = {};
			let i = 0;
			for (let f = -123; f <= last; f++) {
				for (const e of ((all[f] as { stageEvents?: { platform?: number | null; height?: number | null }[] } | undefined)?.stageEvents ?? []))
					if (e.platform != null && e.height != null) heights[e.platform] = e.height;
				if (f < from) continue;
				const frame = frames[i];
				if (frame?.frame === f) {
					frame.stageEvents = Object.entries(heights).map(([platform, height]) => ({ frame: f, platform: Number(platform), height }));
					i++;
				}
			}
		}
		const out = { settings: slimSettings(settings), frames };
		// A game still being played may not have the whole window yet — only complete windows are kept.
		if (all[last]) {
			this.framesCache.set(key, out);
			if (this.framesCache.size > 60) this.framesCache.delete(this.framesCache.keys().next().value!);
		}
		return out;
	}
}
