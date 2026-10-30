<script lang="ts">
	import { getContext } from 'svelte';
	import type { ControllerButtons } from '$lib/models/types/controller';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { CONTROLLER_STYLE_DEFAULTS } from '$lib/utils/controllerStyle';
	import { CONTROLLER_PREVIEW, type ControllerPreview } from './controllerPreview';

	/**
	 * GameCube controller parts as SVG (replaces the PNG pairs). Colours per state (payload.controller):
	 * lines in outline / outlinePressed, the body in fill / fillPressed. Sticks have no pressed state (outline +
	 * fill only, the whole cap); main stick = ridged cap, C-stick = plain cap. The analog L/R bar is a plain
	 * bar (border + rounding from the Border section, track = Background): its pressed part in fillPressed.
	 * The element's box styling (background, border, drop shadow) wraps every part.
	 */
	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	export let part: 'A' | 'B' | 'X' | 'Y' | 'Z' | 'L' | 'R' | 'DPad' | 'Stick' | 'CStick' | 'Trigger';
	export let pressed = false;
	export let buttons: ControllerButtons | undefined = undefined;
	export let x = 0;
	export let y = 0;
	/** Trigger: how far it is pressed (0–1). */
	export let analog = 0;

	// The style window can show the pressed look (its own store, see ElementModal).
	const preview = getContext<ControllerPreview | undefined>(CONTROLLER_PREVIEW);
	$: showPressed = preview ? $preview : false;
	$: isPressed = showPressed || pressed;
	let armPressed: Record<string, boolean>;
	$: armPressed = showPressed
		? { up: true, down: false, left: false, right: true }
		: { up: !!buttons?.isDPadUpPressed, down: !!buttons?.isDPadDownPressed, left: !!buttons?.isDPadLeftPressed, right: !!buttons?.isDPadRightPressed };
	$: sx = showPressed ? 0.7 : Math.max(-1, Math.min(1, x));
	$: sy = showPressed ? 0.7 : Math.max(-1, Math.min(1, y));
	$: level = Math.max(0, Math.min(1, showPressed ? 0.6 : pressed ? 1 : analog));

	$: c = { ...CONTROLLER_STYLE_DEFAULTS, ...(dataItem?.data?.controller ?? {}) };
	$: w = Math.max(0, Number(c.width) || 0);
	$: line = (on: boolean) => (on ? c.outlinePressed : c.outline);
	$: body = (on: boolean) => (on ? c.fillPressed : c.fill);

	// X / Y: the kidney-shaped buttons (Y = X turned on its side).
	const KIDNEY = 'M22 8C36 0 52 8 53 30C54 48 62 62 60 80C58 96 36 99 27 86C21 76 25 63 17 48C9 33 7 16 22 8Z';
	// D-pad cross; the pressed arm fills (clipped to the cross).
	const CROSS = 'M36 6H64V36H94V64H64V94H36V64H6V36H36Z';
	const ARMS: [string, string][] = [['up', 'M36 6H64V50H36Z'], ['down', 'M36 50H64V94H36Z'], ['left', 'M6 36H50V64H6Z'], ['right', 'M50 36H94V64H50Z']];
	const ARROWS: [string, string][] = [['up', 'M50 13L56 21H44Z'], ['down', 'M50 87L44 79H56Z'], ['left', 'M13 50L21 44V56Z'], ['right', 'M87 50L79 56V44Z']];
	$: anyArm = Object.values(armPressed).some(Boolean);
	// Stick gate: an octagon, corner at the top like the real gate.
	const GATE = Array.from({ length: 8 }, (_, i) => {
		const a = ((-90 + 45 * i) * Math.PI) / 180;
		return `${50 + 44 * Math.cos(a)},${50 + 44 * Math.sin(a)}`;
	}).join(' ');
	// Full push: the cap meets the gate (gate apothem ≈ 40.6 = travel 20 + cap 20).
	$: capX = 50 + 20 * sx;
	$: capY = 50 - 20 * sy;
	const uid = Math.random().toString(36).slice(2);
	$: viewBox = part === 'X' ? '0 0 70 100' : part === 'Y' ? '0 0 100 70' : part === 'Z' || part === 'L' || part === 'R' ? '0 0 100 60' : '0 0 100 100';
</script>

{#if part === 'Trigger'}
	<div class={`w-full h-full overflow-hidden ${style.classValue}`} style={`${style.cssValue}; ${dataItem?.data.advancedStyling ? dataItem?.data.css.customBox ?? '' : ''}; ${style.shadow}`}>
		<div class="h-full" style={`width: ${level * 100}%; background-color: ${c.fillPressed}`} />
	</div>
{:else}
	<div class={`w-full h-full relative ${style.classValue}`} style={`${style.cssValue}; ${style.shadow}`}>
		<svg class="w-full h-full absolute inset-0" {viewBox} preserveAspectRatio="xMidYMid meet" stroke-linejoin="round" stroke-linecap="round" fill="none" stroke="none">
			{#if part === 'A' || part === 'B'}
				<circle cx="50" cy="50" r={46 - w / 2} fill={body(isPressed)} stroke={line(isPressed)} stroke-width={w} />
			{:else if part === 'X'}
				<path d={KIDNEY} transform="translate(4 0)" fill={body(isPressed)} stroke={line(isPressed)} stroke-width={w} />
			{:else if part === 'Y'}
				<path d={KIDNEY} transform="translate(0 70) rotate(-90) translate(0 -2)" fill={body(isPressed)} stroke={line(isPressed)} stroke-width={w} />
			{:else if part === 'Z'}
				<rect x="14" y="17" width="72" height="26" rx="13" transform="rotate(-24 50 30)" fill={body(isPressed)} stroke={line(isPressed)} stroke-width={w} />
			{:else if part === 'L' || part === 'R'}
				<path d={part === 'L' ? 'M8 52Q10 14 48 8H92V52Z' : 'M92 52Q90 14 52 8H8V52Z'} fill={body(isPressed)} stroke={line(isPressed)} stroke-width={w} />
			{:else if part === 'DPad'}
				<clipPath id={`dpad-${uid}`}><path d={CROSS} /></clipPath>
				<path d={CROSS} fill={body(false)} />
				{#each ARMS as [dir, arm]}
					{#if armPressed[dir]}<path d={arm} fill={body(true)} clip-path={`url(#dpad-${uid})`} />{/if}
				{/each}
				<path d={CROSS} stroke={line(anyArm)} stroke-width={w} />
				{#each ARROWS as [dir, arrow]}
					{#if !armPressed[dir]}<path d={arrow} fill={line(false)} />{/if}
				{/each}
			{:else}
				<!-- Sticks have no pressed state: one outline + one fill colour (the whole cap). -->
				<polygon points={GATE} stroke={line(false)} stroke-width={w} />
				<circle cx={capX} cy={capY} r="19" fill={body(false)} stroke={line(false)} stroke-width={w} />
				{#if part === 'Stick'}
					<circle cx={capX} cy={capY} r="12" stroke={line(false)} stroke-width={w * 0.4} />
					<circle cx={capX} cy={capY} r="5" stroke={line(false)} stroke-width={w * 0.4} />
				{/if}
			{/if}
		</svg>
	</div>
{/if}
