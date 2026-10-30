import { CustomElement } from '../models/constants/customElement';
import type { PlayerSlot } from './teams';

/**
 * One element, three players: most player elements exist as …CurrentPlayer… / …Player1… / …Player2…
 * (element names). The editor lists each once and a Player dropdown picks the variant — the element id
 * itself changes, so rendering is unchanged. Doubles' second players are Player 1/2 elements with
 * payload.playerSlot (playersForSlot).
 */
export type PlayerRole = 'current' | 'p1' | 'p2';
const TOKENS: Record<PlayerRole, string> = { current: 'CurrentPlayer', p1: 'Player1', p2: 'Player2' };

const byName = CustomElement as unknown as Record<string, number | string>;

/** The element's player and its siblings for the other players (only those that exist). */
export function playerVariants(elementId: number): { role: PlayerRole; ids: Partial<Record<PlayerRole, number>> } | null {
	const name = byName[elementId];
	if (typeof name !== 'string') return null;
	const role = (Object.keys(TOKENS) as PlayerRole[]).find((r) => name.includes(TOKENS[r]));
	if (!role) return null;
	const ids: Partial<Record<PlayerRole, number>> = {};
	for (const r of Object.keys(TOKENS) as PlayerRole[]) {
		const id = byName[name.replace(TOKENS[role], TOKENS[r])];
		if (typeof id === 'number') ids[r] = id;
	}
	return { role, ids };
}

export interface PlayerOption {
	value: string;
	label: string;
	elementId: number;
	slot: PlayerSlot | undefined;
}

/** The Player dropdown: only the players this element exists for (+ doubles' second players for Player 1/2 elements). */
export function playerOptions(elementId: number): PlayerOption[] {
	const v = playerVariants(elementId);
	if (!v) return [];
	const out: PlayerOption[] = [];
	if (v.ids.current !== undefined) out.push({ value: 'current', label: 'Current Player (you)', elementId: v.ids.current, slot: undefined });
	if (v.ids.p1 !== undefined) out.push({ value: 'p1', label: 'Player 1 / Team 1 · Player 1', elementId: v.ids.p1, slot: undefined });
	if (v.ids.p2 !== undefined) out.push({ value: 'p2', label: 'Player 2 / Team 2 · Player 1', elementId: v.ids.p2, slot: undefined });
	// Doubles' second players: a Player 1/2 element pointed at that slot.
	const slotted = v.ids.p1 ?? v.ids.p2;
	if (slotted !== undefined) {
		out.push({ value: 't1p2', label: 'Team 1 · Player 2', elementId: slotted, slot: 't1p2' });
		out.push({ value: 't2p2', label: 'Team 2 · Player 2', elementId: slotted, slot: 't2p2' });
	}
	return out.length > 1 ? out : [];
}

/** Which dropdown entry an element is on now (older overlays may carry the t1p1 / t2p1 slots). */
export function selectedPlayerOption(elementId: number, slot: PlayerSlot | undefined | null): string | undefined {
	if (slot === 't1p2' || slot === 't2p2') return slot;
	if (slot === 't1p1') return 'p1';
	if (slot === 't2p1') return 'p2';
	return playerVariants(elementId)?.role;
}

/** The Player 1 variant (else the element itself) — the picker lists each element once, by this id. */
export const canonicalPlayerElement = (elementId: number) => {
	const v = playerVariants(elementId);
	return v?.ids.p1 ?? v?.ids.current ?? elementId;
};
