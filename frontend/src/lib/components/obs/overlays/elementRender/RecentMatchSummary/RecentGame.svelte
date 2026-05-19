<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { gameScore, gameSettings } from '$lib/utils/store.svelte';
	import GameStage from '../../element/GameStage.svelte';
	import CharacterIcon from '../../element/CharacterIcon.svelte';
	import CharacterRender from '../../element/CharacterRender.svelte';
	import { Character } from '$lib/models/enum';
	import { Stage } from '$lib/models/constants/stageData';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import { GameStats, Player } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let game: GameStats | undefined;
	export let currentPlayers: Player[];

	$: player1 = game?.settings?.players.at(currentPlayers?.at(0)?.playerIndex ?? 0);
	$: player2 = game?.settings?.players.at(currentPlayers?.at(1)?.playerIndex ?? 1);
</script>

{#if dataItem?.elementId === CustomElement.CurrentSetGameRecentStage}
	<GameStage
		{style}
		{dataItem}
		{defaultPreview}
		stageId={game?.settings?.stageId}
		fallbackStageId={Stage.YOSHIS_ISLAND_N64}
	/>
{:else if dataItem?.elementId === CustomElement.MatchGameMode}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `UNRANKED`
			: ($gameSettings?.matchInfo?.mode ?? 'LOCAL').toUpperCase()}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer1Score}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `1` : $gameScore.at(0) ? $gameScore[0] : '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer2Score}
	<TextElement {style} {dataItem}>
		{defaultPreview ? `0` : $gameScore.at(1) ? $gameScore[1] : '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer1CharacterIcon}
	<CharacterIcon
		{style}
		{dataItem}
		player={player1}
		{defaultPreview}
		defaultPreviewId={Character.Ganondorf}
	/>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer2CharacterIcon}
	<CharacterIcon
		{style}
		{dataItem}
		player={player2}
		{defaultPreview}
		defaultPreviewId={Character.Falcon}
	/>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer1CharacterRenderLeft}
	<CharacterRender
		{style}
		{dataItem}
		player={player1}
		{defaultPreview}
		defaultPreviewId={Character.Ganondorf}
		direction="left"
	/>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer1CharacterRenderRight}
	<CharacterRender
		{style}
		{dataItem}
		player={player1}
		{defaultPreview}
		defaultPreviewId={Character.Ganondorf}
		direction="right"
	/>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer2CharacterRenderLeft}
	<CharacterRender
		{style}
		{dataItem}
		player={player2}
		{defaultPreview}
		defaultPreviewId={Character.Falcon}
		direction="left"
	/>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer2CharacterRenderRight}
	<CharacterRender
		{style}
		{dataItem}
		player={player2}
		{defaultPreview}
		defaultPreviewId={Character.Falcon}
		direction="right"
	/>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer1StocksRemaining}
	<TextElement {style} {dataItem}>
		{game
			? game?.lastFrame?.players?.[currentPlayers?.at(0)?.playerIndex ?? 0]?.post
					.stocksRemaining
			: defaultPreview
			? `2`
			: '0'}
	</TextElement>
{:else if dataItem?.elementId === CustomElement.CurrentSetGameRecentPlayer2StocksRemaining}
	<TextElement {style} {dataItem}>
		{game
			? game?.lastFrame?.players?.[currentPlayers?.at(1)?.playerIndex ?? 1]?.post
					.stocksRemaining
			: defaultPreview
			? `0`
			: '0'}
	</TextElement>
{/if}
