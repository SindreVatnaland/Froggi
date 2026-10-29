import path from 'path';
import { SlippiGame } from '@slippi/slippi-js/node';
import { getTeamWinnerIndex, isLighterTeammate, orderTeams, playersForSlot, slotOrder, teamReference } from '../../frontend/src/lib/utils/teams';
import type { GameStats } from '../../frontend/src/lib/models/types/slippiData';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';

const p = (playerIndex: number, teamId: number, connectCode = '') => ({ playerIndex, port: playerIndex + 1, teamId, connectCode });

// ports 1-4: blue, red, red, blue (like the sample replay)
const players = [p(0, 1, 'EME#8'), p(1, 0, 'BLAC#850'), p(2, 0, 'NOHACK#0'), p(3, 1, 'UWU#444')];

const game = (opts: { players?: ReturnType<typeof p>[]; method?: number; lras?: number; first?: number; last?: Record<number, [number, number]> }): GameStats =>
	({
		settings: { isTeams: true, players: opts.players ?? players },
		gameEnd: {
			gameEndMethod: opts.method ?? 2,
			lrasInitiatorIndex: opts.lras ?? -1,
			placements: (opts.players ?? players).map((pl) => ({ playerIndex: pl.playerIndex, position: pl.playerIndex === opts.first ? 0 : 1 })),
		},
		lastFrame: { players: Object.fromEntries(Object.entries(opts.last ?? {}).map(([i, [stocks, percent]]) => [i, { post: { stocksRemaining: stocks, percent } }])) },
	}) as unknown as GameStats;

describe('teams: order and slots', () => {
	it('first game: the team with port 1 is Team 1 (not the colour), lower port is P1 within a team', () => {
		const teams = orderTeams(players);
		expect(teams.map((t) => t.color)).toEqual(['blue', 'red']);
		expect(slotOrder(teams).map((x) => x.playerIndex)).toEqual([0, 1, 3, 2]); // T1P1, T2P1, T1P2, T2P2
	});

	it('later games keep each team in its slot even when they swap colours', () => {
		const reference = teamReference(orderTeams(players)); // blue(EME,UWU) = Team 1
		const swapped = players.map((x) => ({ ...x, teamId: x.teamId === 0 ? 1 : 0, playerIndex: 3 - x.playerIndex }));
		const teams = orderTeams(swapped, reference);
		expect(teams[0].players.map((x) => x.connectCode).sort()).toEqual(['EME#8', 'UWU#444']);
		expect(teams[0].color).toBe('red');
	});

	it('new players → the team with the lowest port again', () => {
		const reference = teamReference(orderTeams(players));
		const others = players.map((x, i) => ({ ...x, connectCode: `NEW#${i}` }));
		expect(orderTeams(others, reference)[0].players[0].playerIndex).toBe(0);
	});
});

describe('teams: winner', () => {
	it('stocks: team of the player placed first', () => {
		expect(getTeamWinnerIndex(game({ first: 2 }))).toBe(1); // NOHACK (red, ports 2+3) won → Team 2
		expect(getTeamWinnerIndex(game({ first: 3 }))).toBe(0);
	});

	it('LRAS: the quitter\'s team loses', () => {
		expect(getTeamWinnerIndex(game({ lras: 1 }))).toBe(0); // red player quit → blue (Team 1, port 1) wins
		expect(getTeamWinnerIndex(game({ lras: 3 }))).toBe(1);
	});

	it('time: more team stocks, then lower team percent; eliminated = 0 stocks / 0%', () => {
		// red (Team 2): 2 + 0 stocks; blue (Team 1): 1 + 0 → red
		expect(getTeamWinnerIndex(game({ method: 1, last: { 1: [2, 50], 2: [0, 180], 0: [1, 10], 3: [0, 0] } }))).toBe(1);
		// stocks tied 2-2 → percent: red 120+0, blue 40+30 → blue
		expect(getTeamWinnerIndex(game({ method: 1, last: { 1: [1, 120], 2: [1, 0], 0: [1, 40], 3: [1, 30] } }))).toBe(0);
		// eliminated player's percent is ignored
		expect(getTeamWinnerIndex(game({ method: 1, last: { 1: [2, 10], 2: [0, 999], 0: [2, 20], 3: [0, 0] } }))).toBe(1);
		// full tie
		expect(getTeamWinnerIndex(game({ method: 1, last: { 1: [1, 50], 2: [1, 0], 0: [1, 25], 3: [1, 25] } }))).toBeUndefined();
	});

	it('singles games are not handled here', () => {
		expect(getTeamWinnerIndex({ ...game({ first: 0 }), settings: { isTeams: false, players } } as unknown as GameStats)).toBeUndefined();
	});

	it('the sample doubles replay: red (Fox + Fox, ports 2 + 3 = Team 2) wins', () => {
		const slp = new SlippiGame(path.join(__dirname, '../sample-games/direct-doubles-set-1/Replay 1 [W].slp'));
		const settings = nulled(slp.getSettings());
		const stats = { settings, gameEnd: nulled(slp.getGameEnd()), lastFrame: nulled(slp.getLatestFrame()) } as unknown as GameStats;
		const teams = orderTeams(settings?.players ?? []);
		expect(teams[0].color).toBe('blue');
		expect(getTeamWinnerIndex(stats)).toBe(1);
	});
});

describe('teams: element player slots', () => {
	const slots = slotOrder(orderTeams(players)); // [T1P1, T2P1, T1P2, T2P2]
	it('no slot: Player 1/2 elements keep index 0/1 (each team\'s first player)', () => {
		expect(playersForSlot(slots, undefined)).toBe(slots);
	});
	it('a slot points both positions at that player', () => {
		expect(playersForSlot(slots, 't1p2').map((x) => x.connectCode)).toEqual(['UWU#444', 'UWU#444']);
		expect(playersForSlot(slots, 't2p2').map((x) => x.connectCode)).toEqual(['NOHACK#0', 'NOHACK#0']);
		expect(playersForSlot(slots.slice(0, 2), 't2p2')).toEqual([]); // singles: no second teammate
	});
	it('same character on one team: the higher port is the lighter one', () => {
		const fox = (playerIndex: number, teamId: number) => ({ playerIndex, teamId, characterId: 2 });
		const team = [fox(1, 0), fox(2, 0), { playerIndex: 0, teamId: 1, characterId: 2 }];
		expect(isLighterTeammate(team, team[0])).toBe(false);
		expect(isLighterTeammate(team, team[1])).toBe(true);
		expect(isLighterTeammate(team, team[2])).toBe(false); // other team
	});
});
