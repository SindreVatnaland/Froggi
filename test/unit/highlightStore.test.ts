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

describe('media files + keys (store)', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'froggi-media-'));
	const video = (name: string, seconds = 30) => writeVideo(path.join(dir, name), seconds);
	const make = () => new ElectronHighlightStore({ info: jest.fn(), warn: jest.fn() } as never, { sendMessage: jest.fn() } as never);

	it('reads the length of an MP4/MOV from its index; null for other files', () => {
		expect(videoDuration(video('len.mov', 28.8))).toBeCloseTo(28.8);
		const junk = path.join(dir, 'junk.webm');
		fs.writeFileSync(junk, 'not a video at all');
		expect(videoDuration(junk)).toBeNull();
	});

	it('files by id: the same path keeps its id; unknown ids and non-ids are refused', async () => {
		const store = make();
		const file = video('a.mp4');
		const id = store.register(file);
		expect(id).toMatch(/^[0-9a-f]{12}$/);
		expect(store.register(file)).toBe(id);
		expect(await store.path(id)).toBe(file);
		expect(await store.path('000000000000')).toBeUndefined();
		expect(await store.path('../../etc/passwd')).toBeUndefined();
	});

	it('OBS: save replay gets the file of ITS save — when it ends, how long it is', async () => {
		const store = make();
		const since = Date.now();
		const waiting = store.savedFile(since);
		store.requestedSave(since + 5);
		const file = video('saved.mp4', 30);
		store.saved(file);
		expect(await waiting).toEqual({ file: store.register(file), path: file, fileSeconds: 30, savedAt: since + 5 });
		// A second punish asks later: it waits for the next file, not the one before.
		const later = Date.now() + 1000;
		const second = store.savedFile(later);
		store.requestedSave(later);
		const file2 = video('saved2.mp4', 30);
		store.saved(file2);
		expect((await second)?.path).toBe(file2);
	});

	it('Set media: one thing per key — a file id or path with a window, an image, a link; empty clears', async () => {
		const store = make();
		const file = video('media.mp4');
		const id = store.register(file);
		expect((await store.setMedia('game', id, { start: 19.5, end: 29.5 }))?.clips).toEqual([{ url: `/media/${id}`, start: 19.5, end: 29.5 }]);
		expect((await store.setMedia('game', file))?.clips).toEqual([{ url: `/media/${id}`, start: null, end: null }]);
		const png = path.join(dir, 'pic.png');
		fs.writeFileSync(png, 'x');
		expect(await store.setMedia('game', png)).toMatchObject({ kind: 'image' });
		expect((await store.setMedia('game', 'https://example.com/a.mp4', { start: 3 }))?.clips).toEqual([{ url: 'https://example.com/a.mp4', start: 3, end: null }]);
		await expect(store.setMedia('game', path.join(dir, 'gone.mp4'))).rejects.toThrow(/No file/);
		await expect(store.setMedia('game', 'abcdefabcdef')).rejects.toThrow(/No file with id/);
		const mkv = path.join(dir, 'replay.mkv');
		fs.writeFileSync(mkv, 'x');
		await expect(store.setMedia('game', mkv)).rejects.toThrow(/MP4/);
		expect(fs.existsSync(file)).toBe(true); // Froggi never deletes files

		const reel = store.current().game;
		store.started('game', 'some-other');
		expect(store.current().game.startedAt).toBeNull();
		store.started('game', reel.id);
		expect(store.current().game.startedAt).not.toBeNull();

		expect(await store.setMedia('game', '')).toBeNull();
		expect(store.current()).toEqual({});
	});

	it('replay windows: frames of a registered .slp only', async () => {
		const store = make();
		const slp = path.join(__dirname, '../sample-games/direct-set-1', fs.readdirSync(path.join(__dirname, '../sample-games/direct-set-1')).find((f) => f.endsWith('.slp'))!);
		const id = store.register(slp);
		const window = await store.replayFrames(id, 1000, 1299);
		expect(window?.frames).toHaveLength(300);
		expect(window?.frames[0].frame).toBe(1000);
		expect(window?.settings.players.length).toBeGreaterThan(1);
		expect(await store.replayFrames(store.register(video('not-a-replay.mp4')), 0, 10)).toBeNull();
		expect(await store.replayFrames('000000000000', 0, 10)).toBeNull();
	});
});
