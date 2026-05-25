<script lang="ts">
	import type { GridContentItemStyle } from '$lib/models/types/overlay';
	import type { BingoSession } from '$lib/models/types/bingo';
	import BingoBoardGrid from '$lib/components/bingo/BingoBoardGrid.svelte';

	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let session: BingoSession | null;

	const PREVIEW_BOXES = Array.from({ length: 9 }, (_, i) => ({
		instanceId: `preview-${i}`,
		challengeId: 'kill_nair' as const,
		label: i === 4 ? 'Bingo' : 'Challenge',
		description: '',
		params: { difficulty: 'medium' as const, target: 1 },
		progress: i % 3 === 0 ? 1 : 0,
		target: 1,
		completed: i % 3 === 0,
		completedBy: i % 3 === 0 ? ('local' as const) : null,
		hasProgress: false,
	}));
</script>

<div class="bingo-wrap" style={style.cssValue}>
	{#if defaultPreview}
		<BingoBoardGrid boxes={PREVIEW_BOXES} size={3} role="solo" />
	{:else if session}
		<BingoBoardGrid
			boxes={session.board.boxes}
			size={session.board.size}
			role={session.role}
		/>
	{:else}
		<div class="bingo-idle">No active bingo session</div>
	{/if}
</div>

<style>
	.bingo-wrap {
		width: 100%;
		height: 100%;
	}

	.bingo-idle {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		opacity: 0.5;
		color: #fff;
	}
</style>
