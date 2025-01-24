<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { Player } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let player: Player | undefined;
	export let preview: boolean = false;
	export let style: GridContentItemStyle;
	export let fallbackIcon = 'GOLD 2';

	const playerRankIcon = player?.rank?.current?.rank?.toUpperCase();
	$: getRankIcon = (rankIcon: string | undefined) => {
		if (preview) return fallbackIcon;
		if (rankIcon) return rankIcon;
		return '';
	};
	$: rankIcon = getRankIcon(playerRankIcon);
</script>

{#if rankIcon}
	<div
		class={`w-full h-full ${style.classValue}`}
		style={`${style.cssValue}; ${
			dataItem?.data.advancedStyling ? dataItem?.data.css.customBox : ''
		}; `}
	>
		<img
			class="w-full h-full object-contain"
			style={`${dataItem?.data.advancedStyling ? dataItem?.data.css.customImage : ''};`}
			src={`/image/rank-icons/${rankIcon}.svg`}
			alt="rank-icon"
		/>
	</div>
{/if}
