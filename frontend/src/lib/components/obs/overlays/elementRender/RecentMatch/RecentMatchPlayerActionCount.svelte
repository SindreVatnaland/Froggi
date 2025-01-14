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

{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountAirDodge}
	<TextElement {style} {dataItem}>
		{![actionCount?.airDodgeCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.airDodgeCount
			: defaultPreview
			? `${53 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountDashDance}
	<TextElement {style} {dataItem}>
		{![actionCount?.dashDanceCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.dashDanceCount
			: defaultPreview
			? `${137 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountLedgeGrab}
	<TextElement {style} {dataItem}>
		{![actionCount?.dashDanceCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.dashDanceCount
			: defaultPreview
			? `${19 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountRoll}
	<TextElement {style} {dataItem}>
		{![actionCount?.rollCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.rollCount
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountSpotDodge}
	<TextElement {style} {dataItem}>
		{![actionCount?.spotDodgeCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.spotDodgeCount
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountWaveDash}
	<TextElement {style} {dataItem}>
		{![actionCount?.wavedashCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.wavedashCount
			: defaultPreview
			? `${63 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountWaveLand}
	<TextElement {style} {dataItem}>
		{![actionCount?.wavelandCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.wavelandCount
			: defaultPreview
			? `${37 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGrabTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.grabCount.success ?? 0) + (actionCount?.grabCount.fail ?? 0)
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGrabSuccess}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount.success, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.grabCount.success
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGrabSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGrabFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount.fail, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.grabCount.fail
			: defaultPreview
			? `${5 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGrabFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechTotal}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechSuccess}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechIn}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.in
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechAway}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.away
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechNeutral}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.neutral
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.fail
			: defaultPreview
			? `${1 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountGroundTechFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountLCancelTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.lCancelCount.success ?? 0) + (actionCount?.lCancelCount.fail ?? 0)
			: defaultPreview
			? `${54 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountLCancelSuccess}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.lCancelCount.success
			: defaultPreview
			? `${42 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountLCancelSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountLCancelFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.lCancelCount.fail
			: defaultPreview
			? `${12 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountLCancelFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountThrowTotal}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountThrowUp}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.up
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountThrowDown}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.down
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountThrowBack}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.back
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchCurrentPlayerActionCountThrowForward}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.forward
			: defaultPreview
			? `${4 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
