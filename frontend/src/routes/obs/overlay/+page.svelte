<script lang="ts">
	import { isElectron, isMobile, overlays, urls } from '$lib/utils/store.svelte';
	import { fade, fly } from 'svelte/transition';
	import OverlayModal from '$lib/components/obs/overlays/OverlayModal.svelte';
	import OverlayPreviewModal from '$lib/components/obs/overlays/OverlayPreviewModal.svelte';
	import NonInteractiveIFrame from '$lib/components/obs/overlays/preview/NonInteractiveIFrame.svelte';
	import type { Overlay } from '$lib/models/types/overlay';
	import { getOverlayById } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';

	let newOverlayModalOpen = false;
	let overlayPreviewOpen = false;
	let selectedOverlay: Overlay | undefined = undefined;

	const openPreview = async (overlayId: string) => {
		selectedOverlay = await getOverlayById(overlayId);
		overlayPreviewOpen = true;
	};

	const handleError = (e: any) => {
		console.error(e);
		// @ts-ignore
		setTimeout(location.reload, 2000);
	};

	$: url = $isElectron ? $urls?.local : $urls?.external;

	$: customOverlays = (
		Object.values($overlays).sort((a, b) => a.title.localeCompare(b.title)) ?? []
	).filter((overlay) => !overlay.isDemo);

	$: demoOverlays = (
		Object.values($overlays).sort((a, b) => a.title.localeCompare(b.title)) ?? []
	).filter((overlay) => overlay.isDemo);
</script>

<svelte:window on:error={handleError} />

<main
	class={`background-primary-color ${$isMobile ? 'pb-20' : ''}`}
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 150 }}
>
	<!-- Page header -->
	<div class="flex items-center justify-between mb-5">
		<h1 class="text-xl font-semibold text-secondary-color">Overlays</h1>
		{#if $isElectron}
			<button
				class="btn text-sm h-8 px-4 border-secondary rounded"
				on:click={() => (newOverlayModalOpen = true)}
			>
				+ New overlay
			</button>
		{/if}
	</div>

	<!-- Custom overlays -->
	{#if customOverlays.length}
		<section class="mb-8">
			<p class="section-label">Custom</p>
			<div class="card-grid mt-3">
				{#each customOverlays as overlay, i}
					<button
						class="overlay-card"
						in:fly={{ duration: 200, y: 24, delay: i * 40 }}
						on:click={() => openPreview(overlay.id)}
					>
						<div
							class="preview-frame border-secondary"
							style="aspect-ratio: {overlay.aspectRatio?.width ?? 16} / {overlay.aspectRatio?.height ?? 9};"
						>
							{#if url}
								<NonInteractiveIFrame
									src={`${url}/obs/overlay/${overlay.id}/layers`}
									title={overlay.title}
								/>
							{/if}
						</div>
						<p class="card-title text-secondary-color">{overlay.title}</p>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Demo overlays -->
	{#if demoOverlays.length}
		<section>
			<p class="section-label">Demo</p>
			<div class="card-grid mt-3">
				{#each demoOverlays as overlay, i}
					<button
						class="overlay-card"
						in:fly={{ duration: 200, y: 24, delay: i * 40 }}
						on:click={() => openPreview(overlay.id)}
					>
						<div
							class="preview-frame border-secondary"
							style="aspect-ratio: {overlay.aspectRatio?.width ?? 16} / {overlay.aspectRatio?.height ?? 9};"
						>
							{#if url}
								<NonInteractiveIFrame
									src={`${url}/obs/overlay/${overlay.id}/layers`}
									title={overlay.title}
								/>
							{/if}
						</div>
						<p class="card-title text-secondary-color">{overlay.title}</p>
					</button>
				{/each}
			</div>
		</section>
	{/if}
</main>

{#if selectedOverlay}
	<OverlayPreviewModal bind:open={overlayPreviewOpen} overlay={selectedOverlay} />
{/if}

<OverlayModal bind:open={newOverlayModalOpen} />

<style>
	.section-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.overlay-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		transition: transform 0.15s;
	}

	.overlay-card:hover {
		transform: scale(1.02);
	}

	.overlay-card:active {
		opacity: 0.6;
	}

	.preview-frame {
		width: 100%;
		overflow: hidden;
		border-radius: 0.125rem;
		background: rgba(0, 0, 0, 0.08);
	}

	.card-title {
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0 0.125rem;
	}
</style>
