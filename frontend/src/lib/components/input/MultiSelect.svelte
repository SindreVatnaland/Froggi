<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import CharacterIcon from '../leaderboard/CharacterIcon.svelte';
	export let id = '';
	export let value: any[];
	export let readonly = false;
	export let label: string | undefined = undefined;
	export let isCharacter = false;

	// TODO: Display selected content in dropdown - https://svelte.dev/repl/c7094fb1004b440482d2a88f4d1d7ef5?version=3.14.0

	let input,
		inputValue,
		options = [],
		activeOption,
		showOptions = false,
		selected = {},
		first = true,
		slot;
	const iconClearPath =
		'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

	onMount(() => {
		slot.querySelectorAll('option').forEach((o) => {
			o.selected && !value.includes(o.value) && (value = [...value, o.value]);
			options = [...options, { value: o.value, name: o.textContent }];
		});
		value &&
			(selected = options.reduce(
				(obj, op) => (value.includes(op.value) ? { ...obj, [op.value]: op } : obj),
				{},
			));
		first = false;
	});

	$: if (!first) value = Object.values(selected).map((o) => o.value);
	$: filtered = options.filter((o) =>
		inputValue ? o.name.toLowerCase().includes(inputValue.toLowerCase()) : o,
	);
	$: if ((activeOption && !filtered.includes(activeOption)) || (!activeOption && inputValue))
		activeOption = filtered[0];

	function add(token) {
		if (!readonly) selected[token.value] = token;
	}

	function remove(value) {
		if (!readonly) {
			const { [value]: val, ...rest } = selected;
			selected = rest;
		}
	}

	function optionsVisibility(show) {
		if (readonly) return;
		if (typeof show === 'boolean') {
			showOptions = show;
			show && input.focus();
		} else {
			showOptions = !showOptions;
		}
		if (!showOptions) {
			activeOption = undefined;
		}
	}

	function handleKeyup(e) {
		if (e.keyCode === 13) {
			Object.keys(selected).includes(activeOption.value)
				? remove(activeOption.value)
				: add(activeOption);
			inputValue = '';
		}
		if ([38, 40].includes(e.keyCode)) {
			// up and down arrows
			const increment = e.keyCode === 38 ? -1 : 1;
			const calcIndex = filtered.indexOf(activeOption) + increment;
			activeOption =
				calcIndex < 0
					? filtered[filtered.length - 1]
					: calcIndex === filtered.length
					? filtered[0]
					: filtered[calcIndex];
		}
	}

	function handleBlur(e) {
		optionsVisibility(false);
	}

	function handleTokenClick(e) {
		if (e.target.closest('.token-remove')) {
			e.stopPropagation();
			remove(e.target.closest('.token').dataset.id);
		} else if (e.target.closest('.remove-all')) {
			selected = [];
			inputValue = '';
		} else {
			optionsVisibility(true);
		}
	}

	function handleOptionMousedown(e) {
		const value = e.target.dataset.value;
		if (selected[value]) {
			remove(value);
		} else {
			add(options.filter((o) => o.value === value)[0]);
			input.focus();
		}
	}
</script>

<div class="multiselect h-10 w-full">
	<div class="tokens" class:showOptions on:click={handleTokenClick}>
		<div class="w-12 min-w-12 flex flex-1 items-center">
			{#if !readonly}
				<div class="w-full text-secondary-color">
					{#if label}
						<label
							class="block uppercase tracking-wide text-secondary-color text-xs font-bold mb-2"
							for="grid-first-name"
						>
							<h1 class="text-secondary-color text-shadow text-sm">
								{label}
							</h1>
						</label>
					{/if}
					<input
						class="background-color-primary bg-opacity-75 text-secondary-color text-md rounded-md border-b-0"
						{id}
						autocomplete="off"
						bind:value={inputValue}
						bind:this={input}
						on:keyup={handleKeyup}
						on:blur={handleBlur}
					/>
				</div>
			{/if}
		</div>
	</div>

	<select bind:this={slot} type="multiple" class="hidden"><slot /></select>

	{#if showOptions}
		<ul
			class="options"
			transition:fly={{ duration: 200, y: 5 }}
			on:mousedown|preventDefault={handleOptionMousedown}
		>
			{#each filtered as option}
				<li
					class="flex content-center gap-2"
					class:selected={selected[option.value]}
					class:active={activeOption === option}
					data-value={option.value}
				>
					{#if isCharacter}
						<div
							class={`flex justify-center items-center w-7 h-7`}
							data-value={option.value}
						>
							<img
								class={`aspect-square`}
								alt="character icon"
								src={`/image/characters/${option.value}/0/stock.png`}
								data-value={option.value}
							/>
						</div>
					{/if}
					<h1 data-value={option.value}>
						{option.name}
					</h1>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.multiselect {
		background-color: transparent;
		position: relative;
	}
	.multiselect:not(.readonly):hover {
		border-bottom-color: hsl(0, 0%, 50%);
	}

	.tokens {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		position: relative;
	}
	.tokens::after {
		background: none repeat scroll 0 0 transparent;
		bottom: -1px;
		content: '';
		display: block;
		height: 2px;
		left: 50%;
		position: absolute;
		background: hsl(48, 5%, 20%);
		transition: width 0.3s ease 0s, left 0.3s ease 0s;
		width: 0;
	}
	.tokens.showOptions::after {
		width: 100%;
		left: 0;
	}

	input {
		border: none;
		font-size: 1.5rem;
		line-height: 1.5rem;
		margin: 0;
		outline: none;
		padding: 0;
		width: 100%;
	}

	.options {
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1), 0px -2px 4px rgba(0, 0, 0, 0.1);
		left: 0;
		list-style: none;
		margin-block-end: 0;
		margin-block-start: 0;
		max-height: 70vh;
		overflow: auto;
		padding-inline-start: 0;
		position: absolute;
		top: calc(100% + 1px);
		width: 100%;
	}
	li {
		background-color: white;
		cursor: pointer;
		padding: 0.5rem;
	}
	li:first-child {
		margin-top: 1.4em;
		border-top-left-radius: 0.2rem;
		border-top-right-radius: 0.2rem;
	}
	li:last-child {
		border-bottom-left-radius: 0.2rem;
		border-bottom-right-radius: 0.2rem;
	}
	li:not(.selected):hover {
		background-color: hsl(214, 17%, 92%);
	}
	li.selected {
		background-color: hsl(232, 54%, 41%);
		color: white;
	}
	li.selected:nth-child(even) {
		background-color: hsl(232, 50%, 45%);
		color: white;
	}
	li.active {
		background-color: hsl(214, 17%, 88%);
	}
	li.selected.active,
	li.selected:hover {
		background-color: hsl(232, 48%, 50%);
	}

	.hidden {
		display: none;
	}
</style>
