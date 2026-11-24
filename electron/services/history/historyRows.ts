import { characters, stages } from '@slippi/slippi-js';
import { SlippiGame } from '@slippi/slippi-js/node';
import { nulled } from '../../../frontend/src/lib/models/types/slippiTypes';
import { fightStatsFromFrames, type FightStatsByPlayer } from '../../../frontend/src/lib/utils/fightStats';
import type { GameStats } from '../../../frontend/src/lib/models/types/slippiData';
import type { GameEndType, GameStartType, PostFrameUpdateType, StatsType } from '../../../frontend/src/lib/models/types/slippiTypes';
import { getGameMode, getWinnerIndex, isHandwarmers, isTiedGame } from '../../../frontend/src/lib/utils/gamePredicates';
import { getTeamWinnerIndex, orderTeams, playerKey } from '../../../frontend/src/lib/utils/teams';
import { enableTeamsStats } from './teamsStats';

/**
 * Game history for the AI (history.sqlite): one row per game + one per player in it, every stat its own
 * column. The column lists below are the table schema AND the descriptions the AI reads
 * (get_game_history_schema) — add a column here and both follow. Bump HISTORY_SCHEMA_VERSION when the
 * columns change: the history is then rebuilt from the replays.
 */
export const HISTORY_SCHEMA_VERSION = 2;

export type SqlType = 'INTEGER' | 'REAL' | 'TEXT';
export interface Column { name: string; type: SqlType; description: string }

type Stats = NonNullable<StatsType>;
type Overall = Stats['overall'][number];
type Actions = Stats['actionCounts'][number];

export interface ReplayData {
	path: string;
	mtime: number;
	settings: GameStartType | null;
	metadata: { startAt?: string | null; lastFrame?: number | null; playedOn?: string | null; consoleNick?: string | null } | null;
	gameEnd: GameEndType | null;
	lastFrame: { players?: Record<number, { post?: PostFrameUpdateType | null } | null> } | null;
	stats: Stats | null;
	/** Teams only: damage / KOs per player (playerKey) from the frames — slippi-js has no doubles conversions. */
	fight?: FightStatsByPlayer | null;
}

/** Read a replay for the history (doubles get per-player stats too — enableTeamsStats). */
export function readReplay(file: string, relPath: string, mtime: number): ReplayData {
	enableTeamsStats();
	const game = new SlippiGame(file);
	const settings = nulled(game.getSettings());
	const isTeams = !!settings?.isTeams && (settings.players?.length ?? 0) > 2;
	return {
		path: relPath,
		mtime,
		settings,
		metadata: nulled(game.getMetadata()),
		gameEnd: nulled(game.getGameEnd()),
		lastFrame: nulled(game.getLatestFrame()) as ReplayData['lastFrame'],
		stats: nulled(game.getStats()) as Stats | null,
		fight: isTeams && settings ? fightStatsFromFrames(settings.players, true, nulled(game.getFrames())) : null,
	};
}

const END_METHOD: Record<number, string> = { 0: 'unresolved', 1: 'time', 2: 'game', 3: 'resolved', 7: 'no_contest' };

export const GAME_COLUMNS: Column[] = [
	{ name: 'id', type: 'INTEGER', description: 'Game id (players.game_id points here).' },
	{ name: 'path', type: 'TEXT', description: 'Replay file, relative to the Slippi replay folder (YYYY-MM/Game_….slp) when inside it.' },
	{ name: 'started_at', type: 'TEXT', description: 'When the game started, ISO 8601 UTC (from the replay). Use date(started_at) / strftime for days, weeks, months.' },
	{ name: 'duration_s', type: 'REAL', description: 'Game length in seconds (from GO).' },
	{ name: 'mode', type: 'TEXT', description: "ranked | unranked | direct (friendlies / netplay direct) | teams (online teams) | local (offline / console, no online mode)." },
	{ name: 'match_id', type: 'TEXT', description: 'Slippi match id (online): games of one ranked set / direct session share it.' },
	{ name: 'game_number', type: 'INTEGER', description: 'Game number within the Slippi session (online).' },
	{ name: 'tiebreaker_number', type: 'INTEGER', description: 'Ranked 1-stock tiebreaker counter (0 = normal game).' },
	{ name: 'is_teams', type: 'INTEGER', description: '1 = teams / doubles game.' },
	{ name: 'player_count', type: 'INTEGER', description: 'Players in the game (2 = singles).' },
	{ name: 'stage_id', type: 'INTEGER', description: 'Melee stage id.' },
	{ name: 'stage', type: 'TEXT', description: 'Stage name (Battlefield, Final Destination, Yoshi\'s Story, Dream Land N64, Fountain of Dreams, Pokémon Stadium, …).' },
	{ name: 'end_method', type: 'TEXT', description: 'game (stocks ran out) | time | no_contest (LRAS quit or disconnect) | resolved | unresolved (replay cut off).' },
	{ name: 'lras_port', type: 'INTEGER', description: 'Port (1–4) of the player who quit with L+R+A+Start, else NULL.' },
	{ name: 'winner_port', type: 'INTEGER', description: 'Winning port (1–4) in singles; NULL for ties, handwarmers, unfinished games and teams.' },
	{ name: 'winner_team', type: 'INTEGER', description: 'Winning team id in teams games, else NULL.' },
	{ name: 'is_tie', type: 'INTEGER', description: '1 = tie → a 1-stock tiebreaker game (singles: double KO, equal timeout; teams: equal team stocks + percent on time, both teams\' last players KO\'d together, sudden death).' },
	{ name: 'is_handwarmer', type: 'INTEGER', description: '1 = looks like a warm-up (little damage, LRAS early; never ranked) — usually filter these out.' },
	{ name: 'is_complete', type: 'INTEGER', description: '1 = the game ran to its end (0 = replay cut off).' },
	{ name: 'played_on', type: 'TEXT', description: 'dolphin | network | nintendont.' },
];

const pct = (n: number | undefined | null) => (n == null ? null : Math.trunc(n));
const ratio = (r: { ratio?: number | null } | undefined) => (r?.ratio == null || !Number.isFinite(r.ratio) ? null : r.ratio);
const share = (good: number, bad: number) => (good + bad > 0 ? good / (good + bad) : null);

interface PlayerColumn extends Column {
	get: (p: PlayerInput) => number | string | null;
	/** Built from slippi-js conversions (attacker → victim pairs): NULL in teams games. */
	singlesOnly?: boolean;
}
interface PlayerInput {
	player: GameStartType['players'][number] & {};
	overall: Overall | undefined;
	actions: Actions | undefined;
	post: PostFrameUpdateType | null | undefined;
	stocks: Stats['stocks'];
	won: number | null;
	metaName: string | null;
	metaCode: string | null;
	fight: FightStatsByPlayer[string] | undefined;
}

const attack = (move: keyof Actions['attackCount'], label: string): PlayerColumn => ({
	name: `attack_${move}`, type: 'INTEGER', description: `${label} used (count).`, get: (p) => p.actions?.attackCount?.[move] ?? null,
});

export const PLAYER_COLUMNS: PlayerColumn[] = [
	{ name: 'port', type: 'INTEGER', description: 'Controller port 1–4.', get: (p) => p.player.playerIndex + 1 },
	{ name: 'connect_code', type: 'TEXT', description: 'Slippi connect code (ABC#123), online games only; NULL offline.', get: (p) => p.player.connectCode || p.metaCode || null },
	{ name: 'display_name', type: 'TEXT', description: 'Slippi display name (online).', get: (p) => p.player.displayName || p.metaName || null },
	{ name: 'tag', type: 'TEXT', description: 'In-game name tag (offline).', get: (p) => p.player.nametag || null },
	{ name: 'character_id', type: 'INTEGER', description: 'Melee character id.', get: (p) => p.player.characterId ?? null },
	{ name: 'character', type: 'TEXT', description: 'Character name (Fox, Falco, Marth, Sheik, Captain Falcon, Jigglypuff, Peach, Ice Climbers, …).', get: (p) => (p.player.characterId == null ? null : characters.getCharacterName(p.player.characterId)) },
	{ name: 'color', type: 'INTEGER', description: 'Costume index (0 = default).', get: (p) => p.player.characterColor ?? null },
	{ name: 'team_id', type: 'INTEGER', description: 'Team id in teams games, else NULL.', get: (p) => p.player.teamId ?? null },
	{ name: 'is_cpu', type: 'INTEGER', description: '1 = CPU player.', get: (p) => (p.player.type === 1 ? 1 : 0) },
	{ name: 'won', type: 'INTEGER', description: '1 = this player (or their team) won, 0 = lost, NULL = tie / no result / handwarmer.', get: (p) => p.won },
	{ name: 'start_stocks', type: 'INTEGER', description: 'Stocks at the start.', get: (p) => p.player.startStocks ?? null },
	{ name: 'stocks_left', type: 'INTEGER', description: 'Stocks left at the end.', get: (p) => p.post?.stocksRemaining ?? null },
	{ name: 'end_percent', type: 'INTEGER', description: 'Percent at the end (as shown).', get: (p) => pct(p.post?.percent) },
	{ name: 'kills', type: 'INTEGER', description: 'Stocks this player took (teams: KOs credited by last hit).', get: (p) => (p.fight ? p.fight.kos : p.overall?.killCount ?? null) },
	{ name: 'deaths', type: 'INTEGER', description: 'Stocks this player lost.', get: (p) => p.stocks.filter((s) => s.playerIndex === p.player.playerIndex && s.endFrame != null).length },
	{
		name: 'avg_death_percent', type: 'REAL', description: 'Average percent at which this player lost a stock (higher = lived longer).',
		get: (p) => {
			const lost = p.stocks.filter((s) => s.playerIndex === p.player.playerIndex && s.endFrame != null && s.endPercent != null);
			return lost.length ? lost.reduce((sum, s) => sum + (s.endPercent ?? 0), 0) / lost.length : null;
		},
	},
	{ name: 'damage_dealt', type: 'REAL', description: 'Total damage dealt to opponents (teams: credited by last hit, teammates excluded).', get: (p) => (p.fight ? p.fight.damage : p.overall?.totalDamage ?? null) },
	{ name: 'conversions', type: 'INTEGER', singlesOnly: true, description: 'Openings turned into a punish (conversion count) — singles only (NULL in teams).', get: (p) => p.overall?.conversionCount ?? null },
	{ name: 'successful_conversion_ratio', type: 'REAL', singlesOnly: true, description: 'Share of openings that became a punish (0–1) — singles only (NULL in teams).', get: (p) => ratio(p.overall?.successfulConversions) },
	{ name: 'openings_per_kill', type: 'REAL', singlesOnly: true, description: 'Openings needed per kill (lower = better punishes) — singles only (NULL in teams).', get: (p) => ratio(p.overall?.openingsPerKill) },
	{ name: 'damage_per_opening', type: 'REAL', singlesOnly: true, description: 'Average damage per opening (higher = better punishes) — singles only (NULL in teams).', get: (p) => ratio(p.overall?.damagePerOpening) },
	{ name: 'neutral_win_ratio', type: 'REAL', singlesOnly: true, description: 'Share of neutral exchanges won (0–1) — singles only (NULL in teams).', get: (p) => ratio(p.overall?.neutralWinRatio) },
	{ name: 'neutral_wins', type: 'INTEGER', singlesOnly: true, description: 'Neutral exchanges won — singles only (NULL in teams).', get: (p) => p.overall?.neutralWinRatio?.count ?? null },
	{ name: 'counter_hit_ratio', type: 'REAL', singlesOnly: true, description: 'Share of counter hits (0–1) — singles only (NULL in teams).', get: (p) => ratio(p.overall?.counterHitRatio) },
	{ name: 'beneficial_trade_ratio', type: 'REAL', singlesOnly: true, description: 'Share of trades that went this player\'s way (0–1) — singles only (NULL in teams).', get: (p) => ratio(p.overall?.beneficialTradeRatio) },
	{ name: 'inputs_per_minute', type: 'REAL', description: 'Inputs per minute (APM-like).', get: (p) => ratio(p.overall?.inputsPerMinute) },
	{ name: 'digital_inputs_per_minute', type: 'REAL', description: 'Button presses per minute.', get: (p) => ratio(p.overall?.digitalInputsPerMinute) },
	{ name: 'l_cancel_success', type: 'INTEGER', description: 'Successful L-cancels.', get: (p) => p.actions?.lCancelCount?.success ?? null },
	{ name: 'l_cancel_fail', type: 'INTEGER', description: 'Missed L-cancels.', get: (p) => p.actions?.lCancelCount?.fail ?? null },
	{ name: 'l_cancel_ratio', type: 'REAL', description: 'L-cancel success rate (0–1).', get: (p) => (p.actions ? share(p.actions.lCancelCount?.success ?? 0, p.actions.lCancelCount?.fail ?? 0) : null) },
	{ name: 'edge_cancel_success', type: 'INTEGER', description: 'Edge cancels done in time.', get: (p) => p.actions?.edgeCancelCount?.success ?? null },
	{ name: 'edge_cancel_slow', type: 'INTEGER', description: 'Edge cancels done late.', get: (p) => p.actions?.edgeCancelCount?.slow ?? null },
	{ name: 'wavedashes', type: 'INTEGER', description: 'Wavedashes.', get: (p) => p.actions?.wavedashCount ?? null },
	{ name: 'wavelands', type: 'INTEGER', description: 'Wavelands.', get: (p) => p.actions?.wavelandCount ?? null },
	{ name: 'air_dodges', type: 'INTEGER', description: 'Air dodges.', get: (p) => p.actions?.airDodgeCount ?? null },
	{ name: 'dash_dances', type: 'INTEGER', description: 'Dash dances.', get: (p) => p.actions?.dashDanceCount ?? null },
	{ name: 'spot_dodges', type: 'INTEGER', description: 'Spot dodges.', get: (p) => p.actions?.spotDodgeCount ?? null },
	{ name: 'rolls', type: 'INTEGER', description: 'Rolls.', get: (p) => p.actions?.rollCount ?? null },
	{ name: 'ledgegrabs', type: 'INTEGER', description: 'Ledge grabs.', get: (p) => p.actions?.ledgegrabCount ?? null },
	{ name: 'taunts', type: 'INTEGER', description: 'Taunts.', get: (p) => p.actions?.tauntCount ?? null },
	{ name: 'grabs_success', type: 'INTEGER', description: 'Grabs that connected.', get: (p) => p.actions?.grabCount?.success ?? null },
	{ name: 'grabs_fail', type: 'INTEGER', description: 'Missed grabs.', get: (p) => p.actions?.grabCount?.fail ?? null },
	{ name: 'throws_up', type: 'INTEGER', description: 'Up throws.', get: (p) => p.actions?.throwCount?.up ?? null },
	{ name: 'throws_forward', type: 'INTEGER', description: 'Forward throws.', get: (p) => p.actions?.throwCount?.forward ?? null },
	{ name: 'throws_back', type: 'INTEGER', description: 'Back throws.', get: (p) => p.actions?.throwCount?.back ?? null },
	{ name: 'throws_down', type: 'INTEGER', description: 'Down throws.', get: (p) => p.actions?.throwCount?.down ?? null },
	{ name: 'tech_away', type: 'INTEGER', description: 'Tech rolls away (teams: relative to one opponent).', get: (p) => p.actions?.groundTechCount?.away ?? null },
	{ name: 'tech_in', type: 'INTEGER', description: 'Tech rolls in (teams: relative to one opponent).', get: (p) => p.actions?.groundTechCount?.in ?? null },
	{ name: 'tech_neutral', type: 'INTEGER', description: 'Techs in place.', get: (p) => p.actions?.groundTechCount?.neutral ?? null },
	{ name: 'tech_fail', type: 'INTEGER', description: 'Missed techs.', get: (p) => p.actions?.groundTechCount?.fail ?? null },
	{ name: 'wall_tech_success', type: 'INTEGER', description: 'Wall techs.', get: (p) => p.actions?.wallTechCount?.success ?? null },
	{ name: 'wall_tech_fail', type: 'INTEGER', description: 'Missed wall techs.', get: (p) => p.actions?.wallTechCount?.fail ?? null },
	attack('jab1', 'Jab 1'), attack('jab2', 'Jab 2'), attack('jab3', 'Jab 3'), attack('jabm', 'Rapid jab'), attack('dash', 'Dash attack'),
	attack('ftilt', 'Forward tilt'), attack('utilt', 'Up tilt'), attack('dtilt', 'Down tilt'),
	attack('fsmash', 'Forward smash'), attack('usmash', 'Up smash'), attack('dsmash', 'Down smash'),
	attack('nair', 'Neutral air'), attack('fair', 'Forward air'), attack('bair', 'Back air'), attack('uair', 'Up air'), attack('dair', 'Down air'),
];

/** The rows of one replay, or null when it isn't a playable game (no settings / players). */
export function historyRows(replay: ReplayData): { game: Record<string, unknown>; players: Record<string, unknown>[] } | null {
	const { settings, metadata, gameEnd, stats } = replay;
	const players = (settings?.players ?? []).filter((p): p is NonNullable<typeof p> => !!p);
	if (!settings || players.length < 2) return null;

	const isTeams = !!settings.isTeams;
	const fightOf = (p: (typeof players)[number]) => (isTeams ? replay.fight?.[playerKey(p)] : undefined);
	// Teams: damage / KOs from the frames (slippi-js conversions are singles-only) — the warm-up check reads them.
	const postGameStats = stats && isTeams
		? { ...stats, overall: stats.overall.map((o) => { const f = fightOf(players.find((p) => p.playerIndex === o.playerIndex)!); return f ? { ...o, totalDamage: f.damage, killCount: f.kos } : o; }) }
		: stats;
	const asGame = { settings, gameEnd, lastFrame: replay.lastFrame, postGameStats } as unknown as GameStats;
	const hasEnd = !!gameEnd && !!stats;
	const handwarmer = hasEnd ? isHandwarmers(asGame) : false;
	// Teams: getTeamWinnerIndex = index into orderTeams (Team 1 / Team 2).
	const teamIndex = hasEnd && isTeams && !handwarmer ? getTeamWinnerIndex(asGame) : undefined;
	const winnerTeam = teamIndex == null ? null : (orderTeams(players)[teamIndex]?.players[0]?.teamId ?? null);
	const tie = hasEnd ? isTiedGame(asGame) : false;
	const winnerIndex = hasEnd && !isTeams ? getWinnerIndex(asGame) : undefined;
	const lras = gameEnd?.lrasInitiatorIndex ?? -1;
	const lastFrame = metadata?.lastFrame ?? stats?.lastFrame ?? null;

	const game = {
		path: replay.path,
		started_at: metadata?.startAt ?? null,
		duration_s: lastFrame == null ? null : Math.max(0, (lastFrame + 123) / 60),
		mode: getGameMode(settings),
		match_id: settings.matchInfo?.matchId || null,
		game_number: settings.matchInfo?.gameNumber ?? null,
		tiebreaker_number: settings.matchInfo?.tiebreakerNumber ?? null,
		is_teams: isTeams ? 1 : 0,
		player_count: players.length,
		stage_id: settings.stageId ?? null,
		stage: settings.stageId == null ? null : stages.getStageName(settings.stageId),
		end_method: gameEnd ? (END_METHOD[gameEnd.gameEndMethod ?? 0] ?? String(gameEnd.gameEndMethod)) : 'unresolved',
		lras_port: lras >= 0 ? lras + 1 : null,
		winner_port: winnerIndex == null ? null : winnerIndex + 1,
		winner_team: winnerTeam,
		is_tie: tie ? 1 : 0,
		is_handwarmer: handwarmer ? 1 : 0,
		is_complete: stats?.gameComplete ? 1 : 0,
		played_on: metadata?.playedOn ?? null,
	};

	const decided = hasEnd && !tie && !handwarmer && (isTeams ? winnerTeam != null : winnerIndex != null);
	const rows = players.map((player) => {
		const won = !decided ? null : isTeams ? (player.teamId === winnerTeam ? 1 : 0) : player.playerIndex === winnerIndex ? 1 : 0;
		const meta = (metadata as { players?: Record<number, { names?: { netplay?: string | null; code?: string | null } }> } | null)?.players?.[player.playerIndex];
		const input: PlayerInput = {
			player,
			overall: stats?.overall?.find((o) => o.playerIndex === player.playerIndex),
			actions: stats?.actionCounts?.find((a) => a.playerIndex === player.playerIndex),
			post: replay.lastFrame?.players?.[player.playerIndex]?.post,
			stocks: stats?.stocks ?? [],
			won,
			metaName: meta?.names?.netplay ?? null,
			metaCode: meta?.names?.code ?? null,
			fight: fightOf(player),
		};
		return Object.fromEntries(PLAYER_COLUMNS.map((c) => [c.name, isTeams && c.singlesOnly ? null : c.get(input)]));
	});
	return { game, players: rows };
}
