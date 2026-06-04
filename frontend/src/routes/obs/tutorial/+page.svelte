<script lang="ts">
	import { goto } from '$app/navigation';
	import { Paintbrush, Plug, Gamepad2, Trophy, Webhook } from 'lucide-svelte';

	import { Swords } from 'lucide-svelte';

	const tutorials = [
		{
			title: 'Build an overlay',
			description: 'Create HUD elements, scenes, layers, and animations from scratch.',
			path: '/obs/tutorial/new-overlay',
			icon: Paintbrush,
		},
		{
			title: 'Integrate with OBS',
			description: 'Embed overlays, set up WebSocket, and automate scene switching.',
			path: '/obs/tutorial/integrate-obs',
			icon: Plug,
		},
		{
			title: 'Remote control OBS',
			description: 'Map controller button combos to trigger OBS commands.',
			path: '/obs/tutorial/remote-obs',
			icon: Gamepad2,
		},
		{
			title: 'Run a tournament',
			description: 'Stage striking, player links, ngrok and Tailscale setup for online play.',
			path: '/set/tutorial',
			icon: Trophy,
		},
		{
			title: 'Play minigames online',
			description: 'Set up ngrok to play Bingo or Iron Man with a friend, or Tailscale for a permanent stable URL.',
			path: '/obs/tutorial/minigames-online',
			icon: Swords,
		},
		{
			title: 'Webhooks',
			description: 'Send real-time game events to any HTTP endpoint.',
			path: '/obs/tutorial/webhook',
			icon: Webhook,
		},
	];
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-lg flex flex-col gap-6">
		<div>
			<h1 class="font-bold text-3xl">Tutorials</h1>
			<p class="text-sm opacity-50 mt-1">Choose a guide to get started.</p>
		</div>

		<div class="flex flex-col gap-3">
			{#each tutorials as tutorial}
				<button
					class="tutorial-card w-full text-left"
					on:click={() => goto(tutorial.path)}
				>
					<span class="tutorial-card-icon">
						<svelte:component this={tutorial.icon} size={22} strokeWidth={1.5} />
					</span>
					<div class="flex flex-col min-w-0">
						<span class="font-semibold text-base leading-tight">{tutorial.title}</span>
						<span class="text-sm opacity-55 mt-0.5 leading-snug">{tutorial.description}</span>
					</div>
					<span class="ml-auto opacity-30 text-lg shrink-0">→</span>
				</button>
			{/each}
		</div>
	</div>
</main>

<style>
	.tutorial-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--secondary-color);
		border-radius: 0.375rem;
		background-color: var(--primary-color);
		color: var(--secondary-color);
		transition: opacity 0.15s, transform 0.15s;
		cursor: pointer;
	}

	.tutorial-card:hover {
		transform: scale(1.01);
	}

	.tutorial-card-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
	}
</style>
