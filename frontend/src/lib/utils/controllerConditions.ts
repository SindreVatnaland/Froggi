import type { ControllerButtons, ControllerInputs } from '../models/types/controller';
import type { PreFrameUpdateType } from '../models/types/slippiTypes';
import { getButtonPressesGame } from './helper';

/**
 * Controller conditions (overlay visibility, category "Controller"): what a player is pressing right now —
 * from the live game frame, else Froggi's memory read (menus). Same inputs as the controller elements.
 */

/** A stick direction counts past this (−1…1). Melee's own dead zone is 0.2875. */
export const STICK_THRESHOLD = 0.3;
/** L/R "analog pressed": past the same dead zone. "Fully pressed": at the end of the travel. */
export const TRIGGER_THRESHOLD = 0.3;
export const TRIGGER_FULL = 0.99;

export interface ControllerState {
	buttons: ControllerButtons | undefined;
	analogL: number;
	analogR: number;
	stickX: number;
	stickY: number;
	cStickX: number;
	cStickY: number;
}

export const controllerState = (pre: PreFrameUpdateType | null | undefined, mem: ControllerInputs | undefined): ControllerState => ({
	buttons: pre ? getButtonPressesGame(pre.buttons ?? 0) : mem?.buttons,
	analogL: pre?.physicalLTrigger ?? mem?.analogL ?? 0,
	analogR: pre?.physicalRTrigger ?? mem?.analogR ?? 0,
	stickX: pre?.joystickX ?? mem?.analogJoystickX ?? 0,
	stickY: pre?.joystickY ?? mem?.analogJoystickY ?? 0,
	cStickX: pre?.cStickX ?? mem?.analogCStickX ?? 0,
	cStickY: pre?.cStickY ?? mem?.analogCStickY ?? 0,
});

/** The conditions per player, by the label's ending ("Player 1 Controller A Pressed" → "A Pressed"). */
export const CONTROLLER_CHECKS: Record<string, (s: ControllerState) => boolean> = {
	'A Pressed': (s) => !!s.buttons?.isAPressed,
	'B Pressed': (s) => !!s.buttons?.isBPressed,
	'X Pressed': (s) => !!s.buttons?.isXPressed,
	'Y Pressed': (s) => !!s.buttons?.isYPressed,
	'Z Pressed': (s) => !!s.buttons?.isZPressed,
	'Start Pressed': (s) => !!s.buttons?.isStartPressed,
	'D-Pad Up': (s) => !!s.buttons?.isDPadUpPressed,
	'D-Pad Down': (s) => !!s.buttons?.isDPadDownPressed,
	'D-Pad Left': (s) => !!s.buttons?.isDPadLeftPressed,
	'D-Pad Right': (s) => !!s.buttons?.isDPadRightPressed,
	'L Analog Pressed': (s) => s.analogL > TRIGGER_THRESHOLD,
	'L Fully Pressed': (s) => s.analogL >= TRIGGER_FULL,
	'L Clicked': (s) => !!s.buttons?.isLPressed,
	'R Analog Pressed': (s) => s.analogR > TRIGGER_THRESHOLD,
	'R Fully Pressed': (s) => s.analogR >= TRIGGER_FULL,
	'R Clicked': (s) => !!s.buttons?.isRPressed,
	// Diagonals turn on both directions (up-right = Up + Right).
	'Stick Up': (s) => s.stickY > STICK_THRESHOLD,
	'Stick Down': (s) => s.stickY < -STICK_THRESHOLD,
	'Stick Left': (s) => s.stickX < -STICK_THRESHOLD,
	'Stick Right': (s) => s.stickX > STICK_THRESHOLD,
	'C-Stick Up': (s) => s.cStickY > STICK_THRESHOLD,
	'C-Stick Down': (s) => s.cStickY < -STICK_THRESHOLD,
	'C-Stick Left': (s) => s.cStickX < -STICK_THRESHOLD,
	'C-Stick Right': (s) => s.cStickX > STICK_THRESHOLD,
};
