<script lang="ts">
	export let click = () => {};
	export let style: string = '';
	export let disabled: boolean = false;
</script>

<button
	{disabled}
	class={`transition  h-10 w-10 bg-inherit justify-center border-secondary rounded-2xl p-1 col-auto disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white`}
	style={`${style}; border-radius: 1rem`}
	on:click={click}
>
	<slot />
</button>
