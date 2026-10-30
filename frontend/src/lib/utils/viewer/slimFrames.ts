import type { MinimalItem, MinimalPost, MinimalPre, ViewerFrame, ViewerSettings } from './renderData';

/**
 * Only what the game view draws (renderData's Minimal* types), rounded — a replay's frames for the
 * highlight replay view are sent once and stay small (~10× smaller than full frames).
 */
type Num = number | null | undefined;
type Raw = Record<string, unknown>;
const r = (n: Num) => (n == null ? null : Math.round(n * 1000) / 1000);
const n = (v: unknown) => (typeof v === 'number' ? v : null);

export const slimSettings = (s: { stageId?: Num; isTeams?: boolean | null; startingTimerSeconds?: Num; players?: ({ playerIndex?: Num; characterId?: Num; teamId?: Num } | null | undefined)[] | null }): ViewerSettings => ({
	stageId: s.stageId ?? null,
	isTeams: s.isTeams ?? false,
	startingTimerSeconds: s.startingTimerSeconds ?? null,
	players: (s.players ?? []).filter((p) => p).map((p) => ({ playerIndex: p!.playerIndex ?? null, characterId: p!.characterId ?? null, teamId: p!.teamId ?? null })),
});

const slimPost = (p: Raw): MinimalPost => ({
	playerIndex: n(p.playerIndex),
	internalCharacterId: n(p.internalCharacterId),
	actionStateId: n(p.actionStateId),
	actionStateCounter: r(n(p.actionStateCounter)),
	positionX: r(n(p.positionX)),
	positionY: r(n(p.positionY)),
	facingDirection: n(p.facingDirection),
	shieldSize: r(n(p.shieldSize)),
	lCancelStatus: n(p.lCancelStatus),
	hurtboxCollisionState: n(p.hurtboxCollisionState),
	percent: r(n(p.percent)),
	stocksRemaining: n(p.stocksRemaining),
});
const slimPre = (p: Raw): MinimalPre => ({ joystickX: r(n(p.joystickX)), joystickY: r(n(p.joystickY)), trigger: r(n(p.trigger)) });
const slimItem = (i: Raw): MinimalItem => ({
	typeId: n(i.typeId),
	state: n(i.state),
	facingDirection: n(i.facingDirection),
	velocityX: r(n(i.velocityX)),
	velocityY: r(n(i.velocityY)),
	positionX: r(n(i.positionX)),
	positionY: r(n(i.positionY)),
	missileType: n(i.missileType),
	turnipFace: n(i.turnipFace),
	chargePower: n(i.chargePower),
	owner: n(i.owner),
	spawnId: n(i.spawnId),
});

/** One frame, slimmed. */
export function slimFrame(frame: { frame?: Num; players?: Record<string, { pre?: Raw | null; post?: Raw | null } | null | undefined> | null; items?: Raw[] | null; stageEvents?: Raw[] | null }): ViewerFrame {
	const players: ViewerFrame['players'] = {};
	for (const [index, p] of Object.entries(frame.players ?? {})) {
		if (!p?.post) continue;
		players[Number(index)] = { post: slimPost(p.post), pre: p.pre ? slimPre(p.pre) : null };
	}
	return {
		frame: frame.frame ?? null,
		players,
		items: (frame.items ?? []).map(slimItem),
		...(frame.stageEvents?.length ? { stageEvents: frame.stageEvents.map((e) => ({ frame: n(e.frame), platform: n(e.platform), height: n(e.height) })) } : {}),
	};
}
