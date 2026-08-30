export interface FrameSnapshot {
	frame: number;
	actionStateId: number;
	isAirborne: boolean;
	groundX: number;
	airX: number;
	jumpsRemaining: number;
	lCancelStatus: number | null;
	joystickX: number;
	joystickY: number;
}

export type TechniqueId =
	| 'wavedash'
	| 'waveland'
	| 'ledgedash'
	| 'shield_drop'
	| 'ground_tech'
	| 'tech_roll'
	| 'wall_tech'
	| 'ceiling_tech'
	| 'pivot'
	| 'dashdance'
	| 'moonwalk'
	| 'l_cancel_success'
	| 'l_cancel_miss';

export interface TechniqueDetectedPayload {
	playerIndex: number;
	connectCode: string | undefined;
	techniqueId: TechniqueId;
	frame: number;
}

export interface ActionStateHistoryEntry {
	frame: number;
	stateId: number;
	stateName: string;
	category: string;
}

export interface ActionStateHistoryPayload {
	playerIndex: number;
	history: ActionStateHistoryEntry[];
}
