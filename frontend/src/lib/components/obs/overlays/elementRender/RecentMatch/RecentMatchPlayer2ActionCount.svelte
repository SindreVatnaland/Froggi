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

{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountAirDodge}
	<TextElement {style} {dataItem}>
		{![actionCount?.airDodgeCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.airDodgeCount
			: defaultPreview
			? `${53 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountDashDance}
	<TextElement {style} {dataItem}>
		{![actionCount?.dashDanceCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.dashDanceCount
			: defaultPreview
			? `${137 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountLedgeGrab}
	<TextElement {style} {dataItem}>
		{![actionCount?.dashDanceCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.dashDanceCount
			: defaultPreview
			? `${19 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountRoll}
	<TextElement {style} {dataItem}>
		{![actionCount?.rollCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.rollCount
			: defaultPreview
			? `${13 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountSpotDodge}
	<TextElement {style} {dataItem}>
		{![actionCount?.spotDodgeCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.spotDodgeCount
			: defaultPreview
			? `${18 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountWaveDash}
	<TextElement {style} {dataItem}>
		{![actionCount?.wavedashCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.wavedashCount
			: defaultPreview
			? `${63 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountWaveLand}
	<TextElement {style} {dataItem}>
		{![actionCount?.wavelandCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.wavelandCount
			: defaultPreview
			? `${37 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGrabTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.grabCount.success ?? 0) + (actionCount?.grabCount.fail ?? 0)
			: defaultPreview
			? `${14 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGrabSuccess}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount.success, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.grabCount.success
			: defaultPreview
			? `${9 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGrabSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGrabFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.grabCount.fail, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.grabCount.fail
			: defaultPreview
			? `${5 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGrabFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechTotal}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechSuccess}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechIn}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.in
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechAway}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.away
			: defaultPreview
			? `${11 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechNeutral}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.neutral
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.groundTechCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.groundTechCount.fail
			: defaultPreview
			? `${1 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountGroundTechFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountLCancelTotal}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? (actionCount?.lCancelCount.success ?? 0) + (actionCount?.lCancelCount.fail ?? 0)
			: defaultPreview
			? `${54 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountLCancelSuccess}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.lCancelCount.success
			: defaultPreview
			? `${42 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountLCancelSuccessPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountLCancelFail}
	<TextElement {style} {dataItem}>
		{![actionCount?.lCancelCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.lCancelCount.fail
			: defaultPreview
			? `${12 - playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountLCancelFailPercent}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountThrowTotal}
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
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountThrowUp}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.up
			: defaultPreview
			? `${8 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountThrowDown}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.down
			: defaultPreview
			? `${2 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountThrowBack}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.back
			: defaultPreview
			? `${3 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.PostGameMatchPlayer2ActionCountThrowForward}
	<TextElement {style} {dataItem}>
		{![actionCount?.throwCount, playerIndex].some((e) => e === undefined || e === null)
			? actionCount?.throwCount.forward
			: defaultPreview
			? `${4 + playerIndex}`
			: '0'}
	</TextElement>
{/if}
