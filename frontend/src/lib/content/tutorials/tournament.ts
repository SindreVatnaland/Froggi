import type { Tutorial } from './types';

export const tournamentTutorial: Tutorial = {
	id: 'tournament',
	title: 'Run a tournament',
	description: 'Stage striking on phones, automatic results, and a stream that runs itself — singles and doubles.',
	icon: 'Trophy',
	path: '/set/tutorial',
	pages: [
		{
			title: 'Players strike on their phones',
			blocks: [
				{ type: 'text', text: 'Froggi runs your Melee sets by the tournament rules — **at a venue or online**. Each player (each team in doubles) opens a link on their phone and does everything there: **characters** (double blind in game 1), **rock-paper-scissors**, **striking** and **banning stages**, and **counterpicks** with DSR.' },
				{ type: 'text', text: 'The phone shows whose turn it is and only lets a player act on their own turn, so the order always follows the rules — even with players in different cities.' },
				{ type: 'image', src: '/image/tutorial/tournament/phone-striking.jpg', caption: 'A player\'s phone during striking: struck stages crossed out, and how many they still strike.' },
			],
		},
		{
			title: 'Your stream follows along',
			blocks: [
				{ type: 'text', text: 'Viewers see the striking live: which stages are left, which are struck, and whose turn it is. When the game starts your overlay switches to the game, and when it ends **the result counts itself** — Froggi reads it from Slippi.' },
				{ type: 'image', src: '/image/tutorial/tournament/overlay-striking.jpg', caption: 'The Stage Striking demo overlay on stream.' },
				{ type: 'text', text: 'With OBS connected, OBS switches scenes on its own too: your striking scene between games, the game scene during a game, a camera scene after — see [Remote control OBS](/obs/tutorial/remote-obs).' },
			],
		},
		{
			title: 'You stay in control',
			blocks: [
				{ type: 'text', text: 'The **Tournament Dashboard** shows the set as it happens. You can act for a player, undo a mistake, restart a step or pause the phones — and fix the score or load earlier games if something went wrong.' },
				{ type: 'image', src: '/image/tutorial/tournament/dashboard-striking.jpg', caption: 'Stage striking on the Dashboard: click a stage to act for whoever\'s turn it is.' },
				{ type: 'text', text: 'And it works from your phone: walk around the venue with the set, your OBS scenes, sources and volume in your hand.' },
				{ type: 'image', src: '/image/tutorial/tournament/phone-dashboard.jpg', caption: 'The Dashboard on a phone.' },
			],
		},
		{
			title: 'What you need',
			blocks: [
				{ type: 'list', items: ['**Froggi** on the PC that plays or spectates the games (Slippi Dolphin)', 'A phone or any browser per player (per team in doubles)', 'For online sets: **ngrok** or **Tailscale** (next page)', 'Optional: OBS connected, and an overlay with a Stage Striking scene — the **Stage Striking** demo overlay is ready to use'] },
				{ type: 'text', text: 'Now let\'s set it up.' },
			],
		},
		{
			title: 'Player links',
			blocks: [
				{ type: 'text', text: 'Each player (or team) gets their **own link** — it only lets that phone act as that player, and only on their turn. A new set makes new links.' },
				{ type: 'list', items: ['**Tailscale** (recommended) — a permanent public address: the links work at the venue and online, and never change. When Tailscale Funnel is on, the links use it.', '**ngrok** — a free temporary address for online sets when Tailscale isn\'t set up (changes when ngrok restarts; the **Online** toggle on the Dashboard).', '**Neither** — devices on the same Wi-Fi as your PC still work.'] },
				{ type: 'text', text: 'The QR codes on the Dashboard stay **hidden until you click them**, so your links don\'t end up on stream. Click a shown QR to copy the link for Discord, or put a tablet with the QR at the setup.' },
			],
		},
		{
			title: 'Start a set',
			blocks: [
				{ type: 'list', ordered: true, items: ['Open **Stream** → **Tournament Dashboard**. Pick **Singles** or **Doubles** (Auto follows the game being played).', 'Click **Start Set**: the names (empty = the players\' Slippi tags), **Bo3** or **Bo5**, and whether players may agree to replay a stage DSR blocks.', 'Players scan their QR code. They can type their own name on their phone (✎) — you can still change it on the Dashboard.'] },
				{ type: 'text', text: 'Froggi switches your overlay to the **Stage Striking** scene.' },
			],
		},
		{
			title: 'The rules on the phones',
			blocks: [
				{ type: 'heading', text: 'Game 1' },
				{ type: 'list', ordered: true, items: ['**Characters** — double blind: both pick at the same time without seeing each other.', '**Rock · paper · scissors** — 30 seconds, a random pick if time runs out, ties go again.', 'The RPS winner chooses to **strike first or second**, then the starters are struck **1 – 2 – 1**. The last stage is played.'] },
				{ type: 'heading', text: 'Game 2 and later' },
				{ type: 'list', ordered: true, items: ['The winner **bans** a stage (no ban in Bo5).', 'The loser **picks** the stage — not one they already won on (**DSR**), unless both agree on their phones.', 'The winner picks a character, then the loser.'] },
				{ type: 'note', text: '**Doubles:** each team\'s phone picks for **both** teammates and confirms them together. Doubles stages: Battlefield, Dream Land, Final Destination, Pokémon Stadium, Yoshi\'s Story.' },
			],
		},
		{
			title: 'During the set',
			blocks: [
				{ type: 'text', text: '**Results come in by themselves**: when a Slippi game with the set\'s players ends, Froggi counts the winner and the phones move on. Ranked and unranked games never count.' },
				{ type: 'list', items: ['**Top card** — the score, the striking-link QR codes and the set\'s games. **Edit Games** is the one list of results: Slippi games, games you **add** by hand (characters, stage, winner, stocks left) or **from a replay**, delete, reorder, and **✎ change a winner** with a note (forfeit, DQ, LRAS by mistake). The score, your overlays and the striking all follow it.', '**Stage striking card** — who is connected, the strike timeline and the stages; click a stage to act for whoever\'s turn it is; **Undo**, **Restart step**, **Pause striking**. While a game runs: **Report result…** (adds the game to the list, prefilled) or **Cancel game** (doesn\'t count, play it again). **End match** ends the set.', '**Fix set…** — Froggi was closed or Slippi started a new session? Load the set\'s earlier games from your latest replays; in doubles, fix who is on which colour and port.'] },
				{ type: 'note', text: 'A disconnect that starts a new Slippi session with the same players simply continues the set — unless you turn off **Continue the set in the next session** in Fix set.' },
			],
		},
		{
			title: 'Run it from your phone',
			blocks: [
				{ type: 'list', ordered: true, items: ['Click the **phone icon** in Froggi\'s sidebar.', 'Use **Local** on the venue Wi-Fi, or **Remote** with Tailscale to reach it from anywhere.', 'Scan the QR. The first time you control something, your phone asks for the host password (on this PC: Settings → Authorization) and checks it.'] },
				{ type: 'note', text: 'Keep the Remote link private — it\'s your control panel. The player links are the ones you share.' },
			],
		},
		{
			title: 'What\'s next',
			blocks: [
				{ type: 'text', text: 'That\'s everything you need to run sets. When you want more:' },
				{ type: 'list', items: ['[**Flows**](/obs/tutorial/flows) — "when this happens, and this is true, do that": flash your Hue / Homey / Home Assistant lights when a player is on their last stock, or switch OBS to the Game scene when a game starts and a camera scene when it ends.', '[**Webhooks**](/obs/tutorial/webhook) — send every set event (games, results, strikes) to your own server, a Discord bot or a bracket tool.', '[**Remote control OBS**](/obs/tutorial/remote-obs) — scenes that switch by themselves and a combo that saves a replay clip.', '[**AI assistant**](/obs/tutorial/ai-assistant) — ask Claude to build your striking overlay or a flow for you.'] },
			],
		},
	],
};
