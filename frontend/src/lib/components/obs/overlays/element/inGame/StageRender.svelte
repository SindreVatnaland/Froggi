<script lang="ts">
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import { getOffStageZone } from '$lib/utils/gamePredicates';
	import { gameFrame } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';

	export let stageId: number;

	const stage = STAGE_DATA[stageId];
	const offStageZone = getOffStageZone(stageId);
</script>

{#if !isNil(stage)}
	<rect
		x={stage.blastZones[0][0]}
		y={stage.blastZones[0][1]}
		width={stage.blastZones[1][0] - stage.blastZones[0][0]}
		height={stage.blastZones[1][1] - stage.blastZones[0][1]}
	/>
	<polyline points={stage.mainStage.join(' ')} />
	{#each stage.platforms as platform}
		<polyline points={platform.join(' ')} />
	{/each}
	{#if stage.getRandallPosition}
		<polyline points={stage?.getRandallPosition($gameFrame?.frame ?? 0)?.join(' ')} />
	{/if}

	{#if offStageZone}
		<rect
			class="opacity-50"
			x={offStageZone[0][0]}
			y={offStageZone[0][1]}
			width={offStageZone[1][0] - offStageZone[0][0]}
			height={offStageZone[1][1] - offStageZone[0][1]}
		/>
	{/if}
{/if}
