<script lang="ts">
	import { ElementCategory, LiveStatsScene } from '$lib/models/enum';
	import type { CustomElement } from '$lib/models/constants/customElement';
	import { CustomElement as CustomElementId } from '$lib/models/constants/customElement';
	import SelectOption from '../visibilityCategories/SelectVisibilityOption.svelte';
	import { statsScene } from '$lib/utils/store.svelte';
	import { fly } from 'svelte/transition';
	import Player1HudSelect from '$lib/components/obs/overlays/selector/elementCategories/CustomHud/Player1HudSelect.svelte';
	import CustomElementSelect from '$lib/components/obs/overlays/selector/elementCategories/Custom/CustomElementSelect.svelte';
	import Session from '$lib/components/obs/overlays/selector/elementCategories/Session/Session.svelte';
	import CustomHudSelect from '$lib/components/obs/overlays/selector/elementCategories/CustomHud/CustomHudSelect.svelte';
	import RecentGamePlayer1SlippiData from '$lib/components/obs/overlays/selector/elementCategories/SlippiData/Player1SlippiData.svelte';
	import RecentGameCurrentPlayerSlippiData from '$lib/components/obs/overlays/selector/elementCategories/SlippiData/CurrentPlayerSlippiData.svelte';
	import RecentGameCurrentSetElementSelect from '$lib/components/obs/overlays/selector/elementCategories/CurrentSet/CurrentSetElementSelect.svelte';
	import RecentGamePlayer1AttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer1AttackCount.svelte';
	import RecentGamePlayer1ActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer1ActionCount.svelte';
	import EdgeStatsSelect from '$lib/components/obs/overlays/selector/elementCategories/PostGame/EdgeStatsSelect.svelte';
	import WinChanceSelect from '$lib/components/obs/overlays/selector/elementCategories/WinChanceSelect.svelte';
	import HighlightsSelect from '$lib/components/obs/overlays/selector/elementCategories/HighlightsSelect.svelte';
	import RecentGamePlayer1Overall from '$lib/components/obs/overlays/selector/elementCategories/PostGame/RecentGamePlayer1Overall.svelte';

	import CurrentMatchPlayer1AttackCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer1AttackCount.svelte';
	import CurrentMatchPlayer1ActionCount from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer1ActionCount.svelte';
	import CurrentMatchPlayer1Overall from '$lib/components/obs/overlays/selector/elementCategories/PostGameMatch/CurrentMatchPlayer1Overall.svelte';
	import RecentGame from './RecentMatchSummary/RecentGame.svelte';
	import Game1Summary from './RecentMatchSummary/Game1.svelte';
	import Game2Summary from './RecentMatchSummary/Game2.svelte';
	import Game3Summary from './RecentMatchSummary/Game3.svelte';
	import Game4Summary from './RecentMatchSummary/Game4.svelte';
	import Game5Summary from './RecentMatchSummary/Game5.svelte';
	import Player1ControllerInput from './CustomHud/Player1ControllerInput.svelte';
	import RankChangeData from './SlippiData/RankChangeData.svelte';
	import Player1PredictedSlippiData from './PredictedSlippiData/Player1PredictedSlippiData.svelte';
	import StrikingElementSelect from './Striking/StrikingElementSelect.svelte';
	import BingoElementSelect from './Bingo/BingoElementSelect.svelte';
	import IronManElementSelect from './IronMan/IronManElementSelect.svelte';
	import LiveGameElementSelect from './LiveGame/LiveGameElementSelect.svelte';
	import DoublesElementSelect from './Doubles/DoublesElementSelect.svelte';
	import Player1ActionStateSelect from './CustomHud/Player1ActionStateSelect.svelte';

	export let selectedElementId: CustomElement;
	export let open: boolean;

	function select(customElement: CustomEvent<CustomElement>) {
		selectedElementId = customElement.detail;
		open = false;
	}

	let selectedCategory: LiveStatsScene | ElementCategory = $statsScene;

	const ALL = Object.values(LiveStatsScene);
	const IN_GAME = [LiveStatsScene.InGame];
	const POST = [LiveStatsScene.PostGame, LiveStatsScene.PostSet];
	const PLAYER_DATA = [LiveStatsScene.Menu, LiveStatsScene.InGame, LiveStatsScene.PostGame, LiveStatsScene.PostSet];
	// Every category: the scenes it is offered in + one line on what it holds (shown above its elements).
	// Player categories list each element once — Styling → Player picks you / Player 1 / Player 2 / team slots.
	const CATEGORIES: { category: ElementCategory; scenes: LiveStatsScene[]; description: string }[] = [
		{ category: ElementCategory.LiveGame, scenes: ALL, description: 'The game drawn live from Slippi: a following camera and an animated radar.' },
		{ category: ElementCategory.GameCustomHud, scenes: IN_GAME, description: 'Game-wide HUD: timer, countdown, stage and the player radar.' },
		{ category: ElementCategory.PlayerHud, scenes: IN_GAME, description: "A player's HUD: character, stocks, percent and combo counter." },
		{ category: ElementCategory.PlayerControllerInput, scenes: IN_GAME, description: "A player's controller: buttons, D-pad, sticks and the L/R triggers, live." },
		{ category: ElementCategory.PlayerActionState, scenes: IN_GAME, description: 'What a player is doing right now: action state, techniques, hitstun, ledge, shield…' },
		{ category: ElementCategory.Doubles, scenes: ALL, description: 'Teams and ports: team names and stocks, ports, and live damage / KO stats.' },
		{ category: ElementCategory.WinChance, scenes: [...IN_GAME, ...POST], description: "Each side's chance to win this game and the set, from stocks, percent and time left." },
		{ category: ElementCategory.CurrentMatchStats, scenes: [LiveStatsScene.Menu, ...IN_GAME, ...POST, LiveStatsScene.RankChange], description: 'The set being played: game mode and best of.' },
		{ category: ElementCategory.Session, scenes: [LiveStatsScene.Menu, ...IN_GAME, LiveStatsScene.RankChange, ...POST], description: 'Your results this session: wins, losses, games and rating.' },
		{ category: ElementCategory.PlayerSlippiRank, scenes: PLAYER_DATA, description: "A player's Slippi profile: tag, connect code, rank, rating, placements and most played characters." },
		{ category: ElementCategory.PlayerPredictedRank, scenes: [...IN_GAME, LiveStatsScene.PostGame], description: 'Ranked: what a win or a loss of this match would do to the rank and rating.' },
		{ category: ElementCategory.RankChangeData, scenes: [LiveStatsScene.RankChange], description: 'After a ranked match: the new rank and how much the rating changed.' },
		{ category: ElementCategory.PlayerOverallStats, scenes: POST, description: "A player's stats from the last game: damage, openings, conversions, inputs per minute…" },
		{ category: ElementCategory.PlayerAttackCount, scenes: POST, description: 'How often a player used each attack in the last game.' },
		{ category: ElementCategory.PlayerActionCount, scenes: POST, description: 'How often a player wavedashed, L-cancelled, teched, grabbed… in the last game.' },
		{ category: ElementCategory.PlayerMatchOverallStats, scenes: POST, description: "A player's stats over the whole set." },
		{ category: ElementCategory.PlayerMatchAttackCount, scenes: POST, description: 'How often a player used each attack over the set.' },
		{ category: ElementCategory.PlayerMatchActionCount, scenes: POST, description: "A player's techniques over the set." },
		{ category: ElementCategory.EdgeStats, scenes: [...IN_GAME, ...POST], description: 'Edge cancels and edgeguards, for the game and the set.' },
		{ category: ElementCategory.Highlights, scenes: ALL, description: 'A video or image (a file, or what a flow puts on a key) and highlights redrawn from replays.' },
		{ category: ElementCategory.PostSetStats, scenes: [LiveStatsScene.PostSet], description: 'The finished set.' },
		{ category: ElementCategory.RecentGameSummary, scenes: POST, description: 'The last game: stage, score and the characters played.' },
		{ category: ElementCategory.Game1Summary, scenes: POST, description: 'Game 1 of the set: stage, score and characters.' },
		{ category: ElementCategory.Game2Summary, scenes: POST, description: 'Game 2 of the set: stage, score and characters.' },
		{ category: ElementCategory.Game3Summary, scenes: POST, description: 'Game 3 of the set: stage, score and characters.' },
		{ category: ElementCategory.Game4Summary, scenes: POST, description: 'Game 4 of the set: stage, score and characters.' },
		{ category: ElementCategory.Game5Summary, scenes: POST, description: 'Game 5 of the set: stage, score and characters.' },
		{ category: ElementCategory.StageStriking, scenes: ALL, description: 'Stage striking for sets: stages, strikes, picks, RPS and character picks.' },
		{ category: ElementCategory.Minigames, scenes: ALL, description: 'Bingo board and Iron Man rosters, progress and counts.' },
		{ category: ElementCategory.Custom, scenes: ALL, description: 'Your own text, images, boxes and embedded web pages.' },
	];
	$: buttons = CATEGORIES.map((c) => ({ ...c, visible: c.scenes.includes($statsScene) }));
	$: description = CATEGORIES.find((c) => c.category === selectedCategory)?.description ?? '';
	// Open on the first category this scene offers (not an empty panel).
	$: if (!buttons.some((b) => b.visible && b.category === selectedCategory)) selectedCategory = buttons.find((b) => b.visible)?.category ?? selectedCategory;
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
				in:fly={{ duration: 150, x: 16, delay: 100 }}
				out:fly={{ duration: 100, x: -16 }}
				class="elem-inner"
			>
				{#if description}<p class="cat-description">{description}</p>{/if}
				{#if selectedCategory === ElementCategory.Doubles}
					<DoublesElementSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.LiveGame}
					<LiveGameElementSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Minigames}
					<div class="flex flex-col gap-2">
						<BingoElementSelect on:select={select} />
						<IronManElementSelect on:select={select} />
					</div>
				{/if}
				{#if selectedCategory === ElementCategory.StageStriking}
					<StrikingElementSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Custom}
					<CustomElementSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.GameCustomHud}
					<CustomHudSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.PlayerHud}
					<Player1HudSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.PlayerControllerInput}
					<Player1ControllerInput on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.PlayerActionState}
					<Player1ActionStateSelect on:select={select} />
					<SelectOption description="The current game frame number" value={CustomElementId.InGameFrame} on:select={select}>Game Frame</SelectOption>
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
				{#if selectedCategory === ElementCategory.PlayerSlippiRank}
					<RecentGamePlayer1SlippiData on:select={select} />
					<SelectOption description="Your Slippi tag (you only)" value={CustomElementId.SlippiRankCurrentPlayerTag} on:select={select}>Your Tag</SelectOption>
					<SelectOption description="Your rating over time (you only)" value={CustomElementId.SlippiRankCurrentPlayerRatingGraph} on:select={select}>Your Rating Graph</SelectOption>
				{/if}
				{#if selectedCategory === ElementCategory.PlayerPredictedRank}
					<Player1PredictedSlippiData on:select={select} />
				{/if}

				{#if selectedCategory === ElementCategory.PlayerAttackCount}
					<RecentGamePlayer1AttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.PlayerActionCount}
					<RecentGamePlayer1ActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.PlayerOverallStats}
					<RecentGamePlayer1Overall on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.Highlights}
					<HighlightsSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.WinChance}
					<WinChanceSelect on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.EdgeStats}
					<EdgeStatsSelect on:select={select} />
				{/if}

				{#if selectedCategory === ElementCategory.PlayerMatchAttackCount}
					<CurrentMatchPlayer1AttackCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.PlayerMatchActionCount}
					<CurrentMatchPlayer1ActionCount on:select={select} />
				{/if}
				{#if selectedCategory === ElementCategory.PlayerMatchOverallStats}
					<CurrentMatchPlayer1Overall on:select={select} />
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

	/* The leaving and the arriving list share one grid cell, so they never stack; the new one waits
	   for the old one to leave (in delay = out duration). */
	.elem-panel {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		position: relative;
		display: grid;
		align-content: start;
	}

	.cat-description {
		font-size: 0.75rem;
		opacity: 0.6;
		margin-bottom: 0.35rem;
	}

	.elem-inner {
		grid-area: 1 / 1;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
</style>
