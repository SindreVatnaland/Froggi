<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import TextElement from '$lib/components/obs/overlays/element/TextElement.svelte';
	import { MatchStats } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;

	export let playerIndex: number;
	export let stats: MatchStats;

	$: actionCount = stats?.actionCounts?.[playerIndex ?? 0];
</script>

{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountAirDodge}
	<TextElement {style} {dataItem}>
		{![actionCount?.airDodgeCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.airDodgeCount
			: defaultPreview
			? `${53 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountDashDance}
	<TextElement {style} {dataItem}>
		{![actionCount?.dashDanceCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.dashDanceCount
			: defaultPreview
			? `${137 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountLedgeGrab}
	<TextElement {style} {dataItem}>
		{![actionCount?.dashDanceCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.dashDanceCount
			: defaultPreview
			? `${19 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountRoll}
	<TextElement {style} {dataItem}>
		{![actionCount?.rollCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.rollCount
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountSpotDodge}
	<TextElement {style} {dataItem}>
		{![actionCount?.spotDodgeCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.spotDodgeCount
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountWaveDash}
	<TextElement {style} {dataItem}>
		{![actionCount?.wavedashCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.wavedashCount
			: defaultPreview
			? `${63 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountWaveLand}
	<TextElement {style} {dataItem}>
		{![actionCount?.wavelandCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.wavelandCount
			: defaultPreview
			? `${37 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGrabTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.grabCount.success ?? 0) + (actionCount?.grabCount.fail ?? 0)
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGrabSuccess}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount.success, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.grabCount.success
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGrabSuccessPercent}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount, playerIndex].some((e) => e === undefined || e === null)
			? Number(
					(
						(actionCount?.grabCount.success ?? 0) /
						((actionCount?.grabCount.success ?? 0) + (actionCount?.grabCount.fail ?? 0))
					).toFixed(1),
			  ) * 100
			: defaultPreview
			? `${64.2 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGrabFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount.fail, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.grabCount.fail
			: defaultPreview
			? `${5 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGrabFailPercent}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount, playerIndex].some((e) => e === undefined || e === null)
			? Number(
					(
						(actionCount?.grabCount.fail ?? 0) /
						((actionCount?.grabCount.success ?? 0) + (actionCount?.grabCount.fail ?? 0))
					).toFixed(1),
			  ) * 100
			: defaultPreview
			? `${37.8 - playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.groundTechCount.neutral ?? 0) +
			  (actionCount?.groundTechCount.in ?? 0) +
			  (actionCount?.groundTechCount.away ?? 0) +
			  (actionCount?.groundTechCount.fail ?? 0)
			: defaultPreview
			? `${23 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechSuccess}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.groundTechCount.neutral ?? 0) +
			  (actionCount?.groundTechCount.in ?? 0) +
			  (actionCount?.groundTechCount.away ?? 0)
			: defaultPreview
			? `${22 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechSuccessPercent}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? Number(
					(
						((actionCount?.groundTechCount.neutral ?? 0) +
							(actionCount?.groundTechCount.in ?? 0) +
							(actionCount?.groundTechCount.away ?? 0)) /
						((actionCount?.groundTechCount.fail ?? 0) +
							(actionCount?.groundTechCount.neutral ?? 0) +
							(actionCount?.groundTechCount.in ?? 0) +
							(actionCount?.groundTechCount.away ?? 0))
					).toFixed(),
			  ) * 100
			: defaultPreview
			? `${95.6 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechIn}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.in
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechAway}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.away
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechNeutral}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.neutral
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.fail
			: defaultPreview
			? `${1 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountGroundTechFailPercent}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? Number(
					(
						(actionCount?.groundTechCount.fail ?? 0) /
						((actionCount?.groundTechCount.fail ?? 0) +
							(actionCount?.groundTechCount.neutral ?? 0) +
							(actionCount?.groundTechCount.in ?? 0) +
							(actionCount?.groundTechCount.away ?? 0))
					).toFixed(),
			  ) * 100
			: defaultPreview
			? `${4.4 - playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountLCancelTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.lCancelCount.success ?? 0) + (actionCount?.lCancelCount.fail ?? 0)
			: defaultPreview
			? `${54 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountLCancelSuccess}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.lCancelCount.success
			: defaultPreview
			? `${42 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountLCancelSuccessPercent}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? Number(
					(
						(actionCount?.lCancelCount.success ?? 0) /
						((actionCount?.lCancelCount.success ?? 0) +
							(actionCount?.lCancelCount.fail ?? 0))
					).toFixed(1) ?? 0.0,
			  ) * 100
			: defaultPreview
			? `${77.8 + playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountLCancelFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.lCancelCount.fail
			: defaultPreview
			? `${12 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountLCancelFailPercent}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? Number(
					(
						(actionCount?.lCancelCount.fail ?? 0) /
						((actionCount?.lCancelCount.fail ?? 0) +
							(actionCount?.lCancelCount.fail ?? 0))
					).toFixed(1),
			  ) * 100
			: defaultPreview
			? `${22.2 - playerIndex}`
			: '0'}%
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountThrowTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.throwCount.up ?? 0) +
			  (actionCount?.throwCount.forward ?? 0) +
			  (actionCount?.throwCount.back ?? 0) +
			  (actionCount?.throwCount.down ?? 0)
			: defaultPreview
			? `${17 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountThrowUp}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.up
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountThrowDown}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.down
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountThrowBack}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.back
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer1ActionCountThrowForward}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.forward
			: defaultPreview
			? `${4 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
