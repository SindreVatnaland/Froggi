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

	// Navbar is 4rem wide on each side. Pad content to avoid overlap.
	// Overlay pages fill the screen — no padding. Browser uses same sidebar width as Electron.
	$: navPadding = !$isOverlayPage
		? 'padding-left: 5rem; padding-right: 5rem;'
		: '';
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
		if ($isOverlayPage && !$isElectron) {
			document.body.style.backgroundColor = 'transparent';
		} else {
			document.body.style.backgroundColor = 'var(--primary-color)';
		}
	};

	$: $isOverlayPage, updateBackgroundColor();

	const setOverlayPage = (pathname: string) => {
		isOverlayPage.set(
			pathname.startsWith('/obs/overlay/') ||
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
	{#if !$isOverlayPage}<Navbar />{/if}
	<GlobalModal />
	<Toast />
	<BuyMeACoffeeEmbed />
	<div style={navPadding}>
		<slot />
	</div>
{:else if ready}
	<slot />
{/if}

<style>
	:root {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
</style>
