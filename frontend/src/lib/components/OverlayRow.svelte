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
	/** When true, pulses the Popup button to attract attention */
	export let active: boolean = false;

	let showQr = false;
	let pulseKey = 0;

	$: resolvedQrUrl = qrUrl || url;
	$: if (active) pulseKey++;

	function popupUrl(u: string) {
		if (!u) return u;
		return u + (u.includes('?') ? '&' : '?') + 'popup=1';
	}
</script>

{#if url}
	<div class="overlay-row border-secondary">
		<div class="overlay-row-info">
			<span class="overlay-label">Display on device / OBS</span>
			<span class="overlay-url">{url}</span>
		</div>
		<div class="overlay-row-actions">
			{#key pulseKey}
				<button
					class="btn text-sm h-9 px-4 border-secondary rounded"
					class:popup-btn--active={active}
					on:click={() => window.open(popupUrl(url), '_blank', `width=${popupWidth},height=${popupHeight}`)}
				>Popup</button>
			{/key}
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

	@keyframes popup-attract {
		0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
		70%  { box-shadow: 0 0 0 7px rgba(255,255,255,0); }
		100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
	}

	.popup-btn--active {
		animation: popup-attract 1.1s ease-out 3;
	}
</style>
