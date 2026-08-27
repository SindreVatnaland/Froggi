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
