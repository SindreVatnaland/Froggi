<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import GameStateAnimationTriggerSelect from './GameStateAnimationTriggerSelect.svelte';
	import MatchStateAnimationTriggerSelect from './MatchStateAnimationTriggerSelect.svelte';
	import CurrentPlayerStateAnimationTriggerSelect from './CurrentPlayerStateAnimationTriggerSelect.svelte';
	import Player1StateAnimationTriggerSelect from './Player1StateAnimationTriggerSelect.svelte';
	import Player2StateAnimationTriggerSelect from './Player2StateAnimationTriggerSelect.svelte';
	import RankStatsAnimationTriggerSelect from './RankStatsAnimationTriggerSelect.svelte';
	import SessionStatsAnimationTriggerSelect from './SessionStatsAnimationTriggerSelect.svelte';
	import {
		AnimationTrigger,
		AnimationTriggerCategory,
		type SelectedAnimationTriggerCondition,
	} from '$lib/models/types/animationOption';
	import Player1DataAnimationTriggerSelect from './Player1DataAnimationTriggerSelect.svelte';
	import Player2DataAnimationTriggerSelect from './Player2DataAnimationTriggerSelect.svelte';

	export let selectedOption: SelectedAnimationTriggerCondition;

	function select(event: CustomEvent<AnimationTrigger>) {
		selectedOption[event.detail] = !selectedOption[event.detail];
	}

	const buttons = [
		{
			category: AnimationTriggerCategory.DolphinState,
			visible: [LiveStatsScene.WaitingForDolphin].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.GameState,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.MatchState,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
				LiveStatsScene.RankChange,
			].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.CurrentPlayerState,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.Player1State,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.Player2State,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.Player1Data,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.Player2Data,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.RankStats,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.RankChange,
			].includes($statsScene),
		},
		{
			category: AnimationTriggerCategory.SessionStats,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.RankChange,
			].includes($statsScene),
		},
	];
	let selectedCategory: AnimationTriggerCategory =
		buttons?.find((button) => button.visible)?.category ?? AnimationTriggerCategory.GameState;
</script>

<div class="w-full h-full flex flex-col gap-4">
	<h1 class="text-lg font-medium color-secondary">Category</h1>
	<div class="w-lg 3xl:w-full flex flex-wrap gap-2">
		{#each buttons.filter((b) => b.visible) as button}
			<div class="grid gap-2 justify-start items-start">
				<button
					class={`transition background-color-primary bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border rounded ${
						selectedCategory === button.category
							? 'border-secondary bg-opacity-50'
							: 'border-accent'
					}`}
					on:click={() => {
						selectedCategory = button.category;
					}}
				>
					{button.category}
				</button>
			</div>
		{/each}
	</div>
	<h1 class="color-secondary text-lg font-medium">Options</h1>
	{#key selectedCategory}
		<div
			in:fly={{ duration: 250, x: 50, delay: 250 }}
			out:fly={{ duration: 250, x: 50 }}
			class="overflow-y-auto flex flex-col gap-2"
		>
			<!-- TODO: Implement -->
			<!-- {#if selectedCategory === AnimationTriggerCategory.DolphinState}
				<GameStateAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if} -->
			{#if selectedCategory === AnimationTriggerCategory.GameState}
				<GameStateAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.MatchState}
				<MatchStateAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.CurrentPlayerState}
				<CurrentPlayerStateAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.Player1State}
				<Player1StateAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.Player2State}
				<Player2StateAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.Player1Data}
				<Player1DataAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.Player2Data}
				<Player2DataAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.RankStats}
				<RankStatsAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
			{#if selectedCategory === AnimationTriggerCategory.SessionStats}
				<SessionStatsAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
		</div>
		<br />
	{/key}
</div>
