<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { getButtonPressesGame } from '$lib/utils/helper';
	import ControllerInputElement from '$lib/components/obs/overlays/element/ControllerInputElement.svelte';
	import ControllerDPadElement from '$lib/components/obs/overlays/element/ControllerDPadElement.svelte';
	import ControllerButtonBackAnalogElement from '$lib/components/obs/overlays/element/ControllerButtonBackAnalogElement.svelte';
	import ControllerStickAnalogElement from '$lib/components/obs/overlays/element/ControllerStickAnalogElement .svelte';
	import { FrameEntryType } from '@slippi/slippi-js';
	import { memoryReadController } from '$lib/utils/store.svelte';

	export let dataItem: GridContentItem;
	export let style: GridContentItemStyle;

	export let gameFrame: FrameEntryType | null | undefined;
	export let playerIndex: number;

	$: slippiPre = gameFrame?.players?.[playerIndex ?? 0]?.pre ?? null;
	$: memPort = $memoryReadController?.[playerIndex ?? 0];
	$: buttonPresses = slippiPre ? getButtonPressesGame(slippiPre.buttons ?? 0) : memPort?.buttons;
	$: analogL = slippiPre?.physicalLTrigger ?? memPort?.analogL ?? 0;
	$: analogR = slippiPre?.physicalRTrigger ?? memPort?.analogR ?? 0;
	$: joystickX = slippiPre?.joystickX ?? memPort?.analogJoystickX ?? 0;
	$: joystickY = slippiPre?.joystickY ?? memPort?.analogJoystickY ?? 0;
	$: cStickX = slippiPre?.cStickX ?? memPort?.analogCStickX ?? 0;
	$: cStickY = slippiPre?.cStickY ?? memPort?.analogCStickY ?? 0;
</script>

{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonA}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isAPressed}
		button="A"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonB}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isBPressed}
		button="B"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonX}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isXPressed}
		button="X"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonY}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isYPressed}
		button="Y"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonL}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isLPressed}
		button="L"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonR}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isRPressed}
		button="R"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonZ}
	<ControllerInputElement
		{dataItem}
		{style}
		isButtonPressed={buttonPresses?.isZPressed}
		button="Z"
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerDPad}
	<ControllerDPadElement {dataItem} {style} {buttonPresses} />
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogL}
	<ControllerButtonBackAnalogElement
		{dataItem}
		{style}
		analogValue={analogL}
		isButtonPressed={buttonPresses?.isLPressed}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogR}
	<ControllerButtonBackAnalogElement
		{dataItem}
		{style}
		analogValue={analogR}
		isButtonPressed={buttonPresses?.isRPressed}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogStickL}
	<ControllerStickAnalogElement
		{dataItem}
		{style}
		analogXValue={joystickX}
		analogYValue={joystickY}
		ribs={true}
	/>
{/if}
{#if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogStickR}
	<ControllerStickAnalogElement
		{dataItem}
		{style}
		analogXValue={cStickX}
		analogYValue={cStickY}
	/>
{/if}
