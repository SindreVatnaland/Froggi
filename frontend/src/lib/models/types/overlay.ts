import type { Animation, LiveStatsScene, SceneBackground } from '../enum';
import type { COL } from '../const';
import type { CustomElement } from '../constants/customElement';
import type { SelectedAnimationTriggerCondition, SelectedVisibilityCondition } from './animationOption';

export interface Animations {
	in: AnimationSettings
	out: AnimationSettings
}

export interface AnimationSettings {
	type: Animation;
	options: AnimationOptions;
}

export interface AnimationOptions {
	delay: number;
	duration: number;
	easing: string;
	start: number;
	x: number;
	y: number;
}

export interface AspectRatio {
	width: number;
	height: number;
}

export interface Background {
	animation: Animations
	color: string | undefined;
	customImage: Image;
	image: Image;
	opacity: number;
	type: SceneBackground;
}

export interface Class {
	rounded: string | undefined;
	alignment: string | undefined;
}

export enum Command {
	SPLIT_MESSAGE = 16,
	MESSAGE_SIZES = 53,
	GAME_START = 54,
	PRE_FRAME_UPDATE = 55,
	POST_FRAME_UPDATE = 56,
	GAME_END = 57,
	FRAME_START = 58,
	ITEM_UPDATE = 59,
	FRAME_BOOKEND = 60,
	GECKO_LIST = 61
}

export interface Css {
	background: string | undefined;
	borderColor: string | undefined;
	borderLeft: string | undefined;
	borderRight: string | undefined;
	borderTop: string | undefined;
	borderBottom: string | undefined;
	color: string | undefined;
	customParent: string | undefined;
	customBox: string | undefined;
	customText: string | undefined;
	customImage: string | undefined;
	opacity: number;
	fill: string;
	fillOpacity: number;
	stroke: string;
	strokeWidth: number;
}

export interface CssTransform {
	translate: Position
	rotate: number
	scale: string
}

export interface ElementPayload {
	advancedStyling: boolean;
	/** Animation 1 (see utils/elementTriggers.ts). */
	animationTrigger: TriggerAnimation;
	/** Animations 2…n — each with its own in/out and its own triggers (a trigger is used by one animation only). */
	extraAnimationTriggers?: TriggerAnimation[];
	class: Class;
	css: Css;
	description: string;
	font: Font
	image: Image;
	percent: Percent
	shadow: Shadow;
	string: string | undefined;
	url: string | undefined;
	textStroke: Stroke;
	transform: CssTransform;
	visibility: VisibilityAnimations;
	/** Image elements: paint the image's shape in one color. strength 100 = solid recolor, lower = tint. */
	colorOverlay?: ColorOverlay;
	/** Character elements: asset pack id (see models/types/assetPack). Default: built-in stock icons. */
	assetPack?: string;
	/** Controller elements: outline colour + width and the fill colour of pressed parts / stick cap / trigger bar. */
	controller?: import('../../utils/controllerStyle').ControllerStyle;
	/** Which player this Player 1/2 element shows (doubles slots); unset = its own player. */
	playerSlot?: import('../../utils/teams').PlayerSlot;
	/** RPS icon elements: your own icon file per hand (uploaded to the overlay's image folder); unset = built-in SVG. */
	rpsIcons?: { rock?: string; paper?: string; scissors?: string };
	/** Built-in RPS hands: "outline" (element text colour, default) or "color" (full-colour emoji). */
	rpsIconStyle?: 'outline' | 'color';
	/** Media element (2100): a file uploaded to the overlay (`source: 'file'`, in its image folder) or the key a
	 *  flow's "Set media" card points at (default); fit (cover default) and volume (0–100). */
	video?: { key: string; volume: number; source?: 'key' | 'file'; file?: string; fit?: 'cover' | 'contain' };
	/** Older Video elements (before volume): read as video {key, volume 100 | 0}. */
	highlight?: { key: string; sound: boolean };
}

export interface ColorOverlay {
	enabled: boolean;
	color: string;
	/** 0–100 */
	strength: number;
}

export interface Font {
	family: string | undefined;
	src: string | undefined;
}

export interface GridContentItem {
	[COL]: GridContentItemConfig;
	elementId: CustomElement;
	data: ElementPayload;
	id: string;
}

export interface GridContentItemConfig {
	customDragger: boolean;
	customResizer: boolean;
	draggable: boolean;
	fixed: boolean;
	resizable: boolean;
	max: {
		y: number; h: number;
	};
	min: {
		w: number; h: number;
	};
	id: string;
	h: number;
	w: number;
	x: number;
	y: number;
}

export interface GridContentItemStyle {
	cssValue: string;
	classValue: string;
	shadow: string;
	textStroke: string;
	transform: string;
}

export interface Image {
	name: string | undefined;
	src: string | undefined;
	objectFit: string | undefined;
}

export interface Layer {
	items: GridContentItem[]
	index: number;
	id: number | undefined;
	preview: boolean;
	/** Optional name shown in the layer panel (e.g. "Timer", "Stock-loss icons"). */
	title?: string;
}

export interface OverlayEditor {
	layerIndex: number | undefined;
	itemId: string | undefined;
}

export interface OverlayLayout {
	overlays: Overlay[]
	current: OverlayEditor
}

export interface Overlay {
	aspectRatio: AspectRatio;
	isDemo: boolean;
	froggiVersion: string;
	/** ISO time the overlay was moved to Deleted Overlays (soft delete); null/absent = live. */
	deletedAt?: string | null;
	description: string;
	id: string;
	title: string;
	[LiveStatsScene.WaitingForDolphin]: Scene;
	[LiveStatsScene.Menu]: Scene;
	[LiveStatsScene.InGame]: Scene;
	[LiveStatsScene.PostGame]: Scene;
	[LiveStatsScene.PostSet]: Scene;
	[LiveStatsScene.RankChange]: Scene;
	[LiveStatsScene.StrikePhase]: Scene;
}

export interface Percent {
	startColor: string;
	endColor: string;
}

export interface Position {
	x: number | null;
	y: number | null;
}


export interface VisibilityAnimations {
	in: AnimationSettings
	out: AnimationSettings
	selectedOptions: SelectedVisibilityCondition[]
}

export interface TriggerAnimation {
	in: AnimationSettings
	out: AnimationSettings
	/** Named (game event) triggers: label → on. */
	selectedOptions: SelectedAnimationTriggerCondition
	/** Element triggers: replay when this or another element of the scene changes what it shows. */
	elementTriggers?: ElementTrigger[]
}

/** source = "self" or another element's item id (same scene); when = any change, or the number going up / down. */
export interface ElementTrigger {
	source: string
	when: 'change' | 'increase' | 'decrease'
}

export interface SceneAnimation extends Animations {
	duration: number;
	layerRenderDelay: number;
}

export interface Scene {
	id: number | undefined
	active: boolean;
	animation: SceneAnimation;
	background: Background;
	fallback: LiveStatsScene;
	font: Font;
	layers: Layer[];
}

export interface Shadow {
	x: number;
	y: number;
	spread: number;
	color: string;
}

export interface ShareCustomFile {
	base64: string;
	fileName: string;
}

export interface ShareCustomFiles {
	[dir: string]: ShareCustomFile[]
}

export type SharedOverlay = Overlay & {
	customFiles: ShareCustomFiles;
}

export interface Stroke {
	size: number;
	color: string;
}

export interface Url {
	external: string;
	externalResource: string;
	local: string;
	localResource: string
}
