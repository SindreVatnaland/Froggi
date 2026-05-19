<script lang="ts">
	import { page } from '$app/stores';
	import { isNil } from 'lodash';

	export let scenes: { title: string; component: any }[] = [];

	let scrollElement: HTMLElement;
	const scrollToTop = () => {
		if (isNil(scrollElement)) return;
		scrollElement.scroll({ top: 0 });
	};

	let pageIndex = Number($page.url.searchParams.get('page') || 0);

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

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') handlePrevious();
		if (e.key === 'ArrowRight') handleNext();
	}

	$: progress = scenes.length > 1 ? (pageIndex / (scenes.length - 1)) * 100 : 100;
	$: currentTitle = scenes[pageIndex]?.title ?? '';
</script>

<svelte:window on:keydown={handleKeyPress} />

<main class="fixed h-screen w-screen background-primary-color text-secondary-color flex justify-center">
	<div class="w-full max-w-3xl h-full flex flex-col p-6 gap-0">

		<!-- Header -->
		<div class="flex items-baseline justify-between mb-3">
			<h1 class="font-bold text-3xl text-secondary-color">Tutorial</h1>
			<span class="text-sm opacity-50 font-medium tabular-nums">
				{pageIndex + 1} / {scenes.length}
			</span>
		</div>

		<!-- Progress bar -->
		<div class="progress-track mb-1">
			<div class="progress-fill" style="width: {progress}%" />
		</div>

		<!-- Current page title -->
		<p class="text-xs uppercase tracking-widest opacity-50 font-semibold mb-4 mt-2">
			{currentTitle}
		</p>

		<!-- Content area -->
		<div
			class="flex-1 overflow-auto tutorial-content border-t border-secondary-color pt-4"
			bind:this={scrollElement}
		>
			{#key pageIndex}
				<div>
					{#if scenes[pageIndex]}
						<svelte:component this={scenes[pageIndex].component} />
					{:else}
						<p class="opacity-50">Page not found.</p>
					{/if}
				</div>
			{/key}
		</div>

		<!-- Navigation -->
		<div class="flex items-center justify-between pt-4 border-t border-secondary-color mt-4 gap-4">
			<button
				disabled={pageIndex === 0}
				class="btn text-sm h-10 px-6 border-secondary rounded disabled:opacity-30"
				on:click={handlePrevious}
			>
				← Previous
			</button>

			<!-- Step dots -->
			<div class="flex gap-1.5 flex-wrap justify-center flex-1">
				{#each scenes as _, i}
					<button
						class="step-dot {i === pageIndex ? 'step-dot-active' : ''} {i < pageIndex ? 'step-dot-done' : ''}"
						on:click={() => { pageIndex = i; scrollToTop(); }}
						aria-label="Go to step {i + 1}"
					/>
				{/each}
			</div>

			<button
				disabled={pageIndex === scenes.length - 1}
				class="btn text-sm h-10 px-6 border-secondary rounded disabled:opacity-30"
				on:click={handleNext}
			>
				Next →
			</button>
		</div>
	</div>
</main>

<style>
	.progress-track {
		width: 100%;
		height: 3px;
		background-color: var(--secondary-color);
		opacity: 0.15;
		border-radius: 2px;
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background-color: var(--secondary-color);
		opacity: 1;
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.step-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background-color: var(--secondary-color);
		opacity: 0.2;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: opacity 0.2s, transform 0.2s;
		flex-shrink: 0;
	}

	.step-dot:hover {
		opacity: 0.5;
	}

	.step-dot-done {
		opacity: 0.4;
	}

	.step-dot-active {
		opacity: 1;
		transform: scale(1.4);
	}
</style>
