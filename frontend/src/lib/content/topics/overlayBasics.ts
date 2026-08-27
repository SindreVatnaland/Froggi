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
				text: 'Each scene has one or more layers (stacked, like Photoshop layers), and each layer holds elements — text, images, stat displays, timers, etc. Elements are placed and resized on a grid, not free-pixel positioning, so they stay aligned and scale cleanly with the overlay\'s aspect ratio.',
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
