<script lang="ts">
	import { page } from '$app/stores';
	import { getOverlayById } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import ExternalPreviewSettings from '$lib/components/obs/overlays/preview/ExternalPreviewSettings.svelte';
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

	let innerWidth = 0;
	let innerHeight = 0;

	let base64: string;

	$: url = $isElectron ? $urls?.local : $urls?.external;
	$: src = `${url}/obs/overlay/${overlayId}/layers`;
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div
	class={`flex flex-col background-primary-color items-center ${
		$isMobile ? '' : 'px-18'
	} gap-2 p-2`}
	style={`height: 100svh; width: 100%; max-height: 100%;`}
>
	<h1 class="text-lg font-medium color-secondary">
		{curOverlay?.title}
	</h1>
	<div class="w-full h-full flex-1 flex justify-center background-color-primary bg-cover">
		<div
			class={`h-full max-h-full
			 bg-cover border-secondary overflow-hidden`}
			style={`background-image: url('${base64}'); aspect-ratio: ${
				curOverlay?.aspectRatio.width ?? 16
			}/${curOverlay?.aspectRatio.height ?? 9};`}
		>
			<NonInteractiveIFrame {src} title="preview" class="w-full h-full" />
		</div>
	</div>
	<div class="flex gap-2 w-full">
		<SceneSelect />
		<ExternalPreviewSettings bind:base64 />
	</div>
</div>
