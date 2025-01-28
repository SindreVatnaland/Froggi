<script lang="ts">
	import NavButton from './NavButton.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { tooltip } from 'svooltip';

	$: route = $page.route.id;
	$: routeDepthArray = route?.split('/').slice(1) ?? [];
	$: routeDepth = routeDepthArray.length;
	$: prevRoute = `/${routeDepthArray.slice(0, -1).join('/')}`;
</script>

<div
	class="opacity-60 hover:opacity-100 border-gray-800 top-4 justify-center rounded-2xl text-center align-middle z-50"
	transition:fly={{ duration: 150, x: -50 }}
	use:tooltip={{
		content: `<p>Back</p>`,
		html: true,
		placement: 'right',
		delay: [1000, 0],
		offset: 25,
	}}
>
	{#if routeDepth > 1}
		<NavButton click={() => goto(prevRoute)}>
			<img src="/image/button-icons/left.png" alt="back" />
		</NavButton>
	{/if}
</div>
