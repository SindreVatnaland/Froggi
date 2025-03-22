<script lang="ts">
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { isNil } from 'lodash';
	import WhatToLearn from '$lib/components/tutorial/integrate-obs/WhatToLearn.svelte';
	import OpenInSeparateWindow from '$lib/components/tutorial/OpenInSeparateWindow.svelte';
	import ObsConnection from '$lib/components/tutorial/integrate-obs/ObsConnection.svelte';
	import EmbedOverlay from '$lib/components/tutorial/integrate-obs/EmbedOverlay.svelte';

	let scrollElement: HTMLElement;
	const scrollToTop = () => {
		if (isNil(scrollElement)) return;
		scrollElement.scroll({ top: 0 });
	};

	let pageIndex = Number($page.url.searchParams.get('page') || 0);

	let scenes = [
		{
			title: 'What to learn in this tutorial',
			component: WhatToLearn,
		},
		{
			title: 'Follow in separate window',
			component: OpenInSeparateWindow,
		},
		{
			title: 'Set up a OBS Connection',
			component: ObsConnection,
		},
		{
			title: 'Embed Overlay',
			component: EmbedOverlay,
		},
	];

	const handlePrevious = () => {
		if (pageIndex > 0) {
			pageIndex--;
			scrollToTop();
		}
	};

	const handleNext = () => {
		if (pageIndex < scenes.length - 1) {
			pageIndex++;
			scrollToTop();
		}
	};
</script>

<main
	class="fixed h-screen w-screen bg-cover bg-center flex justify-center"
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div class="w-full max-w-3xl h-full flex flex-col justify-center items-center p-8 gap-4">
		<div>
			<h1 class="color-secondary font-bold text-4xl">Tutorial</h1>
		</div>
		<div
			class="flex-1 flex flex-col justify-start items-start h-full w-full text-secondary-color gap-4 overflow-auto border-t border-b border-secondary-color p-2"
			bind:this={scrollElement}
		>
			{#if scenes[pageIndex]}
				<svelte:component this={scenes[pageIndex].component} />
			{:else}
				<p>Page not found</p>
			{/if}
		</div>
		<div class="flex justify-between w-full">
			<button
				disabled={pageIndex === 0}
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border border-secondary-color w-40 h-20 my-4 disabled:opacity-50"
				on:click={handlePrevious}
			>
				Previous
			</button>
			<button
				disabled={pageIndex === scenes.length - 1}
				class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border border-secondary-color w-40 h-20 my-4 disabled:opacity-50"
				on:click={handleNext}
			>
				Next
			</button>
		</div>
	</div>
</main>
