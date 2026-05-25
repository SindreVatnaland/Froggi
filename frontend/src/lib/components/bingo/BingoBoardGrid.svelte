<script lang="ts">
	import type { BingoBox } from '../../models/types/bingo';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { createEventDispatcher } from 'svelte';
	import { tooltip } from 'svooltip';

	export let boxes: BingoBox[];
	export let size: number;
	export let role: string = 'solo';
	export let localWinBoxes: Set<number> = new Set();
	export let oppWinBoxes: Set<number> = new Set();
	/** Enable dev-mode click halves (left = local, right = opponent) */
	export let devMode: boolean = false;
	/** Boxes currently playing their CSS exit animation */
	export let exitingBoxIndices: Set<number> = new Set();
	export let isLocalWinner: boolean = false;
	/** Play staggered entry scale animation when boxes mount */
	export let animateEntry: boolean = false;

	const dispatch = createEventDispatcher<{
		devsimulate: { instanceId: string; player: 'local' | 'opponent' };
	}>();

	const CHAR_FALLBACK: Record<number, number> = { 19: 18 };
	function charIconId(id: number): number { return CHAR_FALLBACK[id] ?? id; }

	function labelFontSize(label: string): string {
		const n = label.length;
		if (n <= 8)  return '1.15em';
		if (n <= 12) return '1.0em';
		if (n <= 16) return '0.88em';
		if (n <= 20) return '0.78em';
		if (n <= 26) return '0.68em';
		if (n <= 32) return '0.60em';
		return '0.54em';
	}

	function showProg(box: BingoBox): boolean {
		if (role === 'solo') return true;
		return box.completedBy !== 'opponent';
	}

	function pct(box: BingoBox): number {
		if (!box.hasProgress || box.target <= 0) return box.completed ? 100 : 0;
		return Math.min(100, (box.progress / box.target) * 100);
	}

	function handleClick(e: MouseEvent, instanceId: string) {
		if (!devMode) return;
		const el = e.currentTarget as HTMLElement;
		const player = e.offsetX < el.offsetWidth / 2 ? 'local' : 'opponent';
		dispatch('devsimulate', { instanceId, player });
	}
</script>

<div class="bingo-grid" style="--cols:{size}">
	{#each boxes as box, i (box.instanceId)}
		{@const isLocalW = localWinBoxes.has(i)}
		{@const isOppW = oppWinBoxes.has(i)}
		{@const isOpp = box.completedBy === 'opponent'}
		{@const isMine = box.completedBy === 'local'}
		{@const isBoth = box.completedBy === 'both'}
		{@const isExiting = exitingBoxIndices.has(i)}
		{@const sp = showProg(box)}
		{@const progPct = sp ? pct(box) : 0}
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div
			class="box"
			class:box--mine={isMine}
			class:box--opp={isOpp}
			class:box--both={isBoth}
			class:box--win-local={isLocalW && !isOppW}
			class:box--win-opp={isOppW && !isLocalW}
			class:box--win-both={isLocalW && isOppW}
			class:box--exit-fall={isExiting && !isLocalWinner}
			class:box--exit-rise={isExiting && isLocalWinner}
			class:box--dev={devMode}
			use:tooltip={{ content: box.description, placement: 'top', delay: [400, 0] }}
			on:click={(e) => handleClick(e, box.instanceId)}
			in:scale={animateEntry
				? { delay: i * 35, duration: 220, start: 0.3, easing: backOut }
				: { duration: 0 }}
		>
			{#if box.completed && !isExiting}
				<div class="box-pop" in:scale={{ duration: 280, start: 0.4, opacity: 0, easing: backOut }}></div>
			{/if}
			{#if sp && box.hasProgress && !box.completed}
				<div class="prog" style="width:{progPct}%"></div>
			{/if}
			<div class="box-inner">
				{#if box.challengeId === 'win_with_character' && box.params.characterId != null}
					<img
						src="/image/characters/css/{charIconId(box.params.characterId)}.png"
						alt=""
						class="char-icon"
					/>
				{/if}
				<span class="label" style="font-size:{labelFontSize(box.label)}">{box.label}</span>
			</div>
			{#if sp && box.hasProgress && !box.completed}
				<span class="sub">{box.progress}/{box.target}</span>
			{/if}
			{#if isOpp}
				<span class="opp-badge">✓</span>
			{/if}
			{#if devMode}
				<div class="dev-half dev-half--left"></div>
				<div class="dev-half dev-half--right"></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.bingo-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-auto-rows: 1fr;
		gap: var(--bingo-gap, 0.45rem);
		width: 100%;
		height: 100%;
	}

	.box {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: var(--bingo-radius, 0.375rem);
		background: rgba(0, 0, 0, 0.35);
		overflow: hidden;
		transition: background 0.25s;
		font-size: var(--bingo-font-size, 0.85rem);
	}

	/* ── Completion colors ── */
	.box--mine { background: rgba(96, 165, 250, 0.35); border-color: rgba(96, 165, 250, 0.5); }
	.box--opp  { background: rgba(52, 211, 153, 0.35); border-color: rgba(52, 211, 153, 0.5); }
	.box--both {
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.35) 50%, rgba(52, 211, 153, 0.35) 50%);
		border-color: rgba(255, 255, 255, 0.25);
	}

	/* ── Win row: layered on top of completion color ── */
	.box--win-local { border: 2px solid rgba(96, 165, 250, 0.95); background: rgba(96, 165, 250, 0.60); }
	.box--win-opp   { border: 2px solid rgba(52, 211, 153, 0.95); background: rgba(52, 211, 153, 0.60); }
	.box--win-both  { border: 2px solid rgba(255, 255, 255, 0.75); }

	/* both-completed box inside any win row keeps diagonal */
	.box--both.box--win-local,
	.box--both.box--win-opp,
	.box--both.box--win-both {
		background: linear-gradient(135deg, rgba(96, 165, 250, 0.58) 50%, rgba(52, 211, 153, 0.58) 50%);
	}

	/* ── Exit animations ── */
	@keyframes box-fall {
		0%   { opacity: 1; transform: translateY(0) scale(1); }
		100% { opacity: 0; transform: translateY(120px) scale(0.6); }
	}
	@keyframes box-rise {
		0%   { opacity: 1; transform: translateY(0) scale(1); }
		100% { opacity: 0; transform: translateY(-120px) scale(0.6); }
	}
	.box--exit-fall { animation: box-fall 0.35s ease-in forwards; }
	.box--exit-rise { animation: box-rise 0.35s ease-in forwards; }

	.box-pop {
		position: absolute;
		inset: 0;
		border-radius: var(--bingo-radius, 0.375rem);
		background: rgba(255, 255, 255, 0.3);
		pointer-events: none;
		z-index: 2;
	}

	.prog {
		position: absolute;
		bottom: 0;
		left: 0;
		height: var(--bingo-prog-h, 3px);
		background: rgba(255, 255, 255, 0.5);
		transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
	}

	.box-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15em;
		padding: 0.2em 0.25em;
		z-index: 1;
		width: 100%;
	}

	.char-icon {
		width: var(--bingo-char-size, 28px);
		height: var(--bingo-char-size, 28px);
		object-fit: contain;
		image-rendering: pixelated;
	}

	.label {
		color: #fff;
		font-weight: 600;
		text-align: center;
		line-height: 1.2;
		overflow-wrap: break-word;
		hyphens: none;
		font-family: sans-serif;
	}

	.sub {
		position: absolute;
		bottom: 3px;
		left: 0;
		right: 0;
		text-align: center;
		font-size: var(--bingo-sub-size, 0.6rem);
		font-weight: 600;
		color: rgba(255, 255, 255, 0.75);
		font-family: sans-serif;
	}

	.opp-badge {
		position: absolute;
		top: 2px;
		right: 4px;
		font-size: var(--bingo-badge-size, 0.65rem);
		color: rgba(52, 211, 153, 0.9);
	}

	/* ── Dev mode click hints ── */
	.box--dev { cursor: pointer; }

	.dev-half {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 50%;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.12s;
		z-index: 3;
	}
	.dev-half--left  { left: 0; }
	.dev-half--right { right: 0; }

	.box--dev:hover .dev-half--left  { background: rgba(96, 165, 250, 0.25); opacity: 1; }
	.box--dev:hover .dev-half--right { background: rgba(52, 211, 153, 0.25); opacity: 1; }
</style>
