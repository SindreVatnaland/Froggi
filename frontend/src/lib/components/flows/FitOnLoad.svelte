<script lang="ts">
	// Zoom the canvas to the whole flow once the nodes have been measured (the fitView prop can run
	// before the custom nodes have a size, leaving nodes off-screen).
	import { onMount } from 'svelte';
	import { useNodesInitialized, useSvelteFlow } from '@xyflow/svelte';

	const { fitView } = useSvelteFlow();
	const initialized = useNodesInitialized();
	let done = false;
	$: if ($initialized && !done) {
		done = true;
		setTimeout(() => fitView({ padding: 0.25 }), 0);
	}
	onMount(() => setTimeout(() => fitView({ padding: 0.25 }), 150));
</script>
