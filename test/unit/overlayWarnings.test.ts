import fs from 'fs';
import path from 'path';
import { HIGHLIGHTS_FLOW } from '../../frontend/src/lib/content/highlightsFlow';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import type { Overlay } from '../../frontend/src/lib/models/types/overlay';
import { overlayWarnings } from '../../frontend/src/lib/utils/overlayWarnings';

const load = (file: string) => JSON.parse(fs.readFileSync(path.join(__dirname, '../../../demo-overlays', file), 'utf8')) as Overlay;

describe('overlay warnings (editor + AI)', () => {
	it('Media / Highlight Replay elements: warned while no ENABLED flow fills their key', () => {
		const overlay = load('Highlights.json');
		const off = overlayWarnings(overlay, [{ ...HIGHLIGHTS_FLOW, enabled: false }]);
		const messages = Object.values(off).flatMap((s) => Object.values(s ?? {}).flat());
		expect(messages.join(' ')).toMatch(/Media key "game"/);
		expect(messages.join(' ')).toMatch(/Media key "daily"/);
		expect(messages.join(' ')).toMatch(/Replay list "slippiReplayDaily"/);
		expect(overlayWarnings(overlay, [{ ...HIGHLIGHTS_FLOW, enabled: true }])).toEqual({});
	});

	it('element triggers watching an element that is gone', () => {
		const overlay = load('Score.json');
		const scene = overlay[LiveStatsScene.InGame];
		const item = scene.layers[0].items[0];
		item.data.animationTrigger.elementTriggers = [{ source: 'self', when: 'change' }, { source: 'deleted-item', when: 'increase' }];
		const w = overlayWarnings(overlay, [])[LiveStatsScene.InGame] ?? {};
		expect(w[item.id]).toEqual(['Animation 1 watches an element that is no longer in this scene.']);
		item.data.animationTrigger.elementTriggers = [{ source: scene.layers[0].items[1].id, when: 'change' }];
		expect(overlayWarnings(overlay, [])).toEqual({});
	});
});
