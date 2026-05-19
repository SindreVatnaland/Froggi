<script lang="ts">
	import Select from '$lib/components/input/Select.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import type { ElementPayload } from '$lib/models/types/overlay';
	import { Animation, StyleSetting } from '$lib/models/enum';
	import ColorInput from '$lib/components/input/ColorInput.svelte';
	import SliderInput from '$lib/components/input/SliderInput.svelte';
	import { CustomElement } from '$lib/models/constants/customElement';
	import CodeInput from '$lib/components/input/CodeInput.svelte';
	import { fly } from 'svelte/transition';
	import ShadowSelect from './ShadowSelect.svelte';
	import { localEmitter, statsScene } from '$lib/utils/store.svelte';
	import AnimationInput from '$lib/components/input/AnimationInput.svelte';
	import BooleanInput from '$lib/components/input/BooleanInput.svelte';
	import FontSelectorLayer from '$lib/components/obs/overlays/selector/FontSelectLayer.svelte';
	import { getDefaultElementPayload } from '../edit/OverlayHandler.svelte';
	import NumberInput from '$lib/components/input/NumberInput.svelte';
	import VisibilitySelect from './VisibilitySelect.svelte';
	import AnimationTriggerSelect from './AnimationTriggerSelect.svelte';
	import type {
		SelectedAnimationTriggerCondition,
		SelectedVisibilityCondition,
	} from '$lib/models/types/animationOption';
	import { tooltip } from 'svooltip';
	import { ELEMENT_TRANSITION_LIMIT } from '$lib/models/const';
	import FileUpload from '$lib/components/input/FileUpload.svelte';

	export let selectedItemId: string;
	export let selectedElementId: number;
	export let payload: ElementPayload;

	$: customStringSettings = isCustomStringSettings(selectedElementId);
	$: customBoxSettings = isCustomBoxSettings(selectedElementId);
	$: customImageSettings = isCustomImageSettings(selectedElementId);
	$: stringSettings = isStringSettings(selectedElementId);
	$: imageSettings = isImageSettings(selectedElementId);

	$: boxSettings = isBoxSettings(selectedElementId);
	$: iframeSettings = selectedElementId === CustomElement.CustomBoxIframe;
	$: controllerButtonSettings = selectedElementId >= 3100 && selectedElementId < 3150;
	$: controllerAnalogButtonSettings = selectedElementId >= 3150 && selectedElementId < 3160;
	$: controllerAnalogStickSettings = selectedElementId >= 3160 && selectedElementId < 3170;

	$: svgSettings = selectedElementId >= 3200 && selectedElementId <= 3200; // TODO: Add all buttons as svg

	$: percentSettings = selectedElementId >= 1001 && selectedElementId <= 1006;
	$: customPercentSettings = selectedElementId >= 1007 && selectedElementId <= 1012;

	$: preAnimatedElement = customPercentSettings;

	const isStringSettings = (elementId: number) => {
		return (elementId >= 4000 && elementId < 6000) || elementId === CustomElement.CustomString;
	};
	const isBoxSettings = (elementId: number) => {
		return (elementId >= 7000 && elementId < 8000) || elementId === CustomElement.CustomBox;
	};
	const isImageSettings = (elementId: number) => {
		return (elementId >= 6000 && elementId < 7000) || elementId === CustomElement.CustomImage;
	};
	const isCustomBoxSettings = (elementId: number) => {
		return elementId >= 3000 && elementId < 4000;
	};
	const isCustomImageSettings = (elementId: number) => {
		return elementId >= 2000 && elementId < 3000;
	};
	const isCustomStringSettings = (elementId: number) => {
		return elementId >= 1000 && elementId < 2000;
	};

	const getSettingsType = (elementId: number): StyleSetting | undefined => {
		if (isStringSettings(elementId) || isCustomStringSettings(elementId))
			return StyleSetting.StringSettings;
		if (isBoxSettings(elementId) || isCustomBoxSettings(elementId))
			return StyleSetting.BoxSettings;
		if (isImageSettings(elementId) || isCustomImageSettings(elementId))
			return StyleSetting.ImageSettings;
	};

	let prevSelectedElementId = selectedElementId;

	let savedStyle: null | ElementPayload;

	const updateSavedStyle = () => {
		const settingsType = getSettingsType(selectedElementId);
		const savedStyleJson = localStorage.getItem(`${$statsScene}-${settingsType}`);
		savedStyle = savedStyleJson && JSON.parse(savedStyleJson);
	};
	$: selectedElementId, updateSavedStyle();

	const saveStyling = () => {
		const settingsType = getSettingsType(selectedElementId);
		if (!settingsType) return;
		savedStyle = {
			...JSON.parse(JSON.stringify(payload)),
			image: {
				...payload.image,
				src: '',
			},
			font: {
				...payload.font,
				base64: '',
			},
			string: '',
		};
		localStorage.setItem(`${$statsScene}-${settingsType}`, JSON.stringify(savedStyle));
		notifications.success('Styles Saved', 3000);
	};

	let loadTrigger: number;
	const loadStyling = () => {
		const settingsType = getSettingsType(selectedElementId);
		if (!settingsType || !savedStyle) return;
		payload = JSON.parse(JSON.stringify(savedStyle));
		loadTrigger = Math.random();
		notifications.success('Styles Loaded', 3000);
	};

	function updateStyle() {
		if (getSettingsType(selectedElementId) === getSettingsType(prevSelectedElementId)) return;
		payload = getDefaultElementPayload();
		prevSelectedElementId = selectedElementId;
	}
	$: selectedElementId, updateStyle();

	const fixAnimationInputDelay = () => {
		if (payload.animationTrigger.in.type === Animation.None) {
			payload.animationTrigger.in.options.delay = 0;
			payload.animationTrigger.in.options.duration = 0;
		}
		if (payload.animationTrigger.out.type === Animation.None) {
			payload.animationTrigger.out.options.delay = 0;
			payload.animationTrigger.out.options.duration = 0;
		}
	};
	$: payload.animationTrigger, fixAnimationInputDelay();

	const testAnimationTriggers = () => {
		$localEmitter.emit('TestAnimationTrigger');
	};
	const testCustomAnimationTriggers = () => {
		$localEmitter.emit('TestCustomAnimationTrigger');
	};
	const testVisibilityAnimation = () => {
		$localEmitter.emit('TestVisibilityTrigger');
	};

	const handleVisibilityUpdate = (event: CustomEvent<SelectedVisibilityCondition[]>) => {
		payload.visibility.selectedOptions = event.detail;
	};
	const handleTriggerUpdate = (event: CustomEvent<SelectedAnimationTriggerCondition>) => {
		payload.animationTrigger.selectedOptions = event.detail;
	};
</script>

{#key selectedElementId}
	{#key loadTrigger}
		<div
			class="w-full my-4 flex flex-col gap-8"
			in:fly={{ duration: 250, x: 150, delay: 250 }}
			out:fly={{ duration: 250, x: 150 }}
		>
			{#if savedStyle}
				<div class="flex gap-4">
					<button
						class="btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary rounded"
						on:click={loadStyling}
						use:tooltip={{
							content:
								'Load previously loaded styling and animation settings. This will overwrite the current settings.',
							placement: 'top-start',
							offset: 15,
							delay: [200, 0],
						}}
					>
						Load Style and Animation Settings
					</button>
				</div>
			{/if}
			{#if selectedElementId === CustomElement.CustomString}
				<div class="w-full h-fit flex flex-wrap">
					<h1 class="text-xl font-medium">Custom text</h1>
					<div class="w-full h-10">
						<input
							type="text"
							id="default-input"
							placeholder="Text"
							bind:value={payload.string}
							class="w-full h-full border-secondary text-secondary-color background-primary-color text-lg rounded-lg block p-2.5"
						/>
					</div>
				</div>
			{/if}
			{#if selectedElementId === CustomElement.CustomBoxIframe}
				<div class="w-full h-fit flex flex-wrap">
					<h1 class="text-xl font-medium">Embed Url</h1>
					<div class="w-full h-10">
						<input
							type="text"
							id="default-input"
							placeholder="Text"
							bind:value={payload.url}
							class="w-full h-full border-secondary text-secondary-color background-primary-color text-lg rounded-lg block p-2.5"
						/>
					</div>
				</div>
			{/if}

			{#if selectedElementId === CustomElement.CustomImage}
				<h1 class="text-secondary-color text-xl font-medium">Select Image</h1>
				<div class="w-full h-fit flex flex-wrap">
					<div class="w-full h-24">
						<FileUpload
							fileName={selectedItemId}
							directory="image"
							label="Upload"
							acceptedExtensions={['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']}
							on:change={(event) => {
								payload.image.name = event.detail;
							}}
						/>
					</div>
				</div>
				<h1 class="text-secondary-color text-xl font-medium">Image Positioning</h1>
			{/if}

			{#if stringSettings || customStringSettings}
				<div class="gap-4">
					<FontSelectorLayer bind:font={payload.font} fontId={selectedItemId} />
				</div>
			{/if}

			{#if percentSettings || customPercentSettings}
				<section class="styling-section">
					<p class="section-label">Percent Colors</p>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<p class="field-label">Start · 0%</p>
							<ColorInput bind:value={payload.percent.startColor} />
						</div>
						<div>
							<p class="field-label">End · 300%</p>
							<ColorInput bind:value={payload.percent.endColor} />
						</div>
					</div>
				</section>
			{/if}

			{#if stringSettings || imageSettings}
				<section class="styling-section">
					<p class="section-label">Alignment</p>
					<Select bind:selected={payload.class.alignment}>
						<option value="justify-start">Left</option>
						<option selected value="justify-center">Center</option>
						<option value="justify-end">Right</option>
					</Select>
				</section>
			{/if}

			{#if imageSettings}
				<section class="styling-section">
					<p class="section-label">Image Fit</p>
					<Select bind:selected={payload.image.objectFit}>
						<option value="contain">Contain</option>
						<option selected value="cover">Cover</option>
					</Select>
				</section>
			{/if}

			{#if stringSettings && (!percentSettings || !customPercentSettings)}
				<section class="styling-section">
					<p class="section-label">Text Color</p>
					<div class="h-12">
						<ColorInput bind:valueConcat={payload.css.color} opacity={true} />
					</div>
				</section>
			{/if}

			{#if stringSettings || percentSettings || customPercentSettings}
				<section class="styling-section">
					<p class="section-label">Text Stroke</p>
					<div class="grid grid-cols-2 gap-3 items-end">
						<div>
							<p class="field-label">Size · {payload.textStroke.size}</p>
							<NumberInput bind:value={payload.textStroke.size} min={0} max={100} step={0.1} />
						</div>
						<div>
							<p class="field-label">Color</p>
							<ColorInput bind:valueConcat={payload.textStroke.color} opacity={true} />
						</div>
					</div>
				</section>
			{/if}

			{#if svgSettings}
				<section class="styling-section">
					<p class="section-label">SVG Stroke</p>
					<div class="grid grid-cols-2 gap-3 items-end">
						<div>
							<p class="field-label">Size · {payload.css.strokeWidth}</p>
							<NumberInput bind:value={payload.css.strokeWidth} min={0} max={100} step={0.1} />
						</div>
						<div>
							<p class="field-label">Color</p>
							<ColorInput bind:value={payload.css.stroke} />
						</div>
					</div>
				</section>
			{/if}

			<section class="styling-section">
				<p class="section-label">Border</p>
				<div class="mb-2">
					<p class="field-label">Color</p>
					<ColorInput bind:valueConcat={payload.css.borderColor} opacity={true} />
				</div>
				<div class="grid grid-cols-2 gap-2">
					<NumberInput
						value={Number(payload.css.borderLeft?.slice(0, -9) ?? 0)}
						bind:valueConcat={payload.css.borderLeft}
						min={0} max={100} step={0.1}
						stringFormat={'{0}rem solid'}
						label={'Left'}
					/>
					<NumberInput
						value={Number(payload.css.borderRight?.slice(0, -9) ?? 0)}
						bind:valueConcat={payload.css.borderRight}
						min={0} max={100} step={0.1}
						stringFormat={'{0}rem solid'}
						label={'Right'}
					/>
					<NumberInput
						value={Number(payload.css.borderTop?.slice(0, -9) ?? 0)}
						bind:valueConcat={payload.css.borderTop}
						min={0} max={100} step={0.1}
						stringFormat={'{0}rem solid'}
						label={'Top'}
					/>
					<NumberInput
						value={Number(payload.css.borderBottom?.slice(0, -9) ?? 0)}
						bind:valueConcat={payload.css.borderBottom}
						min={0} max={100} step={0.1}
						stringFormat={'{0}rem solid'}
						label={'Bottom'}
					/>
				</div>
				<div class="mt-2">
					<p class="field-label">Rounded Corner</p>
					<Select bind:selected={payload.class.rounded}>
						<option value="" selected>None</option>
						<option value="rounded-sm">Small</option>
						<option value="rounded-md">Medium</option>
						<option value="rounded-lg">Large</option>
						<option value="rounded-full">Full</option>
					</Select>
				</div>
			</section>

			<section class="styling-section">
				<p class="section-label">Background Color</p>
				<div class="h-12">
					<ColorInput bind:valueConcat={payload.css.background} opacity={true} />
				</div>
			</section>

			<section class="styling-section">
				<p class="section-label">Transformation</p>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<p class="field-label">Flip</p>
						<Select bind:selected={payload.transform.scale}>
							<option selected value={'1, 1'}>Default</option>
							<option value={'-1, 1'}>Horizontal</option>
							<option value={'1, -1'}>Vertical</option>
							<option value={'-1, -1'}>Both</option>
						</Select>
					</div>
					<div>
						<p class="field-label">Rotate · {payload.transform.rotate}°</p>
						<div class="flex gap-2">
							<SliderInput bind:value={payload.transform.rotate} min={-180} max={180} step={1} />
							<NumberInput bind:value={payload.transform.rotate} min={-180} max={180} step={1} />
						</div>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3 mt-2">
					<div>
						<p class="field-label">Translate X · {payload.transform.translate.x}</p>
						<NumberInput bind:value={payload.transform.translate.x} min={0} max={100} step={0.1} />
					</div>
					<div>
						<p class="field-label">Translate Y · {payload.transform.translate.y}</p>
						<NumberInput bind:value={payload.transform.translate.y} min={0} max={100} step={0.1} />
					</div>
				</div>
			</section>

			<section class="styling-section">
				<p class="section-label">Shadow</p>
				<ShadowSelect bind:value={payload.shadow} />
			</section>

			<section class="styling-section">
				<p class="section-label">Opacity · {`${((payload.css.opacity ?? 0) * 100).toFixed()}%`}</p>
				<SliderInput bind:value={payload.css.opacity} />
			</section>
			<div class="items-center gap-2 flex">
				<h1
					class="text-secondary-color text-xl font-medium mb-2"
					use:tooltip={{
						content: 'Animations that triggers on in-game events such as taking damage',
						placement: 'top-start',
						offset: 15,
						delay: [200, 0],
					}}
				>
					Animation Triggers
				</h1>
			</div>
			<h1 class="text-secondary-color text-lg font-medium">Trigger</h1>
			{#if !preAnimatedElement}
				<AnimationTriggerSelect
					bind:selectedOption={payload.animationTrigger.selectedOptions}
					on:update={handleTriggerUpdate}
				/>
			{/if}
			{#if payload.animationTrigger.selectedOptions && !preAnimatedElement}
				<div class="w-full flex gap-4" in:fly={{ duration: 250, x: 100 }}>
					<AnimationInput
						bind:animation={payload.animationTrigger.in}
						label="In"
						max={ELEMENT_TRANSITION_LIMIT}
					/>
					<AnimationInput
						bind:animation={payload.animationTrigger.out}
						label="Out"
						max={ELEMENT_TRANSITION_LIMIT}
					/>
				</div>
			{/if}
			{#if payload.animationTrigger.selectedOptions && !preAnimatedElement}
				<button
					in:fly={{ duration: 250, x: 100 }}
					on:click={testAnimationTriggers}
					class="btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				>
					Test animation
				</button>
			{/if}
			{#if preAnimatedElement}
				<button
					in:fly={{ duration: 250, x: 100 }}
					on:click={testCustomAnimationTriggers}
					class="btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				>
					Test animation
				</button>
			{/if}

			<div class="items-center gap-2 flex">
				<h1
					class="text-secondary-color text-xl font-medium mb-2"
					use:tooltip={{
						content:
							'Conditions that decides when an element should be visible. For example, when a game is paused or if player is alive',
						placement: 'top-start',
						offset: 15,
						delay: [200, 0],
					}}
				>
					Visibility conditions
				</h1>
			</div>

			<VisibilitySelect
				bind:selectedVisibilityOptions={payload.visibility.selectedOptions}
				on:update={handleVisibilityUpdate}
			/>

			{#if payload.visibility.selectedOptions.length}
				<div class="w-full flex gap-4" in:fly={{ duration: 250, x: 100 }}>
					<AnimationInput
						bind:animation={payload.visibility.in}
						label="In"
						max={ELEMENT_TRANSITION_LIMIT}
					/>
					<AnimationInput
						bind:animation={payload.visibility.out}
						label="Out"
						max={ELEMENT_TRANSITION_LIMIT}
					/>
				</div>
				<button
					in:fly={{ duration: 250, x: 100 }}
					on:click={() => testVisibilityAnimation()}
					class="btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				>
					Test animation
				</button>
			{/if}
			<div class="items-center gap-2 flex">
				<h1 class="text-secondary-color text-xl font-medium mb-2">Advanced styling</h1>
				<div class="mb-2">
					<BooleanInput bind:checked={payload.advancedStyling} />
				</div>
			</div>
			{#if payload.advancedStyling}
				{#if stringSettings || imageSettings}
					<div in:fly={{ duration: 250, delay: 0 }}>
						<CodeInput
							bind:value={payload.css.customParent}
							label="Custom Inline CSS Parent - Default: width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
						/>
					</div>
				{/if}
				{#if boxSettings || imageSettings}
					<div in:fly={{ duration: 250, delay: 50 }}>
						<CodeInput
							bind:value={payload.css.customBox}
							label="Custom Inline CSS Box - Default: width: 100%; height: 100%;"
						/>
					</div>
				{/if}
				{#if stringSettings}
					<div in:fly={{ duration: 250, delay: 100 }}>
						<CodeInput
							bind:value={payload.css.customText}
							label="Custom Inline CSS Text"
						/>
					</div>
				{/if}
				{#if imageSettings}
					<div in:fly={{ duration: 250, delay: 150 }}>
						<CodeInput
							bind:value={payload.css.customImage}
							label="Custom Inline CSS Image - Default: width: 100%; height: 100%; object-fit: contain;"
						/>
					</div>
				{/if}
			{/if}
			<div>
				<button
					class="btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
					on:click={saveStyling}
					use:tooltip={{
						content:
							'Save the current styling and animation settings. This can be loaded later. Does <b>NOT</b> save custom image or font.',
						placement: 'top-start',
						offset: 15,
						delay: [1000, 0],
						html: true,
					}}
				>
					Save Styling and Animation
				</button>
			</div>
		</div>
	{/key}
{/key}

<style>
	.styling-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.section-label {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.6;
	}
	.field-label {
		font-size: 0.8rem;
		font-weight: 500;
		opacity: 0.7;
		margin-bottom: 0.25rem;
	}
</style>
