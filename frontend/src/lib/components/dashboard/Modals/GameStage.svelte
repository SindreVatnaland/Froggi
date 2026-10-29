<script lang="ts">
	import { type Stage } from '@slippi/slippi-js';

	export { _class as class };
	export let objectFit: 'contain' | 'cover' = 'contain';
	export let stageId: Stage | undefined | null;
	let _class: string;
</script>

<div class={`w-full h-full flex ${_class} overflow-hidden`}>
	<img
		class="w-full h-full aspect-video"
		style={`object-fit: ${objectFit};`}
		src={`/image/stages/${stageId}.png`}
		alt="stage"
	/>
</div>
