<script lang="ts">
	import FileToBase64Input from '$lib/components/input/FileToBase64Input.svelte';

	export let base64: string;

	const reset = () => {
		base64 = '';
	};
</script>

<div class="w-full flex gap-2 items-end justify-end">
	<div
		class="w-full items-center"
		data-tooltip="Set a temporary background image (Only visible if a background isn't already set)"
	>
		<FileToBase64Input
			bind:base64
			label="Background Image"
			acceptedExtensions={'.jpg, .jpeg, .png, .gif, .svg, .webp'}
		/>
	</div>
	<button
		class="col-start-7 transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-md whitespace-nowrap w-full h-10 px-2 xl:text-xl border border-white rounded"
		on:click={() => reset()}
	>
		Reset
	</button>
</div>
