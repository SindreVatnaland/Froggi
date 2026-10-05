<script lang="ts">
	import { CommandType } from '$lib/models/types/commandTypes';
	import { electronEmitter, obsConnection } from '$lib/utils/store.svelte';
	import { onMount } from 'svelte';

	// Dashboard scene switcher. Favourites (★) are shown first as big buttons; stored per device
	// (localStorage), so each control device can keep its own shortlist.
	const FAVOURITES_KEY = 'froggi.dashboard.favouriteScenes';
	let favourites: string[] = [];
	let showAll = false;

	onMount(() => {
		try {
			favourites = JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? '[]');
		} catch {
			favourites = [];
		}
	});

	const toggleFavourite = (name: string) => {
		favourites = favourites.includes(name) ? favourites.filter((f) => f !== name) : [...favourites, name];
		localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
	};

	const switchScene = (sceneName: string) =>
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SetCurrentProgramScene', { sceneName });

	// OBS lists scenes bottom-up; show them top-down like the OBS scene dock.
	$: scenes = [...($obsConnection?.scenes?.scenes ?? [])].reverse().map((s) => s.sceneName);
	$: current = $obsConnection?.scenes?.currentProgramSceneName;
	$: favouriteScenes = favourites.filter((f) => scenes.includes(f));
	$: listed = showAll || !favouriteScenes.length ? scenes : [];
</script>

{#if scenes.length}
	{#if favouriteScenes.length}
		<div class="fav-grid">
			{#each favouriteScenes as name (name)}
				<button class="scene-btn scene-btn--fav" class:scene-btn--live={current === name} on:click={() => switchScene(name)}>
					{name}
				</button>
			{/each}
		</div>
		<button class="show-all" on:click={() => (showAll = !showAll)}>{showAll ? 'Hide other scenes' : 'All scenes'}</button>
	{/if}
	{#if listed.length}
		<div class="flex flex-col gap-1.5" class:mt-2={favouriteScenes.length}>
			{#each listed as name (name)}
				<div class="scene-row">
					<button class="scene-btn flex-1" class:scene-btn--live={current === name} on:click={() => switchScene(name)}>
						{name}
					</button>
					<button
						class="star"
						class:star--on={favourites.includes(name)}
						title={favourites.includes(name) ? 'Remove from favourites' : 'Add to favourites'}
						on:click={() => toggleFavourite(name)}
					>★</button>
				</div>
			{/each}
		</div>
	{/if}
	{#if !favouriteScenes.length}
		<p class="hint">★ a scene to pin it here.</p>
	{/if}
{:else}
	<p class="hint">No scenes — connect OBS.</p>
{/if}

<style>
	.fav-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
		gap: 0.4rem;
	}
	.scene-row {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}
	.scene-btn {
		text-align: left;
		font-size: 0.8rem;
		padding: 0.35rem 0.6rem;
		border-radius: 0.3rem;
		border: 1px solid color-mix(in srgb, var(--secondary-color) 25%, transparent);
		color: var(--secondary-color);
		background: transparent;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.scene-btn--fav {
		text-align: center;
		font-weight: 600;
		padding: 0.6rem 0.5rem;
	}
	.scene-btn:hover {
		background: color-mix(in srgb, var(--secondary-color) 10%, transparent);
	}
	.scene-btn--live {
		border-color: #ef4444;
		background: color-mix(in srgb, #ef4444 15%, transparent);
	}
	.star {
		font-size: 0.9rem;
		opacity: 0.25;
		color: var(--secondary-color);
		background: none;
	}
	.star--on {
		opacity: 1;
		color: #facc15;
	}
	.show-all {
		margin-top: 0.4rem;
		font-size: 0.7rem;
		opacity: 0.5;
		color: var(--secondary-color);
		background: none;
	}
	.hint {
		font-size: 0.7rem;
		opacity: 0.4;
		margin-top: 0.4rem;
	}
</style>
