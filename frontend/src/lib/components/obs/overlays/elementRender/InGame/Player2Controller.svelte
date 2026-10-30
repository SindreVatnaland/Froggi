<script lang="ts">
	import ControllerGraphic from '$lib/components/obs/overlays/element/ControllerGraphic.svelte';
	import { CustomElement } from '$lib/models/constants/customElement';
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import { getButtonPressesGame } from '$lib/utils/helper';
	import type { FrameEntryType } from '../../../../../models/types/slippiTypes';
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
	<ControllerGraphic {dataItem} {style} part="A" pressed={!!buttonPresses?.isAPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonB}
	<ControllerGraphic {dataItem} {style} part="B" pressed={!!buttonPresses?.isBPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonX}
	<ControllerGraphic {dataItem} {style} part="X" pressed={!!buttonPresses?.isXPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonY}
	<ControllerGraphic {dataItem} {style} part="Y" pressed={!!buttonPresses?.isYPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonL}
	<ControllerGraphic {dataItem} {style} part="L" pressed={!!buttonPresses?.isLPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonR}
	<ControllerGraphic {dataItem} {style} part="R" pressed={!!buttonPresses?.isRPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerButtonZ}
	<ControllerGraphic {dataItem} {style} part="Z" pressed={!!buttonPresses?.isZPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerDPad}
	<ControllerGraphic {dataItem} {style} part="DPad" buttons={buttonPresses} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogL}
	<ControllerGraphic {dataItem} {style} part="Trigger" analog={analogL} pressed={!!buttonPresses?.isLPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogR}
	<ControllerGraphic {dataItem} {style} part="Trigger" analog={analogR} pressed={!!buttonPresses?.isRPressed} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogStickL}
	<ControllerGraphic {dataItem} {style} part="Stick" x={joystickX} y={joystickY} />
{:else if dataItem?.elementId === CustomElement.InGamePlayer2ControllerAnalogStickR}
	<ControllerGraphic {dataItem} {style} part="CStick" x={cStickX} y={cStickY} />
{/if}
