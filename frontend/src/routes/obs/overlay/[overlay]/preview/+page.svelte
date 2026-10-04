<script lang="ts">
	import SecondaryOverlay from '$lib/components/obs/overlays/SecondaryOverlay.svelte';
	import { page } from '$app/stores';
	import { LiveStatsScene } from '$lib/models/enum';

	// ?scene=inGame pins a scene (MCP preview links), otherwise it follows the live game state.
	$: scene = $page.url.searchParams.get('scene') as LiveStatsScene | null;
	$: sceneOverride = scene && Object.values(LiveStatsScene).includes(scene) ? scene : undefined;
</script>

<SecondaryOverlay preview={true} {sceneOverride} />
