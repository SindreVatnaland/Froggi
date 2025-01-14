<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { getButtonPressesGame } from '$lib/utils/helper';
	import ControllerInputElement from '$lib/components/obs/overlays/element/ControllerInputElement.svelte';
	import ControllerDPadElement from '$lib/components/obs/overlays/element/ControllerDPadElement.svelte';
	import ControllerButtonBackAnalogElement from '$lib/components/obs/overlays/element/ControllerButtonBackAnalogElement.svelte';
	import ControllerStickAnalogElement from '$lib/components/obs/overlays/element/ControllerStickAnalogElement .svelte';
	import { FrameEntryType } from '@slippi/slippi-js';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;

	export let gameFrame: FrameEntryType | null | undefined;
	export let playerIndex: number;

	$: playerController = gameFrame?.players?.[playerIndex ?? 0]?.pre ?? null;
	$: buttonPresses = getButtonPressesGame(playerController?.buttons ?? 0);
</script>

{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerButtonA}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isAPressed}
		button="A"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerButtonB}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isBPressed}
		button="B"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerButtonX}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isXPressed}
		button="X"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerButtonY}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isYPressed}
		button="Y"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerButtonL}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isLPressed}
		button="L"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerButtonR}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isRPressed}
		button="R"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerButtonZ}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isZPressed}
		button="Z"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerDPad}
	<ControllerDPadElement {dataItem} {style} {buttonPresses} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerAnalogL}
	<ControllerButtonBackAnalogElement
		{dataItem}
		{style}
		analogValue={playerController?.physicalLTrigger ?? 0}
		isButtonPressed={buttonPresses?.isLPressed}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerAnalogR}
	<ControllerButtonBackAnalogElement
		{dataItem}
		{style}
		analogValue={playerController?.physicalRTrigger ?? 0}
		isButtonPressed={buttonPresses?.isRPressed}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerAnalogStickL}
	<ControllerStickAnalogElement
		{dataItem}
		{style}
		analogXValue={playerController?.joystickX ?? 0}
		analogYValue={playerController?.joystickY ?? 0}
		ribs={true}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer1ControllerAnalogStickR}
	<ControllerStickAnalogElement
		{dataItem}
		{style}
		analogXValue={playerController?.cStickX ?? 0}
		analogYValue={playerController?.cStickY ?? 0}
	/>
{/if}
