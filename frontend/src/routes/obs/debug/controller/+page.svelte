<script lang="ts">
	import ControllerGraphic from '$lib/components/obs/overlays/element/ControllerGraphic.svelte';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { ControllerButtons } from '$lib/models/types/controller';
	import { CONTROLLER_STYLE_DEFAULTS, type ControllerStyle } from '$lib/utils/controllerStyle';

	// Preview of the controller graphics (ControllerGraphic): every part released and pressed, in the
	// default look and in a custom colour scheme, on a dark and a light background.
	type Part = 'A' | 'B' | 'X' | 'Y' | 'Z' | 'L' | 'R' | 'DPad' | 'Stick' | 'CStick' | 'Trigger';
	const parts: Part[] = ['A', 'B', 'X', 'Y', 'Z', 'L', 'R', 'DPad', 'Stick', 'CStick', 'Trigger'];
	const schemes: { label: string; controller: ControllerStyle }[] = [
		{ label: 'Default', controller: CONTROLLER_STYLE_DEFAULTS },
		{ label: 'Custom', controller: { outline: '#22d3eeff', outlinePressed: '#facc15ff', fill: '#1e3a8a88', fillPressed: '#f472b6ff', width: 9 } },
	];
	const item = (controller: ControllerStyle) => ({ data: { controller, css: {} } }) as unknown as GridContentItem;
	const style = { classValue: '', cssValue: '', shadow: 'filter: drop-shadow(0px 3px 2px #000000aa);' } as unknown as GridContentItemStyle;
	const allArms = { isDPadUpPressed: true, isDPadRightPressed: true } as ControllerButtons;
	// The L/R bar is styled like before: border + rounding (Border section), track = Background.
	const barStyle = { classValue: '', cssValue: 'border: 2px solid #ffffff; border-radius: 999px; background: #ffffff22', shadow: '' } as unknown as GridContentItemStyle;
</script>

<main class="p-6 flex flex-col gap-6" style="background:#1f2937; color:#fff">
	{#each schemes as scheme}
		{#each ['#1f2937', '#e5e7eb'] as bg}
			<section class="flex flex-col gap-2 p-3" style={`background:${bg}`}>
				<p style="font-size:0.75rem; opacity:0.6; color:{bg === '#1f2937' ? '#fff' : '#000'}">{scheme.label}</p>
				<div class="flex flex-wrap gap-4 items-center">
					{#each parts as part}
						{#each [false, true] as pressed}
							<div class="flex flex-col items-center gap-1" data-part={`${part}-${pressed ? 'on' : 'off'}`}>
								<div style={part === 'Trigger' ? 'width:140px; height:28px' : 'width:72px; height:72px'}>
									<ControllerGraphic
										dataItem={item(scheme.controller)}
										style={part === 'Trigger' ? barStyle : style}
										{part}
										{pressed}
										buttons={pressed ? allArms : undefined}
										x={pressed ? 0.7 : 0}
										y={pressed ? 0.7 : 0}
										analog={pressed ? 0.6 : 0}
									/>
								</div>
								<span style="font-size:0.65rem; opacity:0.6; color:{bg === '#1f2937' ? '#fff' : '#000'}">{part} {pressed ? 'on' : 'off'}</span>
							</div>
						{/each}
					{/each}
				</div>
			</section>
		{/each}
	{/each}
</main>
