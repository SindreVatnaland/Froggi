import { CustomElement } from '../../frontend/src/lib/models/constants/customElement';
import { canonicalPlayerElement, playerOptions, playerVariants, selectedPlayerOption } from '../../frontend/src/lib/utils/playerVariants';

describe('player variants (one element, a Player dropdown)', () => {
	it('finds the other players by name', () => {
		const v = playerVariants(CustomElement.InGamePlayer2ControllerButtonA);
		expect(v?.role).toBe('p2');
		expect(v?.ids).toEqual({
			current: CustomElement.InGameCurrentPlayerControllerButtonA,
			p1: CustomElement.InGamePlayer1ControllerButtonA,
			p2: CustomElement.InGamePlayer2ControllerButtonA,
		});
	});

	it('the dropdown only offers players the element exists for', () => {
		// Only Player 1 / 2 exist (no Current Player variant):
		expect(playerOptions(CustomElement.WinChanceGamePlayer1).map((o) => o.value)).toEqual(['p1', 'p2', 't1p2', 't2p2']);
		// All three + doubles' second players:
		expect(playerOptions(CustomElement.InGamePlayer1ControllerButtonA).map((o) => o.value)).toEqual(['current', 'p1', 'p2', 't1p2', 't2p2']);
		// Not a player element / only one player: no dropdown.
		expect(playerOptions(CustomElement.CustomString)).toEqual([]);
		expect(playerOptions(CustomElement.SlippiRankCurrentPlayerTag)).toEqual([]);
	});

	it('picking a player switches the element id (and the doubles slot)', () => {
		const opts = playerOptions(CustomElement.InGamePlayer1ControllerButtonA);
		expect(opts.find((o) => o.value === 'current')).toMatchObject({ elementId: CustomElement.InGameCurrentPlayerControllerButtonA, slot: undefined });
		expect(opts.find((o) => o.value === 't2p2')).toMatchObject({ elementId: CustomElement.InGamePlayer1ControllerButtonA, slot: 't2p2' });
	});

	it('older overlays: the default and t1p1 / t2p1 slots show as Player 1 / Player 2', () => {
		expect(selectedPlayerOption(CustomElement.InGamePlayer2ControllerButtonA, undefined)).toBe('p2');
		expect(selectedPlayerOption(CustomElement.InGamePlayer2ControllerButtonA, 't1p1')).toBe('p1');
		expect(selectedPlayerOption(CustomElement.InGamePlayer1ControllerButtonA, 't2p2')).toBe('t2p2');
	});

	it('the picker lists each element once (by its Player 1 variant)', () => {
		expect(canonicalPlayerElement(CustomElement.InGameCurrentPlayerControllerButtonA)).toBe(CustomElement.InGamePlayer1ControllerButtonA);
		expect(canonicalPlayerElement(CustomElement.SlippiRankCurrentPlayerTag)).toBe(CustomElement.SlippiRankCurrentPlayerTag);
	});
});
