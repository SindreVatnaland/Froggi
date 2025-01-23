<script lang="ts" context="module">
	import { LiveStatsScene } from '$lib/models/enum';
	import { GridContentItem, Layer, Overlay } from '$lib/models/types/overlay';
	import { getIsElectron, getUrls } from '$lib/utils/fetchSubscriptions.svelte';
	import { asyncForEach } from '$lib/utils/helper';

	export const addFont = async (src: string | undefined, fontName: string) => {
		if (!src) {
			return;
		}
		try {
			const new_font = new FontFace(fontName, `url(${src})`);
			const loadedFace = await new_font.load();
			document.fonts.add(loadedFace);
			document.fonts.ready;
		} catch (err) {
			console.error(err);
			console.log(src);
		}
	};

	export const updateFont = async (overlay: Overlay | undefined) => {
		if (!overlay) return;
		const urls = await getUrls();
		const isElectron = await getIsElectron();
		const url = isElectron ? urls?.localResource : urls?.externalResource;
		await asyncForEach(Object.values(LiveStatsScene), async (statsScene: LiveStatsScene) => {
			if (!overlay) return;
			const items = [
				...overlay[statsScene].layers?.map((layer: Layer) => layer.items).flat(),
			];

			const sceneFont = overlay[statsScene].font;
			if (sceneFont.src) {
				const src = `${url}/public/custom/${overlay.id}/font/${sceneFont.src}`;
				console.log('url', src);
				await addFont(src, statsScene);
			}

			await asyncForEach(items, async (item: GridContentItem) => {
				if (!item.data.font.src) return;
				const src = `${url}/public/custom/${overlay.id}/font/${item.data.font.src}`;
				await addFont(src, item.id);
			});
		});
	};
</script>
