import { MAX_REPLAY_FRAMES, replayItems } from '../../frontend/src/lib/utils/highlightReel';

describe('replay lists (what a Highlight Replay element may get)', () => {
	it('only well-formed items, only the replay fields; windows capped at 60 s', () => {
		const items = replayItems([
			{ replay: '3f9a1c27b0e4', startFrame: 100, endFrame: 400, score: 90, path: 'C:/secret.slp' },
			{ replay: '../../etc/passwd', startFrame: 1, endFrame: 2 }, // not a file id
			{ replay: '3f9a1c27b0e4', startFrame: 500, endFrame: 400 }, // empty window
			{ replay: '3f9a1c27b0e4', startFrame: 'x', endFrame: 9 },
			{ replay: '3f9a1c27b0e4', startFrame: 0, endFrame: 99999 },
		]);
		expect(items).toEqual([
			{ replay: '3f9a1c27b0e4', startFrame: 100, endFrame: 400 },
			{ replay: '3f9a1c27b0e4', startFrame: 0, endFrame: MAX_REPLAY_FRAMES },
		]);
	});
});
