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
	export let stats: StatsType | null | undefined;

	$: actionCounts = stats?.actionCounts?.[playerIndex ?? 0];
</script>

{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountAirDodge}
	<TextElement {style} {dataItem}>
		{![actionCounts?.airDodgeCount, playerIndex].some(isNil)
			? actionCounts?.airDodgeCount
			: defaultPreview
			? `${52 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountDashDance}
	<TextElement {style} {dataItem}>
		{![actionCounts?.dashDanceCount, playerIndex].some(isNil)
			? actionCounts?.dashDanceCount
			: defaultPreview
			? `${137 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountLedgeGrab}
	<TextElement {style} {dataItem}>
		{![actionCounts?.ledgegrabCount, playerIndex].some(isNil)
			? actionCounts?.ledgegrabCount
			: defaultPreview
			? `${19 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountRoll}
	<TextElement {style} {dataItem}>
		{![actionCounts?.rollCount, playerIndex].some(isNil)
			? actionCounts?.rollCount
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountSpotDodge}
	<TextElement {style} {dataItem}>
		{![actionCounts?.spotDodgeCount, playerIndex].some(isNil)
			? actionCounts?.spotDodgeCount
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountWaveDash}
	<TextElement {style} {dataItem}>
		{![actionCounts?.wavedashCount, playerIndex].some(isNil)
			? actionCounts?.wavedashCount
			: defaultPreview
			? `${63 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountWaveLand}
	<TextElement {style} {dataItem}>
		{![actionCounts?.wavelandCount, playerIndex].some(isNil)
			? actionCounts?.wavelandCount
			: defaultPreview
			? `${37 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGrabTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount, playerIndex].some(isNil)
			? (actionCounts?.grabCount.success ?? 0) + (actionCounts?.grabCount.fail ?? 0)
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGrabSuccess}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount.success, playerIndex].some(isNil)
			? actionCounts?.grabCount.success
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGrabSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGrabFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.grabCount.fail, playerIndex].some(isNil)
			? actionCounts?.grabCount.fail
			: defaultPreview
			? `${5 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGrabFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechTotal}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechSuccess}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechIn}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.in
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechAway}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.away
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechNeutral}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.neutral
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.groundTechCount, playerIndex].some(isNil)
			? actionCounts?.groundTechCount.fail
			: defaultPreview
			? `${1 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountGroundTechFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountLCancelTotal}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount, playerIndex].some(isNil)
			? (actionCounts?.lCancelCount.success ?? 0) + (actionCounts?.lCancelCount.fail ?? 0)
			: defaultPreview
			? `${54 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountLCancelSuccess}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount.success, playerIndex].some(isNil)
			? actionCounts?.lCancelCount.success
			: defaultPreview
			? `${42 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountLCancelSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountLCancelFail}
	<TextElement {style} {dataItem}>
		{![actionCounts?.lCancelCount.fail, playerIndex].some(isNil)
			? actionCounts?.lCancelCount.fail
			: defaultPreview
			? `${12 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountLCancelFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountThrowTotal}
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
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountThrowUp}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.up
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountThrowDown}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.down
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountThrowBack}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.back
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGamePlayer2ActionCountThrowForward}
	<TextElement {style} {dataItem}>
		{![actionCounts?.throwCount, playerIndex].some(isNil)
			? actionCounts?.throwCount.forward
			: defaultPreview
			? `${4 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
