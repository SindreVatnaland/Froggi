/**
 * Per-frame character render computation, ported from SlippiLab (MIT)
 * `src/state/replayStore.tsx` → `computeRenderData`.
 * https://github.com/frankborden/slippilab
 *
 * Decoupled from any store: give it a single player's state + that character's
 * loaded animations and it returns the SVG path + transforms to draw. A frame
 * history accessor is optional — realtime callers with only the current frame
 * can omit it and the few history-dependent details (start-of-action facing,
 * missed-L-cancel tint, DamageFlyRoll / spacie up-B rotation) degrade safely.
 */
import type { CharacterAnimations } from './animationCache';
import { actionNameById, characterNameByExternalId, characterNameByInternalId } from './ids';
import { actionMapByInternalId } from './characters';
import type { Character } from './characters/character';
import type { ActionName } from './ids';

export interface ViewerPlayerState {
	playerIndex: number;
	internalCharacterId: number;
	actionStateId: number;
	actionStateFrameCounter: number;
	xPosition: number;
	yPosition: number;
	/** 1 = facing right, -1 = facing left. */
	facingDirection: number;
	/** [0,60] */
	shieldSize: number;
	/** slippi-js: 2 = missed L-cancel. */
	lCancelStatus: number;
	/** slippi-js: 0 = vulnerable, 1 = invulnerable, 2 = intangible. */
	hurtboxCollisionState: number;
	frameNumber: number;
	/** Processed stick, only needed for spacie up-B angle. */
	joystickX?: number;
	joystickY?: number;
	/** Processed analog trigger [0,1] — drives shield size. */
	trigger?: number;
}

/** Minimal post-frame fields the renderer reads (a slippi-js PostFrameUpdateType satisfies this). */
export interface MinimalPost {
	playerIndex?: number | null;
	internalCharacterId?: number | null;
	actionStateId?: number | null;
	actionStateCounter?: number | null;
	positionX?: number | null;
	positionY?: number | null;
	facingDirection?: number | null;
	shieldSize?: number | null;
	lCancelStatus?: number | null;
	hurtboxCollisionState?: number | null;
	percent?: number | null;
	stocksRemaining?: number | null;
}
/** Minimal pre-frame fields (processed stick + trigger). */
export interface MinimalPre {
	joystickX?: number | null;
	joystickY?: number | null;
	trigger?: number | null;
}

/** Minimal item fields the projectile renderer reads (a slippi-js ItemUpdateType satisfies this). */
export interface MinimalItem {
	typeId?: number | null;
	state?: number | null;
	facingDirection?: number | null;
	velocityX?: number | null;
	velocityY?: number | null;
	positionX?: number | null;
	positionY?: number | null;
	missileType?: number | null;
	turnipFace?: number | null;
	chargePower?: number | null;
	owner?: number | null;
	spawnId?: number | null;
	instanceId?: number | null;
}

/** A frame the viewer can render — both slippi-js FrameEntryType and the demo JSON satisfy this. */
export interface ViewerFrame {
	frame?: number | null;
	players: { [index: number]: { post?: MinimalPost | null; pre?: MinimalPre | null } | null | undefined };
	items?: MinimalItem[] | null;
	/** Stage events (FoD platform heights, Whispy, Stadium) — drives moving platforms. */
	stageEvents?: { frame?: number | null; platform?: number | null; height?: number | null }[] | null;
}

/** Game settings the viewer needs — a slippi-js GameStartType satisfies this. */
export interface ViewerSettings {
	stageId?: number | null;
	isTeams?: boolean | null;
	startingTimerSeconds?: number | null;
	players: ({ playerIndex?: number | null; characterId?: number | null; teamId?: number | null } | null | undefined)[];
}

/** Build a ViewerPlayerState from a (post, pre, frameNumber). Shared by the live and demo paths. */
export function toViewerState(
	post: MinimalPost,
	pre: MinimalPre | undefined,
	frameNumber: number,
): ViewerPlayerState {
	return {
		playerIndex: post.playerIndex ?? 0,
		internalCharacterId: post.internalCharacterId ?? 0,
		actionStateId: post.actionStateId ?? 0,
		actionStateFrameCounter: post.actionStateCounter ?? 0,
		xPosition: post.positionX ?? 0,
		yPosition: post.positionY ?? 0,
		facingDirection: post.facingDirection ?? 1,
		shieldSize: post.shieldSize ?? 0,
		lCancelStatus: post.lCancelStatus ?? 0,
		hurtboxCollisionState: post.hurtboxCollisionState ?? 0,
		joystickX: pre?.joystickX ?? undefined,
		joystickY: pre?.joystickY ?? undefined,
		trigger: pre?.trigger ?? undefined,
		frameNumber,
	};
}

export interface RenderData {
	playerState: ViewerPlayerState;
	path?: string;
	innerColor: string;
	outerColor: string;
	transforms: string[];
	animationName: string;
	characterData: Character;
	/** Translucent shield bubble while guarding; null otherwise. */
	shield?: { cx: number; cy: number; r: number; color: string } | null;
	/** True when invulnerable/intangible (hurtbox not vulnerable) — drives a blink. */
	invulnerable?: boolean;
}

export interface RenderOptions {
	isTeams?: boolean;
	teamId?: number;
	teamShade?: number;
	/** Look up an earlier/other frame's state for the same player (enables full fidelity). */
	getStateOnFrame?: (playerIndex: number, frameNumber: number) => ViewerPlayerState | undefined;
}

const ZELDA_INTERNAL = characterNameByInternalId.indexOf('Zelda');
const SHEIK_INTERNAL = characterNameByInternalId.indexOf('Sheik');
const ZELDA_EXTERNAL = characterNameByExternalId.indexOf('Zelda');
const SHEIK_EXTERNAL = characterNameByExternalId.indexOf('Sheik');

/**
 * Which character's animation zip to load. Zelda/Sheik transform mid-game, so
 * the *internal* character id wins over the menu-selected external id.
 */
export function resolveFetchExternalId(internalCharacterId: number, fallbackExternalId: number): number {
	if (internalCharacterId === ZELDA_INTERNAL) return ZELDA_EXTERNAL;
	if (internalCharacterId === SHEIK_INTERNAL) return SHEIK_EXTERNAL;
	return fallbackExternalId;
}

export function computeRenderData(
	state: ViewerPlayerState,
	animations: CharacterAnimations,
	opts: RenderOptions = {},
): RenderData | null {
	const characterData = actionMapByInternalId[state.internalCharacterId];
	if (!characterData) return null;

	const startState = getStartOfActionState(state, opts) ?? state;
	const actionName = actionNameById[state.actionStateId] as ActionName | undefined;
	const animationName =
		(actionName !== undefined ? characterData.animationMap.get(actionName) : undefined) ??
		characterData.specialsMap.get(state.actionStateId) ??
		(actionName ?? '');

	const animationFrames = animations[animationName];
	// Floor fractional counters; wrap looping animations (Wait, Guard, Entry…).
	const frameIndex =
		Math.floor(Math.max(0, state.actionStateFrameCounter)) % (animationFrames?.length ?? 1);
	// Duplicate frames are stored as "frameN" references back to an earlier frame.
	const ref = animationFrames?.[frameIndex];
	const path =
		ref !== undefined && ref.startsWith('frame')
			? animationFrames?.[Number(ref.slice('frame'.length))]
			: ref;

	const rotation =
		animationName === 'DamageFlyRoll'
			? getDamageFlyRollRotation(state, opts)
			: isSpacieUpB(state)
			? getSpacieUpBRotation(startState)
			: 0;

	// Some animations turn the player; facingDirection updates partway through and
	// would wrongly flip the art. Pin to the start-of-action facing except for jumps
	// / up-B turnarounds which must follow the live facing.
	const facingDirection = actionFollowsFacingDirection(animationName)
		? state.facingDirection
		: startState.facingDirection;

	const innerColor = getPlayerColor(state.playerIndex, opts);

	return {
		playerState: state,
		path,
		innerColor,
		shield: computeShield(state, startState, characterData, animationName, innerColor),
		outerColor:
			startState.lCancelStatus === 2
				? 'red'
				: state.hurtboxCollisionState !== 0
				? 'blue'
				: 'black',
		transforms: [
			`translate(${state.xPosition} ${state.yPosition})`,
			`rotate(${rotation} 0 8)`,
			`scale(${characterData.scale} ${characterData.scale})`,
			`scale(${facingDirection} 1)`,
			'scale(.1 -.1) translate(-500 -500)',
		],
		animationName,
		characterData,
		invulnerable: state.hurtboxCollisionState !== 0,
	};
}

const GUARD_ANIMATIONS = ['GuardOn', 'Guard', 'GuardReflect', 'GuardDamage'];

/**
 * Shield bubble while guarding (SlippiLab Player.tsx Shield, MIT). Size scales
 * with shield health [0,60] and trigger pressure [0,1] per ssbwiki formulas.
 */
function computeShield(
	state: ViewerPlayerState,
	startState: ViewerPlayerState,
	characterData: Character,
	animationName: string,
	color: string,
): { cx: number; cy: number; r: number; color: string } | null {
	if (!GUARD_ANIMATIONS.includes(animationName)) return null;
	// GuardDamage fixes shield strength at the start of stun; otherwise the live trigger.
	// A released trigger (0) mid-Guard animation is treated as full strength.
	const rawTrigger =
		animationName === 'GuardDamage' ? startState.trigger ?? state.trigger ?? 0 : state.trigger ?? 0;
	const triggerStrength = rawTrigger === 0 ? 1 : rawTrigger;
	const triggerStrengthMultiplier = 1 - (0.5 * (triggerStrength - 0.3)) / 0.7;
	const shieldSizeMultiplier = ((state.shieldSize * triggerStrengthMultiplier) / 60) * 0.85 + 0.15;
	return {
		cx: state.xPosition + characterData.shieldOffset[0] * state.facingDirection,
		cy: state.yPosition + characterData.shieldOffset[1],
		r: characterData.shieldSize * shieldSizeMultiplier,
		color,
	};
}

/** Walk back to the first frame of the current action (needs a history accessor). */
function getStartOfActionState(
	state: ViewerPlayerState,
	opts: RenderOptions,
): ViewerPlayerState | undefined {
	if (!opts.getStateOnFrame) return undefined;
	let earliest = state;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const test = opts.getStateOnFrame(state.playerIndex, earliest.frameNumber - 1);
		if (
			!test ||
			test.actionStateId !== earliest.actionStateId ||
			test.actionStateFrameCounter > earliest.actionStateFrameCounter
		) {
			return earliest;
		}
		earliest = test;
	}
}

function getDamageFlyRollRotation(state: ViewerPlayerState, opts: RenderOptions): number {
	const prev = opts.getStateOnFrame?.(state.playerIndex, state.frameNumber - 1);
	if (!prev) return 0;
	const dx = state.xPosition - prev.xPosition;
	const dy = state.yPosition - prev.yPosition;
	return (Math.atan2(dy, dx) * 180) / Math.PI - 90;
}

function isSpacieUpB(state: ViewerPlayerState): boolean {
	const character = characterNameByInternalId[state.internalCharacterId];
	return ['Fox', 'Falco'].includes(character) && [355, 356].includes(state.actionStateId);
}

function getSpacieUpBRotation(startState: ViewerPlayerState): number {
	const jx = startState.joystickX ?? 0;
	const jy = startState.joystickY ?? 0;
	const joystickDegrees =
		((jx === 0 && jy === 0 ? Math.PI / 2 : Math.atan2(jy, jx)) * 180) / Math.PI;
	return joystickDegrees - (startState.facingDirection === -1 ? 180 : 0);
}

function actionFollowsFacingDirection(name: string): boolean {
	return name.includes('Jump') || ['SpecialHi', 'SpecialAirHi'].includes(name);
}

export function getPlayerColor(playerIndex: number, opts: RenderOptions): string {
	if (opts.isTeams && opts.teamId !== undefined) {
		const teams = [
			['#991b1b', '#dc2626'], // red 800 / 600
			['#166534', '#16a34a'], // green 800 / 600
			['#1e40af', '#2563eb'], // blue 800 / 600
		];
		return teams[opts.teamId]?.[opts.teamShade ?? 0] ?? '#000000';
	}
	const palette = ['#b91c1c', '#1d4ed8', '#eab308', '#15803d']; // P1 red, P2 blue, P3 yellow, P4 green
	return palette[playerIndex] ?? '#000000';
}
