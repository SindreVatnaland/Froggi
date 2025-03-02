<script lang="ts">
	import { page } from '$app/stores';
	import Modal from '$lib/components/modal/Modal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { electronEmitter, obsConnection, urls } from '$lib/utils/store.svelte';
	// @ts-ignore
	import Clipboard from 'svelte-clipboard';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';
	import { getOverlayById } from './OverlayHandler.svelte';
	import { tooltip } from 'svooltip';
	import { ConnectionState } from '$lib/models/enum';

	export let overlayId: string = $page.params.overlay;
	$: localUrl = `${$urls?.local}/obs/overlay/${overlayId}`;
	$: externalUrl = `${$urls?.external}/obs/overlay/${overlayId}`;

	$: isObsConnected = $obsConnection?.state === ConnectionState.Connected;

	const addToObs = async () => {
		const overlay = await getOverlayById(overlayId);
		if (!overlay) return;
		$electronEmitter.emit(
			'ObsCreateBrowserSource',
			localUrl,
			overlay.title,
			overlay.aspectRatio,
		);
	};

	export let open: boolean;
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div
		class="w-[80vw] h-[80vh] max-h-[600px] min-w-72 overflow-y-auto flex rounded-lg bg-transparent m-0 bg-cover bg-center p-8 gap-16 justify-between background-primary-color"
	>
		<div class="rounded-md flex flex-col justify-between items-center gap-4 w-[50%]">
			<div class="flex flex-col w-full">
				<h1 class="color-secondary font-medium text-2xl w-full">Embed on local devices</h1>
				<h1 class="color-secondary text-md font-medium w-full">
					This is a local URL and could be used to embed the overlay on <b>this</b>
					device. Paste it in the Web Browser or Embed it to local applications such as OBS.
				</h1>
			</div>
			<div class="flex flex-col w-full gap-2">
				<div class="flex gap-2 items-center">
					<div class="flex-1">
						<img
							src="/image/example-images/obs-add-browser.png"
							alt="obs-add-browser"
						/>
					</div>

					<div class="flex-1">
						<img
							src="/image/example-images/obs-browser-src.png"
							alt="obs-browser-src"
						/>
					</div>
				</div>
				<h1 class="color-secondary text-md font-medium text-start w-full">
					Embed to OBS by adding a new browser source and insert the URL.
				</h1>
				<h1 class="color-secondary text-md font-medium text-start w-full">
					Use a resolution of 1920x1080 resolution if the overlay is horizontal. Otherwise
					use 1080x1920.
				</h1>

				<div class="flex justify-center">
					<h1 class="color-secondary text-md font-medium underline">
						{localUrl}
					</h1>
					<Clipboard
						text={`${localUrl}`}
						let:copy
						on:copy={() => {
							notifications.success('Copied to clipboard!', 2000);
						}}
					>
						<button on:click={copy} class="w-5 h-5 invert transition">
							<img
								src="/image/button-icons/copy.png"
								class="invert dark:invert-0"
								alt="copy"
							/>
						</button>
					</Clipboard>
				</div>
				<Clipboard
					text={localUrl}
					let:copy
					on:copy={() => {
						notifications.success('Copied to clipboard!', 2000);
					}}
				>
					<button
						on:click={copy}
						class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
					>
						Copy local URL
					</button>
				</Clipboard>
				<button
					on:click={addToObs}
					use:tooltip={isObsConnected
						? {}
						: {
								content: `<p>OBS Websockets needs to be connected</p> <p>OBS: Tools -> Websocket Server Settings -> Enable Websocket Server</p>`,
								html: true,
								placement: 'top',
								delay: [250, 0],
								offset: 25,
						  }}
					disabled={!isObsConnected}
					class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary disabled:opacity-50"
				>
					Add to OBS
				</button>
			</div>
			<h1 class="color-secondary text-md font-medium w-full">
				This URL can only be used on the current local device.
			</h1>
		</div>
		<div
			class="place-items-center rounded-md flex flex-col justify-between items-center gap-4 w-[50%]"
		>
			<div class="flex flex-col justify-center items-center">
				<h1 class="font-medium text-2xl w-full color-secondary">
					Embed on external devices
				</h1>
				<h1 class="color-secondary text-md font-medium w-full">
					This is an external URL and can be opened on any device connected to the same
					local network.
				</h1>
				<h1 class="color-secondary text-md font-medium w-full">
					Mobile/Tablets/Laptops/Projectors
				</h1>
			</div>
			<div class="border-secondary" style="border-width: 0.125em">
				<QrCode value={`${externalUrl}`} />
			</div>

			<div class="flex">
				<h1 class="color-secondary text-md font-medium underline w-full">
					{externalUrl}
				</h1>
				<Clipboard
					text={`${externalUrl}`}
					let:copy
					on:copy={() => {
						notifications.success('Copied to clipboard!', 2000);
					}}
				>
					<button on:click={copy} class="w-5 h-5 invert transition">
						<img
							src="/image/button-icons/copy.png"
							class="invert dark:invert-0"
							alt="copy"
						/>
					</button>
				</Clipboard>
			</div>
			<Clipboard
				text={externalUrl}
				let:copy
				on:copy={() => {
					notifications.success('Copied to clipboard!', 2000);
				}}
			>
				<button
					on:click={copy}
					class="w-full transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border-secondary"
				>
					Copy external URL
				</button>
			</Clipboard>
			<h1 class="color-secondary text-md font-medium w-full">
				Consider setting a static local ip-address on this device.
			</h1>
		</div>
	</div>
</Modal>

<style>
</style>
