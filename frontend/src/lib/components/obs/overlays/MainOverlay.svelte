<script lang="ts">
	import { overlays } from '$lib/utils/store.svelte';
	import Edit from '$lib/components/obs/overlays/edit/Edit.svelte';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	const overlayId = $page.params.overlay;
	$: curOverlay = $overlays[overlayId];
</script>

{#if curOverlay}
	<div
		class="fixed top-0 left-0 h-full w-full bg-cover bg-center bg-transparent background-primary-color"
		in:fade={{ delay: 50, duration: 150 }}
		out:fade={{ duration: 300 }}
	>
		<Edit />
	</div>
{/if}
