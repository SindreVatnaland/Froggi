import type { ContentTopic } from '../types';

export const overlayBasicsTopics: ContentTopic[] = [
	{
		id: 'overlay-controller-conditions',
		title: 'Show an element while a button is held (controller conditions)',
		category: 'overlays',
		summary: 'Visibility → Controller: show any element only while Player 1, Player 2 or you hold a button, press L/R, or push a stick in a direction.',
		blocks: [
			{
				type: 'list',
				text: 'Per player (Current Player, Player 1, Player 2):',
				items: [
					'Buttons: A, B, X, Y, Z, Start and the D-pad directions — on while held.',
					'L and R: Analog Pressed (pressed past the dead zone), Fully Pressed (all the way) and Clicked (the digital click at the bottom).',
					'Stick and C-Stick: Up, Down, Left, Right — past the dead zone only, so a resting stick never counts. Diagonals turn on both directions (up-right = Up + Right).',
					'Works in a game, and in menus when Froggi reads the controller from Dolphin.',
					'The controller elements already show presses themselves — these conditions are for other elements (a text, an image, a callout).',
				],
			},
		],
	},
	{
		id: 'overlay-animation-triggers',
		title: 'Animation triggers (replay an animation when something changes)',
		category: 'overlays',
		summary: 'An element can replay an animation when it — or another element of the scene — changes what it shows, or on a game event such as taking damage. One element can have several animations, each with its own triggers.',
		blocks: [
			{
				type: 'list',
				text: 'How it works (Styling → Animation Triggers):',
				items: [
					'Element triggers: "This element changes" (or another element of the same scene) — changes, increases or decreases. Increases/decreases compare the first number shown, e.g. a percent popping when it goes back to 0% on respawn. Works for every element: win chance, fight and edge stats, characters, video (fires on a new highlight reel, not every clip).',
					'Appearing never counts: when an element shows up (scene switch, visibility condition) the scene animation / visibility animation plays, not the trigger.',
					'Game event triggers stay: e.g. "Player1 Percent Increase" makes a character render shake on damage, plus stock loss, countdown, techniques and stage striking events.',
					'Animation 1, 2, … (+ Add): each animation has its own in/out and its own triggers, and they can play together (a pop on the element\'s own change + a shake on damage). A trigger can be used by one animation of the element only.',
					'New elements start with "This element changes" — nothing happens until you pick an animation type.',
					'Count (numbers): pick "Count (numbers)" as the In animation and the number counts from the old value to the new one over the duration, with the easing you choose — e.g. a percent going 42% → 57%. It only counts when both values are plain numbers (decimals, 1,500 and a trailing % are fine); text just switches. "Percent Number" elements show the percent without the %.',
					'Problems are marked in the editor: an element pointing at something that does not exist — a Video whose key no enabled flow sets, or a trigger watching a deleted element (e.g. after importing someone\'s overlay) — gets a red outline, a count on its layer and a note at the top of its settings.',
					'Older overlays keep working: old "value changed" triggers (tag, score, rating, rank, session…) are hidden in the picker; where the element itself shows that value they were converted to "This element changes", anywhere else they stay and are marked legacy.',
				],
			},
		],
	},
	{
		id: 'win-chance',
		title: 'Win chance (game and set)',
		category: 'overlays',
		summary: 'Win Chance elements show how likely Player 1 / Player 2 (doubles: their team) are to win this game and the set, estimated from stocks and percent.',
		blocks: [
			{
				type: 'list',
				text: 'How it is estimated:',
				items: [
					'Remaining life per side = stocks left minus how far into the current stock it is (percent ÷ 120, the typical KO percent). Doubles add the teammates together.',
					'Game chance = life² ÷ (life² + opponent life²) — squaring makes a lead count for more than a plain ratio. Empty when no game runs.',
					'Timer: as the clock runs down, the game chance leans toward whoever would win on time (more stocks, then lower percent). How fast it leans depends on how long stocks have lasted this set (avg seconds per stock; 40 s until a few stocks are taken). A stock lead that can\'t be erased in time — even if the leader self-destructed every stock after this one (5 s each) — is a 100% win.',
					'Set chance = this game\'s chance combined with the set score and the best-of, every later game counted as 50/50.',
					'It is a quick estimate from what is on screen — it does not know characters, skill or stage. Flows can read it as {{state.odds.game.1}} / {{state.odds.set.1}} (percent), plus {{state.odds.secondsLeft}} and {{state.odds.stockSeconds.avg}} / .min / .max / .count.',
				],
			},
		],
	},
	{
		id: 'overlay-doubles',
		title: 'Doubles overlays and live fight stats',
		category: 'overlays',
		summary: 'Every Player 1/2 element can show any of the four doubles players (Styling → Player); there are team elements, team conditions, and live fight stats for singles and doubles.',
		blocks: [
			{
				type: 'list',
				text: 'How doubles works:',
				items: [
					'Team 1 is the team with the lowest port in the set\'s first game (colour doesn\'t matter) and keeps its place for the whole set, even when teams swap colours. Within a team the lower port is Player 1. Wrong way round? Dashboard → Fix set… → Swap teams / Swap players in a team (singles: Swap Player 1 ↔ 2) — names, score, overlays and the striking phones follow; when loading replays there, pick which team is Team 1 before loading.',
					'Team names: typed on the Dashboard (or at Start Set), else "Tag & Tag" when both players have a tag, else Team 1 / Team 2. Start Set (doubles) also takes each player\'s tag — overlays and the phones use them for the whole set.',
					'Player 1 elements show Team 1 · Player 1, Player 2 elements Team 2 · Player 1. Styling → Player switches any Player 1/2 element to another player (e.g. Team 1 · Player 2).',
					'Add Element → "Doubles & Ports": team names (rename on the Dashboard), team stocks, your/opponent team, port numbers, and fight stats.',
					'Visibility → Doubles: Doubles Game, second-player stocks/alive/combo/off-stage, team alive, and "Team N Stocks <= X".',
					'Teammates on the same character: the higher port is drawn a bit lighter, so viewers can tell them apart.',
					'Demo overlay "Doubles (game right, webcams left)": the 4:3 game on the right; on the left per team a webcam frame (put your camera source under it in OBS), team name + set score and a row per player (port, character, stocks); percents with names under them along the bottom of the game.',
				],
			},
			{
				type: 'list',
				text: 'Fight stats (live, singles and doubles, per game and for the whole set):',
				items: [
					'Damage dealt — percent dealt to opponents (hits on a teammate don\'t count).',
					'KOs — credited to whoever hit the player last.',
					'Avg KO % — on average, at what percent this player KOs opponents.',
					'Avg death % — on average, at what percent this player dies (self-destructs included).',
					'Team versions add up both players; in singles a team is just that player.',
				],
			},
		],
	},
	{
		id: 'overlay-structure',
		title: 'How an overlay is built: scenes, layers, elements',
		category: 'overlays',
		summary: 'An overlay has one scene per game state (menu, in-game, post-game, etc.), each scene has stacked layers, and each layer holds elements placed on a grid.',
		blocks: [
			{
				type: 'paragraph',
				text: 'One overlay = one set of scenes, one per game state Froggi tracks: Waiting for Dolphin, Menu, In Game, Post Game, Post Set, Rank Change, and Strike Phase. Froggi automatically shows the matching scene as the game state changes — you don\'t switch these manually.',
			},
			{
				type: 'paragraph',
				text: 'Each scene has one or more layers (stacked, like Photoshop layers) — name a layer in the field under its row in the layer panel — and each layer holds elements — text, images, stat displays, timers, etc. Elements are placed and resized on a grid, not free-pixel positioning, so they stay aligned and scale cleanly with the overlay\'s aspect ratio.',
			},
			{
				type: 'list',
				text: 'Common element types:',
				items: [
					'Static content — custom text, images (or a short MP4/WebM video, which plays muted on a loop — handy for animated backgrounds), boxes/shapes. The overlay in OBS loads its images and videos ahead of time: the scene on screen first (a thin bar at the top shows progress), then the rest, so scene changes don\'t pop in.',
					'Live Slippi data — player name/tag, rank, rating, stocks, percent, character, stage',
					'Minigame elements — Bingo board, rating graph',
					'Custom styling per element — colors, borders, fonts, shadows, animations for how it enters/exits',
				],
			},
		],
	},
	{
		id: 'overlay-asset-packs',
		title: 'Character asset packs (custom stock icons, portraits, renders)',
		category: 'overlays',
		summary: 'Overlays → Assets holds sets of character images — one per character and skin. The "Character" element shows the player\'s character and skin from the pack you pick.',
		blocks: [
			{
				type: 'list',
				text: 'How it works:',
				items: [
					'Built-in packs: Default stock icons (the default), portraits, and renders (left/right). They are read-only — Duplicate one to start your own.',
					'A custom pack has a slot for every Melee character and each of its skins (costumes), e.g. Fox: 0 Default, 1 Red, 2 Blue, 3 Green. Click a slot to upload (PNG, JPG, GIF or WebP; images over 1024px are downsampled), or "Import folder" with <characterId>/<skinId>.png files.',
					'Skin 0 is required. A missing skin shows that character\'s skin 0; a missing character shows the pack\'s built-in fallback (chosen under "Missing characters use").',
					'In the editor, add the Character element (Player 1 / Player 2 / Current Player HUD) and pick the pack under Styling → Asset pack. Use it once per stock with "Player N Stock K" visibility for stock icons.',
				],
			},
			{
				type: 'paragraph',
				text: 'Sharing: Export a pack from its page as a .froggi file and Import it on the Assets page. Exporting an overlay (.froggi) includes every custom pack it uses; importing restores them — an identical pack already on this computer is reused, a different one with the same id is added as a copy so your edits are never overwritten. Old .json overlay files still import.',
			},
		],
	},
	{
		id: 'overlay-deleted-restore',
		title: 'Deleting and restoring overlays',
		category: 'overlays',
		summary: 'Deleting an overlay moves it to Overlays → Deleted, where it can be previewed, restored, or permanently deleted.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Deleting an overlay does not remove it right away — it moves to the Deleted overlays page (Overlays → "Deleted (n)", shown once something is deleted) with the time it was deleted. Click it there to preview it, then Restore it or Delete permanently. Permanent delete removes the overlay and its uploaded images/fonts and cannot be undone. The AI assistant can move an overlay to Deleted (after you confirm) and restore it, but can never permanently delete one.',
			},
		],
	},
	{
		id: 'overlay-one-click-vs-manual',
		title: 'One-click templates vs. building from scratch',
		category: 'overlays',
		summary: 'Demo overlays give you a ready-made HUD to copy and tweak; building from scratch gives full control over every element and scene.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Froggi ships demo overlays you can copy and customize instead of starting blank — fastest path to a working stream overlay. Building from scratch means adding scenes/layers/elements one at a time and wiring up which Slippi data each element shows; more setup, but full control over the exact look.',
			},
		],
	},
	{
		id: 'overlay-embed-url',
		title: 'Embed any web page in an overlay (chat, alerts, widgets)',
		category: 'overlays',
		summary: 'The "Embed" element (CustomBoxIframe, 3001) shows any URL inside an overlay — in OBS or injected into the game: Twitch chat, sub/follow alerts, a now-playing widget, a scoreboard from another tool.',
		blocks: [
			{
				type: 'list',
				text: 'How to use it:',
				items: [
					'Add the Embed element and paste the URL under Styling → Embed URL (AI: payload.url). It is display-only — viewers cannot click into it.',
					'Twitch chat: the chat embed https://www.twitch.tv/embed/<channel>/chat?parent=localhost&darkpopout (Froggi serves overlays on localhost), or a chat-overlay service URL (StreamElements, jChat) made for OBS browser sources.',
					'Alerts (subs, follows, donations): paste the alert-box URL from StreamElements / Streamlabs — the same URL you would give OBS. Keep it private: it identifies your account.',
					'Injected into Dolphin (Windows) the embed is drawn in-game, so a streamer can see chat/alerts while playing without a second monitor.',
				],
			},
			{
				type: 'note',
				text: 'Audio: in OBS, an embed plays through the browser source (tick "Control audio via OBS" to mix it). When injected, sound from the embed plays from Froggi itself on the default audio device (not through the game) — autoplay works without a click (verified on an Electron 43 offscreen window) — so OBS desktop-audio capture picks it up. Its level is set per app in the OS volume mixer (Froggi), not in OBS; suggest one test alert.',
			},
		],
	},
];
