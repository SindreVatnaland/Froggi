<script lang="ts">
	import { urls } from '$lib/utils/store.svelte';

	let _class: string = '';
	let _style: string = '';
	export { _class as class };
	export { _style as style };
	export let src: string;
	export let title: string;
	export let isElement: boolean = false;

	$: isSameOrigin =
		(src.includes($urls.local.split('://')[1]) ||
			src.includes($urls.external.split('://')[1])) &&
		isElement;

	let itemWidth = 0;
	let itemHeight = 0;

	const getScale = (itemWidth: number) => {
		if (!itemWidth) return null;
		return (itemWidth / 1080 / 16) * 9;
	};

	$: scale = getScale(itemWidth);
</script>

{#if isSameOrigin}
	<div>Cannot embed this url</div>
{:else}
	<div
		class={`${_class} w-full h-full relative m-0`}
		style={_style}
		bind:clientWidth={itemWidth}
		bind:clientHeight={itemHeight}
	>
		{#if scale}
			<iframe
				class="absolute m-0"
				style={`transform: scale(${scale}) ;transform-origin: top left; width: ${
					itemWidth / scale
				}px; height: ${itemHeight / scale}px;`}
				{src}
				{title}
				allowtransparency={true}
				allow="autoplay; encrypted-media"
				sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals"
			/>
		{/if}
		<div class="w-full h-full absolute z-2" />
	</div>
{/if}
