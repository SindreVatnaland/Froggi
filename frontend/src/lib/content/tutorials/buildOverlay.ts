import type { Tutorial } from './types';

export const buildOverlayTutorial: Tutorial = {
	id: 'new-overlay',
	title: 'Build an overlay',
	description: 'Design stream overlays and custom HUDs that react to the game — by hand, from a demo, or with the AI assistant.',
	icon: 'Paintbrush',
	path: '/obs/tutorial/new-overlay',
	pages: [
		{
			title: 'What you can build',
			blocks: [
				{ type: 'text', text: 'An overlay is a layer on top of your stream or right on the game window. It reads the game live: **percent, stocks, characters, timer, tags, set score, ranks, combos, controller inputs** and more.' },
				{ type: 'video', src: '/image/tutorial/new-overlay/preview-embed-demo-overlay.mp4', caption: 'A Froggi overlay reacting to a live game.' },
				{ type: 'list', items: ['**A custom HUD** in your own design', '**Stats around the game**: names, score and ranks next to a 4:3 game', '**Between games**: session, post-game and post-set stats', '**Stage striking**: which stages are left and whose turn it is', '**Doubles**: team names, team stocks and all four players'] },
			],
		},
		{
			title: 'The quickest start',
			blocks: [
				{ type: 'text', text: 'Go to **Stream** → **Overlays**. You don\'t have to start empty: the **demo overlays** (HUD, Doubles, Stage Striking, ranks, controller inputs) are ready to use — duplicate one and make it yours.' },
				{ type: 'image', src: '/image/tutorial/overlay/overlays-list.jpg', caption: 'Stream → Overlays: your overlays and the demos.' },
				{ type: 'text', text: 'Or let the **AI assistant** build it: describe what you want — "an Ultimate-style HUD for a 4:3 game window" — and it builds the overlay in Froggi and shows you a preview. More on the last pages.' },
			],
		},
		{
			title: 'Scenes',
			blocks: [
				{ type: 'text', text: 'An overlay has one **scene** per game state, and Froggi switches between them by itself:' },
				{ type: 'list', items: ['**Waiting** — Dolphin isn\'t connected', '**Menu** — between games', '**In Game** — a game is running', '**Post Game** / **Post Set** — after a game, after the set is won', '**Rank Change** — after a ranked game', '**Stage Striking** — while players strike stages for a set'] },
				{ type: 'text', text: 'Pick a scene with the buttons at the bottom of the editor. **Configure** (top right) sets the title, aspect ratio, font, background and how scenes animate in and out.' },
				{ type: 'note', text: 'Ask yourself first where the overlay goes: on the stream canvas (usually 16:9), or the game window itself (4:3) — that decides the aspect ratio.' },
			],
		},
		{
			title: 'Layers and elements',
			blocks: [
				{ type: 'image', src: '/image/tutorial/overlay/editor.jpg', caption: 'The editor: layers on the left, the canvas, and the scenes at the bottom.' },
				{ type: 'list', items: ['**+ Add Element** → pick a category and an element (percent, stock icons, character, tag, timer, text, box, image…).', 'Drag and resize it on the canvas.', '**Layers** stack on top of each other — layer 1 is drawn on top. Give layers a name so you find things later.', 'Select an element to style it: font, colours, stroke, shadow, image fit.'] },
				{ type: 'image', src: '/image/tutorial/overlay/add-element.jpg', caption: 'Add Element: categories on the left, elements on the right.' },
				{ type: 'note', text: '**Doubles:** every Player 1 / Player 2 element has a **Player** option to show any of the four players.' },
			],
		},
		{
			title: 'Make it react',
			blocks: [
				{ type: 'text', text: 'This is what makes an overlay feel like part of the game:' },
				{ type: 'list', items: ['**Visibility conditions** — show an element only when something is true: the 4th stock icon while a player has 4 stocks, "GAME!" when the game ends, the pause screen while paused, a radar when a player is off stage.', '**Animations** — how an element appears and disappears (fade, fly, scale), and **animation triggers** that replay an animation on an event, like a flash when a stock is lost.'] },
				{ type: 'note', text: 'The editor shows every element with placeholder data, conditions ignored. To see the real thing, press **▶ Run replay**: Froggi plays back your latest replay through the overlay.' },
			],
		},
		{
			title: 'Fonts and character art',
			blocks: [
				{ type: 'list', items: ['**Fonts** — pick a built-in font (Melee, Ultimate, Roboto…) per scene in Configure or per element, or upload your own.', '**Character art** — the Character element can show stock icons, portraits or renders. With **asset packs** (Overlays → Assets) you add your own art per character and costume.', '**Images and boxes** — your logo, a sponsor, a background panel.'] },
			],
		},
		{
			title: 'Build it with the AI assistant',
			blocks: [
				{ type: 'text', text: 'Connected to an AI app (see the [AI assistant tutorial](/obs/tutorial/ai-assistant)), you can build overlays by describing them. The assistant knows every element, condition and animation, has screenshots of the Melee and Ultimate HUDs to work from, and the demo overlays as examples.' },
				{ type: 'list', items: ['"Make me a HUD for my 4:3 game window like Ultimate\'s."', '"Add the set score and both tags above the game."', '"Make the percent shake when a player is hit."', '"Use the Doubles demo, but with my team colours."'] },
				{ type: 'image', src: '/image/tutorial/overlay/ai-screenshot.jpg', caption: 'The assistant checks its own work: a screenshot of the overlay at a moment from one of your replays.' },
				{ type: 'text', text: 'It shows you a live preview after each change, can **take screenshots** of the overlay at any moment of a replay to check its own work, and every change can be undone. Keep refining in plain words: "bigger", "move it up", "less transparent".' },
			],
		},
		{
			title: 'Put it on stream',
			blocks: [
				{ type: 'list', items: ['**Embed** (top right) → **Add to OBS** puts it in your current OBS scene, or copy the URL into an OBS Browser source.', '**Windows:** Froggi can also draw the overlay directly in the Dolphin game window (overlay injection).'] },
				{ type: 'text', text: 'Next: the [Integrate with OBS](/obs/tutorial/integrate-obs) tutorial connects OBS so this is one click.' },
			],
		},
	],
};
