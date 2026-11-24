import fs from 'fs';
import path from 'path';
import { SITE_FEATURES, siteShotSrc } from '../../frontend/src/lib/content/site';
import { renderSource } from '../../scripts/site/generateSite';

// GitHub Pages feature pages (docs/features, generated on every compile from content/site.ts).
const ROOT = path.join(__dirname, '../../..');

describe('site feature pages', () => {
	it('ids are unique and every source (tutorial page / topic) exists', () => {
		const ids = SITE_FEATURES.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const f of SITE_FEATURES) {
			for (const s of f.intro) expect(() => renderSource(s, 'intro')).not.toThrow();
			for (const s of f.setup) expect(() => renderSource(s, 'setup')).not.toThrow();
		}
	});

	it('every screenshot was taken (npm run site:shots with the dev app running)', () => {
		const missing = SITE_FEATURES.flatMap((f) => f.shots.map((s) => siteShotSrc(f, s))).filter((src) => !fs.existsSync(path.join(ROOT, 'frontend/static', src)));
		expect(missing).toEqual([]);
	});

	it('the pages and the landing-page cards are generated', () => {
		const index = fs.readFileSync(path.join(ROOT, 'docs/index.html'), 'utf8');
		for (const f of SITE_FEATURES) {
			expect(fs.existsSync(path.join(ROOT, 'docs/features', `${f.id}.html`))).toBe(true);
			expect(index).toContain(`href="features/${f.id}.html"`);
		}
	});
});
