<script lang="ts">
	import '../app.css';
	import 'svooltip/styles.css';
	import '$lib/styles/fonts.css';
	import '$lib/styles/scrollbar.css';
	import '$lib/styles/styles.css';
	import '$lib/styles/tooltip.css';
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/navbar/Navbar.svelte';
	import {
		electronEmitter,
		isElectron,
		isEditPage,
		isOverlayPage,
		localEmitter,
		urls,
	} from '$lib/utils/store.svelte';

	// Hide the navbar (and its padding) for overlay pages and for direct/popup URLs
	// opened with ?nonav (e.g. the live-view popup window).
	$: nonav = $page.url.searchParams.has('nonav');
	$: chromeless = $isOverlayPage || nonav;
	// The .nav-pad class reserves room for the side navbars — but only in landscape,
	// where they exist. Portrait/mobile uses a floating Home button (no side bars),
	// so no horizontal padding there.
	import GlobalModal from '$lib/components/global/GlobalModal.svelte';
	import Toast from '$lib/components/notification/Toast.svelte';
	import { initClient } from '$lib/utils/init.svelte';
	import { page } from '$app/stores';
	import BuyMeACoffeeEmbed from '$lib/components/embeds/BuyMeACoffeeEmbed.svelte';

	let ready: boolean = false;

	$: hasWakeLockSupport = 'wakeLock' in navigator;

	onMount(async () => {
		await initClient();
		initWakeLock();
		ready = true;

		$localEmitter.setMaxListeners(100);
		$electronEmitter.setMaxListeners(100);
		return () => {
			$localEmitter.removeAllListeners();
			$electronEmitter.removeAllListeners();
		};
	});

	let wakeLock: WakeLockSentinel | null = null;

	const requestWakeLock = async () => {
		if (!hasWakeLockSupport || document.visibilityState !== 'visible') return;
		try {
			wakeLock = await navigator.wakeLock.request('screen');
		} catch {}
	};

	const updateBackgroundColor = () => {
		const transparentPage = $isOverlayPage && !$isElectron;
		document.body.style.backgroundColor = transparentPage ? 'transparent' : 'var(--primary-color)';
	};

	$: $isOverlayPage, updateBackgroundColor();

	const setOverlayPage = (pathname: string) => {
		isOverlayPage.set(
			pathname.startsWith('/obs/overlay/') ||
			pathname.startsWith('/obs/bingo/overlay') ||
			pathname.startsWith('/obs/game-preview') ||
			pathname.startsWith('/obs/opponent') ||
			pathname.startsWith('/live') ||
			pathname.startsWith('/set/p/') ||
			pathname.startsWith('/client/')
		);
		// Edit pages: any /obs/overlay/[id]/... that isn't a pure preview/inject
		isEditPage.set(
			/^\/obs\/overlay\/(?!inject)[^/]+/.test(pathname) &&
			!pathname.includes('/preview')
		);
	};
	$: setOverlayPage($page.url.pathname);

	const initWakeLock = () => {
		requestWakeLock();
		document.addEventListener('visibilitychange', requestWakeLock);
	};
</script>

{#if $isElectron}
	<div class="w-screen px-16">
		<div class="dragbar" />
	</div>
{/if}

{#if ready && $urls}
	{#if !chromeless}<Navbar />{/if}
	<GlobalModal />
	<Toast />
	<BuyMeACoffeeEmbed />
	<div class:nav-pad={!chromeless}>
		<slot />
	</div>
{:else if ready}
	<slot />
{:else}
	<!-- Initial connect (WS handshake / init data) — show progress instead of a blank screen. -->
	<div class="app-loading background-primary-color text-secondary-color">
		<img src="/icon.png" alt="Froggi" class="app-loading-icon" />
		<div class="app-loading-bar"><div class="app-loading-fill" /></div>
		<span class="app-loading-text">Connecting…</span>
	</div>
{/if}

<style>
	:root {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	/* Side navbars (and thus this padding) only exist in landscape. Portrait uses a
	   floating Home button, so don't waste horizontal space there. */
	@media (orientation: landscape) {
		.nav-pad {
			padding-left: 5rem;
			padding-right: 5rem;
		}
	}

	.app-loading {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
	.app-loading-icon { width: 64px; height: 64px; opacity: 0.9; }
	.app-loading-bar {
		width: min(60vw, 220px);
		height: 4px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--secondary-color) 20%, transparent);
		overflow: hidden;
	}
	.app-loading-fill {
		width: 40%;
		height: 100%;
		border-radius: 999px;
		background: var(--secondary-color);
		animation: app-loading-slide 1.1s ease-in-out infinite;
	}
	@keyframes app-loading-slide {
		0% { transform: translateX(-120%); }
		100% { transform: translateX(320%); }
	}
	.app-loading-text { font-size: 0.8rem; opacity: 0.5; }
</style>
