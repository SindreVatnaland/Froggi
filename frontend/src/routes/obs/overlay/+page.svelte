<script lang="ts">
	import { isElectron, isMobile, overlays, urls } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import OverlayModal from '$lib/components/obs/overlays/OverlayModal.svelte';
	import OverlayPreviewModal from '$lib/components/obs/overlays/OverlayPreviewModal.svelte';
	import NonInteractiveIFrame from '$lib/components/obs/overlays/preview/NonInteractiveIFrame.svelte';
	import SceneSelect from '$lib/components/obs/overlays/selector/SceneSelect.svelte';
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

	let search = '';

	$: allOverlays = Object.values($overlays).sort((a, b) => a.title.localeCompare(b.title)) ?? [];

	$: customOverlays = allOverlays
		.filter((o) => !o.isDemo)
		.filter((o) => !search || o.title.toLowerCase().includes(search.toLowerCase()));

	$: demoOverlays = allOverlays
		.filter((o) => o.isDemo)
		.filter((o) => !search || o.title.toLowerCase().includes(search.toLowerCase()));

	function groupByAspectRatio(items: Overlay[]): [string, Overlay[]][] {
		const map = new Map<string, Overlay[]>();
		for (const overlay of items) {
			const w = overlay.aspectRatio?.width ?? 16;
			const h = overlay.aspectRatio?.height ?? 9;
			const key = `${w}:${h}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(overlay);
		}
		return [...map.entries()].sort(([ak], [bk]) => {
			const [aw, ah] = ak.split(':').map(Number);
			const [bw, bh] = bk.split(':').map(Number);
			return bw / bh - aw / ah;
		});
	}

	$: customGroups = groupByAspectRatio(customOverlays);
	$: demoGroups = groupByAspectRatio(demoOverlays);
</script>

<svelte:window on:error={handleError} />

<main class={`background-primary-color ${$isMobile ? 'pb-32' : 'pb-16'}`}>
	<!-- Page header -->
	<div class="flex items-center gap-3 mb-5">
		<h1 class="text-xl font-semibold text-secondary-color">Overlays</h1>
		<input
			class="flex-1 max-w-[220px] text-xs h-8 px-3 background-primary-color text-secondary-color border-secondary rounded"
			type="text"
			placeholder="Search…"
			bind:value={search}
		/>
		{#if $isElectron}
			<button
				class="btn text-sm h-8 px-4 border-secondary rounded ml-auto"
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
			{#each customGroups as [ratio, groupOverlays]}
				<div class="ratio-section">
					<p class="ratio-label">{ratio}</p>
					<div class="card-grid mt-2 mb-6">
						{#each groupOverlays as overlay, i}
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
				</div>
			{/each}
		</section>
	{/if}

	<!-- Demo overlays -->
	{#if demoOverlays.length}
		<section>
			<p class="section-label">Demo</p>
			{#each demoGroups as [ratio, groupOverlays]}
				<div class="ratio-section">
					<p class="ratio-label">{ratio}</p>
					<div class="card-grid mt-2 mb-6">
						{#each groupOverlays as overlay, i}
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
				</div>
			{/each}
		</section>
	{/if}
</main>

<!-- Sticky scene bar -->
<div
	class="scene-bar border-t border-secondary-color background-primary-color"
	style={$isElectron ? 'left: 5rem; right: 5rem;' : 'left: 0; right: 0;'}
>
	<p class="bar-label">Scene</p>
	<SceneSelect />
</div>

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
		margin-bottom: 0.75rem;
	}

	.ratio-section {
		margin-top: 0.75rem;
	}

	.ratio-label {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.3;
		color: var(--secondary-color);
		font-family: monospace;
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

	.scene-bar {
		position: fixed;
		bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		z-index: 20;
	}

	.bar-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.4;
		white-space: nowrap;
		flex-shrink: 0;
	}
</style>
