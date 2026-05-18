<script lang="ts">
	import { page } from '$app/stores';
	import TextFitMulti from '$lib/components/TextFitMulti.svelte';
	import FileUpload from '$lib/components/input/FileUpload.svelte';
	// import FileToBase64Input from '$lib/components/input/FileUpload.svelte';
	import Select from '$lib/components/input/Select.svelte';
	import type { Font } from '$lib/models/types/overlay';
	import { isElectron, overlays, statsScene, urls } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';
	import { addFont } from '../CustomFontHandler.svelte';

	export let font: Font;
	export let fontId: string;

	$: overlayId = $page.params.overlay;
	const url = $isElectron ? $urls.localResource : $urls.externalResource;

	const getFont = (font: Font | undefined): string | undefined => {
		if (font?.family === 'default') {
			if ($overlays[overlayId][$statsScene].active)
				return $overlays[overlayId][$statsScene].font.family;
			const fallbackScene = $overlays[overlayId][$statsScene].fallback;
			if (isNil(fallbackScene)) return;
			return $overlays[overlayId][fallbackScene].font.family;
		}
		return font?.family;
	};

	$: fontFamily = getFont(font);

	const updateFontSrc = (event: CustomEvent<string>) => {
		font.src = `${event.detail}`;
	};

	const updateFont = async () => {
		if (isNil(font.src)) return;
		const src = `${url}/public/custom/${overlayId}/font/${font.src}`;
		addFont(src, fontId);
	};
	$: font, updateFont();
</script>

<div class="w-full flex gap-2">
	<div class="w-36 h-full">
		<h1 class="text-sm font-medium">Font</h1>
		<Select bind:selected={font.family}>
			<option value={'default'} selected>Default</option>
			<option value={'sans-serif'}>Sans Serif</option>
			<option value={'Melee'}>Melee</option>
			<option value={'Ultimate'}>Ultimate</option>
			<option value={'A-OTF Folk Pro M'}>A-OTF Folk Pro M</option>
			<option value={'Roboto'}>Roboto</option>
			<option value={'Roboto Bold Italic'}>Roboto Bold Italic</option>
			<option value={'Wix'}>Wix</option>
			<option value={fontId}>Custom</option>
		</Select>
	</div>
	<FileUpload
		directory="font"
		fileName={fontId}
		label="Custom"
		acceptedExtensions={['woff2', 'woff', 'otf', 'ttf']}
		on:change={updateFontSrc}
	/>
	<h1
		class="text-2xl h-full grid text-start justify-center items-center text-secondary-color"
		style={`font-family: ${fontFamily}`}
	>
		Super Smash Bros
	</h1>
</div>
