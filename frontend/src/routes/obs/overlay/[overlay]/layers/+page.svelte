<script lang="ts">
	import { page } from '$app/stores';
	import SecondaryOverlay from '$lib/components/obs/overlays/SecondaryOverlay.svelte';
	import { LiveStatsScene } from '$lib/models/enum';
	import { overlays, statsScene } from '$lib/utils/store.svelte';

	$: overlayId = $page.params.overlay;
	let layerIds: number[] = [];

	const getOverlay = async (overlayId: string, statsScene: LiveStatsScene) => {
		const overlay = $overlays[overlayId];
		if (!overlay) return;
		layerIds = overlay[statsScene].layers
			.filter((layer) => layer.preview)
			.map((layer) => layer.id)
			.filter((id): id is number => id !== undefined);
	};
	$: $overlays, getOverlay(overlayId, $statsScene);
</script>

<SecondaryOverlay bind:layerIds preview={true} />
