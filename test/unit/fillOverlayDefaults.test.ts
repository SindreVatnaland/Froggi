import "reflect-metadata";
import { fillOverlayDefaults } from '../../electron/utils/overlayHandler';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import type { Overlay } from '../../frontend/src/lib/models/types/overlay';

describe('fillOverlayDefaults (imported overlays)', () => {
	it('adds missing scenes, scene settings and element payload fields, keeps imported values', () => {
		const imported = {
			id: 'x',
			title: 'Old',
			[LiveStatsScene.InGame]: {
				active: true,
				layers: [{ index: 0, preview: true, items: [{ id: 'a', data: { css: { color: '#123456' } } }] }],
			},
		} as unknown as Overlay;
		const o = fillOverlayDefaults(imported);
		for (const scene of Object.values(LiveStatsScene)) expect(o[scene]?.layers.length).toBeGreaterThan(0);
		expect(o.inGame.animation.layerRenderDelay).toBe(250);
		const data = o.inGame.layers[0].items[0].data;
		expect(data.css.color).toBe('#123456');
		expect(data.font.family).toBe('default');
		expect(o.inGame.layers[0].items[0].id).toBe('a');
		expect(o.aspectRatio).toEqual({ width: 16, height: 9 });
	});
});
