<script lang="ts">
	import { page } from '$app/stores';
	import OverlayPreviewScaled from '../preview/OverlayPreviewScaled.svelte';

	$: overlayId = $page.params.overlay;
</script>

<OverlayPreviewScaled {overlayId} />
