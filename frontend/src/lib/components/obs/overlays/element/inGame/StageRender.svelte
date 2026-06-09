<script lang="ts">
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import { getOffStageZone } from '$lib/utils/gamePredicates';
	import { gameFrame } from '$lib/utils/store.svelte';
	import { isNil } from 'lodash';

	export let stageId: number;
	/**
	 * Frame to read dynamic stage state from (FoD platform heights, Randall).
	 * Defaults to the live `gameFrame` store so the radar element keeps working
	 * unchanged; the viewer passes its own (live or demo) frame.
	 */
	export let frame:
		| {
				frame?: number | null;
				stageEvents?: { frame?: number | null; platform?: number | null; height?: number | null }[] | null;
		  }
		| null
		| undefined = undefined;

	$: stage = STAGE_DATA[stageId];
	$: offStageZone = getOffStageZone(stageId);
	$: effFrame = frame ?? $gameFrame;

	// ── Fountain of Dreams moving platforms ─────────────────────────────
	// stageEvents (FodPlatformType) are emitted only when a platform's height
	// changes, so accumulate the latest height per side. Event platform: 0 =
	// Right, 1 = Left. Render Y = gameHeight * 0.80625 (SlippiLab coefficient).
	const FOD_STAGE_ID = 2;
	const FOD_COEFF = 0.80625;
	const FOD_INIT_LEFT_Y = 16.125; // 20.0    * 0.80625
	const FOD_INIT_RIGHT_Y = 22.125; // 27.4419 * 0.80625
	let fodLeftY = FOD_INIT_LEFT_Y;
	let fodRightY = FOD_INIT_RIGHT_Y;
	let lastFodFrame: number | null = null;

	$: if (stageId === FOD_STAGE_ID && effFrame) {
		const fn = effFrame.frame ?? 0;
		// Reset on a new game / loop / backward scrub (accumulated heights would be stale).
		if (lastFodFrame === null || fn < lastFodFrame) {
			fodLeftY = FOD_INIT_LEFT_Y;
			fodRightY = FOD_INIT_RIGHT_Y;
		}
		lastFodFrame = fn;
		const events = (effFrame.stageEvents ?? []) as { platform?: number | null; height?: number | null }[];
		for (const ev of events) {
			if (ev && ev.height != null && ev.platform != null) {
				const y = ev.height * FOD_COEFF;
				if (ev.platform === 1) fodLeftY = y;
				else if (ev.platform === 0) fodRightY = y;
			}
		}
	}

	function setPlatformY(platform: string[], y: number): string[] {
		return platform.map((pt) => `${pt.split(',')[0].trim()}, ${y}`);
	}

	// FoD: override the two side-platform heights; top platform stays static.
	$: platforms = (() => {
		if (!stage?.platforms) return [];
		if (stageId !== FOD_STAGE_ID) return stage.platforms;
		const p = stage.platforms.map((pl) => [...pl]);
		if (p[0]) p[0] = setPlatformY(stage.platforms[0], fodLeftY);
		if (p[1]) p[1] = setPlatformY(stage.platforms[1], fodRightY);
		return p;
	})();
</script>

{#if !isNil(stage)}
	<rect
		x={stage.blastZones[0][0]}
		y={stage.blastZones[0][1]}
		width={stage.blastZones[1][0] - stage.blastZones[0][0]}
		height={stage.blastZones[1][1] - stage.blastZones[0][1]}
	/>
	<polyline points={stage.mainStage.join(' ')} />
	{#each platforms as platform}
		<polyline points={platform.join(' ')} />
	{/each}
	{#if stage.getRandallPosition}
		<polyline points={stage?.getRandallPosition(effFrame?.frame ?? 0)?.join(' ')} />
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
