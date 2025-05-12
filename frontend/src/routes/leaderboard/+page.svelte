<script lang="ts">
	import LeaderboardRow from '$lib/components/leaderboard/LeaderboardRow.svelte';
	import MultiSelect from '$lib/components/input/MultiSelect.svelte';
	import TextFitMulti from '$lib/components/TextFitMulti.svelte';
	import { localEmitter, isMobile } from '$lib/utils/store.svelte';
	import { fade, fly } from 'svelte/transition';

	$: selectedRegions = [];
	$: selectedCharacters = [];

	// TODO: add filter dropdown
	// TODO: fill dropdown options
	// TODO: use array of filters to filter
	// Add horizontal scroll bar on PC

	// TODO: Separate header and content component
</script>

<main
	class="fixed h-screen w-screen max-h-full max-w-full bg-cover bg-center lg:flex justify-center"
	style="background-image: url('/image/backgrounds/MeleeMenuGreen.png')"
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div class={`place-items-start px-2 w-full h-full max-h-full max-w-6xl pb-12 overflow-hidden`}>
		<div class="w-full h-12 grid content-center" in:fly={{ y: 100, duration: 1500 }}>
			<h1
				class="text-secondary-color text-md md:text-xl whitespace-nowrap m-0 font-medium text-shadow"
			>
				Leaderboard
			</h1>
		</div>
		<div class="w-full h-16 flex" in:fly={{ y: 100, duration: 1500, delay: 150 }}>
			<div class="w-32 mr-2">
				<MultiSelect bind:value={selectedRegions} label="Regions">
					<option value={'NA'}>North America</option>
					<option value={'EU'}>Europe</option>
					<option value={'Other'}>Other</option>
					<option value={'Friends'}>Favorites</option>
				</MultiSelect>
			</div>
			<div class="w-32 mr-2">
				<MultiSelect bind:value={selectedCharacters} label="Characters" isCharacter={true}>
					<option value={20}>Falco</option>
					<option value={4}>Kirby</option>
				</MultiSelect>
			</div>
		</div>
		<div class="max-h-full overflow-auto" in:fly={{ y: 100, duration: 1500, delay: 300 }}>
			<div class="w-full h-12 grid grid-cols-12 col-span-12 min-w-2xl max-w-6xl">
				<div
					class="w-full h-full grid grid-cols-12 col-span-12 border-b-1 border-gray-500 rounded-t-md background-color-primary bg-opacity-50"
				>
					<div class="w-full h-12 col-span-2 grid content-center justify-center">
						<TextFitMulti
							class="text-secondary-color text-xl whitespace-nowrap m-0 font-medium text-shadow"
						>
							RANK
						</TextFitMulti>
					</div>
					<div class="w-full h-12 col-span-3 grid content-center justify-start">
						<TextFitMulti
							class="text-secondary-color text-xl whitespace-nowrap m-0 font-medium text-shadow"
						>
							PLAYER
						</TextFitMulti>
					</div>
					<div class="w-full h-12 col-span-3 grid content-center justify-start">
						<TextFitMulti
							class="text-secondary-color text-xl whitespace-nowrap m-0 font-medium text-shadow"
						>
							CHARACTERS
						</TextFitMulti>
					</div>
					<div class="w-full h-12 col-span-2 grid content-center justify-center">
						<TextFitMulti
							class="text-secondary-color text-xl whitespace-nowrap m-0 font-medium text-shadow"
						>
							RATING
						</TextFitMulti>
					</div>
					<div class="w-full h-12 col-span-2 grid content-center justify-center">
						<TextFitMulti
							class="text-secondary-color text-xl whitespace-nowrap m-0 font-medium text-shadow"
						>
							W/L
						</TextFitMulti>
					</div>
				</div>
			</div>
			<div
				class="w-full grid grid-cols-12 min-w-2xl max-w-6xl h-full
			[&>*:nth-child(odd)]:background-color-primary [&>*:nth-child(odd)]:bg-opacity-25
			[&>*:nth-child(even)]:background-color-primary [&>*:nth-child(even)]:bg-opacity-50"
			>
				{#each Array.from(Array(200)) as _, i}
					<LeaderboardRow
						player={{
							rank: i + 1,
							nickname: (Math.random() + 1).toString(36).substring(3),
							connectCode: `${Math.random()
								.toString(36)
								.substring(7, 11)}#${Math.floor(Math.random() * 800 + 100)}`,
							characters: Array.from(
								Array(Math.floor(Math.random() * 3 + 1)).keys(),
							).map(() => Math.floor(Math.random() * 24)),
							rating: 2500,
							winLoss: '1024/32',
						}}
					/>
				{/each}
			</div>
			<!-- TODO: Replace "true" with leaderboard array -->
			<!-- Updating the leaderboard array will then re-render the elements and cause a new trigger -->
			{#key true}
				<!-- TODO: Render if not end of database* -->
				{#if true}
					<h1 class="text-secondary-color text-shadow text-md">Loading..</h1>
				{/if}
			{/key}
		</div>
	</div>
</main>

<style>
</style>
