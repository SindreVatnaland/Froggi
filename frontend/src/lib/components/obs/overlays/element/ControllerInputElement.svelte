<script lang="ts">
	import { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;
	export let isButtonPressed: boolean | undefined;
	export let button: string | undefined;
</script>

<div
	class={`w-full h-full flex justify-center relative ${style.classValue}`}
	style={style.cssValue}
>
	<svg
		id="Layer_1"
		data-name="Layer 1"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 91 91"
		fill="red"
	>
		{#if isButtonPressed}
			<path
				d="M45.5,90C20.96,90,1,70.04,1,45.5S20.96,1,45.5,1s44.5,19.96,44.5,44.5-19.96,44.5-44.5,44.5ZM45.5,9.42c-19.89,0-36.08,16.19-36.08,36.08s16.19,36.08,36.08,36.08,36.08-16.19,36.08-36.08S65.39,9.42,45.5,9.42Z"
			/>
		{/if}
		<path
			d="M45.5,1.5c24.26,0,44,19.74,44,44s-19.74,44-44,44S1.5,69.76,1.5,45.5,21.24,1.5,45.5,1.5M45.5,82.08c20.17,0,36.58-16.41,36.58-36.58S65.67,8.92,45.5,8.92,8.92,25.33,8.92,45.5s16.41,36.58,36.58,36.58M45.5.5C20.65.5.5,20.65.5,45.5s20.15,45,45,45,45-20.15,45-45S70.35.5,45.5.5h0ZM45.5,81.08c-19.65,0-35.58-15.93-35.58-35.58S25.85,9.92,45.5,9.92s35.58,15.93,35.58,35.58-15.93,35.58-35.58,35.58h0Z"
		/>
	</svg>
</div>
