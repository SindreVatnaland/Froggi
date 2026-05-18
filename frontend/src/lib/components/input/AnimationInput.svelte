<script lang="ts">
	import type { AnimationSettings } from '$lib/models/types/overlay';
	import { Animation } from '$lib/models/enum';
	import Select from './Select.svelte';
	import { SCENE_TRANSITION_DELAY } from '$lib/models/const';
	import { notifications } from '../notification/Notifications.svelte';
	import * as easingFunctions from 'svelte/easing';

	export let max: number = SCENE_TRANSITION_DELAY;
	export let animation: AnimationSettings;
	export let label: string | undefined = undefined;
	export let isSceneElementAnimation: boolean = false;

	const fixAnimationInputDelay = () => {
		if (animation?.options.duration > max) {
			animation.options.duration = max;
			notifications.warning(`Duration cannot exceed ${max}ms`, 3000);
		}
		if (animation?.options.duration < 0) {
			animation.options.duration = 0;
			notifications.warning(`Duration cannot be negative`, 3000);
		}
		if (animation?.options.duration + animation?.options.delay > max) {
			animation.options.delay = max - animation?.options.duration;
			notifications.warning(`Duration + delay cannot exceed ${max}ms`, 3000);
		}
		if (animation.type === Animation.None) {
			animation.options.delay = 0;
			animation.options.duration = 0;
		}
	};

	$: animation, fixAnimationInputDelay();
</script>

{#if animation}
	<div class="w-full">
		{#if label}
			<h1 class="text-secondary-color text-md font-medium">{label}</h1>
		{/if}
		<div class="w-full">
			<h1 class="text-secondary-color text-sm font-medium">Type</h1>
			<div class="relative w-full background-primary-color rounded-md">
				<Select bind:selected={animation.type}>
					<option selected value={Animation.None}>None</option>
					<option value={Animation.Blur}>Blur</option>
					<option value={Animation.Fade}>Fade</option>
					<option value={Animation.Fly}>Fly</option>
					<option value={Animation.Scale}>Scale</option>
					<option value={Animation.FlyRandom}>Fly Random</option>
					{#if isSceneElementAnimation}
						<option value={Animation.FlyAutomatic}>Fly Automatic</option>
					{/if}
					<option value={Animation.Slide}>Slide</option>
				</Select>
			</div>

			{#if animation?.type !== Animation.None}
				{#if [Animation.Fly, Animation.FlyRandom, Animation.Slide].includes(animation.type)}
					<h1 class="text-secondary-color text-sm font-medium">X-distance - px</h1>
					<div class="relative w-full h-11 rounded-md">
						<input
							type="number"
							class="peer border-secondary block w-full h-full rounded border-0 background-primary-color px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
							id="numberInput"
							step={1}
							min={-max}
							{max}
							bind:value={animation.options.x}
						/>
					</div>

					<h1 class="text-secondary-color text-sm font-medium">Y-distance - px</h1>
					<div class="relative w-full h-11 rounded-md">
						<input
							type="number"
							class="peer block border-secondary w-full h-full rounded border-0 background-primary-color px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
							id="numberInput"
							step={max / 100}
							min={-max}
							{max}
							bind:value={animation.options.y}
						/>
					</div>
				{/if}

				{#if animation.type === Animation.Scale}
					<h1 class="text-secondary-color text-sm font-medium">Scale</h1>
					<div class="relative w-full h-11 rounded-md">
						<input
							type="number"
							class="peer block w-full h-full border-secondary rounded border-0 background-primary-color px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
							id="numberInput"
							step={0.01}
							min={0}
							max={5}
							bind:value={animation.options.start}
						/>
					</div>
				{/if}
				<h1 class="text-secondary-color text-sm font-medium">Duration - ms</h1>
				<div class="relative w-full h-11 rounded-md">
					<input
						type="number"
						class="peer block w-full h-full border-secondary rounded border-0 background-primary-color px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
						id="numberInput"
						step={max / 100}
						min={0}
						{max}
						bind:value={animation.options.duration}
					/>
				</div>
				<h1 class="text-secondary-color text-sm font-medium">Delay - ms</h1>
				<div class="relative w-full h-11 rounded-md">
					<input
						type="number"
						class="peer block w-full h-full rounded border-secondary border-0 background-primary-color px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
						id="numberInput"
						step={max / 100}
						min={0}
						{max}
						bind:value={animation.options.delay}
					/>
				</div>
				<h1 class="text-secondary-color text-sm font-medium">Easing</h1>
				<Select bind:selected={animation.options.easing}>
					<option selected value={undefined}>None</option>
					{#each Object.keys(easingFunctions) as easingName}
						<option value={easingName}>{easingName}</option>
					{/each}
				</Select>
			{/if}
		</div>
	</div>
{/if}
