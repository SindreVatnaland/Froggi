import type { ContentTopic } from '../types';

export const remoteAccessTopics: ContentTopic[] = [
	{
		id: 'remote-access-why',
		title: 'Why you need Tailscale or ngrok',
		category: 'remote-access',
		summary: 'Froggi normally only listens on your local network. Tailscale or ngrok expose it so a friend (or your phone, from elsewhere) can actually reach it.',
		blocks: [
			{
				type: 'paragraph',
				text: 'By default Froggi is only reachable on your local network. Anything that needs to reach it from outside — a friend joining your Bingo/Iron Man lobby, remote OBS control, watching your live overlay from your phone on cell data, stage-striking for a tournament set — needs one of these two tunnels turned on first.',
			},
		],
	},
	{
		id: 'remote-tournament-control',
		title: 'Remote tournament control',
		category: 'remote-access',
		summary: 'Start sets, act for a player, fix the score and switch OBS scenes from your phone. Players strike on their own phones.',
		blocks: [
			{
				type: 'list',
				items: [
					'Open the Tournament Dashboard on your phone: the phone icon in Froggi\'s sidebar shows a QR code. Local works on the venue Wi-Fi, Remote works from anywhere (Tailscale, Settings → Remote Access).',
					'Controlling Froggi needs the host password (Settings → Authorization on the host PC); the phone asks for it the first time.',
					'Players only need their own striking link from the Dashboard, no password.',
				],
			},
		],
	},
	{
		id: 'host-password',
		title: 'Host password: controlling Froggi from another device',
		category: 'remote-access',
		summary: 'Other devices (phone, a co-host\'s browser) can always watch; to control Froggi they need the host password, set on the host PC in Settings → Authorization.',
		blocks: [
			{
				type: 'list',
				text: 'How it works:',
				items: [
					'On the host PC: Froggi → Settings → Authorization. Type a password or press Generate, then Save. The password is shown there. Without one, no other device can control Froggi.',
					'On the other device: the first time you try to control something (switch a scene, use the Tournament Dashboard, edit an overlay), Froggi asks for the host password and checks it right away — "Connected" or "Wrong password". It is remembered on that device. You can also enter it in that device\'s Settings → Authorization.',
					'Without the password a device can still watch: overlays, the live game, OBS browser sources. Players\' stage-striking phone links work without it (they carry their own token).',
					'Changing the password on the host locks out every device until they enter the new one.',
				],
			},
			{
				type: 'note',
				text: 'The AI assistant never sees or hands out the password — it can only tell whether one is set (get_app_status → hostPasswordSet). Point the user to Settings → Authorization on the host PC.',
			},
		],
	},
	{
		id: 'remote-access-tailscale-vs-ngrok',
		title: 'Tailscale vs. ngrok — which one to use',
		category: 'remote-access',
		summary: 'Tailscale: stable, permanent URL, best for your own remote control/viewing. ngrok: quick one-off tunnel, best for playing a minigame with a friend.',
		blocks: [
			{
				type: 'list',
				text: 'Tailscale (recommended for personal/ongoing use):',
				items: [
					'Gives a stable URL that never changes — set it up once',
					'Best for: controlling OBS remotely, watching your own overlay from your phone, stage-striking for tournaments',
					'Needs the Tailscale app installed and logged in; Froggi can detect and enable its "Funnel" (public exposure) automatically',
				],
			},
			{
				type: 'list',
				text: 'ngrok (best for one-off sharing):',
				items: [
					'Generates a temporary public URL, good for a single session',
					'Best for: inviting a friend into a Bingo/Iron Man lobby without either of you setting up a persistent account/network',
					'Froggi auto-detects the ngrok URL once you run it locally (ngrok http 3200)',
				],
			},
			{
				type: 'note',
				text: 'The Discord "Join" button and public lobby invites specifically use the ngrok-based connect code, kept consistent between the Share Code, the deep link, and Discord Rich Presence — even if Tailscale is also enabled.',
			},
		],
	},
];
