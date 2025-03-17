<script lang="ts">
	import { page } from '$app/stores';

	$: setWidgetVisibility($page.url.pathname === '/');

	function setWidgetVisibility(visible: boolean) {
		const widget = document.getElementById('bmc-wbtn');
		if (widget) {
			widget.style.display = visible ? 'flex' : 'none';
		}
	}

	function updateWidgetPosition(isVertical: boolean) {
		const widget = document.getElementById('bmc-wbtn');
		if (widget) {
			widget.style.position = 'fixed';
			widget.style.bottom = isVertical ? '85px' : '18px';
			widget.style.right = isVertical ? '18px' : '85px';
		}
	}

	let innerWidth: number;
	let innerHeight: number;

	$: isVertical = innerWidth < innerHeight;

	$: updateWidgetPosition(isVertical);
</script>

<svelte:window bind:innerWidth bind:innerHeight />
