// Fresh screenshots for the GitHub Pages feature pages (frontend/src/lib/content/site.ts → `shots`). Run before each
// release: `npm run site:shots` (compiles, runs this, regenerates docs/) — with Froggi CLOSED. This script starts the
// dev app itself on a clean profile (FROGGI_PROFILE=site → its own data folder, so no personal setup — stream
// channel, sets, OBS — can appear), turns MCP read access on in that profile, takes the shots and closes it.
// No extra dependencies:
//  - overlay shots: Froggi's own MCP tool capture_overlay_screenshot (a demo overlay at a moment of your newest
//    replays — characters / percent only) on 127.0.0.1:3300;
//  - page shots: the dev window over the Chrome DevTools protocol (dev:electron opens --remote-debugging-port=9222).
// Output: frontend/static/image/site/<feature>/<shot>.png (the app can use them too).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const { SITE_FEATURES, siteShotSrc } = require(path.join(ROOT, 'build_electron/frontend/src/lib/content/site.js'));
const MCP = 'http://127.0.0.1:3300/froggi/mcp';
const CDP = 'http://127.0.0.1:9222';
const only = process.argv[2]; // optional: one feature id

const save = (feature, shot, base64) => {
	const file = path.join(ROOT, 'frontend/static', siteShotSrc(feature, shot));
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, Buffer.from(base64, 'base64'));
	console.log('  ✓', path.relative(ROOT, file));
};

async function mcpTool(name, args) {
	const res = await fetch(MCP, {
		method: 'POST',
		headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
	});
	const text = await res.text();
	const data = text.split('\n').find((l) => l.startsWith('data:'));
	const msg = JSON.parse(data ? data.slice(5) : text);
	if (msg.error) throw new Error(msg.error.message);
	if (msg.result?.isError) throw new Error(msg.result.content?.[0]?.text ?? 'tool error');
	return msg.result.content;
}

/** One CDP session on the dev window. */
async function devWindow() {
	const targets = await fetch(`${CDP}/json/list`).then((r) => r.json());
	const target = targets.find((t) => t.type === 'page' && /localhost:5173|127\.0\.0\.1:3200/.test(t.url));
	if (!target) throw new Error('No dev window found on :9222 — start the app with `npm run dev:all`.');
	const ws = new WebSocket(target.webSocketDebuggerUrl);
	await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
	let id = 0;
	const pending = new Map();
	ws.onmessage = (e) => {
		const msg = JSON.parse(e.data);
		if (msg.id && pending.has(msg.id)) {
			const { ok, fail } = pending.get(msg.id);
			pending.delete(msg.id);
			msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
		}
	};
	const send = (method, params = {}) => new Promise((ok, fail) => {
		const n = ++id;
		pending.set(n, { ok, fail });
		ws.send(JSON.stringify({ id: n, method, params }));
	});
	return { origin: new URL(target.url).origin, startUrl: target.url, send, close: () => ws.close() };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = (url) => fetch(url).then(() => true, () => false);
async function waitFor(what, check, seconds) {
	for (let i = 0; i < seconds; i++) {
		if (await check()) return;
		await sleep(1000);
	}
	throw new Error(`${what} did not come up within ${seconds} s`);
}

if ((await up(`${CDP}/json/version`)) || (await up('http://127.0.0.1:3300/'))) {
	console.error('Froggi (or another dev app) is running — close it first; the screenshots use a clean profile.');
	process.exit(1);
}
// A fresh profile every run (same shots every time): only ever this script's own folder.
const profileDir = require('appdata-path')('Electron-site');
if (path.basename(profileDir) !== 'Electron-site') throw new Error(`Unexpected profile folder: ${profileDir}`);
fs.rmSync(profileDir, { recursive: true, force: true });
console.log('Starting Froggi on the clean "site" profile…');
const env = { ...process.env, FROGGI_PROFILE: 'site' };
delete env.ELECTRON_RUN_AS_NODE;
const app = spawn('npm', ['run', 'dev:all'], { cwd: ROOT, env, stdio: 'ignore', detached: true });
const stopApp = () => { try { process.kill(-app.pid, 'SIGTERM'); } catch { /* already gone */ } };
process.on('exit', stopApp);
await waitFor('The dev window', async () => {
	const targets = await fetch(`${CDP}/json/list`).then((r) => r.json(), () => []);
	return targets.some((t) => t.type === 'page' && /localhost:5173/.test(t.url));
}, 240);
await sleep(8000); // services resolve after dom-ready; demo overlays + default flows install on first start
let win = await devWindow();
// The app follows the computer's light / dark setting; the site and the tutorial pictures are light.
await win.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
// MCP read access in THIS profile only (the overlay shots use its screenshot tool).
await win.send('Runtime.evaluate', { expression: `window.electron.send('message', JSON.stringify({ SetMcpReadEnabled: [true] }))` });
await waitFor('The MCP server', () => up(MCP.replace('/froggi/mcp', '/')), 30);
const failures = [];

for (const feature of SITE_FEATURES) {
	if (only && feature.id !== only) continue;
	if (!feature.shots.length) continue;
	console.log(feature.id);
	for (const shot of feature.shots) {
		try {
			if (shot.overlay) {
				const { id, scene, background, replay, atSeconds } = shot.overlay;
				const content = await mcpTool('capture_overlay_screenshot', { overlayId: id, statsScene: scene, background, replay, atSeconds });
				const image = content.find((c) => c.type === 'image');
				if (!image) throw new Error(content.map((c) => c.text).join(' '));
				save(feature, shot, image.data);
			} else {
				const { route, width = 1280, height = 800, mobile = false, waitMs = 2000 } = shot.page;
				await win.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
				await win.send('Page.navigate', { url: win.origin + route });
				await sleep(waitMs);
				const { clicks = [], scrollTo } = shot.page;
				const find = (text, selector) => `[...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent.trim() === ${JSON.stringify(text)})`;
				for (const click of clicks) {
					// The button with this text (`partial`: starting with it). With `near`: the one in the smallest block that
					// shows that text and holds no other button with this label (its own row).
					const pick = `(() => {
						const label = ${JSON.stringify(click.text)}, near = ${JSON.stringify(click.near ?? null)}, partial = ${!!click.partial};
						const matches = (b) => (partial ? b.textContent.trim().startsWith(label) : b.textContent.trim() === label);
						const same = (root) => [...root.querySelectorAll('button')].filter(matches);
						return same(document).find((b) => {
							if (!near) return true;
							let e = b;
							while (e && !e.textContent.includes(near)) e = e.parentElement;
							return !!e && same(e).length === 1;
						});
					})()`;
					const { result } = await win.send('Runtime.evaluate', { expression: `(() => { const b = ${pick}; b?.click(); return !!b; })()`, returnByValue: true });
					if (!result?.value) throw new Error(`no button "${click.text}"${click.near ? ` near "${click.near}"` : ''}`);
					await sleep(3000);
				}
				if (shot.page.then) {
					await win.send('Page.navigate', { url: win.origin + shot.page.then });
					await sleep(waitMs + 1500);
				}
				if (scrollTo) {
					await win.send('Runtime.evaluate', { expression: `${find(scrollTo, 'h1,h2,h3,p,span,label')}?.scrollIntoView({ block: 'start' })` });
					await sleep(800);
				}
				const clip = shot.page.clipHeight ? { x: 0, y: 0, width, height: shot.page.clipHeight, scale: 1 } : undefined;
				const { data } = await win.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) });
				save(feature, shot, data);
			}
		} catch (e) {
			failures.push(`${feature.id}/${shot.id}: ${e.message}`);
			console.log('  ✗', shot.id, '—', e.message);
		}
	}
}

win.close();
stopApp();
if (failures.length) {
	console.error(`\n${failures.length} screenshot(s) failed:\n- ${failures.join('\n- ')}`);
	process.exit(1);
}
