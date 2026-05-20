<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { isIframe } from '$lib/utils/store.svelte';

	let loaded = false;
	let interval: ReturnType<typeof setInterval>;
	let timeout: ReturnType<typeof setTimeout>;

	function getWidget(): HTMLElement | null {
		return document.getElementById('bmc-wbtn');
	}

	function setWidgetVisibility(visible: boolean) {
		const widget = getWidget();
		if (widget) widget.style.display = visible ? 'flex' : 'none';
	}

	function updateWidgetPosition(isVertical: boolean) {
		const widget = getWidget();
		if (!widget) return;
		widget.style.position = 'fixed';
		widget.style.bottom = isVertical ? '85px' : '18px';
		widget.style.right = isVertical ? '18px' : '85px';
	}

	let innerWidth: number;
	let innerHeight: number;
	$: isVertical = innerWidth < innerHeight;

	$: if (loaded) setWidgetVisibility($page.url.pathname === '/');
	$: if (loaded) updateWidgetPosition(isVertical);

	onMount(() => {
		if ($isIframe || $page.url.pathname.startsWith('/set/')) return;

		const script = document.createElement('script');
		script.setAttribute('data-name', 'BMC-Widget');
		script.setAttribute('data-cfasync', 'false');
		script.setAttribute('data-id', 'sindrevatnw');
		script.setAttribute('data-description', 'Support me on Buy me a coffee!');
		script.setAttribute('data-message', '');
		script.setAttribute('data-color', '#40DCA5');
		script.setAttribute('data-position', 'Right');
		script.setAttribute('data-x_margin', '18');
		script.setAttribute('data-y_margin', '18');
		script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
		document.head.appendChild(script);

		interval = setInterval(() => {
			if (getWidget()) {
				clearInterval(interval);
				loaded = true;
				setWidgetVisibility($page.url.pathname === '/');
				updateWidgetPosition(isVertical);
			}
		}, 100);

		timeout = setTimeout(() => clearInterval(interval), 10000);
	});

	onDestroy(() => {
		clearInterval(interval);
		clearTimeout(timeout);
		if (!$isIframe) setWidgetVisibility(false);
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />
