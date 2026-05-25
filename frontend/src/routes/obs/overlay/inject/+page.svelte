<script lang="ts">
	import { setContext } from 'svelte';
	import SecondaryOverlay from '$lib/components/obs/overlays/SecondaryOverlay.svelte';
	import { injectedOverlays } from '$lib/utils/store.svelte';

	setContext('isInjected', true);
</script>

<div class="relative w-screen h-screen">
	{#each $injectedOverlays as overlayId}
		<SecondaryOverlay {overlayId} />
	{/each}
</div>
