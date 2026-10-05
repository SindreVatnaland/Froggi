<script lang="ts">
	import { electronEmitter, isElectron, overlays } from '$lib/utils/store.svelte';
	import Modal from '$lib/components/modal/Modal.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import OverlayPreviewScaled from '$lib/components/obs/overlays/preview/OverlayPreviewScaled.svelte';
	import type { Overlay } from '$lib/models/types/overlay';
	import { MODAL_CLOSE_MS } from '$lib/models/const';

	// Restored overlays stay mounted but hidden — see the overlays list page for why.
	$: all = Object.values($overlays ?? {}).sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
	$: deletedCount = all.filter((o) => o.deletedAt).length;

	let selected: Overlay | undefined = undefined;
	let confirmPermanentOpen = false;

	const formatDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString() : '');

	// Close the modal first, change the data after its close animation — see OverlayPreviewModal.
	const restore = () => {
		if (!selected) return;
		const id = selected.id;
		selected = undefined;
		setTimeout(() => $electronEmitter.emit('OverlayRestore', id), MODAL_CLOSE_MS);
	};

	const deletePermanently = () => {
		if (!selected) return;
		const id = selected.id;
		selected = undefined;
		setTimeout(() => $electronEmitter.emit('OverlayDeletePermanent', id), MODAL_CLOSE_MS);
	};
</script>

<main class="flex justify-center background-primary-color pb-16">
	<div class="w-full max-w-2xl">
		<div class="flex items-center gap-3 mb-5">
			<a class="btn text-sm h-8 px-3 border-secondary rounded flex items-center" href="/obs/overlay">← Back</a>
			<h1 class="text-xl font-semibold text-secondary-color">Deleted overlays</h1>
		</div>

		<div class="card-grid" style:display={deletedCount ? null : 'none'}>
			{#each all as overlay (overlay.id)}
				<button
					class="overlay-card"
					style:display={overlay.deletedAt ? null : 'none'}
					on:click={() => (selected = overlay)}
				>
						<div
							class="preview-frame border-secondary"
							style="aspect-ratio: {overlay.aspectRatio?.width ?? 16} / {overlay.aspectRatio?.height ?? 9};"
						>
							<OverlayPreviewScaled overlayId={overlay.id} />
						</div>
						<p class="card-title text-secondary-color">{overlay.title}</p>
						<p class="card-date text-secondary-color">Deleted {formatDate(overlay.deletedAt)}</p>
				</button>
			{/each}
		</div>
		{#if !deletedCount}
			<p class="text-secondary-color text-sm" style="opacity: 0.5">No deleted overlays.</p>
		{/if}
	</div>
</main>

<Modal open={!!selected} on:close={() => (selected = undefined)}>
	{#if selected}
		<div class="confirm-box background-primary-color border-secondary text-secondary-color">
			<p class="confirm-title">{selected.title}</p>
			<p class="card-date">Deleted {formatDate(selected.deletedAt)}</p>
			<div
				class="preview-frame border-secondary"
				style="aspect-ratio: {selected.aspectRatio?.width ?? 16} / {selected.aspectRatio?.height ?? 9};"
			>
				<OverlayPreviewScaled overlayId={selected.id} />
			</div>
			{#if $isElectron}
				<div class="confirm-actions">
					<button class="btn text-sm h-9 px-5 border-secondary rounded" on:click={() => (confirmPermanentOpen = true)}>
						Delete permanently
					</button>
					<button class="btn text-sm h-9 px-5 border-secondary rounded confirm-ok" on:click={restore}>
						Restore
					</button>
				</div>
			{/if}
		</div>
	{/if}
</Modal>

<ConfirmModal bind:open={confirmPermanentOpen} on:confirm={deletePermanently}>
	Permanently delete this overlay? This cannot be undone.
</ConfirmModal>

<style>
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.overlay-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		transition: transform 0.15s;
	}

	.overlay-card:hover {
		transform: scale(1.02);
	}

	.preview-frame {
		width: 100%;
		overflow: hidden;
		border-radius: 0.125rem;
		background: rgba(0, 0, 0, 0.08);
	}

	.card-title {
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-date {
		font-size: 0.7rem;
		opacity: 0.4;
	}

	.confirm-box {
		padding: 1.25rem 1.5rem;
		width: 400px;
		max-width: 90vw;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-radius: 0.25rem;
	}

	.confirm-title {
		font-size: 1rem;
		font-weight: 600;
	}

	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.confirm-ok {
		background: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
