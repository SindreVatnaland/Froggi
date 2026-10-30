/**
 * Controller elements (ControllerGraphic): line + fill colours (#rrggbbaa) when released and when pressed,
 * and the line width (% of the part's size). Sticks count as pressed past the dead zone; the analog L/R
 * bar draws its pressed part in fillPressed (track = Background, border + rounding = the Border section).
 */
export interface ControllerStyle {
	outline: string;
	outlinePressed: string;
	fill: string;
	fillPressed: string;
	width: number;
}

/** The look of the old PNG artwork: white outlines, hollow when released, white when pressed. */
export const CONTROLLER_STYLE_DEFAULTS: ControllerStyle = {
	outline: '#ffffffff',
	outlinePressed: '#ffffffff',
	fill: '#00000000',
	fillPressed: '#ffffffff',
	width: 6,
};
