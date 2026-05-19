<script lang="ts">
	import { goto } from '$app/navigation';

	const navItems = [
		{
			label: 'OBS WebSocket',
			description: 'IP address, port, and password for OBS connection',
			path: '/obs/settings/websocket',
		},
		{
			label: 'Scene Commands',
			description: 'Configure OBS scene switches per game state',
			path: '/obs/settings/scene',
		},
		{
			label: 'Controller Commands',
			description: 'Bind controller inputs to OBS commands',
			path: '/obs/settings/controller',
		},
	];
</script>

<h1 class="text-xl font-semibold text-secondary-color mb-6">OBS Settings</h1>

<div class="nav-grid">
	{#each navItems as item}
		<button class="nav-card border-secondary text-secondary-color" on:click={() => goto(item.path)}>
			<span class="nav-card-label">{item.label}</span>
			<span class="nav-card-desc">{item.description}</span>
		</button>
	{/each}
</div>

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

	.nav-card:hover {
		background: rgba(128, 128, 128, 0.07);
		transform: translateY(-1px);
	}

	.nav-card:active {
		opacity: 0.6;
		transform: none;
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
</style>
