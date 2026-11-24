// `npm run site:viewer`: builds the site viewer (vite.config.ts) and copies what it plays — the sample clip, plus the
// animation data and stock icons of the characters in it — into docs/viewer/.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const STATIC = path.join(here, '../static');
const OUT = path.join(here, '../../docs/viewer');
execSync('npx vite build --config site-viewer/vite.config.ts --logLevel warn', { cwd: path.join(here, '..'), stdio: 'inherit' });

const copy = (rel, to = rel) => {
	const dest = path.join(OUT, to);
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(path.join(STATIC, rel), dest);
};
copy('demo/sample-game.json', 'sample-game.json');
const clip = JSON.parse(fs.readFileSync(path.join(STATIC, 'demo/sample-game.json'), 'utf8'));
// Same order as animationCache.ts (external character id → zip).
const src = fs.readFileSync(path.join(here, '../src/lib/utils/viewer/animationCache.ts'), 'utf8');
const zips = [...src.matchAll(/'\/animations\/([a-zA-Z]+\.zip)'/g)].map((m) => m[1]);
for (const id of new Set(clip.settings.players.map((p) => p.characterId))) {
	copy(`animations/${zips[id]}`);
	copy(`image/characters/${id}/0/stock.png`);
}
const size = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`site viewer → docs/viewer (${(size(OUT) / 1024 / 1024).toFixed(1)} MB)`);
