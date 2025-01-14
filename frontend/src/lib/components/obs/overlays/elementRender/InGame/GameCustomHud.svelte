<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { Stage } from '$lib/models/constants/stageData';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { FrameEntryType } from '@slippi/slippi-js';
	import GameStage from '../../element/GameStage.svelte';
	import TextElement from '../../element/TextElement.svelte';
	import InGamePlayerRadar from '../../element/inGame/InGamePlayerRadar.svelte';
	import { GameStartTypeExtended } from '$lib/models/types/slippiData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let gameFrame: FrameEntryType | null | undefined;
	export let gameSettings: GameStartTypeExtended;

	const getTimeSeconds = (
		startingTimer: number | null | undefined,
		frame: number | undefined,
	): number => {
		if (!startingTimer) return 480;
		if (!frame || frame <= 0) return startingTimer;
		const seconds = startingTimer - frame / 60;
		return seconds ? seconds : 1;
	};

	const addZero = (time: number) => {
		if (time < 0) return '00';
		return `${time < 10 ? '0' : ''}${time}`;
	};
</script>

{#if dataItem?.elementId === CustomElement.InGameTimerMinutes}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '08'
			: addZero(
					Math.floor(
						getTimeSeconds(gameSettings?.startingTimerSeconds, gameFrame?.frame) / 60,
					),
			  )}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGameTimerSeconds}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '00'
			: addZero(
					Math.floor(
						getTimeSeconds(gameSettings?.startingTimerSeconds, gameFrame?.frame) % 60,
					),
			  )}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGameTimerMilliseconds3}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '000'
			: getTimeSeconds(gameSettings?.startingTimerSeconds, gameFrame?.frame)
					.toFixed(3)
					.split('.')
					.at(1)}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGameTimerMilliseconds2}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '00'
			: getTimeSeconds(gameSettings?.startingTimerSeconds, gameFrame?.frame)
					.toFixed(2)
					.split('.')
					.at(1)}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGameTimerMilliseconds1}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '0'
			: getTimeSeconds(gameSettings?.startingTimerSeconds, gameFrame?.frame)
					.toFixed(1)
					.split('.')
					.at(1)}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGameTimerSecondsCountdown}
	<TextElement {style} {dataItem}>
		{defaultPreview
			? '480'
			: Math.ceil(
					getTimeSeconds(gameSettings?.startingTimerSeconds, gameFrame?.frame),
			  ).toFixed(0)}
	</TextElement>
{/if}
{#if dataItem?.elementId === CustomElement.InGameStage}
	{#key gameSettings}
		<GameStage
			{style}
			{dataItem}
			{defaultPreview}
			stageId={gameSettings?.stageId}
			fallbackStageId={Stage.BATTLEFIELD}
		/>
	{/key}
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayerRadar}
	{#key gameSettings}
		<InGamePlayerRadar
			{style}
			{dataItem}
			{defaultPreview}
			stageId={gameSettings?.stageId}
			fallbackStageId={Stage.BATTLEFIELD}
		/>
	{/key}
{/if}
