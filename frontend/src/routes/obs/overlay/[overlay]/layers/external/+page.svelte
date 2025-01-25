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

	$: maxHeight = innerHeight - parentDiv?.clientHeight;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if isVerticalScreen}
	<div class={`flex flex-col background-primary-color items-start`} style={`height: 100svh;`}>
		<div class="w-full flex flex-col justify-center" bind:this={parentDiv}>
			<div>
				<TextFitMulti
					class="h-16 w-full color-secondary text-md font-medium text-shadow justify-center underline"
				>
					{curOverlay?.title ?? 'Preview'}
				</TextFitMulti>
			</div>
			<div class="w-full aspect-video border-2 border-zinc-800 relative">
				<div class="w-full h-full absolute background-color-primary" />
				<div
					class="w-full h-full absolute background-color-primary bg-cover bg-center"
					style={`background-image: url('${
						base64 || '/image/backgrounds/MeleeMenuAll.png'
					}');`}
				/>
				{#if url}
					<div class="w-full h-full absolute">
						<NonInteractiveIFrame {src} title="preview" class="w-full h-full" />
					</div>
				{/if}
			</div>
			<div class="w-full p-2 grid grid-flow-row gap-2">
				<SceneSelect />
				<ExternalPreviewSettings bind:base64 />
			</div>
		</div>
		<div class={`w-full pb-16`} style={`max-height: ${maxHeight}px`}>
			<LayerToggle />
		</div>
	</div>
{/if}
{#if isHorizontalScreen}
	<div
		class={`flex flex-row background-primary-color items-center py-4 px-18 gap-2`}
		style={`height: 100svh; padding-bottom: ${$isMobile && '5em'}`}
	>
		<div class="w-full gap-2 flex flex-col justify-center">
			<TextFitMulti
				class="h-16 w-full text-secondary-color text-md font-medium text-shadow justify-center underline"
			>
				{curOverlay?.title ?? 'Preview'}
			</TextFitMulti>
			<div class="w-full h-full aspect-video max-h-full border-2 border-zinc-800 relative">
				<div class="w-full h-full absolute background-color-primary" />
				<div
					class="w-full h-full absolute background-color-primary bg-cover bg-center"
					style={`background-image: url('${
						base64 || '/image/backgrounds/MeleeMenuAll.png'
					}');`}
				/>
				{#if url}
					<div class="w-full h-full absolute">
						<NonInteractiveIFrame {src} title="preview" class="w-full h-full" />
					</div>
				{/if}
			</div>
			<div class="w-full p-2 grid grid-flow-row gap-2">
				<SceneSelect />
				<ExternalPreviewSettings bind:base64 />
			</div>
		</div>
		<div class={`w-[50em] h-full overflow-y-auto`}>
			<LayerToggle />
		</div>
	</div>
{/if}
