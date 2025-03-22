<script lang="ts">
	import { injectedOverlays, urls } from '$lib/utils/store.svelte';
	import NonInteractiveIFrame from '$lib/components/obs/overlays/preview/NonInteractiveIFrame.svelte';

	$: console.log('Injected:', $injectedOverlays);
</script>

<div class="relative w-screen h-screen">
	{#each $injectedOverlays as overlayId}
		<NonInteractiveIFrame
			style="position: absolute;"
			src={`${$urls?.local}/obs/overlay/${overlayId}?isInjected=true`}
			title={overlayId}
		/>
	{/each}
</div>
