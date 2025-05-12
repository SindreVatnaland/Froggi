<script>
	import CharacterIcon from '$lib/components/leaderboard/CharacterIcon.svelte';
	import { isMobile } from '$lib/utils/store.svelte';
	import { fade, fly } from 'svelte/transition';

	// TODO: Click on name directs to profile page
	// TODO: Implement player type

	const animate = (node) =>
		$isMobile ? fly(node, { duration: 150, x: 50 }) : fade(node, { duration: 150 });

	export let player;
</script>

<div class="w-full h-12 grid grid-cols-12 gap-1" in:animate>
	<div class="w-full h-12 col-span-2 grid content-center justify-center">
		<h1 class="whitespace-nowrap m-0 font-medium text-secondary-color text-xl text-shadow">
			{player.rank}
		</h1>
	</div>
	<div class="w-full h-12 col-span-3 grid grid-rows-6 content-center">
		<div class="w-full h-full max-w-full row-span-3">
			<h1 class="w-full max-w-full text-secondary-color text-xl text-shadow">
				{player.nickname}
			</h1>
		</div>
		<div class="w-full h-full max-w-full row-span-2">
			<h1 class="w-full max-w-full text-secondary-color text-md text-shadow">
				{player.connectCode}
			</h1>
		</div>
	</div>
	<div class="w-full h-12 col-span-3 flex flex-row gap-2 text-shadow">
		{#each player.characters as characterId}
			<CharacterIcon {characterId} imgClass="w-7 h-7" />
		{/each}
	</div>
	<div class="w-full h-12 col-span-2 grid content-center justify-center text-shadow">
		<h1 class="whitespace-nowrap m-0 font-medium text-secondary-color text-xl">
			{player.rating}
		</h1>
	</div>
	<div class="w-full h-12 col-span-2 grid content-center justify-center text-shadow">
		<h1 class="whitespace-nowrap m-0 font-medium text-secondary-color text-xl">
			{player.winLoss}
		</h1>
	</div>
</div>
