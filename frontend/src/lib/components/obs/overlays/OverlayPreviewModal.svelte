<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import NonInteractiveIFrame from './preview/NonInteractiveIFrame.svelte';
	import {
		urls,
		isElectron,
		statsScene,
		electronEmitter,
		dolphinState,
		injectedOverlays,
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
	import { tick } from 'svelte';

	export let open = false;
	export let overlay: Overlay | undefined;

	let deleteOverlayModalOpen = false;
	let isEmbedModalOpen = false;
	let editingName = false;
	let draftName = '';
	let nameInput: HTMLInputElement;

	$: isInjected = $injectedOverlays.includes(overlay?.id ?? '');
	$: url = $isElectron ? $urls?.local : $urls?.external;
	$: src = `${url}/obs/overlay/${overlay?.id}/layers`;
	$: if (overlay && !editingName) draftName = overlay.title ?? '';
	$: isVertical = (overlay?.aspectRatio?.height ?? 0) > (overlay?.aspectRatio?.width ?? 1);
	$: arW = overlay?.aspectRatio?.width ?? 16;
	$: arH = overlay?.aspectRatio?.height ?? 9;

	$: notifyDisabledScene(overlay?.id, $statsScene);

	function downloadOverlay() {
		if (!overlay) return;
		$electronEmitter.emit('OverlayDownload', overlay.id);
	}

	const createDuplicateOverlay = () => {
		if (!overlay) return;
		duplicateOverlay(overlay);
		open = false;
	};

	const injectOverlay = (overlayId: string | undefined) => {
		if (!overlayId) return;
		$electronEmitter.emit('InjectOverlay', overlayId);
	};

	const handleDelete = () => {
		deleteOverlay(overlay?.id);
		open = false;
	};

	const startEditName = async () => {
		if (!$isElectron || overlay?.isDemo) return;
		editingName = true;
		await tick();
		nameInput?.focus();
		nameInput?.select();
	};

	const commitName = () => {
		if (!overlay) { editingName = false; return; }
		const trimmed = draftName.trim();
		if (trimmed && trimmed !== overlay.title) {
			$electronEmitter.emit('OverlayUpdate', { ...overlay, title: trimmed });
		}
		editingName = false;
	};

	const onNameKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') commitName();
		if (e.key === 'Escape') { draftName = overlay?.title ?? ''; editingName = false; }
	};

	const availableClass =
		'btn text-sm px-5 h-9 border rounded border-secondary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
	const unavailableInfo =
		'Cannot perform this action on a demo overlay, try duplicating it first.';
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="modal-box w-[800px] max-w-[85vw] max-h-[85vh] overflow-y-auto flex flex-col gap-3 border-secondary rounded-md p-4 background-primary-color text-secondary-color"
	>
		<!-- Title / name editing -->
		<div class="flex items-center justify-center min-h-[2rem]">
			{#if editingName}
				<input
					bind:this={nameInput}
					class="name-input font-semibold text-lg text-center"
					bind:value={draftName}
					on:blur={commitName}
					on:keydown={onNameKeydown}
				/>
			{:else}
				<button
					class="name-btn font-semibold text-lg"
					class:name-btn--editable={$isElectron && !overlay?.isDemo}
					on:click={startEditName}
					title={$isElectron && !overlay?.isDemo ? 'Click to rename' : undefined}
				>
					{overlay?.title}
				</button>
			{/if}
		</div>

		<!-- Preview -->
		<div class="preview-wrap">
			<div
				class="preview-frame border-secondary"
				style="aspect-ratio: {arW}/{arH}; {isVertical ? 'height: min(55vh, 100%)' : 'width: 100%'};"
			>
				{#if url}
					<NonInteractiveIFrame
						{src}
						title="overlay"
						style="width: 100%; height: 100%;"
					/>
				{/if}
			</div>
		</div>

		<!-- Scene select -->
		<div class="shrink-0 flex justify-center"><SceneSelect /></div>

		<!-- Action buttons -->
		<div class="flex flex-wrap gap-2 max-w-full justify-center shrink-0">
			{#if $isElectron}
				<button
					class={availableClass}
					disabled={overlay?.isDemo}
					use:tooltip={overlay?.isDemo
						? { content: `<p>${unavailableInfo}</p>`, html: true, placement: 'top', delay: [250, 0], offset: 25 }
						: {}}
					on:click={() => goto(`/obs/overlay/${overlay?.id}`)}
				>
					Edit
				</button>
			{/if}
			{#if !$isElectron}
				<button class={availableClass} on:click={() => goto(`/obs/overlay/${overlay?.id}`)}>
					View
				</button>
			{/if}
			{#if $isElectron}
				<button class={availableClass} on:click={createDuplicateOverlay}>Duplicate</button>
			{/if}
			{#if $isElectron}
				<button class={availableClass} on:click={() => (isEmbedModalOpen = true)}>Embed</button>
			{/if}
			{#if $isElectron}
				<button
					class={availableClass}
					style={isInjected ? 'border: 2px solid green' : ''}
					disabled={$dolphinState !== ConnectionState.Connected}
					on:click={() => injectOverlay(overlay?.id)}
					use:tooltip={$dolphinState === ConnectionState.Connected
						? { content: `<p>Inject overlay to dolphin</p>`, html: true, placement: 'top', delay: [250, 0], offset: 25 }
						: { content: `<p>Dolphin needs to be running</p>`, html: true, placement: 'top', delay: [250, 0], offset: 25 }}
				>
					Inject
				</button>
			{/if}
			{#if $isElectron}
				<button
					class={availableClass}
					disabled={overlay?.isDemo}
					use:tooltip={overlay?.isDemo
						? { content: `<p>${unavailableInfo}</p>`, html: true, placement: 'top', delay: [250, 0], offset: 25 }
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
						? { content: `<p>${unavailableInfo}</p>`, html: true, placement: 'top', delay: [250, 0], offset: 25 }
						: {}}
					on:click={() => goto(`/obs/overlay/${overlay?.id}/layers/external`)}
				>
					Edit Preview
				</button>
			{/if}
			{#if $isElectron}
				<button
					disabled={overlay?.isDemo}
					class={availableClass}
					use:tooltip={overlay?.isDemo
						? { content: `<p>${unavailableInfo}</p>`, html: true, placement: 'top', delay: [250, 0], offset: 25 }
						: {}}
					on:click={() => (deleteOverlayModalOpen = true)}
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

<style>
	.modal-box {
		background-color: var(--primary-color);
	}

	.preview-wrap {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		overflow: hidden;
	}

	.preview-frame {
		max-width: 100%;
		max-height: 55vh;
		overflow: hidden;
	}

	.name-btn {
		background: transparent;
		border: none;
		color: var(--secondary-color);
		cursor: default;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.name-btn--editable {
		cursor: pointer;
	}

	.name-btn--editable:hover {
		background: rgba(128, 128, 128, 0.1);
	}

	.name-input {
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--secondary-color);
		color: var(--secondary-color);
		outline: none;
		padding: 0.25rem 0.5rem;
		width: 100%;
		max-width: 400px;
		text-align: center;
	}
</style>
