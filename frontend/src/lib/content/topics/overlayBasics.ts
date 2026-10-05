import type { ContentTopic } from '../types';

export const overlayBasicsTopics: ContentTopic[] = [
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
					'Static content — custom text, images, boxes/shapes',
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
];
