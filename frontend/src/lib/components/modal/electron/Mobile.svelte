<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { urls } from '$lib/utils/store.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';
	// @ts-ignore
	import Clipboard from 'svelte-clipboard';
	import Modal from '../Modal.svelte';

	export let open: boolean;
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div class="w-[80vw] max-w-[700px] background-primary-color text-secondary-color border-secondary rounded-lg overflow-hidden flex flex-col">

		<!-- Header -->
		<div class="px-5 py-3 border-b border-secondary-color shrink-0">
			<p class="font-semibold text-sm">Mobile App</p>
		</div>

		<!-- Body -->
		<div class="flex divide-x divide-secondary-color">

			<!-- Left: instructions -->
			<div class="flex-1 p-5 flex flex-col gap-3">
				<div>
					<p class="modal-label">How to open</p>
					<ol class="mt-2 flex flex-col gap-1.5 text-xs opacity-75 list-decimal list-inside leading-relaxed">
						<li>Connect your phone to the <strong>same Wi-Fi</strong> network as this computer</li>
						<li>Scan the QR code with your phone camera</li>
						<li>Open the link in your browser</li>
						<li>Tap <strong>Add to Home Screen</strong> for the best experience</li>
					</ol>
				</div>
				<div class="mt-auto">
					<p class="text-xs opacity-35 leading-relaxed">
						The URL may change if your local IP address changes. Re-scan the QR code if the app stops working.
					</p>
				</div>
			</div>

			<!-- Right: QR + URL -->
			<div class="flex-1 p-5 flex flex-col items-center gap-3">
				<p class="modal-label w-full">Scan to open</p>
				<div class="border-secondary p-1 rounded-sm">
					<QrCode value={$urls?.external} size="160" />
				</div>
				<div class="flex items-center gap-2 rounded px-3 py-2 border-secondary w-full">
					<span class="text-xs font-mono flex-1 truncate opacity-60">{$urls?.external}</span>
					<Clipboard
						text={$urls?.external}
						let:copy
						on:copy={() => notifications.success('Copied!', 2000)}
					>
						<button on:click={copy} class="btn text-xs h-7 px-3 border-secondary rounded shrink-0">
							Copy
						</button>
					</Clipboard>
				</div>
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
</style>
