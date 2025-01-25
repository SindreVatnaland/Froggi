<script lang="ts">
	import { page } from '$app/stores';
	import { isElectron, urls } from '$lib/utils/store.svelte';
	import NonInteractiveIFrame from '../preview/NonInteractiveIFrame.svelte';

	$: overlayId = $page.params.overlay;
	$: url = $isElectron ? $urls?.local : $urls?.external;
	$: src = `${url}/obs/overlay/${overlayId}/layers`;
</script>

{#if url}
	<div class={`w-full h-full border-secondary overflow-hidden shadow-md`}>
		<NonInteractiveIFrame {src} title="preview" class="w-full h-full" />
	</div>
{/if}
