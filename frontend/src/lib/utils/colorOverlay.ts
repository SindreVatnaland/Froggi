import type { ColorOverlay } from '$lib/models/types/overlay';

/**
 * Svelte action for an image element's <img>: paints the image's own shape in one color on top of it
 * (a sibling layer with mask-image = the image), so transparency and edges are kept exactly.
 * strength 100 = solid recolor, lower = partial tint. Follows src changes (character / rank swaps).
 * Note: transforms in the element's Custom Inline CSS Image apply to the <img> only, not the layer.
 */
export function colorOverlay(img: HTMLImageElement, options: ColorOverlay | undefined) {
	let current = options;
	let layer: HTMLDivElement | undefined;

	const apply = () => {
		if (!current?.enabled) {
			layer?.remove();
			layer = undefined;
			return;
		}
		const parent = img.parentElement;
		const src = img.currentSrc || img.src;
		if (!parent || !src) return;
		if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
		if (!layer) {
			layer = document.createElement('div');
			layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
			img.after(layer);
		}
		const fit = getComputedStyle(img).objectFit;
		const size = fit === 'cover' ? 'cover' : fit === 'fill' ? '100% 100%' : fit === 'none' ? 'auto' : 'contain';
		const mask = `url("${src}") center / ${size} no-repeat`;
		layer.style.background = current.color || '#ffffff';
		layer.style.opacity = String(Math.min(1, Math.max(0, (current.strength ?? 100) / 100)));
		layer.style.setProperty('mask', mask);
		layer.style.setProperty('-webkit-mask', mask);
	};

	img.addEventListener('load', apply);
	apply();

	return {
		update(next: ColorOverlay | undefined) {
			current = next;
			apply();
		},
		destroy() {
			img.removeEventListener('load', apply);
			layer?.remove();
		},
	};
}
