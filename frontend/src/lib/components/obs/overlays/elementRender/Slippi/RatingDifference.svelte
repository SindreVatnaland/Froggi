<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { isNil } from 'lodash';
	import TextElement from '../../element/TextElement.svelte';
	import { CurrentPlayer, GameStartTypeExtended } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean = false;
	export let style: GridContentItemStyle;
	export let currentPlayer: CurrentPlayer;
	export let gameSettings: GameStartTypeExtended;

	let currentDifference: number | null;
	$: gameSettings, (currentDifference = null);
	$: difference =
		(currentPlayer?.rank?.new?.rating ?? 0) - (currentPlayer?.rank?.current?.rating ?? 0);

	$: currentDifference = getCurrentDifference(difference);

	const getCurrentDifference = (difference: number) => {
		if (!isNil(currentDifference)) return currentDifference;
		if (difference < 0.1) return Number(difference.toFixed(2));
		return Number(difference.toFixed(1));
	};
</script>

{#if defaultPreview || !isNil(currentDifference)}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? `+132.41`
			: currentDifference
			? `${currentDifference >= 0 ? '+' : ''}${currentDifference}`
			: '+0'}
	</TextElement>
{/if}
