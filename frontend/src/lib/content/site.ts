/**
 * The GitHub Pages site (docs/): one page per landing-page feature card. Pages sell what is possible — pictures
 * first, a short `intro`, then a download button; step-by-step setup stays in the app (tutorials + the AI), so
 * visitors aren't overwhelmed (user decision). The text and pictures come from the app's own tutorials and
 * explainer topics, so the pages change with the app; `shots` are fresh screenshots taken by `npm run site:shots` (scripts/site/screenshots.mjs, a clean
 * "site" profile) into frontend/static/image/site/<feature>/<shot>.png. `npm run site` (part of every compile)
 * writes the pages: scripts/site/generateSite.ts. test/unit/site.test.ts checks every source and picture exists.
 */

/** Text + pictures reused from the app: tutorial pages (by title; omitted = all) or an explainer topic (title + summary). */
export type SiteSource = { tutorial: string; pages?: string[] } | { topic: string };

/** A screenshot of a (demo) overlay at a replay moment — the MCP capture_overlay_screenshot tool. */
export type OverlayShot = {
	id: string;
	caption: string;
	overlay: { id: string; scene: string; background?: string; replay?: 'latest' | number; atSeconds?: number };
};
/**
 * A screenshot of an app page (route on the dev app, clean "site" profile), optionally at a phone size. `click` =
 * a button to press first (its text; `near` = text next to it when several buttons share the label, e.g. a demo
 * flow's "Use"), `scrollTo` = text of a heading to scroll to the top.
 */
export type PageShot = {
	id: string;
	caption: string;
	page: { route: string; width?: number; height?: number; mobile?: boolean; waitMs?: number; click?: { text: string; near?: string }; scrollTo?: string };
};
export type SiteShot = OverlayShot | PageShot;

export interface SiteFeature {
	id: string;
	title: string;
	/** The one line on the landing-page card. */
	card: string;
	shots: SiteShot[];
	/** What it gives you. Keep it short — one tutorial page or a couple of topic summaries. */
	intro: SiteSource[];
	/**
	 * Something live on the page: `liveViewer` = the app's replay viewer playing the sample clip (docs/viewer, built
	 * by `npm run site:viewer`); `discordCards` = Discord profile cards showing what Froggi's Rich Presence sends.
	 */
	embed?: 'liveViewer' | 'discordCards';
}

export interface SiteSection {
	title: string;
	features: SiteFeature[];
}

export const siteShotSrc = (feature: SiteFeature, shot: SiteShot) => `/image/site/${feature.id}/${shot.id}.png`;

const GAME = 'melee-16x9-default';

export const SITE_SECTIONS: SiteSection[] = [
	{
		title: 'For streamers',
		features: [
			{
				id: 'live-overlays',
				title: 'Live overlays',
				card: 'Percent, stocks, rank, win chance and more — build your own or start from a demo.',
				shots: [
					{ id: 'hud', caption: 'The HUD demo — it replaces the game\'s own HUD — at a moment of a real game.', overlay: { id: 'hud', scene: 'inGame', replay: 'latest', atSeconds: 40 } },
					{ id: 'game-stats', caption: 'Game & set stats after a game.', overlay: { id: 'game-stats', scene: 'postGame', replay: 'latest', atSeconds: 60 } },
					{ id: 'editor', caption: 'The overlay editor: scenes, layers and elements on a grid.', page: { route: '/obs/overlay/player1-controller?edit', width: 1440, height: 900, waitMs: 5000, click: { text: 'In Game' } } },
				],
				intro: [{ tutorial: 'new-overlay', pages: ['What you can build'] }],
			},
			{
				id: 'obs-one-click',
				title: 'OBS in one click',
				card: 'Adds your overlay and switches scenes by itself.',
				shots: [
					{ id: 'setup', caption: 'Stream → OBS Connection: status and one-click setup.', page: { route: '/obs/setup', width: 1280, height: 800 } },
					{ id: 'overlays', caption: 'Your overlays, ready to add to OBS.', page: { route: '/obs/overlay', width: 1280, height: 800 } },
				],
				intro: [{ tutorial: 'integrate-obs', pages: ['What it gives you'] }, { topic: 'scene-switching' }],
			},
			{
				id: 'share-live-game',
				title: 'Share your live game',
				card: 'Send a link — friends watch your game live in their browser, no stream needed.',
				embed: 'liveViewer',
				shots: [],
				intro: [{ topic: 'share-live-game' }],
			},
			{
				id: 'game-window',
				title: 'On the game window',
				card: 'Overlays straight on Dolphin, no OBS needed (Windows).',
				shots: [
					{ id: 'scoreboard', caption: 'An overlay on the game itself: names and set score above the action.', overlay: { id: 'scoreboard', scene: 'inGame', background: GAME, replay: 'latest', atSeconds: 40 } },
				],
				intro: [{ topic: 'os-limitations' }],
			},
			{
				id: 'highlights',
				title: 'Highlights',
				card: 'The best moments of each game, set and day — as video or redrawn from replays.',
				// ponytail: no fresh shots — a clean profile has no highlights yet; add some once a seeded replay list exists.
				shots: [],
				intro: [{ topic: 'highlights' }],
			},
			{
				id: 'singles-doubles',
				title: 'Singles & doubles',
				card: 'Every element works for all four players.',
				shots: [
					{ id: 'doubles', caption: 'The Doubles demo: teams, stocks and percent for all four players.', overlay: { id: 'doubles', scene: 'inGame', replay: 'latest', atSeconds: 40 } },
				],
				intro: [{ topic: 'overlay-doubles' }],
			},
		],
	},
	{
		title: 'Build with AI',
		features: [
			{
				id: 'mcp-server',
				title: 'Built-in MCP server',
				card: 'Connect Claude, Cursor or VS Code and build overlays, flows and your OBS setup by chatting.',
				shots: [{ id: 'settings', caption: 'Settings → AI Assistant: turn it on and connect your AI app.', page: { route: '/settings', width: 1280, height: 1000, scrollTo: 'AI Assistant (MCP)' } }],
				intro: [{ tutorial: 'ai-assistant', pages: ['What it does'] }],
			},
			{
				id: 'ai-fixes',
				title: 'Fixes too',
				card: "Your AI reads Froggi's state and logs to help when something breaks.",
				shots: [],
				intro: [{ topic: 'troubleshooting-crash-reports' }],
			},
		],
	},
	{
		title: 'For tournaments',
		features: [
			{
				id: 'stage-striking',
				title: 'Stage striking on phones',
				card: 'Picks, strikes, bans and DSR — live on stream.',
				// The tournament tutorial's pictures show it (a fresh profile has no set running for a fresh shot).
				shots: [],
				intro: [{ tutorial: 'tournament', pages: ['Players strike on their phones', 'Your stream follows along'] }],
			},
			{
				id: 'tournament-dashboard',
				title: 'Tournament dashboard',
				card: 'Set score and names, with wins reported from the replays.',
				shots: [
					{ id: 'dashboard', caption: 'The Tournament Dashboard.', page: { route: '/obs/dashboard', width: 1280, height: 900 } },
					{ id: 'dashboard-phone', caption: 'The same dashboard on a phone.', page: { route: '/obs/dashboard', width: 390, height: 844, mobile: true } },
				],
				intro: [{ tutorial: 'tournament', pages: ['You stay in control'] }],
			},
		],
	},
	{
		title: 'Automate & play',
		features: [
			{
				id: 'flows',
				title: 'Flows',
				card: 'React to the game: switch scenes, control OBS, call webhooks.',
				shots: [
					{
						id: 'stock-lights',
						caption: 'A flow is a few cards: when you lose a stock → send an HTTP request (here: your smart home flashes the lights).',
						page: { route: '/obs/flows', width: 1280, height: 720, waitMs: 2000, click: { text: 'Use', near: 'Flash the lights when you lose a stock' } },
					},
					{ id: 'flows', caption: 'Ready-made demo flows to start from.', page: { route: '/obs/flows', width: 1280, height: 800 } },
				],
				intro: [{ tutorial: 'flows', pages: ['What are flows?'] }],
			},
			{
				id: 'minigames',
				title: 'Minigames',
				card: 'Bingo and Iron Man — solo or online with a friend.',
				shots: [{ id: 'minigames', caption: 'Pick a minigame and a mode.', page: { route: '/minigames', width: 1280, height: 900 } }],
				intro: [{ topic: 'bingo-rules' }, { topic: 'ironman-rules' }],
			},
			{
				id: 'discord-rich-presence',
				title: 'Discord Rich Presence',
				card: 'Your Discord shows the game, score and rank — friends join your minigame lobby in one click.',
				embed: 'discordCards',
				shots: [],
				intro: [{ topic: 'discord-rich-presence' }],
			},
			{
				id: 'remote-control',
				title: 'Remote control',
				card: 'Scenes and overlays from your phone.',
				shots: [{ id: 'automation-phone', caption: 'Stream controls on a phone.', page: { route: '/obs/automation', width: 390, height: 844, mobile: true } }],
				intro: [{ tutorial: 'remote-obs', pages: ['What it gives you'] }],
			},
		],
	},
];

export const SITE_FEATURES: SiteFeature[] = SITE_SECTIONS.flatMap((s) => s.features);
