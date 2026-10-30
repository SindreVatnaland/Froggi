import type { FightStats } from './fightStats';
import type { FlowTokens } from '../models/types/flow';

/**
 * The game state every flow can read as {{state.…}} and POST as a body ("Game state"). Built in the
 * backend (flowService.gameStateObject) from everything Froggi tracks: Slippi's game settings, live
 * frames, rank, fight stats, set score, stage striking and OBS. Lists are 1-based objects so paths
 * read naturally: {{state.players.1.percent}}, {{state.teams.2.stocks}}.
 * Players are in slot order (Player 1/2; doubles: 1 = team 1 first player, 2 = team 2 first player,
 * 3/4 = their partners). Teams are computed here only (doubles) — nothing else in the app uses them.
 */
export interface FlowStatePlayer {
	name: string | null;
	displayName: string | null;
	connectCode: string | null;
	tag: string | null;
	port: number | null;
	character: string | null;
	characterId: number | null;
	costume: number | null;
	team: string | null;
	isCurrentPlayer: boolean;
	stocks: number | null;
	percent: number | null;
	rank: { rank: string | null; rating: number | null; leaderboardPlacement: number | null };
	fight: { game: FightStats | null; match: FightStats | null };
}

export interface FlowStateTeam {
	color: string;
	players: string;
	stocks: number | null;
	percent: number | null;
	score: number;
}

export interface FlowGameState {
	scene: string | null;
	mode: string | null;
	format: 'singles' | 'doubles';
	isTeams: boolean;
	match: { id: string | null; gameNumber: number | null; bestOf: number | null };
	/** Stage striking set: running (started on the Dashboard, not finished) and whether the set is decided
	 *  (someone reached the winning score — Slippi's best-of, or the striking set's). */
	set: { isActive: boolean; isComplete: boolean };
	stage: { id: number; name: string } | null;
	rules: { stocks: number | null; timerMinutes: number | null; friendlyFire: boolean | null; isPAL: boolean | null; isFrozenPS: boolean | null };
	score: Record<string, number>;
	players: Record<string, FlowStatePlayer>;
	teams: Record<string, FlowStateTeam>;
	/** The StrikeState webhook payload (get_webhook_reference), or null outside a set. */
	/** Stage striking (utils/strikeFlowState.ts) — phase, turn, players, the stage to play, every stage's status and who struck / banned / picked it. Empty without a set. */
	strike: import('./strikeFlowState').FlowStrikeState | null;
	/** The latest GameEnd webhook payload. */
	lastGame: Record<string, unknown> | null;
	obs: { scene: string | null; replayBuffer: boolean };
	/** Win chance in percent (utils/winProbability.ts): this game (null when no game runs) and the set.
	 *  Key 1 = Player 1's side, 2 = Player 2's side (doubles: teams). */
	odds: {
		game: Record<string, number | null>;
		set: Record<string, number>;
		/** Seconds left on the game timer (null: no timer / no game) — the game odds lean toward the timeout winner as it runs out. */
		secondsLeft: number | null;
		/** How long stocks lasted this set (respawn included): avg (pulled toward 40 s while few), min, max, count. */
		stockSeconds: { avg: number | null; min: number | null; max: number | null; count: number };
	};
	/** Clips in each built highlight reel (by video key). */
	highlight: { reels: Record<string, number> };
	/** This computer's public addresses (Tailscale Funnel = permanent, ngrok = temporary), null when off. */
	links: { tailscale: string | null; ngrok: string | null };
	/** Now and the start of today (local midnight), ms — e.g. keep list items added today: item.added >= state.time.today. */
	time: { now: number; today: number };
}

export const TEAM_COLORS = ['Red', 'Blue', 'Green'];

const fight = (damage: number, kos: number): FightStats => ({ damage, kos, koPercent: kos ? 118 : 0, deaths: 1, deathPercent: 96 });
const samplePlayer = (n: number, name: string, character: string, characterId: number, team: string | null): FlowStatePlayer => ({
	name,
	displayName: name,
	connectCode: `${name.toUpperCase()}#${n}23`,
	tag: null,
	port: n,
	character,
	characterId,
	costume: 0,
	team,
	isCurrentPlayer: n === 1,
	stocks: 4 - n,
	percent: 30 + n * 17.5,
	rank: { rank: 'Platinum 2', rating: 1650.4 + n, leaderboardPlacement: null },
	fight: { game: fight(120 + n * 20, n), match: fight(410 + n * 35, 3 + n) },
});

/** Example state (a doubles game, so every path exists) — the picker shows it when no game is on,
 *  Test uses it for missing values, and validation checks {{state.…}} paths against it. */
export const SAMPLE_GAME_STATE: FlowGameState = {
	scene: 'InGame',
	mode: 'direct',
	format: 'doubles',
	isTeams: true,
	match: { id: 'mode.direct-2026-10-06T18:00:00.00-0', gameNumber: 2, bestOf: 3 },
	set: { isActive: true, isComplete: false },
	stage: { id: 31, name: 'Battlefield' },
	rules: { stocks: 4, timerMinutes: 8, friendlyFire: true, isPAL: false, isFrozenPS: true },
	score: { 1: 1, 2: 0 },
	players: {
		1: samplePlayer(1, 'Mango', 'Fox', 2, 'Red'),
		2: samplePlayer(2, 'Zain', 'Marth', 9, 'Blue'),
		3: samplePlayer(3, 'Aklo', 'Falco', 20, 'Red'),
		4: samplePlayer(4, 'Moky', 'Sheik', 19, 'Blue'),
	},
	teams: {
		1: { color: 'Red', players: 'Mango & Aklo', stocks: 4, percent: 149.5, score: 1 },
		2: { color: 'Blue', players: 'Zain & Moky', stocks: 2, percent: 167, score: 0 },
	},
	strike: {
		phase: 'stagePick', gameNumber: 2, bestOf: 3, score: { p1: 1, p2: 0 },
		turn: { player: 'p2', name: 'Zain', action: 'pick' },
		p1: { name: 'Mango', character: 'Falco', partnerCharacter: null, rps: 'rock', dsr: "Yoshi's Story" },
		p2: { name: 'Zain', character: 'Marth', partnerCharacter: null, rps: 'scissors', dsr: '' },
		rpsWinner: 'p1', stage: null,
		history: [
			{ order: 1, game: 1, action: 'strike', stage: 'Fountain of Dreams', stageKey: 'fountainOfDreams', player: 'p1', name: 'Mango' },
			{ order: 2, game: 1, action: 'strike', stage: 'Battlefield', stageKey: 'battlefield', player: 'p2', name: 'Zain' },
			{ order: 3, game: 1, action: 'strike', stage: 'Final Destination', stageKey: 'finalDestination', player: 'p2', name: 'Zain' },
			{ order: 4, game: 1, action: 'strike', stage: 'Dream Land', stageKey: 'dreamLand', player: 'p1', name: 'Mango' },
			{ order: 5, game: 1, action: 'pick', stage: "Yoshi's Story", stageKey: 'yoshisStory', player: null, name: null },
			{ order: 6, game: 2, action: 'ban', stage: 'Final Destination', stageKey: 'finalDestination', player: 'p1', name: 'Mango' },
		],
		stages: {
			fountainOfDreams: { name: 'Fountain of Dreams', status: 'available', isAvailable: true, isLocked: false, isStruck: false, isBanned: false, isDsr: false, isPicked: false, by: null, byName: null, order: null },
			battlefield: { name: 'Battlefield', status: 'available', isAvailable: true, isLocked: false, isStruck: false, isBanned: false, isDsr: false, isPicked: false, by: null, byName: null, order: null },
			finalDestination: { name: 'Final Destination', status: 'banned', isAvailable: false, isLocked: false, isStruck: false, isBanned: true, isDsr: false, isPicked: false, by: 'p1', byName: 'Mango', order: 1 },
			dreamLand: { name: 'Dream Land', status: 'available', isAvailable: true, isLocked: false, isStruck: false, isBanned: false, isDsr: false, isPicked: false, by: null, byName: null, order: null },
			yoshisStory: { name: "Yoshi's Story", status: 'available', isAvailable: true, isLocked: false, isStruck: false, isBanned: false, isDsr: false, isPicked: false, by: null, byName: null, order: null },
			pokemonStadium: { name: 'Pokémon Stadium', status: 'available', isAvailable: true, isLocked: false, isStruck: false, isBanned: false, isDsr: false, isPicked: false, by: null, byName: null, order: null },
		},
	},
	lastGame: { score: [1, 0], stage: { id: 8, name: "Yoshi's Story" }, mode: 'direct', gameEndMethod: 'GAME', lrasInitiatorIndex: null, timestamp: '2026-10-06T18:04:12.000Z' },
	obs: { scene: 'Game', replayBuffer: true },
	odds: { game: { 1: 64, 2: 36 }, set: { 1: 82, 2: 18 }, secondsLeft: 214, stockSeconds: { avg: 38.5, min: 12.3, max: 71.0, count: 5 } },
	highlight: { reels: { game: 5, set: 5 } },
	time: { now: 1791753170000, today: 1791720000000 },
	links: { tailscale: 'https://my-pc.tail1234.ts.net', ngrok: 'https://abc123.ngrok-free.app' },
};

/** Leaf values as dotted paths (arrays 1-based): { players: { 1: { name } } } → "prefix.players.1.name". */
export function flattenState(value: unknown, prefix: string, out: FlowTokens = {}): FlowTokens {
	if (Array.isArray(value)) value.forEach((v, i) => flattenState(v, `${prefix}.${i + 1}`, out));
	else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) flattenState(v, prefix ? `${prefix}.${k}` : k, out);
	else out[prefix] = (value ?? null) as FlowTokens[string];
	return out;
}

/** A path with list positions generalised: state.players.3.name → state.players.#.name. */
const shape = (path: string) => path.replace(/\.\d+(?=\.|$)/g, '.#');
const KNOWN_SHAPES = new Set(Object.keys(flattenState(SAMPLE_GAME_STATE, 'state')).map(shape));

/** Whether {{key}} is a real game-state path. strike / lastGame mirror webhook payloads, so anything
 *  under them is accepted (ponytail: check against the payload types if typos there become a problem). */
export const isStateKey = (key: string) =>
	KNOWN_SHAPES.has(shape(key)) || /^state\.(strike|lastGame)\.[\w.]+$/.test(key);
