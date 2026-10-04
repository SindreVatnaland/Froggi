<script lang="ts">
	import FileToBase64Input from '$lib/components/input/FileToBase64Input.svelte';
	import { HUD_REFERENCES } from '$lib/content/hudReferences';

	export let base64: string;

	const reset = () => {
		base64 = '';
	};

	// Game screenshots (with the game's own HUD) as an editing backdrop — same files the AI assistant uses.
	const pickReference = (e: Event) => {
		const id = (e.currentTarget as HTMLSelectElement).value;
		const ref = HUD_REFERENCES.find((r) => r.id === id);
		if (ref) base64 = `/image/hud-references/${ref.image}`;
		(e.currentTarget as HTMLSelectElement).value = '';
	};
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex gap-1.5 items-end">
		<div class="flex-1 min-w-0">
			<FileToBase64Input
				compact
				buttonLabel="Add Background"
				bind:base64
				acceptedExtensions={'.jpg, .jpeg, .png, .gif, .svg, .webp'}
			/>
		</div>
		<button
			class="btn text-xs whitespace-nowrap h-7 px-3 border-secondary rounded"
			on:click={() => reset()}
		>
			Reset
		</button>
	</div>
	<select
		class="w-full h-7 px-2 text-xs rounded background-primary-color border-secondary text-secondary-color"
		on:change={pickReference}
	>
		<option value="">Game HUD background…</option>
		{#each HUD_REFERENCES as ref}
			<option value={ref.id}>{ref.title}</option>
		{/each}
	</select>
</div>
