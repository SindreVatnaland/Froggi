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
	import StrikingElementSelect from './Striking/StrikingElementSelect.svelte';
	import CurrentPlayerActionStateSelect from './CustomHud/CurrentPlayerActionStateSelect.svelte';
	import Player1ActionStateSelect from './CustomHud/Player1ActionStateSelect.svelte';
	import Player2ActionStateSelect from './CustomHud/Player2ActionStateSelect.svelte';

	export let selectedElementId: CustomElement;
	export let open: boolean;

	function select(customElement: CustomEvent<CustomElement>) {
		selectedElementId = customElement.detail;
		open = false;
	}

	let selectedCategory: LiveStatsScene | ElementCategory = $statsScene;

	$: buttons = [
		{
			category: ElementCategory.StageStriking,
			visible: true,
		},
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
			category: ElementCategory.CurrentPlayerActionState,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.Player1ActionState,
			visible: [LiveStatsScene.InGame].includes($statsScene),
		},
		{
			category: ElementCategory.Player2ActionState,
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

<div class="selector-root text-secondary-color">
	<!-- Category sidebar -->
	<div class="cat-sidebar border-secondary-color">
		<p class="cat-header">Category</p>
		{#each buttons.filter((b) => b.visible) as button}
			<button
				class="cat-btn"
				class:cat-btn--active={selectedCategory === button.category}
				on:click={() => { selectedCategory = button.category; }}
			>
				{button.category}
			</button>
		{/each}
	</div>

	<!-- Element panel -->
	<div class="elem-panel">
		{#key selectedCategory}
			<div
				in:fly={{ duration: 150, x: 16 }}
				out:fly={{ duration: 100, x: -16 }}
				class="elem-inner"
			>
				{#if selectedCategory === ElementCategory.StageStriking}
					<StrikingElementSelect on:select={select} />
				{/if}
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
				{#if selectedCategory === ElementCategory.CurrentPlayerActionState}
					<CurrentPlayerActionStateSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player1ActionState}
					<Player1ActionStateSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Player2ActionState}
					<Player2ActionStateSelect on:select={select} />
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

<style>
	.selector-root {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.cat-sidebar {
		width: 200px;
		flex-shrink: 0;
		overflow-y: auto;
		border-right: 1px solid;
		padding: 0.5rem 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.cat-header {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.35;
		padding: 0 0.75rem 0.4rem;
	}

	.cat-btn {
		width: 100%;
		text-align: left;
		padding: 0.3rem 0.75rem;
		font-size: 0.75rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--secondary-color);
		opacity: 0.6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: opacity 0.1s, background 0.1s;
	}

	.cat-btn:hover { opacity: 1; background: rgba(128,128,128,0.07); }

	.cat-btn--active {
		opacity: 1;
		background: rgba(128,128,128,0.14);
		font-weight: 600;
	}

	.elem-panel {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		position: relative;
	}

	.elem-inner {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
</style>
