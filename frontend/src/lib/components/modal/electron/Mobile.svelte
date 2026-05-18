<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { urls } from '$lib/utils/store.svelte';
	import QrCode from 'svelte-qrcode';
	import Clipboard from 'svelte-clipboard';
	import Modal from '../Modal.svelte';

	export let open: boolean;
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="w-[95vw] h-[350px] max-w-[624px] min-w-lg place-items-center bg-cover bg-center background-primary-color border-secondary"
	>
		<div class="h-full w-full grid grid-cols-2 p-4">
			<div class="col-span-1 flex flex-col items-center w-full h-full px-4 gap-2">
				<h1 class="text-secondary-color text-xl font-medium">
					Scan the QR code to open the app on your phone!
				</h1>
				<h1 class="text-secondary-color text-xl font-medium">
					Add page to the home screen to get the best mobile experience
				</h1>
				<h1 class="text-secondary-color text-md font-medium">
					Make sure to be connected to the same network
				</h1>
				<h1 class="text-secondary-color text-md font-medium">
					App might require a new scan if the local IP-address changes
				</h1>
			</div>
			<div
				class="col-span-1 place-items-center flex flex-col rounded-md text-center justify-center gap-2 h-full"
			>
				<div class="border-secondary" style="border-width: 0.125em">
					<QrCode value={$urls?.external} />
				</div>
				<div class="flex">
					<h1 class="text-secondary-color text-md font-medium underline">
						{$urls?.external}
					</h1>
					<Clipboard
						text={`${$urls?.external}`}
						let:copy
						on:copy={() => {
							notifications.success('Copied to clipboard!', 2000);
						}}
					>
						<button on:click={copy} class="w-5 h-5 invert transition">
							<img src="/image/button-icons/copy.png" alt="copy" />
						</button>
					</Clipboard>
				</div>
			</div>
		</div>
	</div>
</Modal>
