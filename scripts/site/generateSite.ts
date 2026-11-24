import fs from 'fs';
import path from 'path';
import { SITE_FEATURES, SITE_SECTIONS, siteShotSrc, type SiteFeature, type SiteSource } from '../../frontend/src/lib/content/site';
import { TUTORIALS } from '../../frontend/src/lib/content/tutorials';
import { ALL_TOPICS } from '../../frontend/src/lib/content';
import { formatInline } from '../../frontend/src/lib/content/tutorials/format';
import type { TutorialBlock } from '../../frontend/src/lib/content/tutorials/types';
import type { ContentBlock } from '../../frontend/src/lib/content/types';

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

function topicBlock(b: ContentBlock): string {
	switch (b.type) {
		case 'heading': return `<h3>${esc(b.text ?? '')}</h3>`;
		case 'paragraph': return `<p>${inline(b.text ?? '')}</p>`;
		case 'note': return `<p class="note">${inline(b.text ?? '')}</p>`;
		case 'list': return `${b.text ? `<p>${inline(b.text)}</p>` : ''}<ul>${(b.items ?? []).map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
	}
}

/**
 * The HTML of one source. `intro` = what visitors see first: a topic shows only its title + summary. `setup` (folded
 * under "How to set it up") shows everything. Throws on an unknown topic / tutorial / page (the test reports it).
 */
export function renderSource(source: SiteSource, mode: 'intro' | 'setup' = 'setup'): string {
	if ('topic' in source) {
		const topic = ALL_TOPICS.find((t) => t.id === source.topic);
		if (!topic) throw new Error(`site: unknown topic "${source.topic}"`);
		const blocks = mode === 'setup' ? topic.blocks.map(topicBlock).join('\n') : '';
		return `<section class="prose"><h2>${esc(topic.title)}</h2><p class="lead">${inline(topic.summary)}</p>${blocks}</section>`;
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
	return pages.map((p) => `<section class="prose"><h2>${esc(p.title)}</h2>${p.blocks.map(tutorialBlock).join('\n')}</section>`).join('\n');
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

function featurePage(feature: SiteFeature): string {
	const all = SITE_FEATURES;
	const i = all.indexOf(feature);
	const prev = all[(i - 1 + all.length) % all.length];
	const next = all[(i + 1) % all.length];
	const shots = feature.shots.filter((s) => fs.existsSync(path.join(STATIC, siteShotSrc(feature, s))));
	const gallery = shots.length
		? `<div class="shots">${shots.map((s, i) => `<figure class="${'page' in s && s.page.mobile ? 'phone' : i === 0 ? 'hero' : ''}"><a href="${picture(siteShotSrc(feature, s))}"><img src="${picture(siteShotSrc(feature, s))}" alt="${esc(s.caption)}" loading="lazy" /></a><figcaption>${inline(s.caption)}</figcaption></figure>`).join('')}</div>`
		: '';
	return `${head(`${feature.title} — Froggi`, feature.card, '../site.css')}
<body>
<!-- Generated by scripts/site/generateSite.ts from frontend/src/lib/content/site.ts — edit those, not this file. -->
<nav class="topbar"><a href="../index.html"><img src="../icon.png" alt="" /> Froggi</a><a class="btn small" href="../index.html#download">⬇ Download</a></nav>
<main class="feature">
  <header class="feature-head">
    <h1>${esc(feature.title)}</h1>
    <p class="tagline">${inline(feature.card)}</p>
  </header>
  ${gallery}
  ${feature.intro.map((src) => renderSource(src, 'intro')).join('\n')}
  ${feature.setup.length ? `<details class="setup"><summary>How to set it up</summary>${feature.setup.map((src) => renderSource(src, 'setup')).join('\n')}</details>` : ''}
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
