import 'reflect-metadata';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ElectronHighlightStore } from '../../electron/services/store/storeHighlights';
import { videoDuration } from '../../electron/utils/videoDuration';

/** Smallest MP4/MOV Froggi can read the length of: ftyp + mdat + moov/mvhd (index at the end, like OBS). */
const writeVideo = (file: string, seconds: number) => {
	const box = (type: string, body: Buffer) => {
		const out = Buffer.concat([Buffer.alloc(4), Buffer.from(type, 'latin1'), body]);
		out.writeUInt32BE(out.length, 0);
		return out;
	};
	const mvhd = Buffer.alloc(100);
	mvhd.writeUInt32BE(1000, 12); // timescale (v0: after version/flags + creation + modification)
	mvhd.writeUInt32BE(Math.round(seconds * 1000), 16);
	fs.writeFileSync(file, Buffer.concat([box('ftyp', Buffer.from('qt  ')), box('mdat', Buffer.alloc(64)), box('moov', box('mvhd', mvhd))]));
	return file;
};

describe('highlight reels (store)', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'froggi-hl-'));
	const video = (name: string, seconds = 30) => writeVideo(path.join(dir, name), seconds);
	const make = () => {
		const sent: unknown[] = [];
		const store = new ElectronHighlightStore({ info: jest.fn(), warn: jest.fn() } as never, { sendMessage: (_: string, v: unknown) => sent.push(v) } as never);
		return { store, sent };
	};

	it('reads the length of an MP4/MOV from its index; null for other files', () => {
		expect(videoDuration(video('len.mov', 28.8))).toBeCloseTo(28.8);
		const junk = path.join(dir, 'junk.webm');
		fs.writeFileSync(junk, 'not a video at all');
		expect(videoDuration(junk)).toBeNull();
	});

	it('builds a reel from moments the saved buffers cover; never deletes files', async () => {
		const { store } = make();
		const t = Date.now() - 50_000; // game started 50 s ago
		store.gameStarted(t);
		const ko = store.mark({ start: t + 32_000, end: t + 42_000 }, 1); // KO at 40 s, 8 s before, 2 s after
		store.requestedSave(t + 42_500);
		store.saved(video('a.mp4')); // ends 42.5 s, holds 12.5–42.5 s
		store.requestedSave(t + 50_000);
		const unused = video('unused.mp4');
		store.saved(unused); // ours, also holds the KO — but a.mp4 ends closer after it
		const byHand = video('by-hand.mp4');
		store.saved(byHand); // OBS hotkey: not requested by Froggi

		const reel = await store.build('game', [ko, 'h-missing']);
		expect(reel?.clips).toHaveLength(1);
		expect(reel?.clips[0]).toMatchObject({ fromEnd: 10.5, toEnd: 0.5 });
		expect(reel?.startedAt).toBeNull();
		expect(fs.existsSync(unused)).toBe(true); // Froggi never deletes replay files
		expect(fs.existsSync(byHand)).toBe(true);
		expect(fs.existsSync(path.join(dir, 'a.mp4'))).toBe(true);
		expect(store.file(reel!.clips[0].url.replace('/highlights/', ''))).toBe(path.join(dir, 'a.mp4'));
		expect(store.file('../../etc/passwd')).toBeUndefined();

		store.started('game', 'some-other-reel');
		expect(store.current().game.startedAt).toBeNull();
		store.started('game', reel!.id);
		const started = store.current().game.startedAt;
		expect(started).not.toBeNull();
		store.started('game', reel!.id); // first client wins
		expect(store.current().game.startedAt).toBe(started);

		expect(await store.build('game', [])).toBeNull(); // an empty list clears the video
		expect(store.current()).toEqual({});
	});

	it('waits for replay saves still being written', async () => {
		const { store } = make();
		const now = Date.now();
		store.gameStarted(now - 10_000);
		const id = store.mark({ start: now - 8000, end: now - 2000 }, 1);
		store.requestedSave(now);
		const building = store.build('game', [id]);
		store.saved(video('late.mp4'));
		expect((await building)?.clips).toHaveLength(1);
	});

	it('no footage → no reel (and an old one with that key is cleared)', async () => {
		const { store } = make();
		store.show('game', video('whole.mp4', 12));
		expect(store.current().game.clips[0]).toMatchObject({ fromEnd: 12, toEnd: 0 });
		const id = store.mark({ start: Date.now() - 5000, end: Date.now() + 1000 }, 1);
		expect(await store.build('game', [id])).toBeNull();
		expect(store.current().game).toBeUndefined();
	});

	it('Show a video file refuses files a browser source cannot play, and missing files', () => {
		const { store } = make();
		const mkv = path.join(dir, 'replay.mkv');
		fs.writeFileSync(mkv, 'x');
		expect(() => store.show('game', mkv)).toThrow(/MP4/);
		expect(() => store.show('game', path.join(dir, 'nope.mp4'))).toThrow(/No file/);
	});

	it('Set media: one thing per key — a highlight\'s clip, a file with a range, an image, a link; empty clears', async () => {
		const { store } = make();
		const t = Date.now() - 50_000;
		const id = store.mark({ start: t + 32_000, end: t + 42_000 }, 1);
		store.requestedSave(t + 42_500);
		const file = video('media.mp4');
		store.saved(file);
		// OBS: save replay with a highlight → where it sits in the file, from the file's start.
		expect(await store.clipFor(id)).toEqual({ path: file, start: 19.5, end: 29.5, seconds: 10 });
		expect(await store.clipFor('h-00000000')).toBeNull();

		const hl = await store.setMedia('game', id);
		expect(hl).toMatchObject({ kind: 'video', highlight: id, clips: [{ fromEnd: 10.5, toEnd: 0.5 }] });
		const ranged = await store.setMedia('game', file, { start: 19.5, end: 29.5 });
		expect(ranged?.clips[0]).toMatchObject({ fromEnd: 10.5, toEnd: 0.5 }); // same clip, from a path + range
		expect((await store.setMedia('game', file))?.clips[0]).toMatchObject({ fromEnd: 30, toEnd: 0 }); // whole video
		const png = path.join(dir, 'pic.png');
		fs.writeFileSync(png, 'x');
		expect(await store.setMedia('game', png)).toMatchObject({ kind: 'image' });
		expect((await store.setMedia('game', 'https://example.com/a.mp4', { start: 3 }))?.clips[0]).toEqual({ url: 'https://example.com/a.mp4', fromEnd: 0, toEnd: 0, start: 3, end: null });
		await expect(store.setMedia('game', path.join(dir, 'gone.mp4'))).rejects.toThrow(/No file/);
		expect(await store.setMedia('game', '')).toBeNull();
		expect(store.current().game).toBeUndefined();

		store.setReplayList('replay-game', [id]);
		expect(store.current()['replay-game']).toMatchObject({ highlights: [id], clips: [] });
		store.setReplayList('replay-game', []);
		expect(store.current()['replay-game']).toBeUndefined();
	});

	it('this game\'s marks become game highlights (frames + score)', () => {
		const { store } = make();
		store.mark({ start: 1, end: 2, frames: { start: 100, end: 400 } }, 80); // before this game
		store.gameStarted(Date.now() - 1000);
		store.mark({ start: Date.now() - 500, end: Date.now(), frames: { start: 900, end: 1300 } }, 95);
		store.mark({ start: Date.now() - 500, end: Date.now() }, 50); // no frames known
		expect(store.gameHighlights()).toEqual([{ startFrame: 900, endFrame: 1300, score: 95 }]);
	});
});
