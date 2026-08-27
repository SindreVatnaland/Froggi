import type { ContentTopic } from '../types';

export const minigamesTopics: ContentTopic[] = [
	{
		id: 'bingo-rules',
		title: 'Bingo — how it works',
		category: 'minigames',
		summary: 'A grid of Melee-related challenges (win with a character, land a specific move, etc.) — complete a full line to win, like classic bingo. Board size, difficulty, and win condition are all configurable.',
		blocks: [
			{
				type: 'paragraph',
				text: 'Each player gets a board of tiles (3x3, 4x4, or 5x5) — each tile is a challenge tied to something that can happen in a real Melee game. As you play, Froggi automatically marks tiles complete based on live game data; you don\'t click anything mid-match. Get enough completed tiles in a line (row, column, and/or diagonal, depending on settings) to win.',
			},
			{
				type: 'list',
				text: 'Configurable per lobby:',
				items: [
					'Board size (3x3 / 4x4 / 5x5) and difficulty',
					'Which line types count (rows, columns, diagonals)',
					'How many lines are needed to win',
					'An optional timer',
					'Optional Twitch chat voting — viewers vote on board events',
				],
			},
		],
	},
	{
		id: 'ironman-rules',
		title: 'Iron Man — how it works',
		category: 'minigames',
		summary: 'Play through a character roster — win with one, move to the next; lose, and it\'s eliminated. Race to clear the whole roster (or survive longest).',
		blocks: [
			{
				type: 'paragraph',
				text: 'Each player works through a character roster. Win a game with your current character and you advance to the next one; lose, and that character is out. The exact win condition (clear the full roster first, deplete the opponent\'s roster, etc.) depends on the track/mode selected for the lobby.',
			},
		],
	},
	{
		id: 'minigames-hosting-joining',
		title: 'Hosting or joining a minigame session',
		category: 'minigames',
		summary: 'Solo (practice alone), Local (same PC, split-screen style), Host (open a lobby for a remote friend), or Guest (join someone else\'s lobby with their code).',
		blocks: [
			{
				type: 'list',
				text: 'Session modes:',
				items: [
					'Solo — play against yourself/practice, no lobby needed',
					'Local — you and a friend on the same PC/setup (Iron Man only)',
					'Host — open a lobby; Froggi gives you a connect code (and a shareable link) for a friend to join remotely',
					'Guest — join a friend\'s lobby by pasting their connect code or link',
				],
			},
			{
				type: 'note',
				text: 'Hosting or joining remotely requires a remote-access tunnel (Tailscale or ngrok) to be running first — see the remote-access topic for which one to use.',
			},
		],
	},
];
