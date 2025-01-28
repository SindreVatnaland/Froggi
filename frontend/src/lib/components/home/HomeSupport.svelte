<script lang="ts">
	import { ConnectionState } from '$lib/models/enum';
	import { currentPlayer, dolphinState, electronEmitter } from '$lib/utils/store.svelte';

	const openUrl = (url: string) => {
		$electronEmitter.emit('OpenUrl', url);
	};
</script>

<div class="w-full flex flex-col justify-center items-center gap-2">
	<div class="w-full flex justify-evenly">
		<button
			class="flex flex-col items-center text-secondary-color w-48"
			on:click={() => openUrl('https://discord.gg/rX7aQmbrEa')}
		>
			<h2>Join Discord</h2>
			<img
				src="/image/icons/discord.png"
				class="h-10 w-10 aspect-square object-contain"
				alt="Discord"
			/>
		</button>

		<button
			class="flex flex-col items-center text-secondary-color w-48"
			on:click={() => openUrl('https://buymeacoffee.com/sindrevatnw')}
		>
			<h2>Buy Me A Coffee</h2>
			<img
				src="/image/icons/buy-me-a-coffee.webp"
				class="h-10 w-10 aspect-square object-contain border-secondary"
				alt="Buy me a coffee"
			/>
		</button>

		<button
			class="flex flex-col items-center text-secondary-color w-48"
			on:click={() => openUrl('https://github.com/SindreVatnaland/Froggi')}
		>
			<h2>Github</h2>
			<img
				src="/image/icons/github.webp"
				class="h-10 w-10 aspect-square object-contain border-secondary"
				alt="Buy me a coffee"
			/>
		</button>
	</div>
</div>
