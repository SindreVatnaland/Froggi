import { Animation } from '../models/enum';
import type { AnimationSettings, ElementPayload } from '../models/types/overlay';
import type { SelectedAnimationTriggerCondition } from '../models/types/animationOption';
import { SCENE_TRANSITION_DELAY } from '../models/const';

export function getDefaultAnimations(delay: number = 0): AnimationSettings {
	return {
		options: {
			delay: delay,
			duration: 0,
			easing: '',
			start: 0,
			x: 0,
			y: 0,
		},
		type: Animation.None,
	};
}

export function getDefaultElementPayload(): ElementPayload {
	return {
		advancedStyling: false,
		animationTrigger: {
			in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
			out: getDefaultAnimations(),
			selectedOptions: {} as SelectedAnimationTriggerCondition,
		},
		class: {
			rounded: '',
			alignment: 'justify-center',
		},
		css: {
			background: '#ffffff00',
			borderLeft: '0rem',
			borderRight: '0rem',
			borderTop: '0rem',
			borderBottom: '0rem',
			borderColor: '#ffffffff',
			color: '#ffffffff',
			customParent: undefined,
			customBox: undefined,
			customText: undefined,
			customImage: undefined,
			opacity: 1,
			fill: '#ff000000',
			stroke: '#ffffff',
			strokeWidth: 3,
			fillOpacity: 1,
		},
		description: '',
		percent: {
			startColor: '#ffffff',
			endColor: '#6f1622',
		},
		font: {
			family: 'default',
			src: undefined,
		},
		image: {
			name: undefined,
			src: undefined,
			objectFit: 'contain',
		},
		visibility: {
			in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
			out: getDefaultAnimations(),
			selectedOptions: [],
		},
		shadow: {
			x: 0,
			y: 0,
			spread: 0,
			color: '#000000ff',
		},
		string: '',
		url: undefined,
		textStroke: {
			size: 1,
			color: '#000000ff',
		},
		transform: {
			rotate: 0,
			scale: '1, 1',
			translate: {
				x: 0,
				y: 0,
			},
		},
	};
}
