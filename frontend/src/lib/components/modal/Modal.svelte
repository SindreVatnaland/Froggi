<script lang="ts">
	import { isIframe, isMobile } from '$lib/utils/store.svelte';
	import { createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	export let open: boolean;
	export { _class as class };
	let _class: string;
	const dispatch = createEventDispatcher();

	function handleCloseClick() {
		dispatch('close');
	}

	function clickOutside(node: any) {
		const handleClick = (event: any) => {
			if (node && !node.contains(event.target) && !event.defaultPrevented) {
				node.dispatchEvent(new CustomEvent('click_outside', node));
			}
		};
		document.addEventListener('click', handleClick, true);
	}

	function modalAction(node: any) {
		let fns = [];
		if (document.body.style.overflow !== 'hidden') {
			const original = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			fns = [...fns, () => (document.body.style.overflow = original)];
		}
		return {
			destroy: () => fns.map((fn) => fn()),
		};
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleCloseClick();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if !$isIframe}
	{#if open}
		<div
			use:modalAction
			transition:fade={{ duration: 200 }}
			class="fixed inset-0 top-0 left-0 w-screen h-screen z-50 p-2"
			style={`${$isMobile ? 'padding-bottom: 8rem;' : ''}`}
		>
			<section>
				<aside
					in:fly={{ duration: 200, y: 100 }}
					out:fade={{ duration: 200 }}
					use:clickOutside
					on:click_outside={handleCloseClick}
					class={`flex justify-center items-center ${_class}`}
				>
					<div
						class="relative overflow-hidden flex justify-center items-center rounded-md"
					>
						<slot />
						<button
							class="top-2 right-2 w-6 h-6 absolute text-secondary-color text-xl transition delay-100 duration-200 hover:text-secondary-color"
							on:click={handleCloseClick}
						>
							X
						</button>
					</div>
				</aside>
			</section>
		</div>
	{/if}
{/if}

<style>
	section {
		height: 100%;
		display: grid;
		place-items: center;
	}
	aside {
		background-color: transparent;
	}
	div {
		background-color: rgba(0, 0, 0, 0.5);
	}

	/* .container {
		max-height: 80vh;
		max-width: 80vw;
	} */
</style>
