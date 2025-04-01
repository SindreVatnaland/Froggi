<script lang="ts">
	import { ConnectionState } from '$lib/models/enum';
	import { currentPlayer, dolphinState } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';

	$: rankIcon = $currentPlayer.rank?.current?.rank?.toUpperCase() ?? 'UNRANKED';

	$: console.log($currentPlayer);
</script>

<div class="w-full h-full relative">
	{#if $dolphinState === ConnectionState.Connected}
		<div class="w-full flex flex-col justify-center items-center gap-2 absolute">
			<h1
				class="text-4xl text-secondary-color"
				in:fly={{ y: -100, duration: 500, delay: 500 }}
				out:fly={{ y: -100, duration: 250, delay: 0 }}
			>
				Welcome, {$currentPlayer?.rank?.current?.displayName}!
			</h1>
			<h2
				class="text-xl text-secondary-color opacity-70"
				in:fly={{ y: -100, duration: 500, delay: 550 }}
				out:fly={{ y: -100, duration: 250, delay: 0 }}
			>
				{$currentPlayer.rank?.current?.connectCode}
			</h2>
			<img
				in:fly={{ y: -100, duration: 500, delay: 600 }}
				out:fly={{ y: -100, duration: 250, delay: 0 }}
				class="h-24 aspect-square"
				src={`/image/rank-icons/${rankIcon}.svg`}
				alt={'Rank icon'}
			/>
			<h2
				class="text-xl text-secondary-color"
				in:fly={{ y: -100, duration: 500, delay: 650 }}
				out:fly={{ y: -100, duration: 250, delay: 0 }}
			>
				{$currentPlayer?.rank?.current?.rank}
			</h2>
			<h2
				class="text-xl text-secondary-color"
				in:fly={{ y: -100, duration: 500, delay: 700 }}
				out:fly={{ y: -100, duration: 250, delay: 0 }}
			>
				{$currentPlayer?.rank?.current?.rating.toFixed(1)}
			</h2>
			<div
				class="flex w-full justify-center gap-8"
				in:fly={{ y: -100, duration: 500, delay: 750 }}
				out:fly={{ y: -100, duration: 250, delay: 0 }}
			>
				<h2 class="text-xl text-secondary-color">
					W: {$currentPlayer?.rank?.current?.wins}
				</h2>
				<h2 class="text-xl text-secondary-color">
					L: {$currentPlayer?.rank?.current?.losses}
				</h2>
			</div>
		</div>
	{:else}
		<div
			class="w-full h-full flex items-center justify-center absolute"
			in:fly={{ y: -100, duration: 500, delay: 500 }}
			out:fly={{ y: -100, duration: 500, delay: 0 }}
		>
			<h1 class="text-2xl text-secondary-color">Connecting to Dolphin...</h1>
		</div>
	{/if}
</div>
