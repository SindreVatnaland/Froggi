<script lang="ts">
	import MainOverlay from '$lib/components/obs/overlays/MainOverlay.svelte';
	import SecondaryOverlay from '$lib/components/obs/overlays/SecondaryOverlay.svelte';
	import { electronEmitter, isElectron } from '$lib/utils/store.svelte';
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores';

	// ?edit opens the editor in a regular browser — loopback only (this machine), never remote clients.
	const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes($page.url.hostname);
	$: showEditor = $isElectron || (isLoopback && $page.url.searchParams.has('edit'));

	onDestroy(() => {
		if (!$isElectron) return;
		$electronEmitter.emit('CleanupCustomResources');
	});
</script>

{#if showEditor}
	<MainOverlay />
{:else}
	<SecondaryOverlay />
{/if}
