<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthorized } from '$lib/utils/store.svelte';
	import { Layers, Trophy, Settings, BookOpen, Send, Grid3x3 } from 'lucide-svelte';

	const navItems = [
		{
			label: 'Overlays',
			description: 'Manage and preview stream overlays.',
			path: '/obs/overlay',
			icon: Layers,
			requiresAuth: false,
		},
		{
			label: 'Tournament Dashboard',
			description: 'Live control — scores, scenes, replay buffer.',
			path: '/obs/dashboard',
			icon: Trophy,
			requiresAuth: true,
		},
		{
			label: 'OBS Settings',
			description: 'WebSocket connection, scene commands, controller bindings.',
			path: '/obs/settings',
			icon: Settings,
			requiresAuth: true,
		},
		{
			label: 'Webhooks',
			description: 'Send real-time game events to external HTTP endpoints.',
			path: '/obs/webhook',
			icon: Send,
			requiresAuth: true,
		},
		{
			label: 'Bingo',
			description: 'Challenge-based bingo across a session. Solo or vs a friend.',
			path: '/obs/bingo',
			icon: Grid3x3,
			requiresAuth: false,
		},
		{
			label: 'Tutorial',
			description: 'Step-by-step setup guide.',
			path: '/obs/tutorial',
			icon: BookOpen,
			requiresAuth: false,
		},
	];
</script>

<main class="background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-lg flex flex-col gap-6">
		<div>
			<h1 class="font-bold text-3xl">OBS</h1>
			<p class="text-sm opacity-50 mt-1">Overlays, dashboard, and settings.</p>
		</div>

		<div class="flex flex-col gap-3">
			{#each navItems as item}
				{@const disabled = item.requiresAuth && !$isAuthorized}
				<button
					class="nav-card w-full text-left"
					class:nav-card--disabled={disabled}
					on:click={() => !disabled && goto(item.path)}
					{disabled}
				>
					<span class="nav-card-icon">
						<svelte:component this={item.icon} size={22} strokeWidth={1.5} />
					</span>
					<div class="flex flex-col min-w-0">
						<span class="font-semibold text-base leading-tight">{item.label}</span>
						<span class="text-sm opacity-55 mt-0.5 leading-snug">{item.description}</span>
						{#if disabled}
							<span class="nav-card-lock">Not authorized</span>
						{/if}
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

	.nav-card:hover:not(:disabled) {
		transform: scale(1.01);
	}

	.nav-card--disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.nav-card-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
	}

	.nav-card-lock {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.4;
		margin-top: 0.25rem;
	}
</style>
