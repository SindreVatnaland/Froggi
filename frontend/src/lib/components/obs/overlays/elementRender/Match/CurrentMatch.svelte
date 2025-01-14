<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { BestOf } from '$lib/models/enum';
	import { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { GameStartTypeExtended, Player } from '$lib/models/types/slippiData';
	import TextElement from '../../element/TextElement.svelte';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let currentPlayers: Player[];
	export let gameScore: number[];
	export let gameSettings: GameStartTypeExtended;

	const bestOf = gameSettings?.matchInfo?.bestOf ?? BestOf.BestOf3;
	const player1Tag = currentPlayers.at(0)?.displayName ?? '';
	const player2Tag = currentPlayers.at(1)?.displayName ?? '';
	const player1Score = gameScore.at(0) ?? 0;
	const player2Score = gameScore.at(1) ?? 0;
</script>

{#if dataItem?.elementId === CustomElement.MatchBestOf}
	<TextElement {style} {dataItem}>
		{defaultPreview ? BestOf.BestOf3 : bestOf ?? BestOf.BestOf3}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.MatchPlayer1Tag}
	<TextElement {style} {dataItem}>
		{defaultPreview ? 'Player1' : player1Tag ?? 'Player1'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.MatchPlayer2Tag}
	<TextElement {style} {dataItem}>
		{defaultPreview ? 'Player2' : player2Tag ?? 'Player2'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.MatchPlayer1Score}
	<TextElement {style} {dataItem}>
		{defaultPreview ? 2 : player1Score ?? 0}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.MatchPlayer2Score}
	<TextElement {style} {dataItem}>
		{defaultPreview ? 1 : player2Score ?? 0}
	</TextElement>
{/if}
