<script lang="ts">
	import { page } from '$app/stores';
	import TextFitMulti from '$lib/components/TextFitMulti.svelte';
	import { getOverlayById } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import ExternalPreviewSettings from '$lib/components/obs/overlays/preview/ExternalPreviewSettings.svelte';
	import LayerToggle from '$lib/components/obs/overlays/preview/LayerToggle.svelte';
	import NonInteractiveIFrame from '$lib/components/obs/overlays/preview/NonInteractiveIFrame.svelte';
	import SceneSelect from '$lib/components/obs/overlays/selector/SceneSelect.svelte';
	import type { Overlay } from '$lib/models/types/overlay';
	import { isElectron, isMobile, urls } from '$lib/utils/store.svelte';

	const overlayId: string | undefined = $page.params.overlay;
	let curOverlay: Overlay | undefined = undefined;

	const getOverlay = async () => {
		curOverlay = await getOverlayById(overlayId);
	};
	$: $page.params.overlay, getOverlay();

	let base64: string;

	let innerWidth: number;
	let innerHeight: number;
	$: isVerticalScreen = innerHeight > innerWidth;
	$: isHorizontalScreen = !isVerticalScreen;

	$: url = $isElectron ? $urls?.local : $urls?.external;
	$: src = `${url}/obs/overlay/${overlayId}/layers`;

	let parentDiv: HTMLElement;

	$: maxHeight = parentDiv?.clientHeight;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if isVerticalScreen}
	<div class={`flex flex-col background-primary-color items-start`} style={`height: 100svh;`}>
		<div
			class="w-full h-full absolute background-color-primary bg-cover bg-center"
			style={`background-image: url('${base64}'
					}');`}
		/>
		{#if url}
			<div class="w-full h-full absolute">
				<NonInteractiveIFrame {src} title="preview" class="w-full h-full" />
			</div>
		{/if}
		<ExternalPreviewSettings bind:base64 />
	</div>
{/if}
{#if isHorizontalScreen}
	<div
		class={`flex flex-col background-primary-color items-center py-4 px-18 gap-2`}
		style={`height: 100svh; width: 100%; max-height: 100%; padding-bottom: ${
			$isMobile && '5em'
		}`}
	>
		<h1 class="text-lg font-medium color-secondary">
			{curOverlay?.title}
		</h1>
		<div class="w-full h-full flex-1 background-color-primary bg-cover" bind:this={parentDiv}>
			{#if url && parentDiv}
				<div
					class="w-full h-full bg-cover border-secondary"
					style={`height: ${(parentDiv.clientWidth / 16) * 9}px; width: ${
						parentDiv.clientWidth
					}px; background-image: url('${base64}');`}
				>
					<NonInteractiveIFrame {src} title="preview" class="w-full h-full" />
				</div>
			{/if}
		</div>
		<ExternalPreviewSettings bind:base64 />
	</div>
{/if}
