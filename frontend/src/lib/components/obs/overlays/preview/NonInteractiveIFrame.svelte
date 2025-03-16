<script lang="ts">
	import { urls } from '$lib/utils/store.svelte';

	let _class: string = '';
	let _style: string;
	export { _class as class };
	export { _style as style };
	export let src: string;
	export let title: string;
	export let isElement: boolean = false;

	$: isSameOrigin =
		(src.includes($urls.local.split('://')[1]) ||
			src.includes($urls.external.split('://')[1])) &&
		isElement;
</script>

{#if isSameOrigin}
	<div>Cannot embed this url</div>
{:else}
	<div class={`${_class} w-full h-full relative m-0`} style={_style}>
		<iframe
			class="w-full h-full absolute m-0"
			{src}
			{title}
			allowtransparency={true}
			allow="autoplay; encrypted-media"
		/>
		<div class="w-full h-full absolute z-2" />
	</div>
{/if}
