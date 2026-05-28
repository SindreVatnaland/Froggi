<script lang="ts">
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { afterUpdate, onDestroy } from 'svelte';
	import type { IronManRoster, IronManSettings } from '$lib/models/types/ironman';
	import { IRONMAN_CHAR_NAMES, IRONMAN_CHAR_FALLBACK } from '$lib/models/types/ironman';

	export let roster: IronManRoster;
	export let settings: IronManSettings;
	export let isLocal: boolean = true;
	export let label: string = '';
	/** If true, unplayed chars show as ? (opponent hidden mode) */
	export let obscured: boolean = false;
	/** variant context for rendering */
	export let variant: IronManSettings['variant'] = 'standard';
	/** characterId currently being played in the active game (from GameSettings event) */
	export let activeGameCharId: number | null = null;
	/** Override icon size (e.g. "6vmin"). When null, computed from slot count. */
	export let iconSizeOverride: string | null = null;
	/** Override grid column count. When set, ignores computed maxCols. */
	export let cols: number | null = null;
	/** When false, suppresses the pulsing active-ring at currentIndex (use for free charOrder). */
	export let showActiveMarker: boolean = true;

	function charIconId(id: number): number {
		return IRONMAN_CHAR_FALLBACK[id] ?? id;
	}

	function slotState(slot: typeof roster.slots[number], index: number): 'active' | 'done' | 'depleted' | 'pending' | 'hidden' {
		if (variant === 'standard') {
			if (slot.depleted) return 'depleted';
			if (obscured && !isLocal) return 'hidden';
			return 'pending';
		}
		// full_roster / challenge
		if (slot.completed) return 'done';
		if (showActiveMarker && index === roster.currentIndex) return 'active';
		if (index > roster.currentIndex && obscured && !isLocal) return 'hidden';
		return 'pending';
	}

	function iconSize(count: number): string {
		if (count <= 8) return '52px';
		if (count <= 13) return '46px';
		if (count <= 18) return '40px';
		return '36px';
	}

	function maxCols(count: number): number {
		if (count <= 8) return count;
		if (count <= 16) return Math.ceil(count / 2);
		return Math.ceil(count / 3);
	}

	$: iconPx = iconSizeOverride ?? iconSize(roster.slots.length);
	$: gridCols = cols ?? maxCols(roster.slots.length);

	// Flash animation tracking
	let flashingSlots = new Set<number>();
	let flashTypes = new Map<number, 'depleted' | 'done'>();
	let prevState = new Map<number, { depleted: boolean; completed: boolean }>();
	let stateInitialized = false;
	let flashTimers: ReturnType<typeof setTimeout>[] = [];

	$: if (roster && !stateInitialized) {
		stateInitialized = true;
		roster.slots.forEach(s => prevState.set(s.characterId, { depleted: s.depleted, completed: s.completed }));
	}

	afterUpdate(() => {
		if (!stateInitialized) return;
		roster.slots.forEach(s => {
			const prev = prevState.get(s.characterId);
			if (!prev) { prevState.set(s.characterId, { depleted: s.depleted, completed: s.completed }); return; }
			const justDepleted = variant === 'standard' && s.depleted && !prev.depleted;
			const justCompleted = variant !== 'standard' && s.completed && !prev.completed;
			if (justDepleted || justCompleted) {
				flashTypes.set(s.characterId, justDepleted ? 'depleted' : 'done');
				flashingSlots = new Set([...flashingSlots, s.characterId]);
				const t = setTimeout(() => {
					flashingSlots = new Set([...flashingSlots].filter(id => id !== s.characterId));
				}, 900);
				flashTimers.push(t);
			}
			prevState.set(s.characterId, { depleted: s.depleted, completed: s.completed });
		});
	});

	onDestroy(() => flashTimers.forEach(clearTimeout));
</script>

<div class="roster-wrap">
	{#if label}
		<p class="roster-label">{label}</p>
	{/if}
	<div class="roster-grid" style="grid-template-columns: repeat({gridCols}, max-content)">
		{#each roster.slots as slot, i (slot.characterId)}
			{@const state = slotState(slot, i)}
			<div
				class="char-slot char-slot--{state}"
				class:char-slot--ingame={activeGameCharId != null && slot.characterId === activeGameCharId}
				title={state === 'hidden' ? '?' : IRONMAN_CHAR_NAMES[slot.characterId] ?? ''}
				in:scale={{ duration: 280, delay: i * 30, start: 0.5, easing: backOut }}
			>
				{#if state === 'hidden'}
					<div class="char-question" style="width:{iconPx};height:{iconPx}">?</div>
				{:else}
					<img
						src="/image/characters/css/{charIconId(slot.characterId)}.png"
						alt={IRONMAN_CHAR_NAMES[slot.characterId] ?? ''}
						style="width:{iconPx};height:{iconPx}"
						class="char-icon"
					/>
					{#if state === 'active'}
						<div class="char-active-ring"></div>
					{/if}
					{#if state === 'done'}
						<div class="char-check">✓</div>
					{/if}
					{#if state === 'depleted'}
						<div class="char-x">✕</div>
					{/if}
					{#if variant === 'standard' && state === 'pending' && slot.stocksRemaining > 0 && slot.stocksRemaining < settings.stocksPerChar}
						<div class="char-stocks">{slot.stocksRemaining}</div>
					{/if}
				{/if}
				{#if flashingSlots.has(slot.characterId)}
					<div class="char-flash char-flash--{flashTypes.get(slot.characterId)}"></div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.roster-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.roster-label {
		font-size: 0.65rem;
		opacity: 0.45;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		text-align: center;
	}

	.roster-grid {
		display: grid;
		gap: 4px;
		justify-content: center;
	}

	.char-slot {
		position: relative;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.25s, filter 0.25s, box-shadow 0.25s;
	}

	.char-slot--active {
		box-shadow: 0 0 0 2px var(--secondary-color, #e5e7eb);
	}

	.char-slot--ingame {
		box-shadow: 0 0 0 2px #f59e0b, 0 0 8px 2px rgba(245, 158, 11, 0.35);
		z-index: 1;
	}

	.char-slot--done .char-icon {
		filter: brightness(0.5) sepia(1) hue-rotate(80deg) saturate(2);
	}

	.char-slot--depleted {
		opacity: 0.25;
	}

	.char-slot--depleted .char-icon {
		filter: grayscale(1) brightness(0.2);
	}

	.char-slot--pending {
		opacity: 0.85;
	}

	.char-icon {
		display: block;
		object-fit: contain;
	}

	.char-active-ring {
		position: absolute;
		inset: -2px;
		border-radius: 8px;
		border: 2px solid var(--secondary-color, #e5e7eb);
		pointer-events: none;
		animation: ring-pulse 1.4s ease-in-out infinite;
	}

	@keyframes ring-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.char-check {
		position: absolute;
		bottom: 1px;
		right: 2px;
		font-size: 0.6rem;
		font-weight: 700;
		color: #4ade80;
		text-shadow: 0 0 3px #000;
		line-height: 1;
	}

	.char-x {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 700;
		color: #f87171;
		text-shadow: 0 0 4px #000;
	}

	.char-stocks {
		position: absolute;
		bottom: 1px;
		right: 2px;
		font-size: 0.55rem;
		font-weight: 700;
		color: #fbbf24;
		text-shadow: 0 0 3px #000;
		line-height: 1;
	}

	.char-question {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		font-weight: 700;
		opacity: 0.25;
		background: rgba(255,255,255,0.05);
		border-radius: 4px;
	}

	.char-flash {
		position: absolute;
		inset: 0;
		border-radius: 6px;
		pointer-events: none;
		z-index: 3;
		animation: char-flash-out 0.85s ease-out forwards;
	}
	.char-flash--depleted {
		background: rgba(248, 113, 113, 0.95);
		box-shadow: 0 0 14px rgba(248, 113, 113, 0.8);
	}
	.char-flash--done {
		background: rgba(74, 222, 128, 0.95);
		box-shadow: 0 0 14px rgba(74, 222, 128, 0.8);
	}
	@keyframes char-flash-out {
		0%   { opacity: 1; transform: scale(1.2); }
		35%  { opacity: 0.8; transform: scale(1.05); }
		100% { opacity: 0; transform: scale(1); }
	}
</style>
