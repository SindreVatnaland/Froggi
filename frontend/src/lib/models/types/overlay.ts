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
	animationTrigger: TriggerAnimation;
	class: Class;
	css: Css;
	description: string;
	font: Font
	image: Image;
	percent: Percent
	shadow: Shadow;
	string: string | undefined;
	textStroke: Stroke;
	transform: CssTransform;
	visibility: VisibilityAnimations;
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
	description: string;
	id: string;
	title: string;
	[LiveStatsScene.WaitingForDolphin]: Scene;
	[LiveStatsScene.Menu]: Scene;
	[LiveStatsScene.InGame]: Scene;
	[LiveStatsScene.PostGame]: Scene;
	[LiveStatsScene.PostSet]: Scene;
	[LiveStatsScene.RankChange]: Scene;
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
	selectedOptions: SelectedAnimationTriggerCondition
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
