<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { currentPlayer, postGame } from '$lib/utils/store.svelte';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import { isNil } from 'lodash';
	import { StatsType } from '@slippi/slippi-js';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let playerIndex: number;
	export let stats: StatsType | null;

	$: actionCounts = stats?.actionCounts?.[playerIndex ?? 0];
</script>

{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountAirDodge}
	<TextElement {style} {dataItem}>
		{![actionCounts?.airDodgeCount, playerIndex].some(isNil)
			? actionCounts?.airDodgeCount
			: defaultPreview
			? `${52 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountDashDance}
	<TextElement {style} {dataItem}>
		{![actionCounts?.dashDanceCount, playerIndex].some(isNil)
			? actionCounts?.dashDanceCount
			: defaultPreview
			? `${137 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountLedgeGrab}
	<TextElement {style} {dataItem}>
		{![actionCounts?.ledgegrabCount, playerIndex].some(isNil)
			? actionCounts?.ledgegrabCount
			: defaultPreview
			? `${19 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountRoll}
	<TextElement {style} {dataItem}>
		{![actionCounts?.rollCount, playerIndex].some(isNil)
			? actionCounts?.rollCount
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountSpotDodge}
	<TextElement {style} {dataItem}>
		{![actionCounts?.spotDodgeCount, playerIndex].some(isNil)
			? actionCounts?.spotDodgeCount
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountWaveDash}
	<TextElement {style} {dataItem}>
		{![actionCounts?.wavedashCount, playerIndex].some(isNil)
			? actionCounts?.wavedashCount
			: defaultPreview
			? `${63 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountWaveLand}
	<TextElement {style} {dataItem}>
		{![actionCounts?.wavelandCount, playerIndex].some(isNil)
			? actionCounts?.wavelandCount
			: defaultPreview
			? `${37 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGrabTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount, playerIndex].some(isNil)
			? (actionCounts?.grabCount.success ?? 0) + (actionCounts?.grabCount.fail ?? 0)
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGrabSuccess}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount.success, playerIndex].some(isNil)
			? actionCounts?.grabCount.success
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGrabSuccessPercent}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount, playerIndex].some(isNil)
			? Number(
					(
						(actionCounts?.grabCount.success ?? 0) /
						((actionCounts?.grabCount.success ?? 0) +
							(actionCounts?.grabCount.fail ?? 0))
					).toFixed(1),
			  ) * 100
			: defaultPreview
			? `${64.2 + 1}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGrabFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount.fail, playerIndex].some(isNil)
			? actionCounts?.grabCount.fail
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGrabFailPercent}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount, playerIndex].some(isNil)
			? Number(
					(
						(actionCounts?.grabCount.fail ?? 0) /
						((actionCounts?.grabCount.success ?? 0) +
							(actionCounts?.grabCount.fail ?? 0))
					).toFixed(1),
			  ) * 100
			: defaultPreview
			? `${37.8 - playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? (actionCounts?.groundTechCount.neutral ?? 0) +
			  (actionCounts?.groundTechCount.in ?? 0) +
			  (actionCounts?.groundTechCount.away ?? 0) +
			  (actionCounts?.groundTechCount.fail ?? 0)
			: defaultPreview
			? `${23 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechSuccess}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? (actionCounts?.groundTechCount.neutral ?? 0) +
			  (actionCounts?.groundTechCount.in ?? 0) +
			  (actionCounts?.groundTechCount.away ?? 0)
			: defaultPreview
			? `${22 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechSuccessPercent}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? Number(
					(
						((actionCounts?.groundTechCount.neutral ?? 0) +
							(actionCounts?.groundTechCount.in ?? 0) +
							(actionCounts?.groundTechCount.away ?? 0)) /
						((actionCounts?.groundTechCount.fail ?? 0) +
							(actionCounts?.groundTechCount.neutral ?? 0) +
							(actionCounts?.groundTechCount.in ?? 0) +
							(actionCounts?.groundTechCount.away ?? 0))
					).toFixed(),
			  ) * 100
			: defaultPreview
			? `${95.6 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechIn}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.in
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechAway}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.away
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechNeutral}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.neutral
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.fail
			: defaultPreview
			? `${1 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountGroundTechFailPercent}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? Number(
					(
						(actionCounts?.groundTechCount.fail ?? 0) /
						((actionCounts?.groundTechCount.fail ?? 0) +
							(actionCounts?.groundTechCount.neutral ?? 0) +
							(actionCounts?.groundTechCount.in ?? 0) +
							(actionCounts?.groundTechCount.away ?? 0))
					).toFixed(),
			  ) * 100
			: defaultPreview
			? `${4.4 - playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountLCancelTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount, playerIndex].some(isNil)
			? (actionCounts?.lCancelCount.success ?? 0) + (actionCounts?.lCancelCount.fail ?? 0)
			: defaultPreview
			? `${54 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountLCancelSuccess}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount.success, playerIndex].some(isNil)
			? actionCounts?.lCancelCount.success
			: defaultPreview
			? `${42 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountLCancelSuccessPercent}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount, playerIndex].some(isNil)
			? Number(
					(
						(actionCounts?.lCancelCount.success ?? 0) /
						((actionCounts?.lCancelCount.success ?? 0) +
							(actionCounts?.lCancelCount.fail ?? 0))
					).toFixed(1) ?? 0.0,
			  ) * 100
			: defaultPreview
			? `${77.8 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountLCancelFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount.fail, playerIndex].some(isNil)
			? actionCounts?.lCancelCount.fail
			: defaultPreview
			? `${12 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountLCancelFailPercent}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount, playerIndex].some(isNil)
			? Number(
					(
						(actionCounts?.lCancelCount.fail ?? 0) /
						((actionCounts?.lCancelCount.fail ?? 0) +
							(actionCounts?.lCancelCount.fail ?? 0))
					).toFixed(1),
			  ) * 100
			: defaultPreview
			? `${22.2 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountThrowTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? (actionCounts?.throwCount.up ?? 0) +
			  (actionCounts?.throwCount.forward ?? 0) +
			  (actionCounts?.throwCount.back ?? 0) +
			  (actionCounts?.throwCount.down ?? 0)
			: defaultPreview
			? `${17 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountThrowUp}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.up
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountThrowDown}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.down
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountThrowBack}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.back
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameCurrentPlayerActionCountThrowForward}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.forward
			: defaultPreview
			? `${4 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
