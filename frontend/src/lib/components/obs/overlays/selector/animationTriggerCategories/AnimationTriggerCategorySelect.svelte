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
	import StrikeAnimationTriggerSelect from './StrikeAnimationTriggerSelect.svelte';
	import { LEGACY_TRIGGERS } from '$lib/utils/elementTriggers';

	export let selectedOption: SelectedAnimationTriggerCondition;

	// Categories whose triggers are all legacy (an element trigger does the same) are hidden unless one is in use.
	const T = AnimationTrigger;
	const CATEGORY_TRIGGERS: Partial<Record<AnimationTriggerCategory, AnimationTrigger[]>> = {
		[AnimationTriggerCategory.MatchState]: [T.MatchBestOfChange, T.MatchGameModeChange, T.MatchPlayer1TagChange, T.MatchPlayer2TagChange, T.SlippiRankPlayer1ConnectCodeChange, T.SlippiRankPlayer2ConnectCodeChange, T.MatchPlayer1ScoreChange, T.MatchPlayer2ScoreChange],
		[AnimationTriggerCategory.Player1Data]: [T.SlippiRankPlayer1ConnectCodeChange, T.SlippiRankPlayer1RatingChange, T.SlippiRankPlayer1RankChange],
		[AnimationTriggerCategory.Player2Data]: [T.SlippiRankPlayer2ConnectCodeChange, T.SlippiRankPlayer2RatingChange, T.SlippiRankPlayer2RankChange],
		[AnimationTriggerCategory.RankStats]: [T.SlippiRankStatsWinsChange, T.SlippiRankStatsLossesChange, T.SlippiRankStatsRankChange, T.SlippiRankStatsRatingChange, T.SlippiRankStatsRatingDifferenceChange],
		[AnimationTriggerCategory.SessionStats]: [T.SessionWins, T.SessionLosses, T.SessionGames, T.SessionRating],
	};
	const hasOptions = (category: AnimationTriggerCategory) => {
		const list = CATEGORY_TRIGGERS[category];
		return !list || list.some((t) => !LEGACY_TRIGGERS.has(t) || selectedOption[t]);
	};

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
		{
			category: AnimationTriggerCategory.StageStriking,
			visible: [LiveStatsScene.StrikePhase].includes($statsScene),
		},
	];
	const shown = buttons.filter((b) => b.visible && hasOptions(b.category));
	let selectedCategory: AnimationTriggerCategory = shown[0]?.category ?? AnimationTriggerCategory.GameState;
</script>

<div class="w-full h-full flex flex-col gap-4">
	<h1 class="text-lg font-medium text-secondary-color">Category</h1>
	<div class="w-lg 3xl:w-full flex flex-wrap gap-2">
		{#each shown as button}
			<div class="grid gap-2 justify-start items-start">
				<button
					class={`btn text-md whitespace-nowrap h-10 px-2 xl:text-xl border rounded ${
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
	<h1 class="text-secondary-color text-lg font-medium">Options</h1>
	<!-- The leaving and the arriving options share one grid cell (no stacking); the new ones wait for the old to leave. -->
	<div class="grid" style="align-content: start">
	{#key selectedCategory}
		<div
			style="grid-area: 1 / 1"
			in:fly={{ duration: 150, x: 16, delay: 100 }}
			out:fly={{ duration: 100, x: -16 }}
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
			{#if selectedCategory === AnimationTriggerCategory.StageStriking}
				<StrikeAnimationTriggerSelect on:select={select} {selectedOption} />
			{/if}
		</div>
		<br />
	{/key}
	</div>
</div>
