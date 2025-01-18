<script lang="ts">
	import { page } from '$app/stores';
	import Modal from '$lib/components/modal/Modal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { urls } from '$lib/utils/store.svelte';
	//@ts-ignore
	import Clipboard from 'svelte-clipboard';
	//@ts-ignore
	import QrCode from 'svelte-qrcode';

	const overlayId = $page.params.overlay;
	$: localUrl = `${$urls?.local}/obs/overlay/${overlayId}/layers/external`;
	$: externalUrl = `${$urls?.external}/obs/overlay/${overlayId}/layers/external`;

	export let open: boolean = false;
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="w-[80vw] h-80 max-h-[80vh] max-w-[800px] flex rounded-lg bg-transparent m-0 bg-cover bg-center p-4 background-primary-color"
	>
		<div class="flex-1 flex flex-col justify-between items-center w-[80%]">
			<h1 class="text-xl font-medium color-secondary">Open Preview In New Window</h1>
			<a target="popup" href={`${localUrl}`} on:click={() => (open = false)}>
				<button
					class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap w-24 h-10 px-2 xl:text-xl border-secondary"
				>
					Popup
				</button>
			</a>
		</div>
		<div class="flex-1 flex flex-col justify-between items-center rounded-md">
			<h1 class="text-xl font-medium color-secondary">Open on external device</h1>
			<div class="border-secondary" style="border-width: 0.125em">
				<QrCode value={`${externalUrl}`} />
			</div>
			<Clipboard
				text={`${externalUrl}`}
				let:copy
				on:copy={() => {
					notifications.success('Copied to clipboard!', 2000);
				}}
			>
				<button
					on:click={copy}
					class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				>
					Copy external URL
				</button>
			</Clipboard>
		</div>
	</div>
</Modal>

<style>
	h1 {
		text-align: center;
	}
</style>
