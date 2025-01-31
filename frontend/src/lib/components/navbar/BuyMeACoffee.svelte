<script lang="ts">
	import { electronEmitter } from '$lib/utils/store.svelte';
	import NavButton from './NavButton.svelte';

	let gifSrc = '/image/icons/buy-me-a-coffee.gif';

	const restartGif = () => {
		gifSrc = '';
		setTimeout(() => {
			gifSrc = '/image/icons/buy-me-a-coffee.gif';
		});
	};

	const openUrl = (url: string) => {
		$electronEmitter.emit('OpenUrl', url);
	};
</script>

<NavButton
	click={() => openUrl('https://buymeacoffee.com/sindrevatnw')}
	style="border-color: #FFDD00; background-color: #FFDD00;"
>
	<div class="image-container overflow-hidden" on:mouseenter={restartGif}>
		<img
			class="static object-contain scale-[0.80]"
			src="/image/icons/buy-me-a-coffee.png"
			alt="Buy me a coffee"
		/>
		{#key gifSrc}
			<img class="animated scale-[1.4]" src={gifSrc} alt="Buy me a coffee" />
		{/key}
	</div>
</NavButton>

<style>
	.image-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: inline-block;
	}

	.static,
	.animated {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transition: opacity 0.2s ease-in-out;
	}

	.animated {
		opacity: 0;
	}

	.image-container:hover .static {
		opacity: 0;
	}

	.image-container:hover .animated {
		opacity: 1;
	}
</style>
