<script lang="ts">
	import { page } from '$app/stores';
	import SecondaryOverlay from '$lib/components/obs/overlays/SecondaryOverlay.svelte';
	import { getOverlayById } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import { LiveStatsScene } from '$lib/models/enum';
	import { statsScene } from '$lib/utils/store.svelte';

	$: overlayId = $page.params.overlay;
	$: layerId = Number($page.params.layer);
	let layerIds: number[] = [];

	const getOverlay = async (overlayId: string, statsScene: LiveStatsScene, layerId: number) => {
		const overlay = await getOverlayById(overlayId);
		if (!overlay) return;
		layerIds = overlay[statsScene].layers
			.filter((layer) => layerId === layer.id)
			.map((layer) => layer.id)
			.filter((id): id is number => id !== undefined);
	};
	$: getOverlay(overlayId, $statsScene, layerId);
</script>

<SecondaryOverlay bind:layerIds preview={true} />
