import { CONTROLLER_CHECKS, controllerState } from '../../frontend/src/lib/utils/controllerConditions';
import { VisibilityOption } from '../../frontend/src/lib/models/types/animationOption';
import type { PreFrameUpdateType } from '../../frontend/src/lib/models/types/slippiTypes';

// A game frame's inputs; buttons = Melee's bit field (A = 1<<8, Z = 1<<4, L = 1<<6, D-pad up = 1<<3).
const pre = (p: Partial<{ buttons: number; joystickX: number; joystickY: number; cStickX: number; cStickY: number; physicalLTrigger: number; physicalRTrigger: number }>) =>
	({ buttons: 0, joystickX: 0, joystickY: 0, cStickX: 0, cStickY: 0, physicalLTrigger: 0, physicalRTrigger: 0, ...p }) as unknown as PreFrameUpdateType;
const on = (p: Parameters<typeof pre>[0]) => Object.keys(CONTROLLER_CHECKS).filter((k) => CONTROLLER_CHECKS[k](controllerState(pre(p), undefined)));

describe('controller conditions', () => {
	it('nothing is on at rest', () => expect(on({})).toEqual([]));

	it('buttons; Z is not also A (Melee sets the A bit with Z)', () => {
		expect(on({ buttons: 1 << 8 })).toEqual(['A Pressed']);
		expect(on({ buttons: (1 << 8) | (1 << 4) })).toEqual(['Z Pressed']);
		expect(on({ buttons: 1 << 3 })).toEqual(['D-Pad Up']);
	});

	it('sticks: the dead zone does nothing, past it counts, diagonals turn on both', () => {
		expect(on({ joystickX: 0.25, joystickY: -0.28 })).toEqual([]);
		expect(on({ joystickX: 0.8 })).toEqual(['Stick Right']);
		expect(on({ joystickX: -0.7, joystickY: 0.7 })).toEqual(['Stick Up', 'Stick Left']);
		expect(on({ cStickY: -1 })).toEqual(['C-Stick Down']);
	});

	it('L/R: analog pressed, fully pressed, clicked', () => {
		expect(on({ physicalLTrigger: 0.2 })).toEqual([]);
		expect(on({ physicalLTrigger: 0.5 })).toEqual(['L Analog Pressed']);
		expect(on({ physicalLTrigger: 1 })).toEqual(['L Analog Pressed', 'L Fully Pressed']);
		expect(on({ physicalLTrigger: 1, buttons: 1 << 6 })).toEqual(['L Analog Pressed', 'L Fully Pressed', 'L Clicked']);
	});

	it('menus: falls back to the memory read', () => {
		const mem = { buttons: { isBPressed: true }, analogJoystickY: -0.9 } as never;
		const s = controllerState(undefined, mem);
		expect(Object.keys(CONTROLLER_CHECKS).filter((k) => CONTROLLER_CHECKS[k](s))).toEqual(['B Pressed', 'Stick Down']);
	});

	it('every controller condition (3 players × 24) has a check', () => {
		const labels = Object.values(VisibilityOption).filter((v) => v.includes(' Controller '));
		expect(labels).toHaveLength(72);
		for (const label of labels) expect(CONTROLLER_CHECKS[label.replace(/^(Current Player|Player [12]) Controller /, '')]).toBeDefined();
	});
});
