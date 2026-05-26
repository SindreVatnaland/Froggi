<script lang="ts">
	import { electronEmitter, isElectron, obsConnection, obsProcessStatus } from '$lib/utils/store.svelte';
	import { ConnectionState } from '$lib/models/enum';

	/** Browser source URL. When provided, button shows "Add to OBS" when connected. */
	export let url: string = '';
	export let title: string = '';
	export let width: number = 1920;
	export let height: number = 1080;
	/** Button CSS classes */
	export let cls: string = 'btn text-sm h-9 px-4 border-secondary rounded';

	$: isConnected = $obsConnection?.state === ConnectionState.Connected;
	$: websocketDisabled = $obsProcessStatus?.running && $obsProcessStatus?.websocketEnabled === false;

	$: label = isConnected && url
		? 'Add to OBS'
		: websocketDisabled
			? 'Enable OBS WebSocket'
			: 'Connect OBS';

	function handleClick() {
		if (isConnected && url) {
			$electronEmitter.emit('ObsCreateBrowserSource', url, title, { width, height });
		} else {
			$electronEmitter.emit('ObsWebsocketEnable');
		}
	}
</script>

{#if $isElectron && !(isConnected && !url)}
	<button class={cls} on:click={handleClick}>{label}</button>
{/if}
