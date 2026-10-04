<script lang="ts">
	import type { GridContentItem } from '$lib/models/types/overlay';
	import {
		localEmitter,
		gameFrame,
		gameState,
		gameSettings,
		currentPlayers,
		currentPlayer,
		gameScore,
		postGame,
		recentGames,
		sessionStats,
		strikeState,
	} from '$lib/utils/store.svelte';
	import { onMount } from 'svelte';
	import { inGameVisibilityOption } from './visibilityConditions/InGameVisibilityOptions.svelte';
	import { inGamePlayer1VisibilityOption } from './visibilityConditions/InGamePlayer1VisibilityOptions.svelte';
	import { inGamePlayer2VisibilityOption } from './visibilityConditions/InGamePlayer2VisibilityOptions.svelte';
	import { postGameVisibilityOption } from './visibilityConditions/PostGameVisibilityOptions.svelte';
	import { postGame1SummaryVisibilityOption } from './visibilityConditions/PostGame1SummaryVisibilityOptions.svelte';
	import { postGame2SummaryVisibilityOption } from './visibilityConditions/PostGame2SummaryVisibilityOptions.svelte';
	import { postGame3SummaryVisibilityOption } from './visibilityConditions/PostGame3SummaryVisibilityOptions.svelte';
	import { postGame4SummaryVisibilityOption } from './visibilityConditions/PostGame4SummaryVisibilityOptions.svelte';
	import { postGame5SummaryVisibilityOption } from './visibilityConditions/PostGame5SummaryVisibilityOptions.svelte';
	import { sessionVisibilityOption } from './visibilityConditions/SessionVisibilityOptions.svelte';
	import { matchStatsVisibilityOption } from './visibilityConditions/MatchStatsVisibilityOptions.svelte';
	import { rankVisibilityOption } from './visibilityConditions/RankVisibilityOptions.svelte';
	import { InGameState } from '$lib/models/enum';
	import { FrameEntryType } from '@slippi/slippi-js';
	import {
		CurrentPlayer,
		GameStartTypeExtended,
		GameStats,
		Player,
		SessionStats,
	} from '$lib/models/types/slippiData';
	import { rankPredictionVisibilityOption } from './visibilityConditions/RankPredictionVisibilityOptions.svelte';
	import { strikeVisibilityOption } from './visibilityConditions/StrikeVisibilityOptions.svelte';
	import type { StrikeState } from '$lib/models/types/stageStriking';
	export let animationIn: Function;
	export let animationOut: Function;
	export let dataItem: GridContentItem;
	export let preview: boolean;
	export let edit: boolean = false;
	export let isDemo: boolean = false;
	export let overlayId: string | undefined = undefined;

	let visible = true;
	const updateVisibilityValue = (
		dataItem: GridContentItem,
		gameSettings: GameStartTypeExtended,
		gameState: InGameState,
		gameScore: number[],
		gameFrame: FrameEntryType | null | undefined,
		postGame: GameStats,
		recentGames: GameStats[],
		currentPlayer: CurrentPlayer | undefined,
		currentPlayers: Player[],
		sessionStats: SessionStats | undefined,
		strikeStateVal: StrikeState | undefined,
	) => {
		if (edit || preview) return true;

		const options = dataItem.data.visibility.selectedOptions;

		if (!options || options.length === 0) {
			return false;
		}

		visible = options.every((option) => {
			if (
				inGameVisibilityOption(
					option,
					currentPlayers,
					gameSettings,
					gameFrame,
					gameState,
					gameScore,
				) ||
				inGamePlayer1VisibilityOption(option, gameFrame, currentPlayers) ||
				inGamePlayer2VisibilityOption(option, gameFrame, currentPlayers) ||
				matchStatsVisibilityOption(option, gameScore) ||
				postGameVisibilityOption(option, currentPlayers, currentPlayer, postGame) ||
				postGame1SummaryVisibilityOption(
					option,
					currentPlayers,
					currentPlayer,
					recentGames,
				) ||
				postGame2SummaryVisibilityOption(
					option,
					currentPlayers,
					currentPlayer,
					recentGames,
				) ||
				postGame3SummaryVisibilityOption(
					option,
					currentPlayers,
					currentPlayer,
					recentGames,
				) ||
				postGame4SummaryVisibilityOption(
					option,
					currentPlayers,
					currentPlayer,
					recentGames,
				) ||
				postGame5SummaryVisibilityOption(
					option,
					currentPlayers,
					currentPlayer,
					recentGames,
				) ||
				rankVisibilityOption(option, currentPlayer) ||
				rankPredictionVisibilityOption(option, currentPlayer, gameSettings) ||
				sessionVisibilityOption(option, sessionStats) ||
				strikeVisibilityOption(option, strikeStateVal)
			) {
				return true;
			}
			return false;
		});
	};

	$: {
		updateVisibilityValue(
			dataItem,
			$gameSettings,
			$gameState,
			$gameScore,
			$gameFrame,
			$postGame,
			$recentGames,
			$currentPlayer,
			$currentPlayers,
			$sessionStats,
			$strikeState,
		);
	}

	const toggleVisibility = () => {
		visible = !visible;
	};

	onMount(() => {
		if (isDemo) {
			$localEmitter.on('TestVisibilityTrigger', toggleVisibility);
			return () => $localEmitter.off('TestVisibilityTrigger', toggleVisibility);
		}
		if (!preview) return;
		// Preview test: hide then show again so both the out and the in animation play.
		const previewHandler = (targetOverlayId?: string, itemId?: string) => {
			if (targetOverlayId && overlayId && targetOverlayId !== overlayId) return;
			if (itemId && itemId !== dataItem?.id) return;
			const out = dataItem?.data?.visibility?.out?.options;
			if (!visible || dataItem?.data?.visibility?.out?.type === 'none') return;
			visible = false;
			setTimeout(() => (visible = true), (Number(out?.delay) || 0) + (Number(out?.duration) || 0) + 300);
		};
		$localEmitter.on('PreviewTestAnimation', previewHandler);
		return () => $localEmitter.off('PreviewTestAnimation', previewHandler);
	});
</script>

{#if edit}
	<div class="w-full h-full absolute top-0 left-0">
		<slot />
	</div>
{:else if Boolean(visible)}
	<div class="w-full h-full" in:animationIn|local out:animationOut|local>
		<slot />
	</div>
{/if}
