<script lang="ts">
	import { isElectron, isMobile, overlays } from '$lib/utils/store.svelte';
	import { fade, fly } from 'svelte/transition';
	import OverlayModal from '$lib/components/obs/overlays/OverlayModal.svelte';
	import OverlayPreviewModal from '$lib/components/obs/overlays/OverlayPreviewModal.svelte';
	import type { Overlay } from '$lib/models/types/overlay';
	import { getOverlayById } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';

	let newOverlayModalOpen = false;
	let overlayPreviewOpen = false;

	const openPreview = async (overlayId: string) => {
		console.log(overlayId);
		selectedOverlay = await getOverlayById(overlayId);
		console.log(overlayId, selectedOverlay);
		overlayPreviewOpen = true;
	};

	const handleError = (e: any) => {
		console.error(e);
		// @ts-ignore
		setTimeout(location.reload, 2000);
	};

	$: customOverlays = (
		Object.values($overlays).sort((a, b) => a.title.localeCompare(b.title)) ?? []
	).filter((overlay) => !overlay.isDemo);
	$: demoOverlays = (
		Object.values($overlays).sort((a, b) => a.title.localeCompare(b.title)) ?? []
	).filter((overlay) => overlay.isDemo);

	let selectedOverlay: Overlay | undefined = undefined;
</script>

<svelte:window on:error={handleError} />

<main
	class="fixed w-screen bg-cover bg-center"
	style={`height: 100vh; `}
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<div
		class={`w-full h-full max-h-full gap-4 flex flex-col justify-between items-center ${
			$isMobile && 'pb-18'
		}`}
	>
		<div>
			<h1 class="text-4xl font-bold color-secondary">Overlays</h1>
		</div>
		<div class="w-full h-full flex-1 flex flex-col gap-2 overflow-hidden">
			<div
				class="w-full border-secondary flex flex-col rounded-sm max-h-[50%] min-h-48 overflow-auto"
			>
				<h1 class="text-2xl font-bold w-full text-center color-secondary">Demo</h1>
				<div
					class="flex-1 flex flex-wrap gap-4 w-full items-center justify-evenly overflow-auto py-4 rounded-md p-4"
				>
					{#each demoOverlays as overlay, i}
						<div in:fly={{ duration: 250, y: 50, delay: i * 50 }}>
							<button
								class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border border-secondary rounded w-40 min-h-[5rem] my-4"
								on:click={() => {
									openPreview(overlay.id);
								}}
							>
								{overlay.title}
							</button>
						</div>
					{/each}
				</div>
			</div>
			<div class="flex-1 flex flex-col w-full border-secondary overflow-auto">
				<h1 class="text-2xl font-bold w-full text-center color-secondary">Custom</h1>
				<div
					class="flex-1 flex flex-wrap gap-4 w-full items-center justify-evenly overflow-auto py-4 rounded-md p-4"
				>
					{#each customOverlays as overlay, i}
						<div in:fly={{ duration: 250, y: 50, delay: i * 50 }}>
							<button
								class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border-secondary rounded w-40 min-h-[5rem] my-4"
								on:click={() => {
									openPreview(overlay.id);
								}}
							>
								{overlay.title}
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
		{#if $isElectron}
			<div>
				<button
					class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 text-3xl font-semibold text-secondary-color text-md whitespace-nowrap p-4 border-secondary rounded"
					on:click={() => (newOverlayModalOpen = true)}
				>
					Add new
				</button>
			</div>
		{/if}
	</div>
	{#if selectedOverlay}
		<OverlayPreviewModal bind:open={overlayPreviewOpen} overlay={selectedOverlay} />
	{/if}

	<OverlayModal bind:open={newOverlayModalOpen} />
</main>
