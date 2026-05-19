<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import { electronEmitter } from '$lib/utils/store.svelte';

	function importOverlay() {
		$electronEmitter.emit('OverlayUpload');
		open = false;
	}

	function createHorizontalOverlay() {
		$electronEmitter.emit('OverlayCreate', { width: 16, height: 9 });
		open = false;
	}

	function createVerticalOverlay() {
		$electronEmitter.emit('OverlayCreate', { width: 9, height: 16 });
		open = false;
	}

	export let open = false;
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div class="w-[420px] background-primary-color text-secondary-color border-secondary rounded-lg overflow-hidden flex flex-col">

		<!-- Header -->
		<div class="px-5 py-3 border-b border-secondary-color shrink-0">
			<p class="font-semibold text-sm">New Overlay</p>
		</div>

		<!-- Body -->
		<div class="p-5 flex flex-col gap-4">
			<div>
				<p class="modal-label">Aspect Ratio</p>
				<div class="flex gap-3 mt-2">
					<button class="ratio-card" on:click={createHorizontalOverlay}>
						<div class="ratio-preview" style="aspect-ratio: 16 / 9; width: 100%;" />
						<span class="ratio-label">Horizontal</span>
						<span class="ratio-sub">16:9</span>
					</button>
					<button class="ratio-card" on:click={createVerticalOverlay}>
						<div class="ratio-preview" style="aspect-ratio: 9 / 16; height: 80px;" />
						<span class="ratio-label">Vertical</span>
						<span class="ratio-sub">9:16</span>
					</button>
				</div>
			</div>

			<div class="border-t border-secondary-color pt-4">
				<p class="modal-label">Or</p>
				<button
					class="btn text-xs h-8 px-4 border-secondary rounded mt-2 w-full"
					on:click={importOverlay}
				>
					Import from file
				</button>
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
	}

	.ratio-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid var(--secondary-color);
		border-radius: 0.25rem;
		background: transparent;
		cursor: pointer;
		transition: background 0.15s;
		opacity: 0.8;
	}

	.ratio-card:hover {
		background: rgba(128, 128, 128, 0.08);
		opacity: 1;
	}

	.ratio-card:active {
		opacity: 0.5;
	}

	.ratio-preview {
		background: rgba(128, 128, 128, 0.15);
		border: 1px solid rgba(128, 128, 128, 0.2);
		border-radius: 0.125rem;
		max-width: 100%;
	}

	.ratio-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--secondary-color);
	}

	.ratio-sub {
		font-size: 0.7rem;
		opacity: 0.45;
		color: var(--secondary-color);
	}
</style>
