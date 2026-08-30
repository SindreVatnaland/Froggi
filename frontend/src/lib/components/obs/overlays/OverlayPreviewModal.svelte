<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import OverlayPreviewScaled from './preview/OverlayPreviewScaled.svelte';
	import {
		isElectron,
		statsScene,
		electronEmitter,
		dolphinState,
		injectedOverlays,
		autoInjectOverlays,
		froggiSettings,
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
	// "Toggled to inject" = in the persisted auto-inject set (survives Dolphin disconnect).
	$: isInjectToggled = $autoInjectOverlays.includes(overlay?.id ?? '');
	let autoInjectPromptOpen = false;
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
		// First time the user toggles an overlay ON, ask whether to auto-inject going forward.
		const turningOn = !$autoInjectOverlays.includes(overlayId);
		const neverAsked = $froggiSettings?.autoInjectEnabled === undefined;
		if (turningOn && neverAsked) {
			autoInjectPromptOpen = true;
			return;
		}
		$electronEmitter.emit('InjectOverlay', overlayId);
	};

	const resolveAutoInjectPrompt = (enable: boolean) => {
		$electronEmitter.emit('SetAutoInjectEnabled', enable);
		autoInjectPromptOpen = false;
		if (overlay?.id) $electronEmitter.emit('InjectOverlay', overlay.id);
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
				{#if overlay?.id}
					<OverlayPreviewScaled overlayId={overlay.id} />
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
					style={isInjectToggled ? 'border: 2px solid green' : ''}
					on:click={() => injectOverlay(overlay?.id)}
					use:tooltip={{
						content: isInjectToggled
							? `<p>Toggled to inject — click to turn off</p>`
							: $dolphinState === ConnectionState.Connected
								? `<p>Inject overlay to Dolphin</p>`
								: `<p>Toggle to inject — auto-injects when Dolphin connects</p>`,
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
	<Modal bind:open={autoInjectPromptOpen} on:close={() => (autoInjectPromptOpen = false)}>
		<div class="confirm-box background-primary-color border-secondary text-secondary-color">
			<p class="confirm-title">Auto-inject overlays?</p>
			<p class="confirm-body">
				Automatically inject your toggled overlays into Dolphin whenever it connects, so you don't
				have to inject them each session. You can turn this off any time in
				<strong>Settings → Overlay injection</strong>.
			</p>
			<div class="confirm-actions">
				<button class="btn text-sm h-9 px-5 border-secondary rounded" on:click={() => resolveAutoInjectPrompt(false)}>
					No, just this time
				</button>
				<button class="btn text-sm h-9 px-5 border-secondary rounded confirm-ok" on:click={() => resolveAutoInjectPrompt(true)}>
					Yes, auto-inject
				</button>
			</div>
		</div>
	</Modal>

	<ConfirmModal bind:open={deleteOverlayModalOpen} on:confirm={handleDelete}>
		Delete Overlay?
	</ConfirmModal>
	<EmbedModal overlayId={overlay?.id} bind:open={isEmbedModalOpen} />
</Modal>

<style>
	.modal-box {
		background-color: var(--primary-color);
	}

	.confirm-box {
		padding: 1.25rem 1.5rem;
		min-width: 260px;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-radius: 0.25rem;
	}
	.confirm-title {
		font-size: 1rem;
		font-weight: 600;
	}
	.confirm-body {
		font-size: 0.85rem;
		line-height: 1.5;
		opacity: 0.85;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
	.confirm-ok {
		background-color: var(--secondary-color);
		color: var(--primary-color);
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
