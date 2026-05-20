<script lang="ts">
	import { page } from '$app/stores';
	import Modal from '$lib/components/modal/Modal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { electronEmitter, isElectron, obsConnection, obsProcessStatus, urls } from '$lib/utils/store.svelte';
	// @ts-ignore
	import Clipboard from 'svelte-clipboard';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';
	import { getOverlayById } from './OverlayHandler.svelte';
	import { ConnectionState } from '$lib/models/enum';

	export let overlayId: string = $page.params.overlay;
	$: localUrl = `${$urls?.local}/obs/overlay/${overlayId}`;
	$: externalUrl = `${$urls?.external}/obs/overlay/${overlayId}`;

	$: isObsConnected = $obsConnection?.state === ConnectionState.Connected;
	$: obsWebsocketDisabled = $obsProcessStatus?.running && $obsProcessStatus?.websocketEnabled === false;

	const addToObs = async () => {
		const overlay = await getOverlayById(overlayId);
		if (!overlay) return;
		$electronEmitter.emit('ObsCreateBrowserSource', localUrl, overlay.title, overlay.aspectRatio);
	};

	export let open: boolean;
</script>

<Modal bind:open on:close={() => (open = false)}>
	<div class="w-[80vw] max-w-[860px] background-primary-color text-secondary-color border-secondary rounded-lg overflow-hidden flex flex-col">

		<!-- Header -->
		<div class="px-5 py-3 border-b border-secondary-color shrink-0">
			<p class="font-semibold text-sm">Add to OBS</p>
		</div>

		<!-- Body: two columns -->
		<div class="flex divide-x divide-secondary-color min-h-0 overflow-y-auto" style="max-height: 80vh;">

			<!-- Left: local -->
			<div class="flex-1 p-5 flex flex-col gap-4 min-w-0">
				<div>
					<p class="embed-label">Local device</p>
					<p class="text-xs opacity-60 mt-1 leading-relaxed">
						Embed the overlay on this machine in OBS or any browser running on the same computer.
					</p>
				</div>

				<div>
					<p class="embed-label">OBS setup</p>
					<ol class="mt-2 flex flex-col gap-1.5 text-xs opacity-75 list-decimal list-inside leading-relaxed">
						<li>In OBS, click <strong>+</strong> in the <strong>Sources</strong> panel</li>
						<li>Select <strong>Browser Source</strong></li>
						<li>Paste the URL below into the <strong>URL</strong> field</li>
						<li>Set width <strong>1920</strong> × height <strong>1080</strong><br>
							<span class="opacity-60 pl-4">(or 1080 × 1920 for vertical overlays)</span>
						</li>
						<li>Click <strong>OK</strong></li>
					</ol>
				</div>

				<div class="flex items-center gap-2 rounded px-3 py-2 border-secondary">
					<span class="text-xs font-mono flex-1 truncate opacity-60">{localUrl}</span>
					<Clipboard text={localUrl} let:copy on:copy={() => notifications.success('Copied!', 2000)}>
						<button on:click={copy} class="btn text-xs h-7 px-3 border-secondary rounded shrink-0">
							Copy
						</button>
					</Clipboard>
				</div>

				{#if $isElectron && !isObsConnected}
				<button
					on:click={() => $electronEmitter.emit('ObsWebsocketEnable')}
					class="btn text-sm h-9 px-5 border-secondary rounded"
				>
					{obsWebsocketDisabled ? 'Enable OBS WebSocket' : 'Connect OBS'}
				</button>
				{:else}
				<button
					on:click={addToObs}
					disabled={!isObsConnected}
					class="btn text-sm h-9 px-5 border-secondary rounded disabled:opacity-40"
				>
					Add to OBS automatically
				</button>
				{/if}

				<p class="text-xs opacity-35">This URL only works on this device.</p>
			</div>

			<!-- Right: external / QR -->
			<div class="flex-1 p-5 flex flex-col gap-4 items-center min-w-0">
				<div class="w-full">
					<p class="embed-label">External devices</p>
					<p class="text-xs opacity-60 mt-1 leading-relaxed">
						Open on any device connected to the same network — phone, tablet, laptop, or second monitor.
					</p>
				</div>

				<div class="border-secondary p-1 rounded-sm">
					<QrCode value={externalUrl} size="180" />
				</div>

				<div class="flex items-center gap-2 rounded px-3 py-2 border-secondary w-full">
					<span class="text-xs font-mono flex-1 truncate opacity-60">{externalUrl}</span>
					<Clipboard text={externalUrl} let:copy on:copy={() => notifications.success('Copied!', 2000)}>
						<button on:click={copy} class="btn text-xs h-7 px-3 border-secondary rounded shrink-0">
							Copy
						</button>
					</Clipboard>
				</div>

				<p class="text-xs opacity-35">Consider setting a static IP on this device for a stable URL.</p>
			</div>
		</div>
	</div>
</Modal>

<style>
	.embed-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.45;
	}
</style>
