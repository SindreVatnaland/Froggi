<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import NonInteractiveIFrame from './preview/NonInteractiveIFrame.svelte';
	import {
		urls,
		isElectron,
		statsScene,
		isMobile,
		electronEmitter,
		dolphinState,
	} from '$lib/utils/store.svelte';
	import SceneSelect from './selector/SceneSelect.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import {
		deleteOverlay,
		duplicateOverlay,
		notifyDisabledScene,
	} from './edit/OverlayHandler.svelte';
	import { goto } from '$app/navigation';
	import type { Overlay } from '$lib/models/types/overlay';
	import EmbedModal from './edit/EmbedModal.svelte';
	import { tooltip } from 'svooltip';
	import { ConnectionState } from '$lib/models/enum';

	export let open = false;
	export let overlay: Overlay | undefined;

	let deleteOverlayModalOpen = false;
	let isEmbedModalOpen = false;

	$: url = $isElectron ? $urls?.local : $urls.external;
	$: src = `${url}/obs/overlay/${overlay?.id}/layers`;

	function downloadOverlay() {
		if (!overlay) return;
		$electronEmitter.emit('OverlayDownload', overlay.id);
	}

	const createDuplicateOverlay = () => {
		if (!overlay) return;
		duplicateOverlay(overlay);
		console.log('Duplicate');
		open = false;
	};

	const injectOverlay = (overlayId: string) => {
		$electronEmitter.emit('InjectOverlay', overlayId);
	};

	const handleDelete = () => {
		deleteOverlay(overlay?.id);
		open = false;
	};

	$: notifyDisabledScene(overlay?.id, $statsScene);

	const availableClass =
		'transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border border-white rounded w-36 h-20 my-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-secondary';
	const unavailableInfo =
		'Cannot perform this action on a demo overlay, try duplicating it first.';

	let parentDiv: HTMLElement | undefined;

	let previewSize = {
		width: 0,
		height: 0,
	};

	const handleResize = (parentDiv: any) => {
		previewSize = {
			height: parentDiv?.clientHeight ?? 0,
			width:
				(parentDiv?.clientHeight ?? 0) *
				((overlay?.aspectRatio?.width ?? 0) / (overlay?.aspectRatio?.height ?? 0)),
		};
	};

	$: handleResize(parentDiv);

	$: isVertical = (overlay?.aspectRatio?.height ?? 0) > (overlay?.aspectRatio?.width ?? 1);
</script>

<svelte:window on:resize={handleResize} />

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="h-[80vh] w-[800px] max-w-[80vw] overflow-y-auto items-center flex flex-col gap-4 justify-between bg-cover bg-center border-secondary rounded-md p-2 background-primary-color color-secondary"
	>
		<div>
			<h1 class="font-bold text-3xl">{overlay?.title}</h1>
		</div>
		<div
			class={`max-h-full max-w-full w-full h-full flex flex-1 justify-center items-start`}
			style={`aspect-ratio: ${overlay?.aspectRatio?.width}/${overlay?.aspectRatio?.height}`}
			bind:this={parentDiv}
		>
			{#if url && parentDiv}
				<div
					class={`border-secondary`}
					style={`${
						isVertical ? 'height: 100%' : 'width: 100%'
					}; max-height: 100%; max-width: 100%; aspect-ratio: ${
						overlay?.aspectRatio?.width
					}/${overlay?.aspectRatio?.height};`}
				>
					<NonInteractiveIFrame
						{src}
						title="overlay"
						style="width: 100%; height: 100%; object-fit: contain;"
					/>
				</div>
			{/if}
		</div>
		<SceneSelect />
		<div class="flex gap-2 max-w-full justify-center" style={`width: 100%;`}>
			{#if $isElectron}
				<button
					class={availableClass}
					disabled={overlay?.isDemo}
					use:tooltip={overlay?.isDemo
						? {
								content: `<p>${unavailableInfo}</p>`,
								html: true,
								placement: 'top',
								delay: [250, 0],
								offset: 25,
						  }
						: {}}
					on:click={() => {
						goto(`/obs/overlay/${overlay?.id}`);
					}}
				>
					Edit
				</button>
			{/if}
			{#if !$isElectron}
				<button
					class={availableClass}
					on:click={() => {
						goto(`/obs/overlay/${overlay?.id}`);
					}}
				>
					View
				</button>
			{/if}
			{#if $isElectron}
				<button class={availableClass} on:click={createDuplicateOverlay}>Duplicate</button>
			{/if}
			{#if $isElectron}
				<button class={availableClass} on:click={() => (isEmbedModalOpen = true)}>
					Embed
				</button>
			{/if}
			{#if $isElectron}
				<button
					class={availableClass}
					on:click={() => injectOverlay(overlay?.id)}
					use:tooltip={$dolphinState === ConnectionState.Connected
						? {
								content: `<p>Inject overlay to dolphin</p>`,
								html: true,
								placement: 'top',
								delay: [250, 0],
								offset: 25,
						  }
						: {
								content: `<p>Dolphin needs to be running</p>`,
								html: true,
								placement: 'top',
								delay: [250, 0],
								offset: 25,
						  }}
				>
					Inject
				</button>
			{/if}
			{#if $isElectron}
				<button
					class={availableClass}
					disabled={overlay?.isDemo}
					use:tooltip={overlay?.isDemo
						? {
								content: `<p>${unavailableInfo}</p>`,
								html: true,
								placement: 'top',
								delay: [250, 0],
								offset: 25,
						  }
						: {}}
					on:click={downloadOverlay}
				>
					Save
				</button>
			{/if}
			{#if !$isElectron}
				<button
					class={availableClass}
					disabled={overlay?.isDemo}
					use:tooltip={overlay?.isDemo
						? {
								content: `<p>${unavailableInfo}</p>`,
								html: true,
								placement: 'top',
								delay: [250, 0],
								offset: 25,
						  }
						: {}}
					on:click={() => {
						goto(`/obs/overlay/${overlay?.id}/layers/external`);
					}}
				>
					Edit Preview
				</button>
			{/if}
			{#if $isElectron}
				<button
					disabled={overlay?.isDemo}
					class={availableClass}
					use:tooltip={overlay?.isDemo
						? {
								content: `<p>${unavailableInfo}</p>`,
								html: true,
								placement: 'top',
								delay: [250, 0],
								offset: 25,
						  }
						: {}}
					on:click={() => {
						deleteOverlayModalOpen = true;
					}}
				>
					Delete
				</button>
			{/if}
		</div>
	</div>
	<ConfirmModal bind:open={deleteOverlayModalOpen} on:confirm={handleDelete}>
		Delete Overlay?
	</ConfirmModal>
	<EmbedModal overlayId={overlay?.id} bind:open={isEmbedModalOpen} />
</Modal>
