<script lang="ts">
	import { VisibilityToggle } from '$lib/models/types/animationOption';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let value: any;
	export let description: string;
	export let selected: VisibilityToggle = VisibilityToggle.Disabled;

	$: stateLabel =
		selected === VisibilityToggle.True ? 'Yes' :
		selected === VisibilityToggle.False ? 'No' : '';
</script>

<button
	class="option-row border-secondary"
	class:option-row--true={selected === VisibilityToggle.True}
	class:option-row--false={selected === VisibilityToggle.False}
	on:click={() => dispatch('select', value)}
>
	<span
		class="indicator"
		class:indicator--true={selected === VisibilityToggle.True}
		class:indicator--false={selected === VisibilityToggle.False}
	/>
	<div class="option-text">
		<span class="option-label"><slot /></span>
		<span class="option-desc">{description}</span>
	</div>
	{#if stateLabel}
		<span class="state-badge" class:state-badge--true={selected === VisibilityToggle.True} class:state-badge--false={selected === VisibilityToggle.False}>
			{stateLabel}
		</span>
	{/if}
</button>

<style>
	.option-row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.4rem 0.6rem;
		border-radius: 0.25rem;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.1s;
	}

	.option-row--true {
		border-color: var(--success-color);
	}

	.option-row--false {
		border-color: var(--danger-color);
	}

	.indicator {
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 50%;
		flex-shrink: 0;
		background: var(--secondary-color);
		opacity: 0.3;
		transition: background 0.1s, opacity 0.1s;
	}

	.indicator--true {
		background: var(--success-color);
		opacity: 1;
	}

	.indicator--false {
		background: var(--danger-color);
		opacity: 1;
	}

	.option-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
		flex: 1;
	}

	.option-label {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--secondary-color);
		white-space: nowrap;
	}

	.option-desc {
		font-size: 0.65rem;
		color: var(--secondary-color);
		opacity: 0.5;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state-badge {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.1rem 0.35rem;
		border-radius: 0.2rem;
		flex-shrink: 0;
	}

	.state-badge--true {
		color: var(--success-color);
		background: rgba(34, 197, 94, 0.1);
	}

	.state-badge--false {
		color: var(--danger-color);
		background: rgba(244, 67, 54, 0.1);
	}
</style>
