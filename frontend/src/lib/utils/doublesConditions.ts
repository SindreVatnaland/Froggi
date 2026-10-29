import { VisibilityOption, VisibilityToggle, type SelectedVisibilityCondition } from '../models/types/animationOption';
import type { FrameEntryType, PreFrameUpdateType } from '../models/types/slippiTypes';
import { getComboCount, getOffStageZone, hasStocksRemaining, isPlayerAlive } from './gamePredicates';

/**
 * Doubles visibility conditions. Players are in slot order [T1P1, T2P1, T1P2, T2P2] (Player 1/2
 * conditions already cover T1P1 / T2P1). Team totals sum the team's stocks (missing = 0).
 */
type Slot = { playerIndex: number } | undefined;

const isOffStage = (pre: PreFrameUpdateType | undefined, stageId: number | null | undefined) => {
	if (!pre || stageId == null) return false;
	const zone = getOffStageZone(stageId as Parameters<typeof getOffStageZone>[0]);
	if (!zone) return false;
	const x = pre.positionX ?? 0;
	const y = pre.positionY ?? 0;
	return x < zone[0][0] || x > zone[1][0] || y < zone[0][1] || y > zone[1][1];
};
const side = (pre: PreFrameUpdateType | undefined) => (!pre?.positionX ? undefined : pre.positionX < 0 ? 'left' : 'right');

export function doublesVisibilityOption(
	option: SelectedVisibilityCondition,
	gameFrame: FrameEntryType | null | undefined,
	players: Slot[],
	isTeams: boolean,
	stageId: number | null | undefined,
): boolean {
	const check = (opt: VisibilityOption, cond: boolean) =>
		(option[opt] === VisibilityToggle.True && cond) || (option[opt] === VisibilityToggle.False && !cond);

	if (check(VisibilityOption.DoublesGame, isTeams)) return true;

	const post = (slot: number) => gameFrame?.players?.[players[slot]?.playerIndex ?? -1]?.post;
	const pre = (slot: number) => gameFrame?.players?.[players[slot]?.playerIndex ?? -1]?.pre;

	// Team 1 · P2 = slot 2, Team 2 · P2 = slot 3
	const second: [1 | 2, number][] = [[1, 2], [2, 3]];
	for (const [team, slot] of second) {
		if (!players[slot]) continue;
		const p = post(slot);
		const k = (name: string) => VisibilityOption[`Team${team}Player2${name}` as keyof typeof VisibilityOption];
		const conds: [VisibilityOption, boolean][] = [
			[k('Alive'), !!isPlayerAlive(p)],
			[k('Stock1'), !!hasStocksRemaining(p, 1)],
			[k('Stock2'), !!hasStocksRemaining(p, 2)],
			[k('Stock3'), !!hasStocksRemaining(p, 3)],
			[k('Stock4'), !!hasStocksRemaining(p, 4)],
			[k('Combo'), !!getComboCount(p)],
			[k('OffStage'), isOffStage(pre(slot), stageId)],
			[k('OffStageLeft'), isOffStage(pre(slot), stageId) && side(pre(slot)) === 'left'],
			[k('OffStageRight'), isOffStage(pre(slot), stageId) && side(pre(slot)) === 'right'],
		];
		for (const [opt, cond] of conds) if (check(opt, cond)) return true;
	}

	// Team totals: Team 1 = slots 0 + 2, Team 2 = slots 1 + 3
	const teams: [1 | 2, number[]][] = [[1, [0, 2]], [2, [1, 3]]];
	for (const [team, slots] of teams) {
		const members = slots.filter((s) => players[s]);
		if (!members.length) continue;
		const stocks = members.reduce((n, s) => n + (post(s)?.stocksRemaining ?? 0), 0);
		if (check(VisibilityOption[`Team${team}Alive` as keyof typeof VisibilityOption], members.some((s) => !!isPlayerAlive(post(s))))) return true;
		for (let v = 1; v <= 8; v++) {
			if (check(VisibilityOption[`Team${team}StocksAtMost${v}` as keyof typeof VisibilityOption], stocks <= v)) return true;
		}
	}
	return false;
}

/** Picker entries (label, option) for the Doubles condition category. */
export const DOUBLES_CONDITION_GROUPS: { title: string; options: { value: VisibilityOption; label: string }[] }[] = [
	{ title: 'Format', options: [{ value: VisibilityOption.DoublesGame, label: 'Doubles game (Slippi teams)' }] },
	...([1, 2] as const).map((t) => ({
		title: `Team ${t} · Player 2`,
		options: ['Alive', 'Stock 1', 'Stock 2', 'Stock 3', 'Stock 4', 'Combo', 'Off Stage', 'Off Stage Left', 'Off Stage Right'].map((label) => ({
			value: `Team ${t} Player 2 ${label}` as VisibilityOption,
			label: `Team ${t} · P2 ${label}`,
		})),
	})),
	...([1, 2] as const).map((t) => ({
		title: `Team ${t} totals`,
		options: [
			{ value: `Team ${t} Alive` as VisibilityOption, label: `Team ${t} has a player alive` },
			...[8, 7, 6, 5, 4, 3, 2, 1].map((v) => ({ value: `Team ${t} Stocks <= ${v}` as VisibilityOption, label: `Team ${t} stocks ≤ ${v}` })),
		],
	})),
];
