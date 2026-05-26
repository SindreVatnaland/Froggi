<script lang="ts">
	import { page } from '$app/stores';
	import Modal from '$lib/components/modal/Modal.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { remoteAccess, urls } from '$lib/utils/store.svelte';
	import ObsIntegration from '$lib/components/obs/ObsIntegration.svelte';
	// @ts-ignore
	import Clipboard from 'svelte-clipboard';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';
	import { getOverlayById } from './OverlayHandler.svelte';

	export let overlayId: string = $page.params.overlay;
	$: localUrl = `${$urls?.local}/obs/overlay/${overlayId}`;
	$: externalUrl = `${$urls?.external}/obs/overlay/${overlayId}`;
	$: tsUrl = $remoteAccess.tailscale;

	let externalTab: 'local' | 'remote' = 'local';
	$: activeExternalUrl = externalTab === 'remote' && tsUrl ? `${tsUrl}/obs/overlay/${overlayId}` : externalUrl;

	let overlayTitle = '';
	let overlayAspectRatio: { width: number; height: number } = { width: 1920, height: 1080 };
	$: getOverlayById(overlayId).then(o => {
		if (!o) return;
		overlayTitle = o.title;
		overlayAspectRatio = o.aspectRatio;
	});

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

				<ObsIntegration url={localUrl} title={overlayTitle} width={overlayAspectRatio.width} height={overlayAspectRatio.height} cls="btn text-sm h-9 px-5 border-secondary rounded" />

				<p class="text-xs opacity-35">This URL only works on this device.</p>
			</div>

			<!-- Right: external / QR -->
			<div class="flex-1 p-5 flex flex-col gap-4 items-center min-w-0">
				<div class="w-full flex items-start justify-between gap-2">
					<div>
						<p class="embed-label">External devices</p>
						<p class="text-xs opacity-60 mt-1 leading-relaxed">
							{#if externalTab === 'remote' && tsUrl}
								Public URL via Tailscale — works from anywhere.
							{:else}
								Open on any device on the same network — phone, tablet, laptop, or second monitor.
							{/if}
						</p>
					</div>
					{#if tsUrl}
						<div class="tab-row shrink-0">
							<button class="tab-btn" class:tab-btn--active={externalTab === 'local'} on:click={() => externalTab = 'local'}>Local</button>
							<button class="tab-btn" class:tab-btn--active={externalTab === 'remote'} on:click={() => externalTab = 'remote'}>Public</button>
						</div>
					{/if}
				</div>

				<div class="border-secondary p-1 rounded-sm">
					<QrCode value={activeExternalUrl} size="180" />
				</div>

				<div class="flex items-center gap-2 rounded px-3 py-2 border-secondary w-full">
					<span class="text-xs font-mono flex-1 truncate opacity-60">{activeExternalUrl}</span>
					<Clipboard text={activeExternalUrl} let:copy on:copy={() => notifications.success('Copied!', 2000)}>
						<button on:click={copy} class="btn text-xs h-7 px-3 border-secondary rounded shrink-0">
							Copy
						</button>
					</Clipboard>
				</div>

				{#if externalTab === 'remote' && tsUrl}
					<p class="text-xs opacity-35">Tailscale keeps the URL stable — no need to re-scan if your IP changes.</p>
				{:else}
					<p class="text-xs opacity-35">Consider setting a static IP on this device for a stable URL.</p>
				{/if}
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

	.tab-row {
		display: flex;
		gap: 0.25rem;
		background: rgba(128,128,128,0.08);
		border-radius: 0.3rem;
		padding: 0.15rem;
	}

	.tab-btn {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: 0.2rem;
		border: none;
		background: transparent;
		color: var(--secondary-color);
		opacity: 0.45;
		cursor: pointer;
		transition: opacity 0.1s, background 0.1s;
	}

	.tab-btn--active {
		background: rgba(128,128,128,0.15);
		opacity: 1;
	}
</style>
