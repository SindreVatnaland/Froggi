<script lang="ts">
	import { DashboardOption } from '$lib/models/enum';
	import { fade, fly } from 'svelte/transition';
	import OverlayScenes from '$lib/components/dashboard/OverlayScenes.svelte';
	import Default from '$lib/components/dashboard/Default.svelte';
	import ReplayBufferHandler from '$lib/components/dashboard/ReplayBufferHandler.svelte';

	let dashboardOption: DashboardOption = DashboardOption.Offline;
</script>

<main
	class={`fixed h-screen w-screen bg-cover bg-center text-secondary-color`}
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div
		class="w-full h-full flex flex-col overflow-y-auto items-center justify-start p-4 pb-24 gap-8"
	>
		<h1 class="text-secondary-color text-4xl font-bold">Dashboard</h1>
		<div class="flex gap-2">
			{#each Object.values(DashboardOption) as option}
				<button
					class={`btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary ${
						dashboardOption === option
							? 'border-secondary bg-opacity-50'
							: 'border-white'
					}`}
					on:click={() => {
						dashboardOption = option;
					}}
				>
					{option}
				</button>
			{/each}
		</div>
		{#key dashboardOption}
			<div
				class="relative w-full flex justify-center"
				in:fly={{ duration: 250, x: -200, delay: 250 }}
				out:fly={{ duration: 250, x: 200 }}
			>
				<div class="absolute flex flex-col gap-8 py-4">
					<Default />
					<div class="flex gap-2 justify-center items-center">
						<h1 class="text-secondary-color text-3xl font-semibold">Stream Commands</h1>
					</div>
					<OverlayScenes />
					<ReplayBufferHandler />
				</div>
			</div>
		{/key}
	</div>
</main>

<style>
</style>
