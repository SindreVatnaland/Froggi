import fs from 'fs';
import path from 'path';
import { SITE_FEATURES, SITE_SECTIONS, siteShotSrc, type SiteFeature, type SiteSource } from '../../frontend/src/lib/content/site';
import { TUTORIALS } from '../../frontend/src/lib/content/tutorials';
import { ALL_TOPICS } from '../../frontend/src/lib/content';
import { formatInline } from '../../frontend/src/lib/content/tutorials/format';
import type { TutorialBlock } from '../../frontend/src/lib/content/tutorials/types';

/**
 * Writes the GitHub Pages feature pages (docs/features/<id>.html) and the landing page's feature cards
 * (docs/index.html between the features markers) from frontend/src/lib/content/site.ts, and copies every picture
 * they use from frontend/static into docs/. Runs on every compile (npm run site). Deterministic: same content →
 * same files.
 */

// Compiled to build_electron/scripts/site — the repo root is three levels up.
const ROOT = path.join(__dirname, '../../..');
const DOCS = path.join(ROOT, 'docs');
const STATIC = path.join(ROOT, 'frontend/static');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// App links (/settings#…) don't exist on the site — keep the words, drop the link.
const inline = (s: string) => formatInline(s).replace(/<a class="t-link" href="\/[^"]*">([^<]*)<\/a>/g, '<b>$1</b>');

/** Width / height of a PNG or JPEG in frontend/static (header only), or null for anything else. */
function imageSize(src: string): { w: number; h: number } | null {
	const file = path.join(STATIC, src);
	if (!fs.existsSync(file)) return null;
	const b = fs.readFileSync(file);
	if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
	if (b[0] === 0xff && b[1] === 0xd8) {
		for (let i = 2; i < b.length - 9; ) {
			if (b[i] !== 0xff) { i++; continue; }
			const marker = b[i + 1];
			const len = b.readUInt16BE(i + 2);
			if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
			i += 2 + len;
		}
	}
	return null;
}
/** Phone-shaped and square pictures sit beside the text instead of under it (user: no tall white space). */
export const isPortrait = (src: string) => {
	const size = imageSize(src);
	return !!size && size.h >= size.w * 0.9;
};

const images = new Set<string>();
/** A picture from frontend/static, copied to docs/ under the same path; returns its URL from a feature page. */
const picture = (src: string) => {
	images.add(src);
	return '..' + src;
};

function tutorialBlock(b: TutorialBlock): string {
	switch (b.type) {
		case 'heading': return `<h3>${esc(b.text)}</h3>`;
		case 'text': return `<p>${inline(b.text)}</p>`;
		case 'list': {
			const tag = b.ordered ? 'ol' : 'ul';
			return `<${tag}>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${tag}>`;
		}
		case 'image': return `<figure><img src="${picture(b.src)}" alt="${esc(b.caption)}" loading="lazy" /><figcaption>${inline(b.caption)}</figcaption></figure>`;
		case 'video': return `<figure><video src="${picture(b.src)}" autoplay muted loop playsinline></video><figcaption>${inline(b.caption)}</figcaption></figure>`;
		case 'note': return `<p class="note">${inline(b.text)}</p>`;
		case 'copyInstructions': return '';
	}
}

/**
 * The HTML of one source: a topic's summary, or whole tutorial pages (text + pictures). Throws on an unknown
 * topic / tutorial / page (the test reports it).
 */
export function renderSource(source: SiteSource): string {
	if ('topic' in source) {
		const topic = ALL_TOPICS.find((t) => t.id === source.topic);
		if (!topic) throw new Error(`site: unknown topic "${source.topic}"`);
		return `<section class="prose"><p class="lead">${inline(topic.summary)}</p></section>`;
	}
	const tutorial = TUTORIALS.find((t) => t.id === source.tutorial);
	if (!tutorial) throw new Error(`site: unknown tutorial "${source.tutorial}"`);
	const pages = source.pages
		? source.pages.map((title) => {
			const page = tutorial.pages.find((p) => p.title === title);
			if (!page) throw new Error(`site: tutorial "${source.tutorial}" has no page "${title}"`);
			return page;
		})
		: tutorial.pages;
	return pages.map((p) => {
		const side = p.blocks.filter((b) => b.type === 'image' && isPortrait(b.src));
		const main = p.blocks.filter((b) => !side.includes(b));
		const body = main.map(tutorialBlock).join('\n');
		return side.length
			? `<section class="prose split"><div class="split-main"><h2>${esc(p.title)}</h2>${body}</div><div class="split-side">${side.map(tutorialBlock).join('')}</div></section>`
			: `<section class="prose"><h2>${esc(p.title)}</h2>${body}</section>`;
	}).join('\n');
}

const head = (title: string, description: string, css: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <link rel="icon" type="image/png" href="../icon.png" />
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <link rel="stylesheet" href="${css}" />
</head>`;

/** The live viewer: the app's ReplayDemo (SlippiLab port) playing the sample clip — docs/viewer, npm run site:viewer. */
const liveViewer = () => `<figure class="hero viewer-figure"><div class="viewer" data-froggi-viewer></div>
  <figcaption>A sample game drawn live in your browser, just like friends see it when you share the link. Viewer based on <a href="https://github.com/frankborden/slippilab">SlippiLab</a> (<a href="../licenses/slippilab.txt">MIT license</a>).</figcaption></figure>
  <link rel="stylesheet" href="../viewer/style.css" />
  <script type="module" src="../viewer/viewer.js"></script>`;

/**
 * Simulated Discord profile cards with what Froggi's Rich Presence sends (electron/services/discord.ts): in a game
 * (mode, codes + set score, stage + rank badge, time left, a button per player) and a minigame lobby (Join).
 * Neutral example players — never a real profile.
 */
function discordCards(): string {
	const card = (body: string) => `<div class="dc-card"><div class="dc-banner"></div><div class="dc-avatar">Y</div><div class="dc-name">You<span>you</span></div><div class="dc-activity"><p class="dc-label">Playing</p>${body}</div></div>`;
	const activity = (large: string, small: string | null, lines: string[], extra: string, buttons: string[]) =>
		`<div class="dc-row"><div class="dc-art"><img src="${large}" alt="" />${small ? `<img class="dc-badge" src="${small}" alt="" />` : ''}</div><div class="dc-text"><b>Melee</b>${lines.map((l) => `<span>${esc(l)}</span>`).join('')}${extra}</div></div>${buttons.map((b) => `<div class="dc-button">${esc(b)}</div>`).join('')}`;
	const stage = encodeURI(picture('/image/stages/31.png'));
	const rank = encodeURI(picture('/image/rank-icons/GOLD 2.svg'));
	return `<figure class="hero discord-figure"><div class="dc-cards">
    ${card(activity(stage, rank, ['Ranked - In Game', 'FROG#123 (1 - 0) TOAD#456'], '<span class="dc-time">07:42 left</span>', ['FROG - Falco - 3 - 42%', 'TOAD - Marth - 2 - 87%']))}
    ${card(activity('../icon.png', null, ['Bingo · Lobby', 'Waiting for opponent… (1 of 2)'], '', ['Join']))}
  </div><figcaption>Simulated: what friends see on your Discord profile in a game and while you host a minigame lobby.</figcaption></figure>`;
}

function featurePage(feature: SiteFeature): string {
	const all = SITE_FEATURES;
	const i = all.indexOf(feature);
	const prev = all[(i - 1 + all.length) % all.length];
	const next = all[(i + 1) % all.length];
	const shots = feature.shots.filter((s) => fs.existsSync(path.join(STATIC, siteShotSrc(feature, s))));
	const phoneOnly = shots.length > 0 && shots.every((s) => 'page' in s && s.page.mobile);
	const intro = feature.intro.map(renderSource).join('\n');
	const hero = (i: number) => (feature.shotLayout === 'grid' ? '' : i === 0 ? 'hero' : '');
	const gallery = shots.length
		? `<div class="shots">${shots.map((s, i) => `<figure class="${'page' in s && s.page.mobile ? 'phone' : hero(i)}"><a href="${picture(siteShotSrc(feature, s))}"><img src="${picture(siteShotSrc(feature, s))}" alt="${esc(s.caption)}" loading="lazy" /></a><figcaption>${inline(s.caption)}</figcaption></figure>`).join('')}</div>`
		: '';
	return `${head(`${feature.title} · Froggi`, feature.card, '../site.css')}
<body>
<!-- Generated by scripts/site/generateSite.ts from frontend/src/lib/content/site.ts. Edit those, not this file. -->
<nav class="topbar"><a href="../index.html"><img src="../icon.png" alt="" /> Froggi</a><a class="btn small" href="../index.html#download">⬇ Download</a></nav>
<main class="feature">
  <header class="feature-head">
    <h1>${esc(feature.title)}</h1>
    <p class="tagline">${inline(feature.card)}</p>
  </header>
  ${feature.embed === 'liveViewer' ? liveViewer() : feature.embed === 'discordCards' ? discordCards() : ''}
  ${phoneOnly ? `<div class="split"><div class="split-main">${intro}</div><div class="split-side">${gallery}</div></div>` : `${gallery}\n  ${intro}`}
  <nav class="pager"><a href="${prev.id}.html">← ${esc(prev.title)}</a><a href="../index.html">All features</a><a href="${next.id}.html">${esc(next.title)} →</a></nav>
</main>
<footer>Not affiliated with Nintendo or Project Slippi</footer>
</body>
</html>
`;
}

/** The landing page's feature sections (between the markers in docs/index.html). */
const cards = () => SITE_SECTIONS.map((section) => `  <section>
    <h2>${esc(section.title)}</h2>
    <div class="grid">
${section.features.map((f) => `      <a class="feat" href="features/${f.id}.html"><b>${esc(f.title)}</b><span>${inline(f.card)}</span></a>`).join('\n')}
    </div>
  </section>`).join('\n\n');

const START = '<!-- features:start (generated by scripts/site/generateSite.ts from content/site.ts) -->';
const END = '<!-- features:end -->';

export function generateSite() {
	images.clear();
	fs.mkdirSync(path.join(DOCS, 'features'), { recursive: true });
	const pages = new Set<string>();
	for (const feature of SITE_FEATURES) {
		const file = `${feature.id}.html`;
		pages.add(file);
		fs.writeFileSync(path.join(DOCS, 'features', file), featurePage(feature));
	}
	// A feature removed from site.ts loses its page.
	for (const file of fs.readdirSync(path.join(DOCS, 'features'))) if (!pages.has(file)) fs.rmSync(path.join(DOCS, 'features', file));

	const indexPath = path.join(DOCS, 'index.html');
	const index = fs.readFileSync(indexPath, 'utf8');
	const a = index.indexOf(START), b = index.indexOf(END);
	if (a === -1 || b === -1) throw new Error('site: docs/index.html is missing the features markers');
	fs.writeFileSync(indexPath, index.slice(0, a + START.length) + '\n' + cards() + '\n  ' + index.slice(b));

	// The live viewer is a SlippiLab port: its MIT notice goes with it.
	fs.mkdirSync(path.join(DOCS, 'licenses'), { recursive: true });
	fs.copyFileSync(path.join(STATIC, 'licenses/slippilab.txt'), path.join(DOCS, 'licenses/slippilab.txt'));

	// Pictures: exactly the ones the pages use (docs/image mirrors frontend/static/image).
	fs.rmSync(path.join(DOCS, 'image'), { recursive: true, force: true });
	for (const src of [...images].sort()) {
		const from = path.join(STATIC, src);
		if (!fs.existsSync(from)) throw new Error(`site: missing picture ${src}`);
		const to = path.join(DOCS, src);
		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.copyFileSync(from, to);
	}
	return { pages: pages.size, images: images.size };
}

if (require.main === module) {
	const { pages, images: n } = generateSite();
	console.log(`site: ${pages} feature pages, ${n} pictures → docs/`);
}
