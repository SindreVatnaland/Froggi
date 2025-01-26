<script lang="ts">
	export let label: string | undefined = undefined;

	export let opacity: boolean = false;
	export let valueConcat: string = '';

	export let value: string = valueConcat.length < 8 ? valueConcat : valueConcat.slice(0, -2);
	export let inputValue: number = parseInt(valueConcat.slice(-2), 16);

	const updateConcatValue = (value: string, sliderValue: number) => {
		valueConcat = String.format(`${value}${rgbToHex(sliderValue)}`, value);
	};
	$: updateConcatValue(value, inputValue);

	var rgbToHex = function (rgb: number) {
		var hex = Number(rgb).toString(16);
		if (hex.length < 2) {
			hex = '0' + hex;
		}
		return hex;
	};
</script>

{#if label}
	<h1 class="color-secondary text-sm font-medium">{label}</h1>
{/if}
<div class="w-full h-12 grid grid-flow-col gap-4 grid-cols-2">
	<input
		class="w-full h-11 rounded-md col-span-1 background-secondary-color"
		type="color"
		id="head"
		name="head"
		bind:value
	/>
	{#if opacity}
		<input
			class="w-full h-11 rounded-md col-span-1"
			type="range"
			id="head"
			name="head"
			min={0}
			max={255}
			bind:value={inputValue}
		/>
		<input
			class="w-full h-11 rounded-md col-span-1 background-primary-color border-secondary"
			type="number"
			id="head"
			name="head"
			min={0}
			max={255}
			bind:value={inputValue}
		/>
	{/if}
</div>
