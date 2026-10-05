import type { ContentTopic } from '../types';

export const stageStrikingTopics: ContentTopic[] = [
	{
		id: 'stage-striking',
		title: 'Stage striking (tournament sets)',
		category: 'app',
		summary: 'Run a set with the Melee tournament ruleset: the TO starts it on the Set page, each player picks/strikes on their phone, and game winners come in automatically from Slippi.',
		blocks: [
			{
				type: 'list',
				text: 'Flow (Melee ruleset):',
				items: [
					'Only the host (the Froggi app, or a browser with the host password) starts a set: OBS → Dashboard "Start Set" or the Set page — names, Bo3/Bo5, and whether players may agree to play a DSR-blocked stage (on by default). Player 1 = the lower controller port.',
					'Players scan their own QR ("P1/P2 phone · stage striking"). Each link carries a secret for that player, so a phone can only act as its own player and only on its turn; resetting the set makes new links. The phone keeps the screen on (HTTPS links) and reconnects by itself after being locked.',
					'Game 1: characters double blind on the phones, then rock-paper-scissors (30s, random pick on timeout); the RPS winner chooses to strike first or second; the 5 starters are struck 1-2-1 and the last one is played.',
					'Game 2+: the previous winner bans 1 stage (no ban in Bo5), the loser picks — not a stage they already won on (DSR), unless both players agree on their phones — then the winner picks a character, then the loser. While a game is played the phones show a small live view (stocks, percent, timer).',
					'Winners are reported automatically when the Slippi game ends — only for games with the set\'s own players, never ranked/unranked. The host can still report a game winner, mark a warmup, undo, or End match (pick the set winner — kept for result reporting — or no winner to cancel). The Set page is on the Dashboard: "Stage striking →". A set left idle for 3 hours ends on startup.',
				],
			},
			{
				type: 'list',
				text: 'Scenes:',
				items: [
					'Starting a set shows the Strike Phase scene. After each game the normal Post Game scene shows; the first striking action (a character pick, RPS, a ban or pick) switches back to Strike Phase. A running game is never interrupted.',
					'Overlays without a Strike Phase scene simply keep showing their Menu content.',
				],
			},
			{
				type: 'paragraph',
				text: 'Stages: starters Fountain of Dreams, Yoshi\'s Story, Dream Land, Battlefield, Final Destination; counterpick Pokémon Stadium. The demo overlay "Stage Striking" shows all six from plain stage-image elements plus coloured layers driven by the per-stage conditions (grey = locked/counterpick in game 1, yellow = struck or banned, red = DSR, green outline = picked), with a caption per phase — copy it and restyle anything.',
			},
		],
	},
];
