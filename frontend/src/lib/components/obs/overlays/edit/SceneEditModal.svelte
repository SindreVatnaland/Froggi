<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { LiveStatsScene, SceneBackground } from '$lib/models/enum';
	import type { Overlay } from '$lib/models/types/overlay';
	import { isElectron, statsScene, urls } from '$lib/utils/store.svelte';
	import Select from '$lib/components/input/Select.svelte';
	import ColorInput from '$lib/components/input/ColorInput.svelte';
	import NumberInput from '$lib/components/input/NumberInput.svelte';
	import TextInput from '$lib/components/input/TextInput.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { updateOverlay } from '$lib/components/obs/overlays/edit/OverlayHandler.svelte';
	import FileUpload from '$lib/components/input/FileUpload.svelte';
	import { SCENE_TRANSITION_DELAY } from '$lib/models/const';
	import FontSelectorLayer from '../selector/FontSelectLayer.svelte';
	import AnimationInput from '$lib/components/input/AnimationInput.svelte';
	import SceneSelectOptions from '../selector/SceneSelectOptions.svelte';
	import { tooltip } from 'svooltip';
	import { fly } from 'svelte/transition';

	export let open: boolean;
	export let overlay: Overlay;

	$: curScene = overlay[$statsScene];

	$: resourceUrl = $isElectron ? $urls?.localResource : $urls?.localResource;

	let imageOptions: string[] = [];

	function getImageOptions() {
		const modules = import.meta.glob('../../../../../../static/image/backgrounds/**.png');
		for (let image in modules) {
			imageOptions.push(image);
		}
		imageOptions = imageOptions
			.filter((i) => i !== undefined)
			.map((imageString: string) => `${imageString.split('/').slice(-1).pop()}`)
			.filter((image) => image !== undefined);
	}
	getImageOptions();

	function clear() {
		open = false;
	}

	async function handleUpdate() {
		notifications.success('Overlay updated!', 3000);
		open = false;
		await updateOverlay(overlay);
	}

	let autofocus: number = 0;

	$: bgStyle = [
		curScene.background.type === SceneBackground.Color
			? `background: ${curScene.background.color};`
			: '',
		curScene.background.type === SceneBackground.Image
			? `background-image: url('/image/backgrounds/${curScene.background.image.src}'); background-size: ${curScene.background.image.objectFit ?? 'cover'};`
			: '',
		curScene.background.type === SceneBackground.ImageCustom
			? `background-image: url('${resourceUrl}/public/custom/${overlay.id}/image/${encodeURI(curScene.background.customImage.name ?? '')}'); background-size: ${curScene.background.customImage.objectFit};`
			: '',
		curScene.background.type === SceneBackground.InGameImageStage || curScene.background.type === SceneBackground.PostGameImageStage
			? `background-image: url('/image/stages/8.png');`
			: '',
		curScene.background.opacity !== undefined
			? `opacity: ${curScene.background.opacity / 100};`
			: '',
		'background-repeat: no-repeat;',
	].join(' ');
</script>

<Modal bind:open class="rounded-lg" on:close={clear}>
	<div class="w-[80vw] h-[80vh] min-w-72 border-secondary background-primary-color text-secondary-color flex">
		<div class="w-full h-full flex gap-4 p-4">

			<!-- Left column: overlay + scene config -->
			<div class="flex flex-col justify-between gap-4 shrink-0" style="width: 240px;">
				<div class="flex flex-col gap-5 overflow-auto flex-1">
					<div>
						<p class="modal-label">Overlay</p>
						<TextInput bind:value={overlay.title} label="Title" bind:autofocus autoFocusValue={1} />
					</div>
					<div>
						<p class="modal-label">Scene visibility</p>
						<div class="flex gap-2 justify-between mb-1 mt-1">
							<span class="text-xs opacity-40">Active</span>
							<span class="text-xs opacity-40">Fallback</span>
						</div>
						<SceneSelectOptions bind:overlay />
					</div>
				</div>
				<button class="btn text-sm h-9 px-5 border-secondary rounded shrink-0" on:click={handleUpdate}>
					Update
				</button>
			</div>

			<!-- Right column: per-scene settings -->
			<div class="overflow-auto flex-1 relative min-h-0">
				{#key $statsScene}
					<div
						class="flex flex-col gap-4 w-full absolute"
						out:fly={{ duration: 200, x: 100 }}
						in:fly={{ duration: 200, delay: 200, x: 100 }}
					>
						<p class="modal-label">{$statsScene}</p>

						<div>
							<p class="modal-label">Default Font</p>
							<FontSelectorLayer bind:font={curScene.font} fontId={$statsScene} />
						</div>

						<div class="flex flex-col gap-2">
							<p class="modal-label">Background</p>
							<div class="flex flex-wrap gap-2">
								<div class="w-40">
									<Select bind:selected={curScene.background.type} label="Type">
										<option value={SceneBackground.None}>None</option>
										<option value={SceneBackground.Color}>Color</option>
										<option value={SceneBackground.Image}>Image</option>
										<option value={SceneBackground.ImageCustom}>Custom Image</option>
										{#if $statsScene === LiveStatsScene.InGame}
											<option value={SceneBackground.InGameImageStage}>Stage</option>
										{/if}
										{#if [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene)}
											<option value={SceneBackground.PostGameImageStage}>Stage</option>
										{/if}
									</Select>
								</div>
								{#if curScene.background.type === SceneBackground.Image}
									<div class="w-24">
										<Select bind:selected={curScene.background.image.src} label="Image">
											{#each imageOptions as image, i}
												<option selected={i === 0} value={image}>{image.split('.')[0]}</option>
											{/each}
										</Select>
									</div>
								{/if}
								{#if curScene.background.type === SceneBackground.ImageCustom}
									<div class="w-24">
										<FileUpload
											fileName={$statsScene}
											directory={'image'}
											label="Upload"
											acceptedExtensions={['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']}
											on:change={(event) => { curScene.background.customImage.name = event.detail; }}
										/>
									</div>
									<div class="w-24">
										<Select bind:selected={curScene.background.customImage.objectFit} label="Fit">
											<option selected value="cover">Cover</option>
											<option value="contain">Contain</option>
										</Select>
									</div>
								{/if}
								{#if curScene.background.type === SceneBackground.Color}
									<div class="w-24">
										<ColorInput bind:value={curScene.background.color} label="Color" />
									</div>
								{/if}
								{#if curScene.background.type !== SceneBackground.None}
									<div class="w-24">
										<NumberInput bind:value={curScene.background.opacity} label="Opacity" max={100} />
									</div>
								{/if}
							</div>

							{#key curScene.background}
								<div class="aspect-video w-[35vw] max-w-[500px] border-secondary bg-center" style={bgStyle} />
							{/key}

							{#if curScene.background.type !== SceneBackground.None}
								<div class="flex gap-4">
									<div>
										<p class="modal-label">Background in</p>
										<div class="w-48">
											<AnimationInput bind:animation={curScene.background.animation.in} />
										</div>
									</div>
									<div>
										<p class="modal-label">Background out</p>
										<div class="w-48">
											<AnimationInput bind:animation={curScene.background.animation.out} />
										</div>
									</div>
								</div>
							{/if}
						</div>

						<div>
							<p class="modal-label" use:tooltip={{ content: 'Delay between each layer rendering', placement: 'top-start', offset: 15, delay: [200, 0] }}>
								Layer render delay
							</p>
							<div class="w-48 mt-1">
								<NumberInput bind:value={curScene.animation.layerRenderDelay} max={SCENE_TRANSITION_DELAY} label="ms" />
							</div>
						</div>

						<div class="flex gap-4">
							<div>
								<p class="modal-label">Element in</p>
								<div class="w-48">
									<AnimationInput bind:animation={curScene.animation.in} isSceneElementAnimation={true} />
								</div>
							</div>
							<div>
								<p class="modal-label">Element out</p>
								<div class="w-48">
									<AnimationInput bind:animation={curScene.animation.out} isSceneElementAnimation={true} />
								</div>
							</div>
						</div>
					</div>
				{/key}
			</div>

		</div>
	</div>
</Modal>

<style>
	.modal-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.45;
		margin-bottom: 0.35rem;
	}
</style>
