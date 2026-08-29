import { CustomElement } from '../models/constants/customElement';

export type ElementKind = 'text' | 'image' | 'box';

/**
 * Authoritative element-kind classification by id range. Mirrors StylingSelect's `getSettingsType`,
 * which decides what styling controls the overlay editor shows for an element. Kept here (in the
 * runtime-agnostic lib) so the editor UI and the MCP schema tools share one source of truth instead
 * of duplicating the ranges.
 */
export const getElementKind = (elementId: number): ElementKind | undefined => {
	if ((elementId >= 1000 && elementId < 2000) || (elementId >= 4000 && elementId < 6000) || elementId === CustomElement.CustomString)
		return 'text';
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
	image: ['image.src', 'image.name', 'image.objectFit (contain|cover)', 'css.opacity', 'shadow', 'transform', 'class.alignment'],
	box: ['css.background', 'css.border{Top,Right,Bottom,Left} + borderColor', 'css.fill / stroke / strokeWidth (controller & svg)', 'css.customBox (needs advancedStyling)', 'shadow', 'transform'],
};
