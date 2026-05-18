<script lang="ts">
	import { newId } from '$lib/utils/helper';
	import { fly } from 'svelte/transition';

	export let menuItems = [
		{
			onClick: () => {
				console.log('here');
			},
			displayText: 'Settings',
		},
		{
			name: 'hr',
		},
		{
			onClick: () => {},
			displayText: 'Trash',
		},
	];

	let pos = { x: 0, y: 0 };
	let menu = { x: 0, y: 0, w: 0, h: 0 };
	let browser = { x: 0, y: 0, w: 0, h: 0 };
	let showMenu = false;

	const elementId = newId();

	function rightClickContextMenu(event: MouseEvent) {
		const isSpecificElement =
			event.target === document.getElementById(elementId) ||
			// @ts-ignore
			event?.target?.closest(`#${elementId}`);

		if (!isSpecificElement) return;
		event.preventDefault();

		showMenu = true;
		browser = {
			w: window.innerWidth,
			h: window.innerHeight,
			x: 0,
			y: 0,
		};
		pos = {
			x: event.clientX,
			y: event.clientY,
		};

		if (browser.h - pos.y < menu.h) pos.y = pos.y - menu.h;
		if (browser.w - pos.x < menu.w) pos.x = pos.x - menu.w;
	}
	function onPageClick(e: MouseEvent) {
		showMenu = false;
	}
	function getContextMenuDimension(node: HTMLElement) {
		let height = node.offsetHeight;
		let width = node.offsetWidth;
		menu = {
			h: height,
			w: width,
			x: 0,
			y: 0,
		};
	}
</script>

<div id={elementId} class="w-full h-full">
	<slot />
</div>

{#if showMenu}
	<nav
		use:getContextMenuDimension
		style="position: absolute; top:{pos.y}px; left:{pos.x}px"
		transition:fly={{ duration: 100, x: -20 }}
	>
		<div class="navbar" id="navbar">
			<ul>
				{#each menuItems as item}
					{#if item.name == 'hr'}
						<hr />
					{:else}
						<li>
							<button on:click={item.onClick} class="background-primary-color">
								<i />
								{item.displayText}
							</button>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	</nav>
{/if}

<svelte:window on:contextmenu={rightClickContextMenu} on:click={onPageClick} />

<style>
	* {
		padding: 0;
		margin: 0;
	}
	.navbar {
		position: fixed;
		z-index: 99999;
		display: inline-flex;
		border: 1px #999 solid;
		width: 170px;
		background-color: #fff;
		border-radius: 10px;
		overflow: hidden;
		flex-direction: column;
	}
	.navbar ul {
		margin: 6px;
	}
	ul li {
		display: block;
		list-style-type: none;
		width: 1fr;
	}
	ul li button {
		font-size: 1rem;
		color: #222;
		width: 100%;
		height: 30px;
		text-align: left;
		border: 0px;
		background-color: #fff;
	}
	ul li button:hover {
		color: #000;
		text-align: left;
		border-radius: 5px;
		background-color: #eee;
	}
	ul li button i {
		padding: 0px 15px 0px 10px;
	}

	:global(ul li button.info:hover) {
		color: navy;
	}
	hr {
		border: none;
		border-bottom: 1px solid #ccc;
		margin: 5px 0px;
	}
</style>
