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
		isOverlayPage,
		localEmitter,
		urls,
	} from '$lib/utils/store.svelte';
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

	const updateBackgroundColor = () => {
		if ($isOverlayPage && !$isElectron) {
			document.body.style.backgroundColor = 'transparent';
		} else {
			document.body.style.backgroundColor = 'var(--primary-color)';
		}
	};

	$: $isOverlayPage, updateBackgroundColor();

	const setOverlayPage = (pathname: string) => {
		isOverlayPage.set(pathname.startsWith('/obs/overlay/'));
	};
	$: setOverlayPage($page.url.pathname);

	const initWakeLock = () => {
		if (!hasWakeLockSupport) return;
		navigator.wakeLock.request();
	};
</script>

{#if $isElectron}
	<div class="w-screen px-16">
		<div class="dragbar" />
	</div>
{/if}

{#if ready && $urls}
	<Navbar />
	<GlobalModal />
	<Toast />
	<BuyMeACoffeeEmbed />
	<slot />
{/if}

<style>
	:root {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
</style>
