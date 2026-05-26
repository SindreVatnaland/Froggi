<script lang="ts">
	import ObsIntegration from '$lib/components/obs/ObsIntegration.svelte';
	// @ts-ignore
	import QrCode from 'svelte-qrcode';

	/** Local URL: used for Popup and ObsIntegration */
	export let url: string;
	/** QR URL: may differ (Tailscale vs local). Defaults to url. */
	export let qrUrl: string = '';
	export let title: string = 'Overlay';
	export let popupWidth: number = 600;
	export let popupHeight: number = 600;
	export let obsWidth: number = 500;
	export let obsHeight: number = 500;

	let showQr = false;

	$: resolvedQrUrl = qrUrl || url;
</script>

{#if url}
	<div class="overlay-row border-secondary">
		<div class="overlay-row-info">
			<span class="overlay-label">Display on device / OBS</span>
			<span class="overlay-url">{url}</span>
		</div>
		<div class="overlay-row-actions">
			<button
				class="btn text-sm h-9 px-4 border-secondary rounded"
				on:click={() => window.open(url, '_blank', `width=${popupWidth},height=${popupHeight}`)}
			>Popup</button>
			<ObsIntegration {url} {title} width={obsWidth} height={obsHeight} />
			<button
				class="btn text-sm h-9 px-4 border-secondary rounded"
				on:click={() => (showQr = !showQr)}
			>{showQr ? 'Hide QR' : 'QR'}</button>
		</div>
	</div>
	{#if showQr}
		<div class="qr-expand border-secondary">
			<QrCode value={resolvedQrUrl} size="180" color="#ffffff" background="#1a1a1a" />
			<div class="qr-text">
				<p class="qr-hint">Scan to open on your phone or second screen</p>
				<p class="qr-url">{resolvedQrUrl}</p>
				{#if resolvedQrUrl !== url}
					<p class="qr-note">⚠ Do not share this URL — use the ngrok link for opponents</p>
				{/if}
			</div>
		</div>
	{/if}
{/if}

<style>
	.overlay-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.9rem 1.1rem;
		border-radius: 0.375rem;
		flex-wrap: wrap;
	}

	.overlay-row-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.overlay-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.45;
		white-space: nowrap;
	}

	.overlay-url {
		font-size: 0.75rem;
		opacity: 0.6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.overlay-row-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.qr-expand {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		padding: 1rem 1.1rem;
		border-radius: 0.375rem;
	}

	.qr-text {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.qr-hint {
		font-size: 0.85rem;
		opacity: 0.6;
	}

	.qr-url {
		font-size: 0.72rem;
		opacity: 0.4;
		word-break: break-all;
	}

	.qr-note {
		font-size: 0.72rem;
		opacity: 0.4;
		margin-top: 0.25rem;
	}
</style>
