<script lang="ts">
	import { electronEmitter, froggiSettings } from '$lib/utils/store.svelte';

	$: console.log($froggiSettings.version);
</script>

<div class="w-full flex justify-center">
	<h1>
		{$froggiSettings.version}
	</h1>
</div>
