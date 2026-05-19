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
	class="opacity-60 hover:opacity-100 duration-100 border-gray-800 top-4 justify-center rounded-2xl text-center align-middle z-50"
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
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:1.2rem;height:1.2rem;display:block;margin:auto;">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</NavButton>
	{/if}
</div>
