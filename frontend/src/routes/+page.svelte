<script lang="ts">
	import Home from '$lib/components/home/Home.svelte';
	import { fade } from 'svelte/transition';
</script>

<main
	class="w-screen h-screen background-primary-color"
	in:fade={{ delay: 50, duration: 150 }}
	out:fade={{ duration: 300 }}
>
	<Home />
</main>
