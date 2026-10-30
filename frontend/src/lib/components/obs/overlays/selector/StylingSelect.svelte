<script lang="ts">
	import { IRONMAN_BOX_ELEMENTS, IRONMAN_TEXT_ELEMENTS } from '$lib/utils/elementKind';
	import { canonicalPlayerElement, playerOptions, selectedPlayerOption } from '$lib/utils/playerVariants';
	import { BUILTIN_ASSET_PACKS, DEFAULT_ASSET_PACK_ID } from '$lib/models/types/assetPack';
	import { PACK_CHARACTER_ELEMENTS, STRIKE_CHARACTER_ELEMENTS } from '../elementCategories';
	import Select from '$lib/components/input/Select.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import type { ElementPayload } from '$lib/models/types/overlay';
	import { Animation, StyleSetting } from '$lib/models/enum';
	import ColorInput from '$lib/components/input/ColorInput.svelte';
	import { CONTROLLER_STYLE_DEFAULTS } from '$lib/utils/controllerStyle';
	import { CONTROLLER_PREVIEW, type ControllerPreview } from '../element/controllerPreview';
	import { getContext } from 'svelte';
	import SliderInput from '$lib/components/input/SliderInput.svelte';
	import { CustomElement } from '$lib/models/constants/customElement';
	import CodeInput from '$lib/components/input/CodeInput.svelte';
	import { fly } from 'svelte/transition';
	import ShadowSelect from './ShadowSelect.svelte';
	import { assetPacks, localEmitter, statsScene } from '$lib/utils/store.svelte';
	import AnimationInput from '$lib/components/input/AnimationInput.svelte';
	import BooleanInput from '$lib/components/input/BooleanInput.svelte';
	import FontSelectorLayer from '$lib/components/obs/overlays/selector/FontSelectLayer.svelte';
	import { getNewElementPayload } from '../edit/OverlayHandler.svelte';
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
	import { page } from '$app/stores';
	import { flows, overlays } from '$lib/utils/store.svelte';
	import { flowVideoKeys, sceneWarnings } from '$lib/utils/overlayWarnings';
	import type { ElementTrigger, TriggerAnimation } from '$lib/models/types/overlay';
	import { SELF, activeTriggers, elementTriggerKey, triggerAnimations } from '$lib/utils/elementTriggers';
	import { getDefaultAnimations } from '$lib/utils/overlayElementDefaults';

	export let selectedItemId: string;
	export let selectedElementId: number;
	export let payload: ElementPayload;

	$: customStringSettings = isCustomStringSettings(selectedElementId);
	$: customBoxSettings = isCustomBoxSettings(selectedElementId);
	$: customImageSettings = isCustomImageSettings(selectedElementId);
	// Media element (2100): payload.video {source, key, file, fit, volume}; older ones: payload.highlight {key, sound}.
	type MediaSettings = { source?: 'key' | 'file'; key?: string; file?: string; fit?: 'cover' | 'contain'; volume?: number };
	$: mediaSettings = (payload?.video ?? (payload?.highlight ? { key: payload.highlight.key, volume: payload.highlight.sound ? 100 : 0 } : {})) as MediaSettings;
	const setMedia = (patch: MediaSettings) => (payload.video = { key: 'game', volume: 0, ...mediaSettings, ...patch });
	$: stringSettings = isStringSettings(selectedElementId);
	$: imageSettings = isImageSettings(selectedElementId);
	$: isPackCharacter = PACK_CHARACTER_ELEMENTS.has(selectedElementId) || STRIKE_CHARACTER_ELEMENTS.has(selectedElementId);
	$: rpsIconSettings = selectedElementId === CustomElement.StrikeRpsPlayer1Icon || selectedElementId === CustomElement.StrikeRpsPlayer2Icon;
	const RPS_HANDS: { value: 'rock' | 'paper' | 'scissors'; label: string }[] = [
		{ value: 'rock', label: 'Rock' },
		{ value: 'paper', label: 'Paper' },
		{ value: 'scissors', label: 'Scissors' },
	];
	$: if (isPackCharacter && payload && !payload.assetPack) payload.assetPack = DEFAULT_ASSET_PACK_ID;
	// Elements created before the color option existed have no colorOverlay yet.
	$: if ((imageSettings || customImageSettings) && payload && !payload.colorOverlay)
		payload.colorOverlay = { enabled: false, color: '#ffffff', strength: 100 };

	$: boxSettings = isBoxSettings(selectedElementId);
	$: iframeSettings = selectedElementId === CustomElement.CustomBoxIframe;
	$: controllerButtonSettings = selectedElementId >= 3100 && selectedElementId < 3150;
	$: controllerAnalogButtonSettings = selectedElementId >= 3150 && selectedElementId < 3160;
	$: controllerAnalogStickSettings = selectedElementId >= 3160 && selectedElementId < 3170;

	$: svgSettings = selectedElementId >= 3200 && selectedElementId <= 3200; // TODO: Add all buttons as svg
	// Controller graphics (ControllerGraphic): outline + fill colours; elements made before get today's look.
	$: controllerSettings = selectedElementId >= 3100 && selectedElementId < 3170;
	// Fill in fields elements made before this option had (older payloads lack the pressed colours).
	$: if (controllerSettings && payload && (!payload.controller || payload.controller.fillPressed === undefined))
		payload.controller = { ...CONTROLLER_STYLE_DEFAULTS, ...(payload.controller ?? {}) };
	$: isTriggerBar = selectedElementId >= 3150 && selectedElementId < 3160;
	$: isStick = selectedElementId >= 3160 && selectedElementId < 3170;
	// Set by the style window (ElementModal): show the controller preview pressed.
	const controllerPreview = getContext<ControllerPreview | undefined>(CONTROLLER_PREVIEW);

	$: percentSettings = (selectedElementId >= 1001 && selectedElementId <= 1006) || (selectedElementId >= 1013 && selectedElementId <= 1015);
	$: customPercentSettings = selectedElementId >= 1007 && selectedElementId <= 1012;

	$: preAnimatedElement = customPercentSettings;

	const isStringSettings = (elementId: number) => {
		return (elementId >= 4000 && elementId < 6000) || elementId === CustomElement.CustomString || IRONMAN_TEXT_ELEMENTS.has(elementId);
	};
	// Plain stage images for striking overlays (7600–7699) style like images.
	const isStrikeStageImage = (elementId: number) => elementId >= 7600 && elementId < 7700;
	const isBoxSettings = (elementId: number) => {
		return (elementId >= 7000 && elementId < 8000 && !isStrikeStageImage(elementId))
			|| elementId === CustomElement.CustomBox
			|| IRONMAN_BOX_ELEMENTS.has(elementId);
	};
	const isImageSettings = (elementId: number) => {
		return (elementId >= 6000 && elementId < 7000)
			|| isStrikeStageImage(elementId)
			|| elementId === CustomElement.CustomImage
			|| elementId === CustomElement.SlippiRankCurrentPlayerRatingGraph;
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
		payload = getNewElementPayload();
		prevSelectedElementId = selectedElementId;
	}
	$: selectedElementId, updateStyle();

	const fixAnimationInputDelay = () => {
		for (const t of triggerAnimations(payload)) {
			if (t.in.type === Animation.None) {
				t.in.options.delay = 0;
				t.in.options.duration = 0;
			}
			if (t.out.type === Animation.None) {
				t.out.options.delay = 0;
				t.out.options.duration = 0;
			}
		}
	};
	$: payload.animationTrigger, payload.extraAnimationTriggers, fixAnimationInputDelay();

	// Trigger animations: animation 1 = payload.animationTrigger, 2… = payload.extraAnimationTriggers.
	// Each has its own in/out and triggers; a trigger belongs to one animation only.
	let animIndex = 0;
	$: animations = triggerAnimations(payload);
	$: if (animIndex >= animations.length) animIndex = 0;
	$: currentAnimation = animations[animIndex];
	$: takenByOthers = new Set(
		animations
			.filter((_, i) => i !== animIndex)
			.flatMap((t) => [...activeTriggers(t.selectedOptions), ...(t.elementTriggers ?? []).map(elementTriggerKey)]),
	);
	const addAnimation = () => {
		const next: TriggerAnimation = { in: getDefaultAnimations(), out: getDefaultAnimations(), selectedOptions: {} as SelectedAnimationTriggerCondition, elementTriggers: [] };
		payload.extraAnimationTriggers = [...(payload.extraAnimationTriggers ?? []), next];
		animIndex = animations.length;
	};
	const removeAnimation = () => {
		if (animIndex === 0) return;
		payload.extraAnimationTriggers = (payload.extraAnimationTriggers ?? []).filter((_, i) => i !== animIndex - 1);
		animIndex = 0;
	};
	// Elements a trigger can watch: this one, then every other element of the scene.
	const humanize = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
	$: sceneLayers = $overlays[$page.params.overlay]?.[$statsScene]?.layers ?? [];
	// Problems with this element (utils/overlayWarnings.ts) — e.g. a video key no flow sets.
	$: itemWarnings = sceneWarnings($overlays[$page.params.overlay]?.[$statsScene], flowVideoKeys($flows))[selectedItemId] ?? [];
	$: triggerElements = [
		{ value: SELF, label: 'This element' },
		...sceneLayers.flatMap((layer, i) =>
			(layer.items ?? [])
				.filter((item) => item.id !== selectedItemId)
				.map((item) => ({ value: item.id, label: `${layer.title || `Layer ${i + 1}`} · ${humanize(CustomElement[item.elementId] ?? `Element ${item.elementId}`)}` })),
		),
	];

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
	const handleTriggerUpdate = (event: CustomEvent<{ selectedOptions: SelectedAnimationTriggerCondition; elementTriggers: ElementTrigger[] }>) => {
		const t = triggerAnimations(payload)[animIndex];
		if (!t) return;
		t.selectedOptions = event.detail.selectedOptions;
		t.elementTriggers = event.detail.elementTriggers;
		payload = payload;
	};
	// Player dropdown (utils/playerVariants): the players this element exists for + doubles' second
	// players. Picking one switches the element id (and the doubles slot) — styling stays.
	$: playerChoices = playerOptions(selectedElementId);
	$: playerChoice = selectedPlayerOption(selectedElementId, payload?.playerSlot);
	const pickPlayer = (value: string) => {
		const choice = playerChoices.find((o) => o.value === value);
		if (!choice) return;
		payload.playerSlot = choice.slot;
		prevSelectedElementId = choice.elementId;
		selectedElementId = choice.elementId;
	};
</script>

{#key canonicalPlayerElement(selectedElementId)}
	{#key loadTrigger}
		<div
			class="w-full my-2 flex flex-col gap-5"
			in:fly={{ duration: 250, x: 150, delay: 250 }}
			out:fly={{ duration: 250, x: 150 }}
		>
			{#if itemWarnings.length}
				<div class="element-warning">
					{#each itemWarnings as w}<p>⚠ {w}</p>{/each}
				</div>
			{/if}
			{#if savedStyle}
				<button
					class="btn text-xs h-8 px-4 border-secondary rounded"
					on:click={loadStyling}
					use:tooltip={{
						content: 'Load previously saved styling and animation settings. Overwrites current.',
						placement: 'top-start',
						offset: 15,
						delay: [200, 0],
					}}
				>
					Load Style and Animation
				</button>
			{/if}
			{#if selectedElementId === CustomElement.CustomString}
				<section class="styling-section">
					<p class="section-label">Custom Text</p>
					<input
						type="text"
						placeholder="Text"
						bind:value={payload.string}
						class="w-full border-secondary text-secondary-color background-primary-color text-sm rounded block px-3 py-2"
					/>
				</section>
			{/if}
			{#if selectedElementId === CustomElement.CustomBoxIframe}
				<section class="styling-section">
					<p class="section-label">Embed URL</p>
					<input
						type="text"
						placeholder="https://..."
						bind:value={payload.url}
						class="w-full border-secondary text-secondary-color background-primary-color text-sm rounded block px-3 py-2"
					/>
				</section>
			{/if}

			{#if selectedElementId === CustomElement.PostGameHighlightVideo}
				<section class="styling-section">
					<p class="section-label">Media</p>
					<div class="pill-group mb-2">
						<button class="pill" class:pill--active={mediaSettings.source !== 'file'} on:click={() => setMedia({ source: 'key' })}>Key (set by a flow)</button>
						<button class="pill" class:pill--active={mediaSettings.source === 'file'} on:click={() => setMedia({ source: 'file' })}>File</button>
					</div>
					{#if mediaSettings.source === 'file'}
						<FileUpload
							fileName={`${selectedItemId}-media`}
							directory="image"
							label="Video or image"
							acceptedExtensions={['mp4', 'webm', 'jpg', 'jpeg', 'png', 'gif', 'webp']}
							on:change={(event) => setMedia({ file: event.detail })}
						/>
						<p class="text-xs opacity-50 mt-1">{mediaSettings.file ?? 'No file yet'} · videos up to 50 MB, loop. Shared with the overlay.</p>
					{:else}
						<label class="flex flex-col gap-1 text-sm mb-2">
							Key
							<input
								value={mediaSettings.key ?? 'game'}
								on:change={(e) => setMedia({ key: e.currentTarget.value.trim() || 'game' })}
								class="w-full border-secondary text-secondary-color background-primary-color text-sm rounded block px-3 py-2"
							/>
						</label>
					{/if}
					<label class="flex flex-col gap-1 text-sm mb-2">
						Fit
						<select
							value={mediaSettings.fit ?? 'cover'}
							on:change={(e) => setMedia({ fit: e.currentTarget.value === 'contain' ? 'contain' : 'cover' })}
							class="w-full border-secondary text-secondary-color background-primary-color text-sm rounded block px-3 py-2"
						>
							<option value="cover">Fill (crop)</option>
							<option value="contain">Fit (whole picture)</option>
						</select>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						Volume · {mediaSettings.volume ?? 0}
						<input type="range" min="0" max="100" step="5" value={mediaSettings.volume ?? 0} on:change={(e) => setMedia({ volume: Number(e.currentTarget.value) })} />
					</label>
					<p class="text-xs opacity-50 mt-2 leading-relaxed">
						{mediaSettings.source === 'file'
							? 'Shows this file on loop.'
							: 'Shows what a flow\'s "Set media" card puts on this key — a video or image file, a web link, or a highlight\'s replay-buffer clip. Empty until a flow sets it. Every screen (OBS, a phone, a remote device) shows the same moment at the same time; a flow\'s "Set media volume" for this key overrides the volume.'}
						0 = muted.
					</p>
				</section>
			{/if}

			{#if selectedElementId === CustomElement.HighlightReplay}
				<section class="styling-section">
					<p class="section-label">Highlight Replay</p>
					<label class="flex flex-col gap-1 text-sm">
						Key
						<input
							value={payload.video?.key ?? 'game'}
							on:change={(e) => (payload.video = { volume: 0, ...payload.video, key: e.currentTarget.value.trim() || 'game' })}
							class="w-full border-secondary text-secondary-color background-primary-color text-sm rounded block px-3 py-2"
						/>
					</label>
					<p class="text-xs opacity-50 mt-2 leading-relaxed">
						Plays the highlights a flow's "Set replay list" card puts on this key, redrawn from the game replays (no
						OBS needed), one after another. Empty until a flow sets it and the games are stored.
					</p>
				</section>
			{/if}

			{#if selectedElementId === CustomElement.CustomImage}
				<section class="styling-section">
					<p class="section-label">Image or video</p>
					<FileUpload
						fileName={selectedItemId}
						directory="image"
						label="Upload"
						acceptedExtensions={['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'mp4', 'webm']}
						on:change={(event) => { payload.image.name = event.detail; }}
					/>
					<p class="text-xs opacity-50 mt-1">MP4 / WebM videos play muted and on loop.</p>
				</section>
				<p class="section-label">Image Positioning</p>
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

			{#if playerChoices.length}
				<section class="styling-section">
					<p
						class="section-label"
						use:tooltip={{
							content: 'Which player this element shows: you (your connect code), Player 1 / 2 — in doubles each team\'s first player — or a team\'s second player.',
							placement: 'top-start',
							offset: 15,
							delay: [200, 0],
						}}
					>
						Player
					</p>
					<Select selected={playerChoice} on:change={(e) => pickPlayer(e.detail)}>
						{#each playerChoices as choice (choice.value)}
							<option value={choice.value} selected={playerChoice === choice.value}>{choice.label}</option>
						{/each}
					</Select>
				</section>
			{/if}

			{#if isPackCharacter}
				<section class="styling-section">
					<p
						class="section-label"
						use:tooltip={{
							content: 'Which set of character images to show — built-in stock icons, portraits or renders, or your own asset pack (Overlays → Assets).',
							placement: 'top-start',
							offset: 15,
							delay: [200, 0],
						}}
					>
						Asset pack
					</p>
					<Select bind:selected={payload.assetPack}>
						{#each [...BUILTIN_ASSET_PACKS, ...$assetPacks] as pack}
							<option value={pack.id} selected={(payload.assetPack ?? DEFAULT_ASSET_PACK_ID) === pack.id}>{pack.title}</option>
						{/each}
					</Select>
					<a class="text-xs underline opacity-60" href="/obs/overlay/assets">Manage asset packs →</a>
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

			{#if (imageSettings || customImageSettings) && payload.colorOverlay}
				<section class="styling-section">
					<div class="flex items-center gap-3">
						<p
							class="section-label"
							use:tooltip={{
								content: 'Paint the image in one color, keeping its shape and transparency. 100% = solid recolor (e.g. a white or black silhouette), lower = tint.',
								placement: 'top-start',
								offset: 15,
								delay: [200, 0],
							}}
						>
							Color Overlay
						</p>
						<BooleanInput bind:checked={payload.colorOverlay.enabled} />
					</div>
					{#if payload.colorOverlay.enabled}
						<div class="flex flex-col gap-2" in:fly={{ duration: 250, x: 100 }}>
							<ColorInput bind:value={payload.colorOverlay.color} />
							<p class="section-label">Strength · {payload.colorOverlay.strength}%</p>
							<SliderInput bind:value={payload.colorOverlay.strength} min={0} max={100} step={1} />
						</div>
					{/if}
				</section>
			{/if}

			{#if stringSettings && (!percentSettings || !customPercentSettings)}
				<section class="styling-section">
					<p class="section-label">Text Color</p>
					<ColorInput bind:valueConcat={payload.css.color} opacity={true} />
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

			{#if controllerSettings && payload.controller}
				<section class="styling-section">
					<div class="flex items-center justify-between">
						<p class="section-label">Controller</p>
						{#if controllerPreview}
							<label class="flex items-center gap-1 text-xs cursor-pointer">
								<input type="checkbox" bind:checked={$controllerPreview} />
								Show pressed
							</label>
						{/if}
					</div>
					{#if isTriggerBar}
						<!-- The analog L/R bar: border + rounding come from the Border section, the track from Background. -->
						<div>
							<p class="field-label">Bar color (pressed part)</p>
							<ColorInput bind:valueConcat={payload.controller.fillPressed} opacity={true} />
						</div>
					{:else if isStick}
						<!-- Sticks have no pressed state: one outline + one fill (the whole cap). -->
						<div class="grid grid-cols-2 gap-3 items-end">
							<div>
								<p class="field-label">Outline</p>
								<ColorInput bind:valueConcat={payload.controller.outline} opacity={true} />
							</div>
							<div>
								<p class="field-label">Fill (cap)</p>
								<ColorInput bind:valueConcat={payload.controller.fill} opacity={true} />
							</div>
							<div>
								<p class="field-label">Outline width · {payload.controller.width}</p>
								<NumberInput bind:value={payload.controller.width} min={0} max={20} step={0.5} />
							</div>
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-3 items-end">
							<div>
								<p class="field-label">Outline · released</p>
								<ColorInput bind:valueConcat={payload.controller.outline} opacity={true} />
							</div>
							<div>
								<p class="field-label">Outline · pressed</p>
								<ColorInput bind:valueConcat={payload.controller.outlinePressed} opacity={true} />
							</div>
							<div>
								<p class="field-label">Fill · released</p>
								<ColorInput bind:valueConcat={payload.controller.fill} opacity={true} />
							</div>
							<div>
								<p class="field-label">Fill · pressed</p>
								<ColorInput bind:valueConcat={payload.controller.fillPressed} opacity={true} />
							</div>
							<div>
								<p class="field-label">Outline width · {payload.controller.width}</p>
								<NumberInput bind:value={payload.controller.width} min={0} max={20} step={0.5} />
							</div>
						</div>
					{/if}
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
				<ColorInput bind:valueConcat={payload.css.background} opacity={true} />
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

			{#if rpsIconSettings}
				<section class="styling-section">
					<p class="section-label">Icons</p>
					<div class="pill-group">
						<button class="pill" class:pill--active={(payload.rpsIconStyle ?? 'outline') === 'outline'} on:click={() => (payload.rpsIconStyle = 'outline')}>Outline (text colour)</button>
						<button class="pill" class:pill--active={payload.rpsIconStyle === 'color'} on:click={() => (payload.rpsIconStyle = 'color')}>Colour</button>
					</div>
					{#each RPS_HANDS as h (h.value)}
						<div class="flex gap-2 items-end">
							<div class="flex-1">
								<FileUpload
									fileName={`${selectedItemId}-${h.value}`}
									directory="image"
									label={`${h.label}${payload.rpsIcons?.[h.value] ? ' · your icon' : ' · built-in'}`}
									acceptedExtensions={['png', 'svg', 'webp', 'gif', 'jpg', 'jpeg']}
									on:change={(event) => (payload.rpsIcons = { ...(payload.rpsIcons ?? {}), [h.value]: event.detail })}
								/>
							</div>
							{#if payload.rpsIcons?.[h.value]}
								<button class="btn text-xs h-10 px-3 border-secondary rounded" on:click={() => (payload.rpsIcons = { ...(payload.rpsIcons ?? {}), [h.value]: undefined })}>Built-in</button>
							{/if}
						</div>
					{/each}
				</section>
			{/if}

			<section class="styling-section">
				<p class="section-label">Shadow</p>
				<ShadowSelect bind:value={payload.shadow} />
			</section>

			<section class="styling-section">
				<p class="section-label">Opacity · {`${((payload.css.opacity ?? 0) * 100).toFixed()}%`}</p>
				<SliderInput bind:value={payload.css.opacity} />
			</section>
			<section class="styling-section">
				<p
					class="section-label"
					use:tooltip={{
						content: 'Animations that trigger on in-game events such as taking damage',
						placement: 'top-start',
						offset: 15,
						delay: [200, 0],
					}}
				>
					Animation Triggers
				</p>
				{#if !preAnimatedElement}
					<div class="pill-group">
						{#each animations as _, i}
							<button class="pill" class:pill--active={animIndex === i} on:click={() => (animIndex = i)}>Animation {i + 1}</button>
						{/each}
						<button class="pill" title="Another animation with its own triggers" on:click={addAnimation}>+ Add</button>
					</div>
					{#key animIndex}
						{#if currentAnimation}
							<AnimationTriggerSelect
								selectedOption={currentAnimation.selectedOptions}
								elementTriggers={currentAnimation.elementTriggers ?? []}
								taken={takenByOthers}
								elements={triggerElements}
								label="Triggers · Animation {animIndex + 1}"
								on:update={handleTriggerUpdate}
							/>
						{/if}
						<div class="w-full flex gap-4" in:fly={{ duration: 250, x: 100 }}>
							{#if animIndex === 0}
								<AnimationInput bind:animation={payload.animationTrigger.in} label="In" max={ELEMENT_TRANSITION_LIMIT} allowCount />
								<AnimationInput bind:animation={payload.animationTrigger.out} label="Out" max={ELEMENT_TRANSITION_LIMIT} />
							{:else}
								{#each payload.extraAnimationTriggers ?? [] as extra, i}
									{#if i + 1 === animIndex}
										<AnimationInput bind:animation={extra.in} label="In" max={ELEMENT_TRANSITION_LIMIT} allowCount />
										<AnimationInput bind:animation={extra.out} label="Out" max={ELEMENT_TRANSITION_LIMIT} />
									{/if}
								{/each}
							{/if}
						</div>
					{/key}
					<div class="flex gap-2">
						<button in:fly={{ duration: 250, x: 100 }} on:click={testAnimationTriggers} class="btn text-xs h-8 px-4 border-secondary rounded">
							Test animation
						</button>
						{#if animIndex > 0}
							<button on:click={removeAnimation} class="btn text-xs h-8 px-4 border-secondary rounded">Remove animation {animIndex + 1}</button>
						{/if}
					</div>
				{/if}
				{#if preAnimatedElement}
					<button in:fly={{ duration: 250, x: 100 }} on:click={testCustomAnimationTriggers} class="btn text-xs h-8 px-4 border-secondary rounded">
						Test animation
					</button>
				{/if}
			</section>

			<section class="styling-section">
				<p
					class="section-label"
					use:tooltip={{
						content: 'Conditions that decide when an element is visible — e.g. game paused, player alive',
						placement: 'top-start',
						offset: 15,
						delay: [200, 0],
					}}
				>
					Visibility Conditions
				</p>
				<VisibilitySelect
					bind:selectedVisibilityOptions={payload.visibility.selectedOptions}
					on:update={handleVisibilityUpdate}
				/>
				{#if payload.visibility.selectedOptions.length}
					<div class="w-full flex gap-4" in:fly={{ duration: 250, x: 100 }}>
						<AnimationInput bind:animation={payload.visibility.in} label="In" max={ELEMENT_TRANSITION_LIMIT} />
						<AnimationInput bind:animation={payload.visibility.out} label="Out" max={ELEMENT_TRANSITION_LIMIT} />
					</div>
					<button in:fly={{ duration: 250, x: 100 }} on:click={() => testVisibilityAnimation()} class="btn text-xs h-8 px-4 border-secondary rounded">
						Test animation
					</button>
				{/if}
			</section>

			<div class="flex items-center gap-3">
				<p class="section-label">Advanced Styling</p>
				<BooleanInput bind:checked={payload.advancedStyling} />
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
			<button
				class="btn text-xs h-8 px-4 border-secondary rounded"
				on:click={saveStyling}
				use:tooltip={{
					content: 'Save current styling and animation settings for later. Does NOT save custom image or font.',
					placement: 'top-start',
					offset: 15,
					delay: [1000, 0],
				}}
			>
				Save Styling and Animation
			</button>
		</div>
	{/key}
{/key}

<style>
	.element-warning { border: 1px solid #ef4444; border-radius: 0.375rem; padding: 0.5rem 0.7rem; color: #ef4444; font-size: 0.78rem; display: flex; flex-direction: column; gap: 0.2rem; }
	.pill-group { display: flex; flex-wrap: wrap; gap: 0.4rem; }
	.pill {
		font-size: 0.78rem;
		padding: 0.2rem 0.7rem;
		border: 1px solid var(--secondary-color);
		border-radius: 1rem;
		color: var(--secondary-color);
		background: transparent;
		opacity: 0.4;
	}
	.pill--active, .pill:hover { opacity: 1; background: color-mix(in srgb, var(--secondary-color) 12%, transparent); }
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
