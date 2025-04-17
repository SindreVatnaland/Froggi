<script lang="ts">
	import { ElementCategory, LiveStatsScene } from '$lib/models/enum';
	import type { CustomElement } from '$lib/models/constants/customElement';
	import { statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import CurrentPlayerCustomHudSelect from '$lib/components/obs/overlays/selector/elementCategories/CustomHud/CurrentPlayerCustomHudSelect.svelte';
	import Player1HudSelect from '$lib/components/obs/overlays/selector/elementCategories/CustomHud/Player1HudSelect.svelte';
	import Player2HudSelect from '$lib/components/obs/overlays/selector/elementCategories/CustomHud/Player2HudSelect.svelte';
	import CustomElementSelect from '$lib/components/obs/overlays/selector/elementCategories/Custom/CustomElementSelect.svelte';
	import Session from '$lib/components/obs/overlays/selector/elementCategories/Session/Session.svelte';
	import CustomHudSelect from '$lib/components/obs/overlays/selector/elementCategories/CustomHud/CustomHudSelect.svelte';
	import RecentGamePlayer1SlippiData from '$lib/components/obs/overlays/selector/elementCategories/SlippiData/Player1SlippiData.svelte';
	import RecentGamePlayer2SlippiData from '$lib/components/obs/overlays/selector/elementCategories/SlippiData/Player2SlippiData.svelte';
	import RecentGameCurrentPlayerSlippiData from '$lib/components/obs/overlays/selector/elementCategories/SlippiData/CurrentPlayerSlippiData.svelte';
	import RecentGameCurrentSetElementSelect from '$lib/components/obs/overlays/selector/elementCategories/CurrentSet/CurrentSetElementSelect.svelte';
	import RecentGameCurrentPlayerActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGameCurrentPlayerActionCount.svelte';
	import RecentGameCurrentPlayerAttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGameCurrentPlayerAttackCount.svelte';
	import RecentGameCurrentPlayerOverall from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGameCurrentPlayerOverall.svelte';
	import RecentGamePlayer1AttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer1AttackCount.svelte';
	import RecentGamePlayer1ActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer1ActionCount.svelte';
	import RecentGamePlayer1Overall from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer1Overall.svelte';
	import RecentGamePlayer2AttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer2AttackCount.svelte';
	import RecentGamePlayer2ActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer2ActionCount.svelte';
	import RecentGamePlayer2Overall from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer2Overall.svelte';

	import CurrentMatchCurrentPlayerActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchCurrentPlayerActionCount.svelte';
	import CurrentMatchCurrentPlayerAttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchCurrentPlayerAttackCount.svelte';
	import CurrentMatchCurrentPlayerOverall from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchCurrentPlayerOverall.svelte';
	import CurrentMatchPlayer1AttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer1AttackCount.svelte';
	import CurrentMatchPlayer1ActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer1ActionCount.svelte';
	import CurrentMatchPlayer1Overall from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer1Overall.svelte';
	import CurrentMatchPlayer2AttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer2AttackCount.svelte';
	import CurrentMatchPlayer2ActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer2ActionCount.svelte';
	import CurrentMatchPlayer2Overall from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer2Overall.svelte';
	import RecentGame from './RecentMatchSummary/RecentGame.svelte';
	import Game1Summary from './RecentMatchSummary/Game1.svelte';
	import Game2Summary from './RecentMatchSummary/Game2.svelte';
	import Game3Summary from './RecentMatchSummary/Game3.svelte';
	import Game4Summary from './RecentMatchSummary/Game4.svelte';
	import Game5Summary from './RecentMatchSummary/Game5.svelte';
	import CurrentPlayerControllerInput from './CustomHud/CurrentPlayerControllerInput.svelte';
	import Player1ControllerInput from './CustomHud/Player1ControllerInput.svelte';
	import Player2ControllerInput from './CustomHud/Player2ControllerInput.svelte';
	import RankChangeData from './SlippiData/RankChangeData.svelte';
	import CurrentPlayerPredictedSlippiRank from '../../elementRender/Slippi/CurrentPlayerPredictedSlippiRank.svelte';
	import CurrentPlayerPredictedSlippiData from './PredictedSlippiData/CurrentPlayerPredictedSlippiData.svelte';
	import Player2PredictedSlippiData from './PredictedSlippiData/Player2PredictedSlippiData.svelte';
	import Player1PredictedSlippiData from './PredictedSlippiData/Player1PredictedSlippiData.svelte';

	export let selectedElementId: CustomElement;
	export let open: boolean;

	function select(customElement: CustomEvent<CustomElement>) {
		selectedElementId = customElement.detail;
		open = false;
	}

	let selectedCategory: LiveStatsScene | ElementCategory = $statsScene;

	$: buttons = [
		{
			category: ElementCategory.Custom,
			visible: true,
		},
		{
			category: ElementCategory.GameCustomHud,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerCustomHud,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentMatchStats,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
				LiveStatsScene.RankChange,
			].includes($statsScene),
		},
		{
			category: ElementCategory.Player1Hud,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.Player2Hud,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerControllerInput,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.Player1ControllerInput,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.Player2ControllerInput,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.RankChangeData,
			visible: [LiveStatsScene.RankChange].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerData,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
			].includes($statsScene),
		},
		{
			category: ElementCategory.Player1Data,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
			].includes($statsScene),
		},
		{
			category: ElementCategory.Player2Data,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
			].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerPredictedData,
			visible: [LiveStatsScene.InGame, LiveStatsScene.PostGame].includes($statsScene),
		},
		{
			category: ElementCategory.Player1PredictedData,
			visible: [LiveStatsScene.InGame, LiveStatsScene.PostGame].includes($statsScene),
		},
		{
			category: ElementCategory.Player2PredictedData,
			visible: [LiveStatsScene.InGame, LiveStatsScene.PostGame].includes($statsScene),
		},
		{
			category: ElementCategory.Session,
			visible: [
				LiveStatsScene.Menu,
				LiveStatsScene.InGame,
				LiveStatsScene.RankChange,
				LiveStatsScene.PostGame,
				LiveStatsScene.PostSet,
			].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerPostGameAttackCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerPostGameActionCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerPostGameOverallStats,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player1PostGameAttackCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player1PostGameActionCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player1PostGameOverallStats,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player2PostGameAttackCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player2PostGameActionCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player2PostGameOverallStats,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerPostGameMatchAttackCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerPostGameMatchActionCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.CurrentPlayerPostGameMatchOverallStats,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player1PostGameMatchAttackCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player1PostGameMatchActionCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player1PostGameMatchOverallStats,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player2PostGameMatchAttackCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player2PostGameMatchActionCount,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Player2PostGameMatchOverallStats,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.PostSetStats,
			visible: [LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.RecentGameSummary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Game1Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Game2Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Game3Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Game4Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
		{
			category: ElementCategory.Game5Summary,
			visible: [LiveStatsScene.PostGame, LiveStatsScene.PostSet].includes($statsScene),
		},
	];
</script>

<div class="w-full h-full flex flex-col gap-2 color-secondary">
	<div class="w-full">
		<h1 class="text-lg font-medium">Category</h1>
		<div
			class="w-lg 3xl:w-full flex flex-wrap gap-2 max-h-[13rem] min-h-[9rem] overflow-auto border-t border-b border-secondary-color p-2"
		>
			{#each buttons.filter((b) => b.visible) as button}
				<div class="grid gap-2 justify-start items-start">
					<button
						class={`transition background-color-primary hover:bg-opacity-40  font-semibold text-secondary-color text-md whitespace-nowrap h-10 px-2 xl:text-xl rounded ${
							selectedCategory === button.category
								? 'border-secondary bg-opacity-50'
								: 'border-accent bg-opacity-25'
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
	</div>
	<div class="w-full flex-1 overflow-auto border-t border-b border-secondary-color">
		<h1 class="text-lg font-medium color-secondary">Element</h1>
		{#key selectedCategory}
			<div
				in:fly={{ duration: 250, x: 50, delay: 250 }}
				out:fly={{ duration: 250, x: 50 }}
				class="overflow-y-auto flex flex-col gap-2 color-secondary"
			>
				{#if selectedCategory === ElementCategory.Custom}
					<CustomElementSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.GameCustomHud}
					<CustomHudSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerCustomHud}
					<CurrentPlayerCustomHudSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1Hud}
					<Player1HudSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2Hud}
					<Player2HudSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerControllerInput}
					<CurrentPlayerControllerInput on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1ControllerInput}
					<Player1ControllerInput on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2ControllerInput}
					<Player2ControllerInput on:select={select} />
				{/if}

				{#if selectedCategory === ElementCategory.CurrentMatchStats}
					<RecentGameCurrentSetElementSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Session}
					<Session on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.RankChangeData}
					<div class="flex flex-col gap-2">
						<RecentGameCurrentPlayerSlippiData on:select={select} />
						<RankChangeData on:select={select} />
					</div>
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerData}
					<RecentGameCurrentPlayerSlippiData on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1Data}
					<RecentGamePlayer1SlippiData on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2Data}
					<RecentGamePlayer2SlippiData on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerPredictedData}
					<CurrentPlayerPredictedSlippiData on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1PredictedData}
					<Player1PredictedSlippiData on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2PredictedData}
					<Player2PredictedSlippiData on:select={select} />
				{/if}

				{#if selectedCategory === ElementCategory.CurrentPlayerPostGameAttackCount}
					<RecentGameCurrentPlayerAttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerPostGameActionCount}
					<RecentGameCurrentPlayerActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerPostGameOverallStats}
					<RecentGameCurrentPlayerOverall on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1PostGameAttackCount}
					<RecentGamePlayer1AttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1PostGameActionCount}
					<RecentGamePlayer1ActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1PostGameOverallStats}
					<RecentGamePlayer1Overall on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2PostGameAttackCount}
					<RecentGamePlayer2AttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2PostGameActionCount}
					<RecentGamePlayer2ActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2PostGameOverallStats}
					<RecentGamePlayer2Overall on:select={select} />
				{/if}

				{#if selectedCategory === ElementCategory.CurrentPlayerPostGameMatchAttackCount}
					<CurrentMatchCurrentPlayerAttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerPostGameMatchActionCount}
					<CurrentMatchCurrentPlayerActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.CurrentPlayerPostGameMatchOverallStats}
					<CurrentMatchCurrentPlayerOverall on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1PostGameMatchAttackCount}
					<CurrentMatchPlayer1AttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1PostGameMatchActionCount}
					<CurrentMatchPlayer1ActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1PostGameMatchOverallStats}
					<CurrentMatchPlayer1Overall on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2PostGameMatchAttackCount}
					<CurrentMatchPlayer2AttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2PostGameMatchActionCount}
					<CurrentMatchPlayer2ActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2PostGameMatchOverallStats}
					<CurrentMatchPlayer2Overall on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.RecentGameSummary}
					<RecentGame on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Game1Summary}
					<Game1Summary on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Game2Summary}
					<Game2Summary on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Game3Summary}
					<Game3Summary on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Game4Summary}
					<Game4Summary on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Game5Summary}
					<Game5Summary on:select={select} />
				{/if}
			</div>
		{/key}
	</div>
</div>
