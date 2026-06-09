<script lang="ts">
	import { onDestroy } from 'svelte';
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

	// ── Win tile-exit sweep ─────────────────────────────────────────────
	// The full-page overlays own a richer win-screen state machine; the board
	// element just needs the staggered tile exit so a win reads on-overlay.
	let exitingBoxIndices = new Set<number>();
	let isLocalWinner = false;
	let winTriggered = false;
	let prevBoardId: string | null = null;
	let exitTimers: ReturnType<typeof setTimeout>[] = [];

	function clearExitTimers() {
		exitTimers.forEach(clearTimeout);
		exitTimers = [];
	}

	function shuffleIndices(n: number): number[] {
		const arr = Array.from({ length: n }, (_, i) => i);
		for (let i = n - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function triggerWinExit(count: number) {
		const order = shuffleIndices(count);
		order.forEach((idx, step) => {
			exitTimers.push(
				setTimeout(() => {
					exitingBoxIndices = new Set([...exitingBoxIndices, idx]);
				}, Math.floor((step / count) * 900)),
			);
		});
	}

	// Reset the sweep whenever the board changes (new game / restart / cleared).
	$: {
		const boardId = session?.board?.id ?? null;
		if (boardId !== prevBoardId) {
			prevBoardId = boardId;
			clearExitTimers();
			winTriggered = false;
			exitingBoxIndices = new Set();
		}
	}

	// Fire the exit sweep on win.
	$: if (!defaultPreview && session?.board && !winTriggered && session.winState?.hasWon) {
		winTriggered = true;
		isLocalWinner = session.winState.localWinner;
		triggerWinExit(session.board.tiles.length);
	}

	onDestroy(clearExitTimers);
</script>

<div class="bingo-wrap" style={style.cssValue}>
	{#if defaultPreview}
		<BingoBoardGrid tiles={PREVIEW_BOXES} size={3} role="solo" />
	{:else if session}
		<BingoBoardGrid
			tiles={session.board.tiles}
			size={session.board.size}
			role={session.role}
			{exitingBoxIndices}
			{isLocalWinner}
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
