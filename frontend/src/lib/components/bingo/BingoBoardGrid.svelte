<script lang="ts">
	import type { BingoBox } from '../../models/types/bingo';
	import { bingoShuffleDelays } from '$lib/utils/store.svelte';
	import { scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut, backOut } from 'svelte/easing';
	import { createEventDispatcher, onDestroy, afterUpdate } from 'svelte';
	import { tooltip } from 'svooltip';

	import type { BingoControlledLine } from '../../models/types/bingo';

	export let boxes: BingoBox[];
	export let size: number;
	export let role: string = 'solo';
	export let localWinBoxes: Set<number> = new Set();
	export let oppWinBoxes: Set<number> = new Set();
	/** Controlled rows/cols for rowcontrol mode (renders border overlay instead of per-tile highlight) */
	export let localControlledLines: BingoControlledLine[] = [];
	export let oppControlledLines: BingoControlledLine[] = [];
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
		if (n <= 8)  return '1.35em';
		if (n <= 13) return '1.22em';
		if (n <= 18) return '1.1em';
		if (n <= 24) return '1.0em';
		if (n <= 30) return '0.93em';
		if (n <= 38) return '0.86em';
		if (n <= 46) return '0.78em';
		return '0.70em';
	}

	function charLabelPrefix(label: string): string {
		const idx = label.lastIndexOf(' as ');
		if (idx >= 0) return label.slice(0, idx) + ' as';
		return label;
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

	// Frozen countdown — reactive on both boxes and now
	let now = Date.now();
	let clockInterval: ReturnType<typeof setInterval> | null = null;
	$: hasFrozen = boxes.some(b => b.frozen && b.frozenUntil);
	$: if (hasFrozen && !clockInterval) {
		clockInterval = setInterval(() => { now = Date.now(); }, 1000);
	} else if (!hasFrozen && clockInterval) {
		clearInterval(clockInterval);
		clockInterval = null;
	}
	$: frozenCountdowns = boxes.map(b =>
		b.frozen && b.frozenUntil ? Math.max(0, Math.ceil((b.frozenUntil - now) / 1000)) : 0
	);

	// Shake/pop animation on tile change
	let prevBoxes: BingoBox[] = boxes.map(b => ({ ...b }));
	let shakeIndices: Set<number> = new Set();
	let shakeTimers: ReturnType<typeof setTimeout>[] = [];

	afterUpdate(() => {
		const changed: number[] = [];
		for (let i = 0; i < boxes.length; i++) {
			const prev = prevBoxes[i];
			const curr = boxes[i];
			if (prev && curr && (
				prev.frozen !== curr.frozen ||
				prev.completed !== curr.completed ||
				prev.completedBy !== curr.completedBy ||
				prev.instanceId !== curr.instanceId ||
				prev.challengeId !== curr.challengeId  // catch randomize
			)) {
				changed.push(i);
			}
		}
		prevBoxes = boxes.map(b => ({ ...b }));
		if (changed.length === 0) return;
		changed.forEach((idx, n) => {
			const t1 = setTimeout(() => {
				shakeIndices = new Set([...shakeIndices, idx]);
				const t2 = setTimeout(() => {
					shakeIndices = new Set([...shakeIndices].filter(i => i !== idx));
				}, 520);
				shakeTimers.push(t2);
			}, n * 50);
			shakeTimers.push(t1);
		});
	});

	onDestroy(() => {
		if (clockInterval) clearInterval(clockInterval);
		shakeTimers.forEach(t => clearTimeout(t));
	});
</script>

<div class="grid-wrap">
<div class="bingo-grid" style="--cols:{size}">
	{#each boxes as box, i (box.instanceId)}
		{@const isLocalW = localWinBoxes.has(i)}
		{@const isOppW = oppWinBoxes.has(i)}
		{@const isOpp = box.completedBy === 'opponent'}
		{@const isMine = box.completedBy === 'local'}
		{@const isBoth = box.completedBy === 'both'}
		{@const isExiting = exitingBoxIndices.has(i)}
		{@const isFrozen = !!box.frozen}
		{@const isShaking = shakeIndices.has(i)}
		{@const sp = showProg(box)}
		{@const progPct = sp ? pct(box) : 0}
		{@const secsLeft = frozenCountdowns[i] ?? 0}
		{@const frozenProminent = isFrozen && (role === 'solo' || (role === 'host' ? !box.frozenForOpponent : !!box.frozenForOpponent))}
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
			class:box--frozen={isFrozen}
			class:box--frozen-prominent={frozenProminent}
			class:box--shake={isShaking}
			class:box--dev={devMode}
			use:tooltip={{ content: box.description, placement: 'top', delay: [400, 0] }}
			on:click={(e) => handleClick(e, box.instanceId)}
			animate:flip={{ duration: 250, easing: quintOut }}
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
					{#if box.target <= 1}
						<span class="label label--winicas">Win as</span>
						<img
							src="/image/characters/css/{charIconId(box.params.characterId)}.png"
							alt=""
							class="char-icon char-icon--large"
						/>
					{:else}
						{@const prefix = charLabelPrefix(box.label)}
						<span class="label" style="font-size:{labelFontSize(prefix)}">{prefix}</span>
						<img
							src="/image/characters/css/{charIconId(box.params.characterId)}.png"
							alt=""
							class="char-icon"
						/>
					{/if}
				{:else}
					<span class="label" style="font-size:{labelFontSize(box.label)}">{box.label}</span>
				{/if}
			</div>
			{#if sp && box.hasProgress && !box.completed && !(box.challengeId === 'win_with_character' && box.target <= 1)}
				<span class="sub">{box.progress}/{box.target}</span>
			{/if}
			{#if isOpp}
				<span class="opp-badge">✓</span>
			{/if}
			{#if isFrozen}
				{#if frozenProminent}
					<div class="frozen-badge frozen-badge--center">
						<span class="frozen-icon frozen-icon--large">❄</span>
						{#if secsLeft > 0}
							<span class="frozen-countdown frozen-countdown--large">{secsLeft}s</span>
						{/if}
					</div>
				{:else}
					<div class="frozen-badge frozen-badge--corner">
						<span class="frozen-icon">❄</span>
						{#if secsLeft > 0}
							<span class="frozen-countdown">{secsLeft}s</span>
						{/if}
					</div>
				{/if}
			{/if}
			{#if devMode}
				<div class="dev-half dev-half--left"></div>
				<div class="dev-half dev-half--right"></div>
			{/if}
		</div>
	{/each}
</div>
{#if localControlledLines.length > 0 || oppControlledLines.length > 0}
	<div class="line-ctrl-layer" style="--cols:{size}">
		{#each localControlledLines as line (line.type + line.index)}
			<div
				class="line-ctrl line-ctrl--local"
				style="{line.type === 'row' ? `grid-row:${line.index+1};grid-column:1/-1` : `grid-row:1/-1;grid-column:${line.index+1}`}"
			></div>
		{/each}
		{#each oppControlledLines as line (line.type + line.index)}
			<div
				class="line-ctrl line-ctrl--opp"
				style="{line.type === 'row' ? `grid-row:${line.index+1};grid-column:1/-1` : `grid-row:1/-1;grid-column:${line.index+1}`}"
			></div>
		{/each}
	</div>
{/if}
</div>

<style>
	.grid-wrap {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.bingo-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-auto-rows: 1fr;
		gap: var(--bingo-gap, 0.45rem);
		width: 100%;
		height: 100%;
	}

	.line-ctrl-layer {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--cols), 1fr);
		gap: var(--bingo-gap, 0.45rem);
		pointer-events: none;
		z-index: 5;
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

	/* ── Completion colors (green = local, red = opponent) ── */
	.box--mine { background: rgba(74, 222, 128, 0.28); border-color: rgba(74, 222, 128, 0.5); }
	.box--opp  { background: rgba(248, 113, 113, 0.28); border-color: rgba(248, 113, 113, 0.5); }
	.box--both {
		background: linear-gradient(135deg, rgba(74, 222, 128, 0.28) 50%, rgba(248, 113, 113, 0.28) 50%);
		border-color: rgba(255, 255, 255, 0.25);
	}

	/* ── Win row: layered on top of completion color ── */
	.box--win-local { border: 2px solid rgba(74, 222, 128, 0.95); background: rgba(74, 222, 128, 0.55); }
	.box--win-opp   { border: 2px solid rgba(248, 113, 113, 0.95); background: rgba(248, 113, 113, 0.55); }
	.box--win-both  { border: 2px solid rgba(255, 255, 255, 0.75); }

	/* both-completed box inside any win row keeps diagonal */
	.box--both.box--win-local,
	.box--both.box--win-opp,
	.box--both.box--win-both {
		background: linear-gradient(135deg, rgba(74, 222, 128, 0.55) 50%, rgba(248, 113, 113, 0.55) 50%);
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

	/* ── Shake/pop on tile change ── */
	.box--shake {
		animation: tile-pop-shake 0.52s ease-in-out both;
		z-index: 3;
	}
	@keyframes tile-pop-shake {
		0%   { transform: scale(1); filter: brightness(1); }
		14%  { transform: scale(1.13) translateY(-3px); filter: brightness(1.8); }
		28%  { transform: scale(1.09) rotate(2.5deg); filter: brightness(1.35); }
		44%  { transform: scale(1.07) rotate(-1.8deg); filter: brightness(1.15); }
		60%  { transform: scale(1.04) rotate(0.8deg); }
		78%  { transform: scale(1.02); filter: brightness(1.05); }
		100% { transform: scale(1); filter: brightness(1); }
	}

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
		gap: 0.2em;
		padding: 0.3em 0.35em 0.5em;
		z-index: 1;
		width: 100%;
		min-height: 0;
		transition: opacity 0.3s;
	}

	/* Dim tile content while frozen so badge is readable */
	.box--frozen .box-inner { opacity: 0.38; }

	.char-icon {
		width: var(--bingo-char-size, 56px);
		height: var(--bingo-char-size, 56px);
		object-fit: contain;
		image-rendering: pixelated;
	}

	.label {
		color: #fff;
		font-weight: 600;
		text-align: center;
		line-height: 1.25;
		overflow-wrap: break-word;
		hyphens: none;
		font-family: sans-serif;
	}

	.sub {
		position: absolute;
		bottom: 4px;
		left: 0;
		right: 0;
		text-align: center;
		font-size: var(--bingo-sub-size, 0.78rem);
		font-weight: 700;
		color: rgba(255, 255, 255, 0.82);
		font-family: sans-serif;
	}

	.label--winicas {
		font-size: 0.78em;
		opacity: 0.7;
	}

	.char-icon--large {
		width: var(--bingo-char-size-lg, 76px);
		height: var(--bingo-char-size-lg, 76px);
	}

	.opp-badge {
		position: absolute;
		top: 2px;
		right: 4px;
		font-size: var(--bingo-badge-size, 0.65rem);
		color: rgba(248, 113, 113, 0.9);
	}

	/* ── Frozen ── */
	.box--frozen {
		border-color: rgba(147, 210, 255, 0.8) !important;
		background: rgba(147, 210, 255, 0.12) !important;
		animation: frozen-pulse 2s ease-in-out infinite;
	}
	/* Opponent/solo: heavier dim so centered timer is readable */
	.box--frozen-prominent .box-inner { opacity: 0.22 !important; }

	@keyframes frozen-pulse {
		0%, 100% { box-shadow: 0 0 0 0 rgba(147, 210, 255, 0); }
		50%       { box-shadow: 0 0 12px 4px rgba(147, 210, 255, 0.5); }
	}

	/* Shared badge base */
	.frozen-badge {
		position: absolute;
		pointer-events: none;
		z-index: 4;
		display: flex;
		align-items: center;
		gap: 0.2em;
		animation: frozen-reveal 0.4s ease-out both;
	}
	/* Corner badge for host (subtle — you initiated it) */
	.frozen-badge--corner {
		top: 3px;
		left: 4px;
		flex-direction: row;
	}
	/* Centered large badge for opponent / solo */
	.frozen-badge--center {
		inset: 0;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	@keyframes frozen-reveal {
		from { opacity: 0; transform: scale(0.6); }
		to   { opacity: 1; transform: scale(1); }
	}

	.frozen-icon {
		font-size: var(--bingo-frozen-icon, 1em);
		line-height: 1;
		filter: drop-shadow(0 0 3px rgba(147, 210, 255, 0.95));
	}
	.frozen-icon--large {
		font-size: var(--bingo-frozen-icon-lg, 2em);
		filter: drop-shadow(0 0 6px rgba(147, 210, 255, 1));
	}

	.frozen-countdown {
		font-size: var(--bingo-frozen-cd, 0.72em);
		font-weight: 700;
		color: rgba(200, 235, 255, 0.97);
		font-family: sans-serif;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
	}
	.frozen-countdown--large {
		font-size: var(--bingo-frozen-cd-lg, 1.3em);
		font-weight: 700;
		color: rgba(200, 235, 255, 1);
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
	}

	/* ── Controlled line full border (rowcontrol mode) ── */
	.line-ctrl {
		pointer-events: none;
		border-radius: 4px;
	}

	.line-ctrl--local {
		outline: 3px solid rgba(74, 222, 128, 0.9);
		animation: ctrl-appear 0.4s cubic-bezier(0.2, 0, 0, 1) both, ctrl-pulse-local 2.8s ease-in-out 0.4s infinite;
	}

	.line-ctrl--opp {
		outline: 3px solid rgba(248, 113, 113, 0.9);
		animation: ctrl-appear 0.4s cubic-bezier(0.2, 0, 0, 1) both, ctrl-pulse-opp 2.8s ease-in-out 0.4s infinite;
	}

	@keyframes ctrl-appear {
		from { opacity: 0; transform: scale(0.94); }
		to   { opacity: 1; transform: scale(1); }
	}

	@keyframes ctrl-pulse-local {
		0%, 100% { box-shadow: inset 0 0 8px rgba(74, 222, 128, 0.08), 0 0 6px rgba(74, 222, 128, 0.2); outline-color: rgba(74, 222, 128, 0.75); }
		50%       { box-shadow: inset 0 0 20px rgba(74, 222, 128, 0.25), 0 0 18px rgba(74, 222, 128, 0.5); outline-color: rgba(74, 222, 128, 1); }
	}

	@keyframes ctrl-pulse-opp {
		0%, 100% { box-shadow: inset 0 0 8px rgba(248, 113, 113, 0.08), 0 0 6px rgba(248, 113, 113, 0.2); outline-color: rgba(248, 113, 113, 0.75); }
		50%       { box-shadow: inset 0 0 20px rgba(248, 113, 113, 0.25), 0 0 18px rgba(248, 113, 113, 0.5); outline-color: rgba(248, 113, 113, 1); }
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

	.box--dev:hover .dev-half--left  { background: rgba(74, 222, 128, 0.25); opacity: 1; }
	.box--dev:hover .dev-half--right { background: rgba(248, 113, 113, 0.25); opacity: 1; }
</style>
