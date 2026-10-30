import { CustomElement } from '../models/constants/customElement';

export type ElementKind = 'text' | 'image' | 'box';

/**
 * Authoritative element-kind classification by id range. Mirrors StylingSelect's `getSettingsType`,
 * which decides what styling controls the overlay editor shows for an element. Kept here (in the
 * runtime-agnostic lib) so the editor UI and the MCP schema tools share one source of truth instead
 * of duplicating the ranges.
 */
/** Iron Man counts are text; its progress bars are boxes (background / border around the bar). */
export const IRONMAN_TEXT_ELEMENTS = new Set<number>([
	CustomElement.IronManPlayer1CharacterTotal,
	CustomElement.IronManPlayer2CharacterTotal,
	CustomElement.IronManPlayer1CharactersRemaining,
	CustomElement.IronManPlayer2CharactersRemaining,
]);
export const IRONMAN_BOX_ELEMENTS = new Set<number>([CustomElement.IronManPlayer1ProgressBar, CustomElement.IronManPlayer2ProgressBar]);

export const getElementKind = (elementId: number): ElementKind | undefined => {
	if (IRONMAN_TEXT_ELEMENTS.has(elementId)) return 'text';
	if (IRONMAN_BOX_ELEMENTS.has(elementId)) return 'box';
	if ((elementId >= 1000 && elementId < 2000) || (elementId >= 4000 && elementId < 6000) || elementId === CustomElement.CustomString)
		return 'text';
	if (elementId >= 7600 && elementId < 7700) return 'image'; // plain stage images (stage striking)
	if ((elementId >= 3000 && elementId < 4000) || (elementId >= 7000 && elementId < 8000) || elementId === CustomElement.CustomBox)
		return 'box';
	if ((elementId >= 2000 && elementId < 3000) || (elementId >= 6000 && elementId < 7000) || elementId === CustomElement.CustomImage || elementId === CustomElement.SlippiRankCurrentPlayerRatingGraph)
		return 'image';
	return undefined;
};

/** True for the plain percent-value text elements whose color interpolates start→end as % rises. */
export const isPercentColorElement = (elementId: number) => elementId >= 1001 && elementId <= 1006;

/** Which ElementPayload fields actually affect each kind — so a client sets only relevant options. */
export const ELEMENT_KIND_OPTIONS: Record<ElementKind, string[]> = {
	text: ['string', 'font.family / font.src', 'css.color', 'css.background', 'css.border{Top,Right,Bottom,Left} + borderColor', 'textStroke', 'shadow', 'percent.startColor/endColor (percent elements only)', 'transform', 'class.alignment'],
	image: ['image.src', 'image.name', 'image.objectFit (contain|cover)', 'colorOverlay {enabled, color, strength 0-100} — recolor the image (100 = solid silhouette in that color, lower = tint)', 'css.opacity', 'shadow', 'transform', 'class.alignment'],
	box: ['css.background', 'css.border{Top,Right,Bottom,Left} + borderColor', 'controller {outline, outlinePressed, fill, fillPressed (#rrggbbaa), width} (controller elements 3100–3169; Analog L/R bar: fillPressed + background/border)', 'css.fill / stroke / strokeWidth (radar svg)', 'css.customBox (needs advancedStyling)', 'shadow', 'transform'],
};
