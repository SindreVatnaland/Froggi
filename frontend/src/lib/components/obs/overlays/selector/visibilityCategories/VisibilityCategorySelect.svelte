<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import SessionStateVisibilitySelect from './SessionStateVisibilitySelect.svelte';
	import InGameStateVisibilitySelect from './InGameStateVisibilitySelect.svelte';
	import InGamePlayer1StateVisibilitySelect from './InGamePlayer1StateVisibilitySelect.svelte';
	import InGamePlayer2StateVisibilitySelect from './InGamePlayer2StateVisibilitySelect.svelte';
	import RecentGameVisibilitySelect from './RecentGameVisibilitySelect.svelte';
	import Game1SummaryVisibilitySelect from './Game1SummaryVisibilitySelect.svelte';
	import Game2SummaryVisibilitySelect from './Game2SummaryVisibilitySelect.svelte';
	import Game3SummaryVisibilitySelect from './Game3SummaryVisibilitySelect.svelte';
	import Game4SummaryVisibilitySelect from './Game4SummaryVisibilitySelect.svelte';
	import Game5SummaryVisibilitySelect from './Game5SummaryVisibilitySelect.svelte';
	import RankStatsVisibilitySelect from './RankStatsVisibilitySelect.svelte';
	import {
		VisibilityCategory,
		type SelectedVisibilityCondition,
		type VisibilityOption,
	} from '$lib/models/types/animationOption';
	import { VisibilityToggle } from '$lib/models/types/animationOption';
	import MatchStatsVisibilitySelect from './MatchStatsVisibilitySelect.svelte';
	import RankPredictionVisibilitySelect from './RankPredictionVisibilitySelect.svelte';

	export let selectedVisibilityOption: SelectedVisibilityCondition;

	function select(event: CustomEvent<VisibilityOption>) {
		switch (selectedVisibilityOption[event.detail]) {
			case VisibilityToggle.Disabled:
				selectedVisibilityOption[event.detail] = VisibilityToggle.True;
				return;
			case VisibilityToggle.True:
				selectedVisibilityOption[event.detail] = VisibilityToggle.False;
				return;
			case VisibilityToggle.False:
				selectedVisibilityOption[event.detail] = VisibilityToggle.Disabled;
				return;
			default:
				selectedVisibilityOption[event.detail] = VisibilityToggle.Disabled;
		}
	}

	const buttons = [
		{
			category: VisibilityCategory.DolphinState,
			visible: [LiveStatsScene.WaitingForDolphin].includes($statsScene),
		},
		{
			category: VisibilityCategory.Session,
			visible: [
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
				LiveStatsScene.Menu,
				LiveStatsScene.RankChange,
			].includes($statsScene),
		},
		{
			category: VisibilityCategory.InGameState,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: VisibilityCategory.Player1State,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: VisibilityCategory.Player2State,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: VisibilityCategory.MatchStats,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
			].includes($statsScene),
		},
		{
			category: VisibilityCategory.RecentGame,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: VisibilityCategory.RecentGame1Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: VisibilityCategory.RecentGame2Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: VisibilityCategory.RecentGame3Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: VisibilityCategory.RecentGame4Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: VisibilityCategory.RecentGame5Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: VisibilityCategory.RankStats,
			visible: [LiveStatsScene.RankChange].includes($statsScene),
		},
		{
			category: VisibilityCategory.RankPrediction,
			visible: [
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.RankChange,
			].includes($statsScene),
		},
	];

	let selectedCategory: VisibilityCategory =
		buttons.find((button) => button.visible)?.category ?? VisibilityCategory.InGameState;
</script>

<div class="w-full h-full flex flex-col gap-4">
	<h1 class="text-lg font-medium">Category</h1>
	<div class="w-lg 3xl:w-full flex flex-wrap gap-2">
		{#each buttons.filter((b) => b.visible) as button}
			<div class="grid gap-2 justify-start items-start">
				<button
					class={`transition background-color-primary bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl border rounded ${
						selectedCategory === button.category
							? 'border-secondary bg-opacity-50'
							: 'border-white'
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
	<h1 class="text-lg font-medium">Options</h1>
	{#key selectedCategory}
		<div
			in:fly={{ duration: 250, x: 50, delay: 250 }}
			out:fly={{ duration: 250, x: 50 }}
			class="overflow-auto"
		>
			{#if selectedCategory === VisibilityCategory.Session}
				<div class="flex flex-col gap-2">
					<SessionStateVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.InGameState}
				<div class="flex flex-col gap-2">
					<InGameStateVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.Player1State}
				<div class="flex flex-col gap-2">
					<InGamePlayer1StateVisibilitySelect
						on:select={select}
						{selectedVisibilityOption}
					/>
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.Player2State}
				<div class="flex flex-col gap-2">
					<InGamePlayer2StateVisibilitySelect
						on:select={select}
						{selectedVisibilityOption}
					/>
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.MatchStats}
				<div class="flex flex-col gap-2">
					<MatchStatsVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RecentGame}
				<div class="flex flex-col gap-2">
					<RecentGameVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RecentGame1Summary}
				<div class="flex flex-col gap-2">
					<Game1SummaryVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RecentGame2Summary}
				<div class="flex flex-col gap-2">
					<Game2SummaryVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RecentGame3Summary}
				<div class="flex flex-col gap-2">
					<Game3SummaryVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RecentGame4Summary}
				<div class="flex flex-col gap-2">
					<Game4SummaryVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RecentGame5Summary}
				<div class="flex flex-col gap-2">
					<Game5SummaryVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RankStats}
				<div class="flex flex-col gap-2">
					<RankStatsVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
			{#if selectedCategory === VisibilityCategory.RankPrediction}
				<div class="flex flex-col gap-2">
					<RankPredictionVisibilitySelect on:select={select} {selectedVisibilityOption} />
				</div>
			{/if}
		</div>
		<br />
	{/key}
</div>
