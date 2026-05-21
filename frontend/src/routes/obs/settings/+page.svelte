<script lang="ts">
	import { goto } from '$app/navigation';
	import { Plug, Clapperboard, Gamepad2, Send } from 'lucide-svelte';

	const navItems = [
		{
			label: 'OBS WebSocket',
			description: 'IP address, port, and password for OBS connection.',
			path: '/obs/settings/websocket',
			icon: Plug,
		},
		{
			label: 'Scene Commands',
			description: 'Configure OBS scene switches per game state.',
			path: '/obs/settings/scene',
			icon: Clapperboard,
		},
		{
			label: 'Controller Commands',
			description: 'Bind controller inputs to OBS commands.',
			path: '/obs/settings/controller',
			icon: Gamepad2,
		},
		{
			label: 'Webhooks',
			description: 'Send game events to external HTTP endpoints.',
			path: '/obs/settings/webhook',
			icon: Send,
		},
	];
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-lg flex flex-col gap-6">
		<div>
			<h1 class="font-bold text-3xl">OBS Settings</h1>
			<p class="text-sm opacity-50 mt-1">Connection, scene commands, and controller bindings.</p>
		</div>

		<div class="flex flex-col gap-3">
			{#each navItems as item}
				<button class="nav-card w-full text-left" on:click={() => goto(item.path)}>
					<span class="nav-card-icon">
						<svelte:component this={item.icon} size={22} strokeWidth={1.5} />
					</span>
					<div class="flex flex-col min-w-0">
						<span class="font-semibold text-base leading-tight">{item.label}</span>
						<span class="text-sm opacity-55 mt-0.5 leading-snug">{item.description}</span>
					</div>
					<span class="ml-auto opacity-30 text-lg shrink-0">→</span>
				</button>
			{/each}
		</div>
	</div>
</main>

<style>
	.nav-card {
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

	.nav-card:hover {
		transform: scale(1.01);
	}

	.nav-card-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
	}
</style>
