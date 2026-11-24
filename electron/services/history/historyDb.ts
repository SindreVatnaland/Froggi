import { GAME_COLUMNS, HISTORY_SCHEMA_VERSION, PLAYER_COLUMNS, type ReplayData, historyRows } from './historyRows';

/** The bit of better-sqlite3 the history uses (the package ships no types). */
export interface Db {
	exec(sql: string): Db;
	prepare(sql: string): Stmt;
	pragma(source: string): unknown;
	transaction<F extends (...args: never[]) => unknown>(fn: F): F;
	close(): void;
}
interface Stmt {
	run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
	get(...params: unknown[]): Record<string, unknown> | undefined;
	all(...params: unknown[]): Record<string, unknown>[];
	iterate(...params: unknown[]): IterableIterator<Record<string, unknown>>;
	columns(): { name: string }[];
	readonly reader: boolean;
	readonly readonly: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require('better-sqlite3') as new (file: string, options?: { readonly?: boolean; fileMustExist?: boolean }) => Db;

/** history.sqlite — separate from Froggi's main database (which holds webhook / OAuth secrets), so the AI's
 *  SQL can only ever see game history. */
export function openHistoryDb(file: string): Db {
	const db = new Database(file);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)');
	if (getMeta(db, 'schema_version') !== String(HISTORY_SCHEMA_VERSION)) {
		// Columns changed: rebuild from the replays (the import sees every file as new).
		db.exec('DROP VIEW IF EXISTS my_games; DROP VIEW IF EXISTS game_players; DROP TABLE IF EXISTS players; DROP TABLE IF EXISTS games; DROP TABLE IF EXISTS files;');
		setMeta(db, 'schema_version', String(HISTORY_SCHEMA_VERSION));
	}
	const cols = (list: { name: string; type: string }[]) => list.filter((c) => c.name !== 'id').map((c) => `${c.name} ${c.type}`).join(', ');
	db.exec(`
		CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY, ${cols(GAME_COLUMNS)}, UNIQUE(path));
		CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY, game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE, ${cols(PLAYER_COLUMNS)});
		CREATE TABLE IF NOT EXISTS files (path TEXT PRIMARY KEY, mtime INTEGER, status TEXT, reason TEXT);
		CREATE INDEX IF NOT EXISTS players_game ON players(game_id);
		CREATE INDEX IF NOT EXISTS players_code ON players(connect_code);
		CREATE INDEX IF NOT EXISTS games_started ON games(started_at);
	`);
	// Views are rebuilt every start so they always match the columns.
	const side = (alias: string, prefix: string) => PLAYER_COLUMNS.map((c) => `${alias}.${c.name} AS ${prefix}_${c.name}`).join(', ');
	db.exec(`
		DROP VIEW IF EXISTS my_games;
		CREATE VIEW my_games AS
			SELECT g.*, me.won AS won, ${side('me', 'my')}, ${side('op', 'opp')}
			FROM games g
			JOIN players me ON me.game_id = g.id AND upper(me.connect_code) = (SELECT upper(value) FROM meta WHERE key = 'me_code')
			JOIN players op ON op.game_id = g.id AND op.id <> me.id
			WHERE g.is_teams = 0 AND g.player_count = 2;
		DROP VIEW IF EXISTS game_players;
		CREATE VIEW game_players AS
			SELECT p.*, g.started_at, g.mode, g.stage, g.stage_id, g.match_id, g.is_teams, g.player_count, g.duration_s, g.end_method,
				g.is_handwarmer, g.is_tie, g.path,
				(p.connect_code IS NOT NULL AND upper(p.connect_code) = (SELECT upper(value) FROM meta WHERE key = 'me_code')) AS is_me
			FROM players p JOIN games g ON g.id = p.game_id;
	`);
	return db;
}

/** A read-only connection for the AI's queries. */
export function openHistoryReader(file: string): Db {
	const db = new Database(file, { readonly: true, fileMustExist: true });
	db.pragma('query_only = ON');
	return db;
}

export const getMeta = (db: Db, key: string) => db.prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value as string | undefined;
export const setMeta = (db: Db, key: string, value: string | null) =>
	value == null ? db.prepare('DELETE FROM meta WHERE key = ?').run(key) : db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(key, value);

/** Store one replay (replacing an older import of the same file). Returns whether it became a game. */
export function storeReplay(db: Db, replay: ReplayData): boolean {
	const rows = historyRows(replay);
	const save = db.transaction(() => {
		db.prepare('DELETE FROM games WHERE path = ?').run(replay.path);
		if (rows) {
			const gameKeys = Object.keys(rows.game);
			const { lastInsertRowid } = db
				.prepare(`INSERT INTO games (${gameKeys.join(', ')}) VALUES (${gameKeys.map(() => '?').join(', ')})`)
				.run(...gameKeys.map((k) => rows.game[k]));
			const playerKeys = PLAYER_COLUMNS.map((c) => c.name);
			const insert = db.prepare(`INSERT INTO players (game_id, ${playerKeys.join(', ')}) VALUES (?, ${playerKeys.map(() => '?').join(', ')})`);
			for (const p of rows.players) insert.run(lastInsertRowid, ...playerKeys.map((k) => p[k]));
		}
		markFile(db, replay.path, replay.mtime, rows ? 'ok' : 'skipped', rows ? null : 'not a game (no settings or < 2 players)');
	});
	save();
	return !!rows;
}

export const markFile = (db: Db, path: string, mtime: number, status: 'ok' | 'skipped' | 'error', reason: string | null) =>
	db.prepare('INSERT OR REPLACE INTO files (path, mtime, status, reason) VALUES (?, ?, ?, ?)').run(path, mtime, status, reason);

export const MAX_ROWS = 1000;

/** Run the AI's SQL: one read-only SELECT (or WITH … SELECT), at most `limit` rows. */
export function runQuery(db: Db, sql: string, limit: number): { columns: string[]; rows: Record<string, unknown>[]; truncated: boolean } {
	const text = sql.trim().replace(/;\s*$/, '');
	// A read-only connection still accepts ATTACH (it doesn't change the file) — never let it open another database.
	if (/\b(attach|detach)\b/i.test(text)) throw new Error('ATTACH / DETACH are not allowed.');
	const stmt = db.prepare(text);
	if (!stmt.reader || !stmt.readonly) throw new Error('Only read queries (SELECT / WITH … SELECT) are allowed.');
	const rows: Record<string, unknown>[] = [];
	let truncated = false;
	for (const row of stmt.iterate()) {
		if (rows.length >= Math.min(limit, MAX_ROWS)) {
			truncated = true;
			break;
		}
		rows.push(row);
	}
	return { columns: stmt.columns().map((c) => c.name), rows, truncated };
}
