<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
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

{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountAirDodge}
	<TextElement {style} {dataItem}>
		{![actionCounts?.airDodgeCount, playerIndex].some(isNil)
			? actionCounts?.airDodgeCount
			: defaultPreview
			? `${52 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountDashDance}
	<TextElement {style} {dataItem}>
		{![actionCounts?.dashDanceCount, playerIndex].some(isNil)
			? actionCounts?.dashDanceCount
			: defaultPreview
			? `${137 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountLedgeGrab}
	<TextElement {style} {dataItem}>
		{![actionCounts?.ledgegrabCount, playerIndex].some(isNil)
			? actionCounts?.ledgegrabCount
			: defaultPreview
			? `${19 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountRoll}
	<TextElement {style} {dataItem}>
		{![actionCounts?.rollCount, playerIndex].some(isNil)
			? actionCounts?.rollCount
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountSpotDodge}
	<TextElement {style} {dataItem}>
		{![actionCounts?.spotDodgeCount, playerIndex].some(isNil)
			? actionCounts?.spotDodgeCount
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountWaveDash}
	<TextElement {style} {dataItem}>
		{![actionCounts?.wavedashCount, playerIndex].some(isNil)
			? actionCounts?.wavedashCount
			: defaultPreview
			? `${63 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountWaveLand}
	<TextElement {style} {dataItem}>
		{![actionCounts?.wavelandCount, playerIndex].some(isNil)
			? actionCounts?.wavelandCount
			: defaultPreview
			? `${37 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGrabTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount, playerIndex].some(isNil)
			? (actionCounts?.grabCount.success ?? 0) + (actionCounts?.grabCount.fail ?? 0)
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGrabSuccess}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount.success, playerIndex].some(isNil)
			? actionCounts?.grabCount.success
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGrabSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGrabFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount.fail, playerIndex].some(isNil)
			? actionCounts?.grabCount.fail
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGrabFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechTotal}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechSuccess}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechIn}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.in
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechAway}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.away
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechNeutral}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.neutral
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.fail
			: defaultPreview
			? `${1 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountGroundTechFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountLCancelTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount, playerIndex].some(isNil)
			? (actionCounts?.lCancelCount.success ?? 0) + (actionCounts?.lCancelCount.fail ?? 0)
			: defaultPreview
			? `${54 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountLCancelSuccess}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount.success, playerIndex].some(isNil)
			? actionCounts?.lCancelCount.success
			: defaultPreview
			? `${42 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountLCancelSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountLCancelFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount.fail, playerIndex].some(isNil)
			? actionCounts?.lCancelCount.fail
			: defaultPreview
			? `${12 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountLCancelFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountThrowTotal}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountThrowUp}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.up
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountThrowDown}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.down
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountThrowBack}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.back
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer1ActionCountThrowForward}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.forward
			: defaultPreview
			? `${4 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
