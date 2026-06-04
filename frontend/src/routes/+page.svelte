<script lang="ts">
	import Home from '$lib/components/home/Home.svelte';
	import { navigating } from '$app/stores';
</script>

{#if !$navigating}
<main class="background-primary-color" style="height:100vh;overflow:hidden;">
	<Home />
</main>
{/if}
