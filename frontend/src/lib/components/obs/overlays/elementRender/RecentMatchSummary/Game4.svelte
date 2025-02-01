<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import GameStage from '../../element/GameStage.svelte';
	import { Stage } from '$lib/models/constants/stageData';
	import CharacterIcon from '../../element/CharacterIcon.svelte';
	import CharacterRender from '../../element/CharacterRender.svelte';
	import { Character } from '$lib/models/enum';
	import { GameStats, Player } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let recentGames: GameStats[];
	export let currentPlayers: Player[];

	$: gameNumber = recentGames.length > 5 ? -5 : 0;
	$: game = recentGames.at(gameNumber);

	$: player1 = game?.settings?.players.at(currentPlayers?.at(0)?.playerIndex ?? 0);
	$: player2 = game?.settings?.players.at(currentPlayers?.at(1)?.playerIndex ?? 1);
</script>

{#if dataItem?.elementId === CustomElement.CurrentSetGame4Stage}
	<GameStage
		{style}
		{dataItem}
		{defaultPreview}
		stageId={game?.settings?.stageId}
		fallbackStageId={Stage.POKEMON_STADIUM}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player1Score}
	<TextElement {style} {dataItem}>
		{game?.score.at(0) ? game.score[0] : defaultPreview ? `2` : '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player2Score}
	<TextElement {style} {dataItem}>
		{game?.score.at(1) ? game.score[1] : defaultPreview ? `2` : '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player1CharacterIcon}
	<CharacterIcon
		{style}
		{dataItem}
		player={player1}
		{defaultPreview}
		defaultPreviewId={Character.Fox}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player2CharacterIcon}
	<CharacterIcon
		{style}
		{dataItem}
		player={player2}
		{defaultPreview}
		defaultPreviewId={Character.Falcon}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player1CharacterRenderLeft}
	<CharacterRender
		{style}
		{dataItem}
		player={player1}
		{defaultPreview}
		defaultPreviewId={Character.Ganondorf}
		direction="left"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player1CharacterRenderRight}
	<CharacterRender
		{style}
		{dataItem}
		player={player1}
		{defaultPreview}
		defaultPreviewId={Character.Ganondorf}
		direction="right"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player2CharacterRenderLeft}
	<CharacterRender
		{style}
		{dataItem}
		player={player2}
		{defaultPreview}
		defaultPreviewId={Character.Falcon}
		direction="left"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player2CharacterRenderRight}
	<CharacterRender
		{style}
		{dataItem}
		player={player2}
		{defaultPreview}
		defaultPreviewId={Character.Falcon}
		direction="right"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player1StocksRemaining}
	<TextElement {style} {dataItem}>
		{game
			? game?.lastFrame?.players?.[currentPlayers?.at(0)?.playerIndex ?? 0]?.post
					.stocksRemaining
			: defaultPreview
			? `3`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.CurrentSetGame4Player2StocksRemaining}
	<TextElement {style} {dataItem}>
		{game
			? game?.lastFrame?.players?.[currentPlayers?.at(1)?.playerIndex ?? 1]?.post
					.stocksRemaining
			: defaultPreview
			? `0`
			: '0'}
	</TextElement>
{/if}
