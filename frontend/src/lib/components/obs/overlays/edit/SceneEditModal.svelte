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
	import NonInteractiveIFrame from '../preview/NonInteractiveIFrame.svelte';

	export let open: boolean;
	export let overlay: Overlay;

	$: curScene = overlay[$statsScene];
	$: previewBackgroundType = curScene.background.type;

	$: url = $isElectron ? $urls?.local : $urls?.external;
	$: overlayPreviewSrc = `${url}/obs/overlay/${overlay.id}/layers`;

	const resourceUrl = $isElectron ? $urls.localResource : $urls.localResource;

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
</script>

<Modal bind:open class="rounded-lg" on:close={clear}>
	<div
		class="w-[80vw] h-[80vh] min-w-72 min-w-lg place-items-center bg-cover bg-center border-secondary background-primary-color"
	>
		<div class="w-full max-h-full h-full flex gap-8 p-4 justify-between">
			<div class="h-full flex flex-col justify-between">
				<div class="max-h-full h-full overflow-auto flex flex-col gap-4">
					<div>
						<h1 class="color-secondary text-2xl font-medium">Overlay:</h1>
						<div class="w-48 flex gap-2">
							<TextInput
								bind:value={overlay.title}
								label="Overlay title"
								bind:autofocus
								autoFocusValue={1}
							/>
						</div>
					</div>

					<div>
						<h1 class="text-2xl font-medium color-secondary">Scene:</h1>
						<div class="flex gap-8 justify-between">
							<h1 class="text-lg font-medium color-secondary w-[50%]">
								Active scenes
							</h1>
							<h1 class="text-lg font-medium color-secondary w-[50%]">Fallback</h1>
						</div>
						<SceneSelectOptions bind:overlay />
					</div>
				</div>
				<div class="w-48 flex items-end">
					<button
						class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-12 px-2 xl:text-xl border-secondary"
						on:click={handleUpdate}
					>
						Update
					</button>
				</div>
			</div>
			<div class="overflow-auto max-h-full w-full relative">
				{#key $statsScene}
					<div
						class="flex flex-col gap-4 w-full h-full absolute"
						out:fly={{ duration: 250, x: 150 }}
						in:fly={{ duration: 250, delay: 250, x: 150 }}
					>
						<div class="w-full">
							<h1 class="text-2xl font-medium">
								{$statsScene}:
							</h1>
						</div>
						<div class="w-full">
							<h1 class="text-2xl font-medium">Default Font:</h1>
							<FontSelectorLayer bind:font={curScene.font} fontId={$statsScene} />
						</div>

						<div class="flex flex-col gap-2">
							<h1 class="text-2xl font-medium">Background</h1>
							<div class="w-full flex gap-2">
								<div class="w-48">
									<Select bind:selected={curScene.background.type} label="Type">
										<option value={SceneBackground.None}>None</option>
										<option value={SceneBackground.Color}>Color</option>
										<option value={SceneBackground.Image}>Image</option>
										<option value={SceneBackground.ImageCustom}>
											Custom Image
										</option>
										{#if $statsScene === LiveStatsScene.InGame}
											<option value={SceneBackground.InGameImageStage}>
												Stage
											</option>
										{/if}
										{#if [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene)}
											<option value={SceneBackground.PostGameImageStage}>
												Stage
											</option>
										{/if}
									</Select>
								</div>
								{#if curScene.background.type === SceneBackground.Image}
									<div class="w-24">
										<Select
											bind:selected={curScene.background.image.src}
											label="Image"
										>
											{#each imageOptions as image, i}
												<option selected={i === 0} value={image}>
													{image.split('.')[0]}
												</option>
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
											acceptedExtensions={[
												'jpg',
												'jpeg',
												'png',
												'gif',
												'svg',
												'webp',
											]}
											on:change={(event) => {
												curScene.background.customImage.name = event.detail;
											}}
										/>
									</div>
									<div class="w-24">
										<Select
											bind:selected={curScene.background.customImage
												.objectFit}
											label="Object fit"
										>
											<option selected value="cover">Cover</option>
											<option value="contain">Contain</option>
										</Select>
									</div>
								{/if}
								{#if curScene.background.type === SceneBackground.Color}
									<div class="w-24">
										<ColorInput
											bind:value={curScene.background.color}
											label="Color"
										/>
									</div>
								{/if}
								{#if curScene.background.type !== SceneBackground.None}
									<div class="w-24">
										<NumberInput
											bind:value={curScene.background.opacity}
											label="Opacity"
											max={100}
										/>
									</div>
								{/if}
							</div>

							<div
								class="bg-center aspect-video w-[35vw] max-w-[600px] border-secondary"
								style={`
						${
							previewBackgroundType === SceneBackground.Color
								? `background: ${curScene.background.color};`
								: ''
						}
							${
								previewBackgroundType === SceneBackground.Image
									? `background-image: url('/image/backgrounds/${
											curScene.background.image.src
									  }');
									background-size: ${curScene.background.image.objectFit ?? 'cover'};`
									: ''
							}
									${
										previewBackgroundType === SceneBackground.ImageCustom
											? `background-image: url('${`${resourceUrl}/public/custom/${
													overlay.id
											  }/image/${encodeURI(
													curScene.background.customImage.name ?? '',
											  )}`}');
											background-size: ${curScene.background.customImage.objectFit};`
											: ''
									}
											${
												previewBackgroundType ===
												SceneBackground.InGameImageStage
													? `background-image: url('/image/stages/8.png');`
													: ''
											}
												${
													previewBackgroundType ===
													SceneBackground.PostGameImageStage
														? `background-image: url('/image/stages/8.png');`
														: ''
												}
													${curScene.background.opacity !== undefined ? `opacity: ${curScene.background.opacity / 100};` : ''}
													background-repeat: no-repeat;`}
							>
								<NonInteractiveIFrame
									src={overlayPreviewSrc}
									title="preview"
									class="w-full h-full"
								/>
							</div>

							{#if curScene.background.type !== SceneBackground.None}
								<div class="flex gap-4">
									<div class="max-w-full">
										<h1 class=" text-lg font-medium color-secondary">
											Background Transition - In
										</h1>
										<div class="w-48">
											<AnimationInput
												bind:animation={curScene.background.animation.in}
											/>
										</div>
									</div>
									<div class="max-w-full">
										<h1 class=" text-lg font-medium color-secondary">
											Background Transition - Out
										</h1>
										<div class="w-48">
											<AnimationInput
												bind:animation={curScene.background.animation.out}
											/>
										</div>
									</div>
								</div>
							{/if}
						</div>
						<div>
							<h1
								class=" text-2xl font-medium color-secondary"
								use:tooltip={{
									content: 'Delay between each layer rendering',
									placement: 'top-start',
									offset: 15,
									delay: [200, 0],
								}}
							>
								Layers Render Delay
							</h1>
							<div class="w-full flex gap-2">
								<div class="w-48">
									<NumberInput
										bind:value={curScene.animation.layerRenderDelay}
										max={SCENE_TRANSITION_DELAY}
										label="Delay"
									/>
								</div>
							</div>
						</div>
						<div class="flex gap-4">
							<div class="max-w-full">
								<h1 class=" text-lg font-medium color-secondary">
									Element Transition - In
								</h1>
								<div class="w-48">
									<AnimationInput
										bind:animation={curScene.animation.in}
										isSceneElementAnimation={true}
									/>
								</div>
							</div>
							<div class="max-w-full">
								<h1 class=" text-lg font-medium color-secondary">
									Element Transition - Out
								</h1>
								<div class="w-48">
									<AnimationInput
										bind:animation={curScene.animation.out}
										isSceneElementAnimation={true}
									/>
								</div>
							</div>
						</div>
					</div>
				{/key}
			</div>
		</div>
	</div>
</Modal>
