/**
 * The live game viewer on the GitHub Pages site (docs/features/share-live-game.html): the app's own ReplayDemo
 * (a port of SlippiLab, MIT — docs/licenses/slippilab.txt) playing the bundled sample clip. Built by
 * `npm run site:viewer` (site-viewer/build.mjs) into docs/viewer/. Mounts on every [data-froggi-viewer].
 */
import './viewer.css';
import ReplayDemo from '$lib/components/viewer/ReplayDemo.svelte';
import { setViewerAssetBase } from '$lib/utils/viewer/assetBase';

// The folder of this script (docs/viewer/). Plain string handling — Vite rewrites `new URL('.', import.meta.url)` to
// resolve against the page, which would point at docs/features/.
const base = import.meta.url.replace(/[^/]*$/, '');
setViewerAssetBase(base);
document.querySelectorAll<HTMLElement>('[data-froggi-viewer]').forEach((target) => {
	new ReplayDemo({ target, props: { src: `${base}sample-game.json`, hud: true, camera: 'live', controls: false } });
});
