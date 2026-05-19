<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthorized } from '$lib/utils/store.svelte';

	const navItems = [
		{
			label: 'Overlays',
			description: 'Manage and preview stream overlays',
			path: '/obs/overlay',
			requiresAuth: false,
		},
		{
			label: 'Dashboard',
			description: 'Live control — scores, scenes, replay buffer',
			path: '/obs/dashboard',
			requiresAuth: true,
		},
		{
			label: 'OBS Settings',
			description: 'WebSocket connection, scene commands, controller bindings',
			path: '/obs/settings',
			requiresAuth: true,
		},
		{
			label: 'Tutorial',
			description: 'Step-by-step setup guide',
			path: '/obs/tutorial',
			requiresAuth: false,
		},
	];
</script>

<main class="flex justify-center">
	<div class="w-full max-w-2xl">
	<h1 class="text-xl font-semibold text-secondary-color mb-6">OBS</h1>

	<div class="nav-grid">
		{#each navItems as item}
			{@const disabled = item.requiresAuth && !$isAuthorized}
			<button
				class="nav-card border-secondary text-secondary-color"
				class:nav-card--disabled={disabled}
				on:click={() => !disabled && goto(item.path)}
				{disabled}
			>
				<span class="nav-card-label">{item.label}</span>
				<span class="nav-card-desc">{item.description}</span>
				{#if disabled}
					<span class="nav-card-lock">Not authorized</span>
				{/if}
			</button>
		{/each}
	</div>
	</div>
</main>

<style>
	.nav-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.nav-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1rem 1.25rem;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s, transform 0.1s;
		border-radius: 0.25rem;
	}

	.nav-card:hover:not(:disabled) {
		background: rgba(128, 128, 128, 0.07);
		transform: translateY(-1px);
	}

	.nav-card:active:not(:disabled) {
		opacity: 0.6;
		transform: none;
	}

	.nav-card--disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.nav-card-label {
		font-size: 0.9rem;
		font-weight: 600;
	}

	.nav-card-desc {
		font-size: 0.75rem;
		opacity: 0.55;
		line-height: 1.4;
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
