<script lang="ts">
	import { colorOverlay } from '$lib/utils/colorOverlay';
	import { page } from '$app/stores';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { isElectron, urls } from '$lib/utils/store.svelte';
	import TextElement from '../element/TextElement.svelte';
	import NonInteractiveIFrame from '../preview/NonInteractiveIFrame.svelte';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;

	export let overlayId: string | undefined = $page.params.overlay;

	$: url = $isElectron ? $urls?.localResource : $urls?.externalResource;
</script>

{#if dataItem?.elementId === CustomElement.CustomString}
	<TextElement {style} {dataItem}>
		{dataItem?.data.string}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.CustomBox}
	<div
		class={`w-full h-full ${style.classValue}`}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
		}; `}
	/>
{:else if dataItem?.elementId === CustomElement.CustomImage}
	<div
		class={`w-full h-full ${style.classValue}`}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
		}; `}
	>
		<img
			use:colorOverlay={dataItem?.data.colorOverlay}
			class="w-full h-full"
			style={`object-fit: ${dataItem?.data.image.objectFit ?? 'contain'};
					${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
			src={`${url}/public/custom/${overlayId}/image/${encodeURI(
				dataItem?.data.image.name ?? '',
			)}`}
			alt="custom"
		/>
	</div>
{:else if dataItem?.elementId === CustomElement.CustomBoxIframe}
	<NonInteractiveIFrame
		title={'Embed'}
		style={style.cssValue}
		class={style.classValue}
		src={dataItem.data.url ?? ''}
		isElement={true}
	/>
{/if}
