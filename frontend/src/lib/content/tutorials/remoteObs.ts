import type { Tutorial } from './types';

export const remoteObsTutorial: Tutorial = {
	id: 'remote-obs',
	title: 'Remote control OBS',
	description: 'Scenes that switch by themselves, controller combos, and OBS from your phone.',
	icon: 'Gamepad2',
	path: '/obs/tutorial/remote-obs',
	pages: [
		{
			title: 'What it gives you',
			blocks: [
				{ type: 'text', text: 'Run your stream without touching the keyboard during a match:' },
				{ type: 'list', items: ['**Scene Commands** — OBS follows the game: your Game scene when a game starts, a big camera scene when it ends, the striking scene between games.', '**Controller Commands** — hold a combo on your controller to save a replay clip or toggle your camera.', '**The Dashboard on your phone** — switch scenes, show or hide sources, set volume and save replays from anywhere in the room.'] },
				{ type: 'image', src: '/image/tutorial/obs/automation.jpg', caption: 'Stream → Automation.' },
				{ type: 'note', text: 'All of this needs OBS connected — see [Integrate with OBS](/obs/tutorial/integrate-obs).' },
			],
		},
		{
			title: 'Scene Commands',
			blocks: [
				{ type: 'text', text: 'Go to **Stream** → **Automation** → **Scene Commands**, turn on **Enable scene switching**, then click **+ Add** next to a game state and pick what OBS should do — usually **switch scene**.' },
				{ type: 'image', src: '/image/tutorial/obs/scene-commands.jpg', caption: 'One list per game state; commands run the moment Froggi enters it.' },
				{ type: 'list', items: ['**In Game** → switch to "Game"', '**Post Game** → switch to "Camera"', '**Stage Striking** → switch to your striking overlay scene', '**Menu** → back to "Camera" or a break scene'] },
				{ type: 'text', text: 'Each command is **Global**, **Singles** or **Doubles**. A Singles or Doubles command replaces the Global one for that state — e.g. a "Game (doubles)" scene with four player cams.' },
			],
		},
		{
			title: 'Controller Commands',
			blocks: [
				{ type: 'text', text: 'Go to **Stream** → **Automation** → **Controller Commands**, turn on **Enable controller commands** and click **+ Add Command**: tick the buttons of your combo and pick the OBS action.' },
				{ type: 'image', src: '/image/tutorial/obs/controller-commands.jpg', caption: 'Controller Commands.' },
				{ type: 'list', items: ['**L + R + Start** — save the replay buffer (a clip of the last 30 seconds)', '**L + R + Z** — show or hide your webcam', '**L + R + A** — switch to a scene'] },
				{ type: 'list', items: ['A combo fires after you **hold it for half a second**, then waits a second before it can fire again — no accidents mid-game.', 'Dolphin must be open so Froggi can read your controller.'] },
				{ type: 'note', text: '⚠️ **Windows only** — Froggi can\'t read controllers on macOS or Linux, so controller combos aren\'t available there.' },
			],
		},
		{
			title: 'Access from anywhere',
			blocks: [
				{ type: 'text', text: 'On your own Wi-Fi nothing is needed. To control Froggi from anywhere — or give a co-host a link that never changes — use **Tailscale** (free).' },
				{ type: 'list', ordered: true, items: ['Install Tailscale and log in.', 'In Froggi: [Settings → Remote Access](/settings#remote-access) — follow the status there until it is green.', 'Turn on **Funnel** to get your permanent link. It stays hidden until you click it; Copy always works.'] },
				{ type: 'note', text: 'Anyone with the link can open Froggi, but controlling it needs your host password — set it in [Settings → Authorization](/settings). The other device asks for it the first time it tries to control something. For playing minigames online, the host uses ngrok instead — see Play minigames online.' },
			],
		},
		{
			title: 'OBS from your phone',
			blocks: [
				{ type: 'text', text: 'The **Tournament Dashboard** works in any browser. Open it on your phone and you have your scenes, sources, volume and replay buffer in your hand.' },
				{ type: 'image', src: '/image/tutorial/tournament/phone-dashboard.jpg', caption: 'The Dashboard on a phone.' },
				{ type: 'list', ordered: true, items: ['Click the **phone icon** in Froggi\'s sidebar.', '**Local** works on your Wi-Fi; **Remote** works from anywhere (needs Tailscale, Settings → Remote Access).', 'Scan the QR code. The first time you control something, the phone asks for the host password (on this PC: Settings → Authorization) and checks it.'] },
			],
		},
		{
			title: 'Test it',
			blocks: [
				{ type: 'text', text: 'No match needed: open any overlay and press **▶ Run replay** in the editor. Froggi plays your latest replay and goes through the game states as if live — watch OBS switch scenes, and hold your combo.' },
				{ type: 'list', items: ['Nothing happens? Check **OBS Connection** is green and the commands are switched on (also on the Dashboard under Automation).', 'Check the command\'s format (Global / Singles / Doubles) matches the game.'] },
				{ type: 'text', text: 'Want more — conditions, or your smart home? See the [Flows tutorial](/obs/tutorial/flows).' },
			],
		},
	],
};
