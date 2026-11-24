import type { GameStats } from '../models/types/slippiData';

/**
 * Doubles (Slippi teams mode). Melee team ids: 0 = red, 1 = blue, 2 = green.
 *  - Team order: in the set's first game Team 1 = the team with the lowest port (colour doesn't matter); later
 *    games keep each TEAM (its players) in the same slot even if the teams swap colours.
 *  - Slot order of players: Team 1 P1, Team 2 P1, Team 1 P2, Team 2 P2 — so existing "Player 1 /
 *    Player 2" elements show each team's first player. Within a team, the lower port is P1.
 *  - Winner: LRAS → the quitter's team loses; time → more team stocks, then lower team percent
 *    (an eliminated player counts as 0 stocks / 0%); otherwise the team of the player placed first.
 *  - Tie (tournament rulesets → 1-stock tiebreaker): time with equal team stocks + percent, both teams'
 *    last players KO'd on the same frame, or sudden death (bomb rain — its result never counts).
 */
export const TEAM_COLORS = ['red', 'blue', 'green'] as const;

/** Minimal player shape (Slippi settings players). */
export interface TeamsPlayer {
	playerIndex: number;
	port?: number;
	teamId?: number | null;
	connectCode?: string | null;
	displayName?: string | null;
	/** Set identity (see playerIdentity.ts) — offline doubles "Red-1" etc. */
	froggiKey?: string | null;
}

export interface Team<P extends TeamsPlayer = TeamsPlayer> {
	teamId: number;
	color: (typeof TEAM_COLORS)[number] | 'unknown';
	players: P[];
}

/** Identity of a player across games: set key (offline doubles), connect code online, else port. */
export const playerKey = (p: TeamsPlayer) => p.froggiKey || p.connectCode || `port${p.port ?? p.playerIndex + 1}`;
/** Identity of a team: its players' keys. */
export const teamKey = (players: TeamsPlayer[]) => players.map(playerKey).sort().join('|');

/**
 * The two teams in slot order (Team 1 first). `reference` = team keys from the set's first game
 * (index 0 = Team 1); without it (or when the players changed) the team with the lowest port is Team 1.
 */
export function orderTeams<P extends TeamsPlayer>(players: (P | null | undefined)[], reference?: string[]): Team<P>[] {
	const byTeam = new Map<number, P[]>();
	for (const p of players) {
		if (!p) continue;
		const id = p.teamId ?? 0;
		byTeam.set(id, [...(byTeam.get(id) ?? []), p]);
	}
	const teams: Team<P>[] = [...byTeam.entries()].map(([teamId, members]) => ({
		teamId,
		color: TEAM_COLORS[teamId] ?? 'unknown',
		players: [...members].sort((a, b) => a.playerIndex - b.playerIndex),
	}));
	teams.sort((a, b) => a.players[0].playerIndex - b.players[0].playerIndex);
	if (reference?.length) {
		const at = (t: Team<P>) => {
			const i = reference.indexOf(teamKey(t.players));
			return i < 0 ? 99 : i;
		};
		if (teams.every((t) => at(t) < 99)) teams.sort((a, b) => at(a) - at(b));
	}
	return teams;
}

/** Players in slot order: [T1P1, T2P1, T1P2, T2P2] (missing slots skipped). */
export function slotOrder<P extends TeamsPlayer>(teams: Team<P>[]): P[] {
	const [t1, t2] = teams;
	return [t1?.players[0], t2?.players[0], t1?.players[1], t2?.players[1]].filter((p): p is P => !!p);
}

/** Team keys of a game, Team 1 first — store this from the set's first game as the reference. */
export const teamReference = (teams: Team[]) => teams.map((t) => teamKey(t.players));

/**
 * Who is side 1 / 2 in a set: from its first game (singles: players by port; doubles: teams by colour),
 * then the host's swaps stored on that game (GameStats.sides): sides swapped → the reference reversed;
 * teamOrder → the two players inside that team reversed (apply with applyTeamOrder).
 */
export function setReference(first: GameStats | undefined) {
	const sides = first?.sides ?? undefined;
	const players = (first?.settings?.players ?? []).filter((p) => p);
	const teamRef = first?.settings?.isTeams ? teamReference(orderTeams(first.settings.players ?? [])) : undefined;
	return {
		players: sides?.swapped ? [...players].reverse() : players,
		teamRef: teamRef && sides?.swapped ? [...teamRef].reverse() : teamRef,
		teamOrder: (sides?.teamOrder ?? [false, false]) as [boolean, boolean],
	};
}

/** Teams with the host's within-team swaps applied (index = Team 1 / Team 2 as shown). */
export const applyTeamOrder = <P extends TeamsPlayer>(teams: Team<P>[], teamOrder: [boolean, boolean]): Team<P>[] =>
	teams.map((t, i) => (teamOrder[i] ? { ...t, players: [...t.players].reverse() } : t));

/** Index (0 = Team 1, 1 = Team 2) of the winning team, or undefined for a tie / no result. */
export function getTeamWinnerIndex(game: GameStats | undefined, reference?: string[]): number | undefined {
	if (!game?.settings?.isTeams) return undefined;
	const teams = orderTeams(game.settings.players ?? [], reference);
	const teamOf = (playerIndex: number) => teams.findIndex((t) => t.players.some((p) => p.playerIndex === playerIndex));
	const other = (i: number) => (i === 0 ? 1 : i === 1 ? 0 : undefined);
	const end = game.gameEnd;

	const lras = end?.lrasInitiatorIndex ?? -1;
	if (lras >= 0) {
		const quitter = teamOf(lras);
		return quitter < 0 ? undefined : other(quitter);
	}

	if (game.settings.gameInfoBlock?.bombRainEnabled) return undefined; // sudden death


	if (end?.gameEndMethod === 1 /* TIME */) {
		const frame = game.lastFrame?.players ?? {};
		const totals = teams.map((t) =>
			t.players.reduce(
				(acc, p) => {
					const post = frame[p.playerIndex]?.post;
					const stocks = post?.stocksRemaining ?? 0;
					return { stocks: acc.stocks + stocks, percent: acc.percent + (stocks > 0 ? Math.trunc(post?.percent ?? 0) : 0) };
				},
				{ stocks: 0, percent: 0 },
			),
		);
		if (totals.length < 2) return undefined;
		if (totals[0].stocks !== totals[1].stocks) return totals[0].stocks > totals[1].stocks ? 0 : 1;
		if (totals[0].percent !== totals[1].percent) return totals[0].percent < totals[1].percent ? 0 : 1;
		return undefined; // full tie → tiebreaker game
	}

	// Both teams wiped out (their last players KO'd on the same frame) → tie.
	const posts = (game.settings.players ?? []).map((p) => (p ? game.lastFrame?.players?.[p.playerIndex]?.post : undefined));
	if (posts.length && posts.every((post) => post) && posts.every((post) => (post?.stocksRemaining ?? 0) === 0)) return undefined;
	const firsts = new Set((end?.placements ?? []).filter((pl) => pl.position === 0).map((pl) => teamOf(pl.playerIndex)));
	if (firsts.size > 1) return undefined;
	const first = end?.placements?.find((pl) => pl.position === 0);
	if (!first) return undefined;
	const winner = teamOf(first.playerIndex);
	return winner < 0 ? undefined : winner;
}

/** Which player an element shows. Singles: p1 / p2. Doubles: team + player (slot order above). */
export type PlayerSlot = 't1p1' | 't2p1' | 't1p2' | 't2p2';
export const PLAYER_SLOTS: { value: PlayerSlot; label: string; index: number }[] = [
	{ value: 't1p1', label: 'Team 1 · Player 1 (= Player 1 in singles)', index: 0 },
	{ value: 't1p2', label: 'Team 1 · Player 2', index: 2 },
	{ value: 't2p1', label: 'Team 2 · Player 1 (= Player 2 in singles)', index: 1 },
	{ value: 't2p2', label: 'Team 2 · Player 2', index: 3 },
];

/**
 * The player list an element renders with. Without a slot: unchanged (Player 1 = index 0, Player 2 =
 * index 1 — in doubles that is each team's first player). With a slot: both positions are that slot's
 * player, so a "Player 1 …" or "Player 2 …" element shows the chosen player.
 */
export function playersForSlot<P>(players: P[], slot: PlayerSlot | undefined | null): P[] {
	if (!slot) return players;
	const index = PLAYER_SLOTS.find((s) => s.value === slot)?.index ?? 0;
	const chosen = players[index];
	return chosen ? [chosen, chosen] : [];
}

/** In doubles, a teammate on the same character with a higher port is drawn lighter. */
export function isLighterTeammate(players: (TeamsPlayer & { characterId?: number | null })[], player: (TeamsPlayer & { characterId?: number | null }) | undefined): boolean {
	if (!player) return false;
	return players.some(
		(p) => p && p.playerIndex < player.playerIndex && (p.teamId ?? -1) === (player.teamId ?? -2) && p.characterId === player.characterId,
	);
}

/** A team's name: the host's custom name, else "Tag & Tag" when every player has a tag (display name or
 *  connect code), else the fallback ("Team 1") — never port numbers. */
export function teamDisplayName(custom: string | undefined, players: (TeamsPlayer | undefined)[], fallback: string): string {
	if (custom?.trim()) return custom.trim();
	const present = players.filter(Boolean) as TeamsPlayer[];
	const tags = present.map((p) => p.displayName || p.connectCode || '');
	return present.length && tags.every(Boolean) ? tags.join(' & ') : fallback;
}

/** A finished teams game without a winning team (see the rules at the top). LRAS / disconnects are no result, not ties. */
export function isTeamsTie(game: GameStats | undefined | null): boolean {
	const end = game?.gameEnd;
	if (!game?.settings?.isTeams || !end || (end.lrasInitiatorIndex ?? -1) >= 0) return false;
	if (game.settings.gameInfoBlock?.bombRainEnabled) return true;
	if (![1, 2, 3].includes(end.gameEndMethod ?? 0)) return false; // 0 = cut off, 7 = no contest
	return getTeamWinnerIndex(game) === undefined;
}
