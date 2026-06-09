<script lang="ts">
	/**
	 * Share the live game view (/live). Both options expose a PUBLIC link (Tailscale
	 * Funnel / ngrok) — viewers don't install anything, they just open the URL:
	 *  - Tailscale Funnel: permanent, stable public URL.
	 *  - ngrok: temporary public URL (expires when ngrok stops).
	 * Viewers only watch; sending commands still needs the host password.
	 */
	import { remoteAccess, urls } from '$lib/utils/store.svelte';
	import { Radio } from 'lucide-svelte';
	// @ts-ignore - no types
	import QrCode from 'svelte-qrcode';

	const PATH = '/live';
	const join = (base: string | undefined) => (base ? base.replace(/\/$/, '') + PATH : '');

	$: tailscaleUrl = join($remoteAccess?.tailscale);
	$: ngrokUrl = join($remoteAccess?.ngrok);
	$: localUrl = join($urls?.local);
	// QR points at the permanent (Tailscale Funnel) link when available.
	$: qrUrl = tailscaleUrl || ngrokUrl || localUrl;
	$: qrKind = tailscaleUrl ? 'Tailscale' : ngrokUrl ? 'ngrok' : 'Local';
	$: qrNote = tailscaleUrl ? 'Permanent public link' : ngrokUrl ? 'Temporary public link' : 'Same network only';

	let copied = '';
	async function copy(url: string, id: string) {
		if (!url) return;
		await navigator.clipboard.writeText(url);
		copied = id;
		setTimeout(() => (copied = ''), 1500);
	}
	const open = (url: string) => url && window.open(url, '_blank');
</script>

<div class="share-card border-secondary flex flex-col gap-3">
	<div class="share-head">
		<Radio size={16} strokeWidth={2} />
		<span class="share-title">Share live game</span>
	</div>

	<!-- Permanent (Tailscale Funnel) + QR -->
	<div class="primary-row">
		<div class="link-block primary-block">
			<div class="link-head">
				<span class="link-title">Permanent link · Tailscale</span>
				<span class="link-tag link-tag--perm">Permanent</span>
			</div>
			<p class="link-desc">Stable public link — nothing to install. Best for a link you reuse.</p>
			{#if tailscaleUrl}
				<div class="link-row">
					<span class="link-url">{tailscaleUrl}</span>
					<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => copy(tailscaleUrl, 'ts')}>{copied === 'ts' ? 'Copied' : 'Copy'}</button>
					<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => open(tailscaleUrl)}>Open</button>
				</div>
			{:else}
				<span class="link-empty">Enable Tailscale Funnel in Settings → Remote Access.</span>
			{/if}
		</div>

		{#if qrUrl}
			<div class="qr-wrap">
				<QrCode value={qrUrl} size="104" color="#0b0e13" background="#ffffff" />
				<span class="qr-label">Scan · {qrKind}</span>
				<span class="qr-note">{qrNote}</span>
			</div>
		{/if}
	</div>

	<!-- Temporary (ngrok) -->
	<div class="link-block">
		<div class="link-head">
			<span class="link-title">Temporary link · ngrok</span>
			<span class="link-tag link-tag--temp">Temporary</span>
		</div>
		<p class="link-desc">Temporary public link — stops when you close ngrok.</p>
		{#if ngrokUrl}
			<div class="link-row">
				<span class="link-url">{ngrokUrl}</span>
				<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => copy(ngrokUrl, 'ng')}>{copied === 'ng' ? 'Copied' : 'Copy'}</button>
				<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => open(ngrokUrl)}>Open</button>
			</div>
		{:else}
			<span class="link-empty">Start ngrok in Settings → Remote Access.</span>
		{/if}
	</div>

	<p class="link-foot">Anyone with a link can <strong>watch</strong>. Controlling Froggi still needs the host password.</p>
</div>

<style>
	.share-card { padding: 1rem 1.1rem; }
	.share-head { display: flex; align-items: center; gap: 0.5rem; opacity: 0.85; }
	.share-title { font-size: 0.95rem; font-weight: 700; }

	.primary-row { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: stretch; }
	.primary-block { flex: 1; min-width: 15rem; }

	.link-block {
		display: flex; flex-direction: column; gap: 0.4rem;
		padding: 0.7rem 0.8rem; border-radius: 0.45rem;
		background: rgba(255, 255, 255, 0.025);
	}
	.link-head { display: flex; align-items: center; gap: 0.5rem; }
	.link-title { font-size: 0.85rem; font-weight: 600; }
	.link-tag { font-size: 0.58rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.08rem 0.45rem; border-radius: 1rem; margin-left: auto; }
	.link-tag--perm { background: color-mix(in srgb, #4ade80 18%, transparent); color: #4ade80; }
	.link-tag--temp { background: color-mix(in srgb, #f59e0b 18%, transparent); color: #f59e0b; }
	.link-desc { font-size: 0.7rem; opacity: 0.45; line-height: 1.4; }
	.link-row {
		display: flex; align-items: center; gap: 0.35rem;
		padding: 0.3rem 0.3rem 0.3rem 0.6rem; border-radius: 0.35rem;
		background: rgba(0, 0, 0, 0.25); border: 1px solid color-mix(in srgb, var(--secondary-color) 18%, transparent);
	}
	.link-url { flex: 1; min-width: 0; font-family: monospace; font-size: 0.72rem; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.link-empty { font-size: 0.72rem; opacity: 0.4; font-style: italic; }
	.link-foot { font-size: 0.68rem; opacity: 0.4; }
	.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; background: #fff; padding: 0.55rem; border-radius: 0.5rem; }
	.qr-label { font-size: 0.6rem; font-weight: 700; color: #0b0e13; text-transform: uppercase; letter-spacing: 0.05em; }
	.qr-note { font-size: 0.55rem; color: #0b0e13; opacity: 0.6; text-align: center; max-width: 8rem; }
</style>
