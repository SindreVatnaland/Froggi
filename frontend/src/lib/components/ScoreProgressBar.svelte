<script lang="ts">
	/** Stacked race progress bars. Pass oppScore=null for solo mode. */
	export let localScore: number;
	export let localName: string = 'You';
	export let oppScore: number | null = null;
	export let oppName: string = 'Opponent';
	export let target: number;
	export let unit: string = '';
	export let localWinner: boolean = false;
	export let oppWinner: boolean = false;

	function pct(n: number): number {
		return target > 0 ? Math.min(100, (n / target) * 100) : 0;
	}
</script>

<div class="spb border-secondary">
	<div class="spb-row" class:spb-row--winner={localWinner}>
		<span class="spb-name">{localName}</span>
		<div class="spb-track">
			<div class="spb-fill spb-fill--local" style="width:{pct(localScore)}%"></div>
		</div>
		<span class="spb-count">{localScore}<span class="spb-of">/{target}</span></span>
	</div>
	{#if oppScore !== null}
		<div class="spb-row" class:spb-row--winner={oppWinner}>
			<span class="spb-name">{oppName}</span>
			<div class="spb-track">
				<div class="spb-fill spb-fill--opp" style="width:{pct(oppScore)}%"></div>
			</div>
			<span class="spb-count">{oppScore}<span class="spb-of">/{target}</span></span>
		</div>
	{/if}
	{#if unit}
		<span class="spb-unit">{unit}</span>
	{/if}
</div>

<style>
	.spb {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
	}

	.spb-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.spb-name {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.5;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 7rem;
		flex-shrink: 0;
	}

	.spb-track {
		flex: 1;
		height: 6px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--secondary-color) 12%, transparent);
		overflow: hidden;
	}

	.spb-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
	}

	.spb-fill--local {
		background: rgba(96, 165, 250, 0.85);
	}

	.spb-fill--opp {
		background: rgba(52, 211, 153, 0.85);
	}

	.spb-row--winner .spb-fill--local,
	.spb-row--winner .spb-fill--opp {
		background: rgba(74, 222, 128, 0.95);
	}

	.spb-count {
		font-size: 0.95rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		width: 3.5rem;
		text-align: right;
		flex-shrink: 0;
	}

	.spb-row--winner .spb-count {
		color: #4ade80;
	}

	.spb-of {
		font-size: 0.65rem;
		opacity: 0.4;
		font-weight: 400;
	}

	.spb-unit {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		opacity: 0.35;
		padding-left: calc(7rem + 0.65rem);
	}
</style>
