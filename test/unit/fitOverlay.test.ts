import "reflect-metadata";
import { fitOverlay } from '../../electron/services/injectOverlay';

const W169 = { width: 16, height: 9 };

describe('fitOverlay (16:9 overlay)', () => {
	it.each([
		['16:9 exact', 1920, 1080, { width: 1920, height: 1080, x: 0, y: 0 }],
		['ultrawide → fill height, side margins', 2560, 1080, { width: 1920, height: 1080, x: 320, y: 0 }],
		['4:3 → fill height, crop sides', 1440, 1080, { width: 1920, height: 1080, x: -240, y: 0 }],
		['square → fill height, crop sides', 565, 565, { width: 1004, height: 565, x: -219, y: 0 }],
		['portrait → fill width, centre vertically', 860, 1070, { width: 860, height: 484, x: 0, y: 293 }],
	])('%s', (_name, w, h, expected) => {
		expect(fitOverlay(w, h, W169)).toEqual(expected);
	});
});
