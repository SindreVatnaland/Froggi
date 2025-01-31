<script lang="ts">
	import { ConnectionState } from '$lib/models/enum';
	import { tooltip } from 'svooltip';
	import { fly } from 'svelte/transition';

	export let connectionState: ConnectionState = ConnectionState.None;
	export let iconPath: string = '';
	export let style: string = '';
	export { _class as class };
	export let click = () => {};

	let _class: string;

	const getBorderStyle = (state: ConnectionState) => {
		switch (state) {
			case ConnectionState.Disconnected:
				return 'border: 1px solid red';
			case ConnectionState.Connected:
				return 'border: 1px solid green';
			case ConnectionState.Connecting:
				return 'border: 1px solid yellow';
			case ConnectionState.Searching:
				return 'border: 1px solid yellow';
			default:
				return 'border: 1px solid red';
		}
	};

	const getAnimation = (state: ConnectionState) => {
		switch (state) {
			case ConnectionState.Searching:
				return 'pulse';
			case ConnectionState.Connecting:
				return 'pulse';
			default:
				return '';
		}
	};
</script>

<div class="relative flex justify-end items-center">
	<button
		class={`transition w-full flex flex-col items-center justify-center hover:opacity-100 rounded-2xl text-center align-middle z-50 cursor-pointer dark:bg-white ${_class}`}
		style={`${style};`}
		transition:fly={{ duration: 150, x: -50 }}
		on:click={click}
		use:tooltip={{
			content: `<p>${connectionState}</p>`,
			html: true,
			placement: 'left',
			delay: [1000, 0],
			offset: 25,
		}}
	>
		<div class={`${getAnimation(connectionState)} w-full h-full`} />
		<button
			class={`h-10 w-10 bg-inherit justify-center rounded-2xl p-1 col-auto`}
			style={`${getBorderStyle(connectionState)};`}
		>
			<img src={iconPath} alt="connection status" />
		</button>
	</button>
</div>
