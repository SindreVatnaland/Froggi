// hurtboxCollisionState values
export const HURTBOX_VULNERABLE = 0;
export const HURTBOX_INVULNERABLE = 1;
export const HURTBOX_INTANGIBLE = 2;

// Confirmed state range boundaries (from slippi-js)
export const STATE_GROUNDED_CONTROL_START = 14; // idle
export const STATE_GROUNDED_CONTROL_END = 24;   // jumpsquat (exclusive)
export const STATE_SQUAT_START = 39;
export const STATE_SQUAT_END = 41;
export const STATE_GROUND_ATTACK_START = 44;
export const STATE_GROUND_ATTACK_END = 64;
export const STATE_AERIAL_ATTACK_START = 65;
export const STATE_AERIAL_ATTACK_END = 74;
export const STATE_DAMAGE_START = 75;
export const STATE_DAMAGE_END = 91;
export const STATE_GUARD_START = 178;
export const STATE_GUARD_END = 182;
export const STATE_DOWN_START = 183;
export const STATE_DOWN_END = 198;
export const STATE_TECH_START = 199;
export const STATE_TECH_END = 204;
export const STATE_CAPTURE_START = 223;
export const STATE_CAPTURE_END = 232;
export const STATE_CLIFF_START = 252;
export const STATE_CLIFF_END = 263;

// Specific named states
export const STATE_DAMAGE_FALL = 38;
export const STATE_LANDING_FALL_SPECIAL = 43; // wavedash / airdodge landing
export const STATE_AIR_DODGE = 236;
export const STATE_CLIFF_CATCH = 252;
export const STATE_CLIFF_WAIT = 253;

// Derived state helpers
export const isGroundedControl = (s: number) =>
	(s >= STATE_GROUNDED_CONTROL_START && s < STATE_GROUNDED_CONTROL_END) ||
	(s >= STATE_SQUAT_START && s <= STATE_SQUAT_END);

export const isAttacking = (s: number) =>
	(s > STATE_GROUND_ATTACK_START && s <= STATE_GROUND_ATTACK_END) ||
	(s >= STATE_AERIAL_ATTACK_START && s <= STATE_AERIAL_ATTACK_END);

export const isDamaged = (s: number) =>
	(s >= STATE_DAMAGE_START && s <= STATE_DAMAGE_END) ||
	s === STATE_DAMAGE_FALL;

export const isShielding = (s: number) => s >= STATE_GUARD_START && s <= STATE_GUARD_END;

export const isInTech = (s: number) => s >= STATE_TECH_START && s <= STATE_TECH_END;

export const isDown = (s: number) => s >= STATE_DOWN_START && s <= STATE_DOWN_END;

export const isCaptured = (s: number) => s >= STATE_CAPTURE_START && s <= STATE_CAPTURE_END;

export const isOnLedge = (s: number) => s >= STATE_CLIFF_START && s <= STATE_CLIFF_END;

export const isInvincible = (hurtbox: number | undefined | null) =>
	hurtbox === HURTBOX_INVULNERABLE || hurtbox === HURTBOX_INTANGIBLE;

// Full action state name map
export const ACTION_STATE_NAMES: Record<number, string> = {
	// Death / Respawn (0–13)
	0: 'Dead (Down)',
	1: 'Dead (Left)',
	2: 'Dead (Right)',
	3: 'Dead (Up)',
	4: 'Dead (Star KO)',
	5: 'Dead (Star KO Ice)',
	6: 'Dead (Fall)',
	7: 'Dead (Fall Hit Camera)',
	8: 'Dead (Fall Hit Camera Flat)',
	9: 'Dead (Fall Ice)',
	10: 'Dead (Fall Ice Flat)',
	11: 'Respawn Idle',
	12: 'Respawn',
	13: 'Respawn Wait',

	// Grounded Control (14–23)
	14: 'Idle',
	15: 'Walk (Slow)',
	16: 'Walk (Mid)',
	17: 'Walk (Fast)',
	18: 'Turn',
	19: 'Turn (Run)',
	20: 'Dash',
	21: 'Run',
	22: 'Run (Direct)',
	23: 'Run (Brake)',

	// Jump / Fall (24–37)
	24: 'Jump Squat',
	25: 'Jump Forward',
	26: 'Jump Backward',
	27: 'Double Jump Forward',
	28: 'Double Jump Backward',
	29: 'Fall',
	30: 'Fall Forward',
	31: 'Fall Backward',
	32: 'Fall (Aerial)',
	33: 'Fall Forward (Aerial)',
	34: 'Fall Backward (Aerial)',
	35: 'Special Fall',
	36: 'Special Fall Forward',
	37: 'Special Fall Backward',

	// Ground Misc (38–43)
	38: 'Tumble',
	39: 'Crouch Start',
	40: 'Crouching',
	41: 'Crouch End',
	42: 'Landing',
	43: 'Landing (Special Fall)',

	// Ground Attacks (44–64)
	44: 'Jab 1',
	45: 'Jab 2',
	46: 'Jab 3',
	47: 'Rapid Jab Start',
	48: 'Rapid Jab Loop',
	49: 'Rapid Jab End',
	50: 'Dash Attack',
	51: 'FTilt (Up)',
	52: 'FTilt (Up-Angled)',
	53: 'FTilt',
	54: 'FTilt (Down-Angled)',
	55: 'FTilt (Down)',
	56: 'UTilt',
	57: 'DTilt',
	58: 'FSmash (Up)',
	59: 'FSmash (Up-Angled)',
	60: 'FSmash',
	61: 'FSmash (Down-Angled)',
	62: 'FSmash (Down)',
	63: 'USmash',
	64: 'DSmash',

	// Aerials (65–69)
	65: 'Nair',
	66: 'Fair',
	67: 'Bair',
	68: 'Uair',
	69: 'Dair',

	// Aerial Landings (70–74)
	70: 'Landing (Nair)',
	71: 'Landing (Fair)',
	72: 'Landing (Bair)',
	73: 'Landing (Uair)',
	74: 'Landing (Dair)',

	// Hitstun (75–91)
	75: 'Hitstun (Hi 1)',
	76: 'Hitstun (Hi 2)',
	77: 'Hitstun (Hi 3)',
	78: 'Hitstun',
	79: 'Hitstun (Lo 1)',
	80: 'Hitstun (Lo 2)',
	81: 'Hitstun (Air 1)',
	82: 'Hitstun (Air 2)',
	83: 'Hitstun (Air 3)',
	84: 'Launched (Hi)',
	85: 'Launched',
	86: 'Launched (Lo)',
	87: 'Launched (Top)',
	88: 'Launched (Roll)',
	89: 'Hitstun (Neck)',
	90: 'Hitstun (Spine)',
	91: 'Hitstun (No Jump)',

	// Item Interactions (92–117)
	92: 'Item Pickup (Light)',
	93: 'Item Pickup (Heavy)',
	94: 'Item Throw Forward',
	95: 'Item Throw Backward',
	96: 'Item Throw Up',
	97: 'Item Throw Down',
	98: 'Item Throw Dash',
	99: 'Item Drop',
	100: 'Item Throw Air Forward',
	101: 'Item Throw Air Backward',
	102: 'Item Throw Air Up',
	103: 'Item Throw Air Down',
	104: 'Item Throw Forward (Heavy)',
	105: 'Item Throw Backward (Heavy)',
	106: 'Item Throw Up (Heavy)',
	107: 'Item Throw Down (Heavy)',
	108: 'Item Pickup Forward (Light)',
	109: 'Item Pickup Backward (Light)',
	110: 'Item Pickup Forward (Heavy)',
	111: 'Item Pickup Backward (Heavy)',

	// Shield (178–182)
	178: 'Shield On',
	179: 'Shielding',
	180: 'Shield Off',
	181: 'Shield Drop',
	182: 'Powershield',

	// Missed Tech / Lying (183–190) — face up
	183: 'Missed Tech (Face Up)',
	184: 'Lying (Face Up)',
	185: 'Jab Reset (Face Up)',
	186: 'Get Up (Face Up)',
	187: 'Floor Attack (Face Up)',
	188: 'Get Up Forward (Face Up)',
	189: 'Get Up Backward (Face Up)',
	190: 'Stand (Face Up)',

	// Missed Tech / Lying (191–198) — face down
	191: 'Missed Tech (Face Down)',
	192: 'Lying (Face Down)',
	193: 'Jab Reset (Face Down)',
	194: 'Get Up (Face Down)',
	195: 'Floor Attack (Face Down)',
	196: 'Get Up Forward (Face Down)',
	197: 'Get Up Backward (Face Down)',
	198: 'Stand (Face Down)',

	// Techs (199–204)
	199: 'Neutral Tech',
	200: 'Tech Forward',
	201: 'Tech Backward',
	202: 'Wall Tech',
	203: 'Wall Tech Jump',
	204: 'Ceiling Tech',

	// Shield Break (205–211)
	205: 'Shield Break (Fly)',
	206: 'Shield Break (Fall)',
	207: 'Shield Break (Down Face Up)',
	208: 'Shield Break (Down Face Down)',
	209: 'Shield Break (Stand Face Up)',
	210: 'Shield Break (Stand Face Down)',
	211: 'Dizzy',

	// Grab / Throw (212–222)
	212: 'Grab',
	213: 'Grab Pull',
	214: 'Dash Grab',
	215: 'Dash Grab Pull',
	216: 'Holding',
	217: 'Pummel',
	218: 'Grab Release',
	219: 'Throw Forward',
	220: 'Throw Backward',
	221: 'Throw Up',
	222: 'Throw Down',

	// Captured / Being Grabbed (223–232)
	223: 'Grabbed (Lifted)',
	224: 'Grabbed (Held)',
	225: 'Grabbed (Damage)',
	226: 'Grabbed (Held Low)',
	227: 'Grabbed (Damage Low)',
	228: 'Grab Break',
	229: 'Grabbed (Jump)',
	230: 'Grabbed (Neck)',
	231: 'Grabbed (Foot)',
	232: 'Escape',

	// Dodges (233–236)
	233: 'Roll Forward',
	234: 'Roll Backward',
	235: 'Spot Dodge',
	236: 'Air Dodge',

	// Misc (247)
	247: 'Missed Wall Tech',

	// Ledge (252–263)
	252: 'Ledge Grab',
	253: 'Ledge Hang',
	254: 'Ledge Get Up (Slow)',
	255: 'Ledge Get Up (Fast)',
	256: 'Ledge Attack (Slow)',
	257: 'Ledge Attack (Fast)',
	258: 'Ledge Roll (Slow)',
	259: 'Ledge Roll (Fast)',
	260: 'Ledge Jump (Slow) 1',
	261: 'Ledge Jump (Slow) 2',
	262: 'Ledge Jump (Fast) 1',
	263: 'Ledge Jump (Fast) 2',

	// Character-specific ranges (named generically)
	// GnW
	341: 'GnW Jab 1',
	342: 'GnW Rapid Jab',
	345: 'GnW DTilt',
	346: 'GnW FSmash',
	347: 'GnW Nair',
	348: 'GnW Bair',
	349: 'GnW Uair',

	// Peach FSmash weapon variants
	350: 'Peach FSmash (Frying Pan)',
	351: 'Peach FSmash (Tennis Racket)',
};

export const getActionStateName = (id: number | undefined | null): string => {
	if (id == null) return '—';
	return ACTION_STATE_NAMES[id] ?? `State ${id}`;
};

export const getStateCategory = (id: number | undefined | null): string => {
	if (id == null) return '—';
	if (id <= 10) return 'Dead';
	if (id <= 13) return 'Respawning';
	if (id <= 17) return 'Idle';
	if (id === 18) return 'Walking';
	if (id === 19) return 'Turning';
	if (id <= 23) return 'Dashing';
	if (id <= 30) return 'Jumping';
	if (id <= 34) return 'Falling';
	if (id === 38) return 'Tumbling';
	if (id <= 41) return 'Crouching';
	if (id === STATE_LANDING_FALL_SPECIAL) return 'Special Landing';
	if (id <= 47) return 'Landing';
	if (id <= 74) return 'Attacking';
	if (id <= 112) return 'Hitstun';
	if (id <= 177) return 'Other';
	if (id <= STATE_GUARD_END) return 'Shielding';
	if (id <= STATE_DOWN_END) return 'Down';
	if (id <= STATE_TECH_END) return 'Tech';
	if (id <= 214) return 'Shield Break';
	if (id <= 222) return 'Grabbing';
	if (id <= STATE_CAPTURE_END) return 'Grabbed';
	if (id <= STATE_AIR_DODGE) return 'Dodging';
	if (id === 244) return 'Platform Drop';
	if (id <= 251) return 'Teetering';
	if (id <= STATE_CLIFF_END) return 'Ledge';
	return 'Other';
};
