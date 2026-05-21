<script lang="ts">
	import type { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let value: any;
	export let description: string;
	export let selected: boolean = false;
</script>

<button
	class="option-row border-secondary"
	class:option-row--active={selected}
	on:click={() => dispatch('select', value)}
>
	<span class="indicator" class:indicator--active={selected} />
	<div class="option-text">
		<span class="option-label"><slot /></span>
		<span class="option-desc">{description}</span>
	</div>
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

	.option-row--active {
		border-color: var(--success-color);
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

	.indicator--active {
		background: var(--success-color);
		opacity: 1;
	}

	.option-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
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
</style>
