import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { mcpContext } from '../mcpContext';
import { GAME_COLUMNS, PLAYER_COLUMNS } from '../../history/historyRows';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

// Fewer digits = fewer tokens; 4 decimals is plenty for ratios and averages.
const compact = (v: unknown) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 10000) / 10000 : v);

const EXAMPLES = [
	{ question: 'My record vs one player (online)', sql: "SELECT opp_display_name, COUNT(*) AS games, SUM(won) AS wins, ROUND(AVG(won), 3) AS win_rate FROM my_games WHERE opp_connect_code = 'ABC#123' AND won IS NOT NULL" },
	{ question: 'Who I play most, with records', sql: 'SELECT opp_connect_code, MAX(opp_display_name) AS name, COUNT(*) AS games, SUM(won) AS wins FROM my_games WHERE won IS NOT NULL GROUP BY opp_connect_code ORDER BY games DESC LIMIT 20' },
	{ question: 'Win rate per matchup and stage (ranked)', sql: "SELECT my_character, opp_character, stage, COUNT(*) AS games, ROUND(AVG(won), 3) AS win_rate FROM my_games WHERE mode = 'ranked' AND won IS NOT NULL GROUP BY 1, 2, 3 HAVING games >= 5 ORDER BY games DESC" },
	{ question: 'Sets (not games) vs a player: one Slippi match id = one set / session', sql: "SELECT match_id, MIN(started_at) AS started, SUM(won) AS my_games_won, SUM(1 - won) AS their_games_won FROM my_games WHERE opp_connect_code = 'ABC#123' AND won IS NOT NULL GROUP BY match_id ORDER BY started DESC" },
	{ question: 'Tech skill trend per month', sql: "SELECT strftime('%Y-%m', started_at) AS month, COUNT(*) AS games, ROUND(SUM(my_l_cancel_success) * 1.0 / NULLIF(SUM(my_l_cancel_success + my_l_cancel_fail), 0), 3) AS l_cancel_rate, ROUND(AVG(my_neutral_win_ratio), 3) AS neutral_wins, ROUND(AVG(my_openings_per_kill), 2) AS openings_per_kill FROM my_games WHERE is_handwarmer = 0 GROUP BY month ORDER BY month" },
	{ question: 'Doubles / any player (game_players has every player of every game)', sql: "SELECT character, COUNT(*) AS games, ROUND(AVG(won), 3) AS win_rate FROM game_players WHERE is_me = 1 AND is_teams = 1 AND won IS NOT NULL GROUP BY character" },
];

export function registerGameHistoryReadTools(server: McpServer) {
	server.registerTool(
		'get_game_history_schema',
		{
			description:
				'Schema of the user\'s Melee game history (every Slippi replay, imported into a local SQLite database) + import status. Call this FIRST, then answer performance questions ("my record vs X", "how do I do vs Marth", "my L-cancel rate this month", "best stage", head-to-head in ranked / unranked / friendlies) with query_game_history. Returns tables, views and every column with its meaning, the signed-in connect code ("me"), and example queries.',
			inputSchema: {},
		},
		async () => {
			const history = mcpContext.historyService;
			if (!history) return error('Game history is not available.');
			history.recount();
			const status = history.getStatus();
			const describe = (cols: { name: string; type: string; description: string }[]) => Object.fromEntries(cols.map((c) => [c.name, `${c.type} — ${c.description}`]));
			return text({
				me: status.me ?? 'NOT SIGNED IN — my_games is empty until the user signs in to Slippi (Froggi uses the signed-in connect code as "me").',
				status: {
					...status,
					hint: status.state === 'importing' || status.state === 'paused'
						? `Import running (${status.done}/${status.total}) — answers cover only the replays imported so far.`
						: status.pending
							? `${status.pending} replays are not imported yet — answers miss them. Offer to import (import_replays, or Settings → Game History → Import replays); it runs in the background and can be cancelled.`
							: undefined,
				},
				views: {
					my_games: 'START HERE. Singles games the signed-in player played (online — offline games have no connect code): every games column + won (1/0/NULL) + my_<player column> and opp_<player column> for both sides (e.g. my_character, opp_connect_code, my_l_cancel_ratio).',
					game_players: 'One row per player per game, with the game\'s started_at / mode / stage / match_id / is_teams / … and is_me (1 = the signed-in player). Use for doubles and for players other than me.',
				},
				tables: {
					games: describe(GAME_COLUMNS),
					players: { game_id: 'INTEGER — games.id', ...describe(PLAYER_COLUMNS) },
				},
				notes: [
					'SQLite dialect, one read-only SELECT per call (WITH … SELECT works). Results are capped — aggregate in SQL (COUNT, AVG, GROUP BY) instead of pulling raw games.',
					'won is NULL for ties, handwarmers and games without a result — filter `won IS NOT NULL` for records and win rates.',
					'Exclude warm-ups with is_handwarmer = 0 for skill stats. Very short games (duration_s < 30) are usually quits.',
					'Ratios are 0–1; ratio columns can be NULL when nothing happened (e.g. no L-cancels). For rates over many games prefer SUM(success) / SUM(success + fail) over AVG(ratio).',
					'started_at is UTC ISO 8601 — date(started_at), strftime(\'%Y-%m\', started_at), started_at >= date(\'now\', \'-30 days\').',
					'Connect codes are upper case with # (ABC#123); match case-insensitively with upper(). Display names can change, codes do not.',
					'A ranked set / unranked session / direct session shares match_id: GROUP BY match_id for sets.',
					'Only replays in the Slippi replay folder are included; the history is local to this computer.',
					'Teams games: per-player stocks, deaths, action counts, inputs, kills and damage (credited by last hit) are filled; conversion stats (openings, neutral, punishes, counter hits, trades) are NULL — Slippi computes those for singles only.',
				],
				examples: EXAMPLES,
			});
		},
	);

	server.registerTool(
		'query_game_history',
		{
			description:
				'Run ONE read-only SQLite SELECT against the user\'s game history (call get_game_history_schema first for the columns). Returns columns + rows (arrays) + truncated. Aggregate in SQL; ask only for the columns you need. Timeout 15 s.',
			inputSchema: {
				sql: z.string().describe('One SELECT (or WITH … SELECT) statement.'),
				limit: z.number().int().min(1).max(1000).optional().describe('Max rows (default 100).'),
			},
		},
		async ({ sql, limit }) => {
			const history = mcpContext.historyService;
			if (!history) return error('Game history is not available.');
			try {
				const result = await history.query(sql, limit ?? 100);
				return text({
					columns: result.columns,
					rows: result.rows.map((row) => result.columns.map((c) => compact(row[c]))),
					rowCount: result.rows.length,
					truncated: result.truncated || undefined,
				});
			} catch (e) {
				return error(`Query failed: ${(e as Error).message}`);
			}
		},
	);
}

export function registerGameHistoryWriteTools(server: McpServer) {
	server.registerTool(
		'import_replays',
		{
			description:
				'Import the replays not in the game history yet (get_game_history_schema → status.pending), newest first, in the background (paused while a game runs; ~0.5 s per replay). Ask the user first — it uses CPU for a while. action "cancel" stops it; what was imported stays and the next "start" picks up the rest. Progress: Settings → Game History (progress bar) and get_game_history_schema.',
			inputSchema: { action: z.enum(['start', 'cancel']).optional().describe('start (default) or cancel') },
		},
		async ({ action }) => {
			const history = mcpContext.historyService;
			if (!history) return error('Game history is not available.');
			if (action === 'cancel') {
				history.cancelImport();
				return text({ cancelled: true, note: 'Imported games stay; start again to pick up the rest.' });
			}
			const result = history.importAll();
			if (!result.started) return error(result.reason ?? 'Could not start the import.');
			return text({ started: true, status: history.getStatus() });
		},
	);
}
