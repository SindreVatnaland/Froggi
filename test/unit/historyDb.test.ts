import fs from 'fs';
import os from 'os';
import path from 'path';
import { type Db, openHistoryDb, openHistoryReader, runQuery, setMeta, storeReplay } from '../../electron/services/history/historyDb';
import { readReplay } from '../../electron/services/history/historyRows';

// Game history for the AI (history.sqlite): sample replays → rows, the my_games view, and the SQL guard.
const SAMPLES = path.join(__dirname, '../sample-games');
const ME = 'FLCD#507'; // the recording player of the direct / unranked sample sets ([W] / [L] in the file names)

let dir: string;
let db: Db;
let reader: Db;
const files: string[] = [];

beforeAll(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'froggi-history-'));
	db = openHistoryDb(path.join(dir, 'history.sqlite'));
	for (const set of fs.readdirSync(SAMPLES)) {
		for (const file of fs.readdirSync(path.join(SAMPLES, set)).filter((f) => f.endsWith('.slp'))) {
			const rel = `${set}/${file}`;
			storeReplay(db, readReplay(path.join(SAMPLES, rel), rel, 1));
			files.push(rel);
		}
	}
	setMeta(db, 'me_code', ME.toLowerCase()); // codes match case-insensitively
	reader = openHistoryReader(path.join(dir, 'history.sqlite'));
}, 120_000);

afterAll(() => {
	reader?.close();
	db?.close();
	fs.rmSync(dir, { recursive: true, force: true });
});

describe('game history', () => {
	it('stores every sample replay once, with a player row per player', () => {
		expect(runQuery(reader, 'SELECT count(*) AS n FROM games', 10).rows[0].n).toBe(files.length);
		const doubles = runQuery(reader, "SELECT player_count, is_teams, mode FROM games WHERE path LIKE 'online-teams-1/%' LIMIT 1", 10).rows[0];
		expect(doubles).toEqual({ player_count: 4, is_teams: 1, mode: 'teams' });
		// Teams games get a winning team (two winners, two losers) — not flagged as warm-ups.
		const teams = runQuery(reader, "SELECT SUM(won = 1) AS w, SUM(won = 0) AS l, SUM(g.is_handwarmer) AS hw FROM players p JOIN games g ON g.id = p.game_id WHERE g.mode = 'teams'", 10).rows[0];
		expect(teams).toEqual({ w: 8, l: 8, hw: 0 });
		// slippi-js has no doubles stats — the history fills the per-player ones (stocks, actions, inputs, damage / KOs)
		// and leaves conversion stats NULL.
		const doublesStats = runQuery(reader, `SELECT SUM(deaths) AS deaths, SUM(kills) AS kills, SUM(damage_dealt) > 0 AS damage,
			SUM(l_cancel_success + l_cancel_fail) > 0 AS lcancels, SUM(inputs_per_minute) > 0 AS inputs, COUNT(openings_per_kill) AS opk
			FROM game_players WHERE is_teams = 1`, 10).rows[0];
		expect(doublesStats).toMatchObject({ damage: 1, lcancels: 1, inputs: 1, opk: 0 });
		expect(Number(doublesStats.deaths)).toBeGreaterThan(0);
		// every KO is credited to someone or was a self-destruct: kills never exceed deaths
		expect(Number(doublesStats.kills)).toBeGreaterThan(0);
		expect(Number(doublesStats.kills)).toBeLessThanOrEqual(Number(doublesStats.deaths));
		expect(runQuery(reader, 'SELECT count(*) AS n FROM players WHERE character IS NULL OR port IS NULL', 10).rows[0].n).toBe(0);
	});

	it('re-importing a file replaces it', () => {
		const rel = files[0];
		storeReplay(db, readReplay(path.join(SAMPLES, rel), rel, 2));
		expect(runQuery(reader, 'SELECT count(*) AS n FROM games', 10).rows[0].n).toBe(files.length);
		expect(runQuery(reader, 'SELECT count(*) AS n FROM players WHERE game_id NOT IN (SELECT id FROM games)', 10).rows[0].n).toBe(0);
	});

	it('my_games: the signed-in code\'s singles games, won matches the [W] / [L] file names', () => {
		const rows = runQuery(reader, 'SELECT path, won, my_connect_code, opp_connect_code FROM my_games', 1000).rows;
		expect(rows.length).toBeGreaterThan(0);
		for (const row of rows) {
			expect(row.my_connect_code).toBe(ME);
			expect(row.opp_connect_code).not.toBe(ME);
			const tag = /\[(W|L)\]/.exec(String(row.path))?.[1];
			if (tag && row.won !== null) expect([row.path, row.won]).toEqual([row.path, tag === 'W' ? 1 : 0]);
		}
		// Teams games never show up in my_games.
		expect(rows.some((r) => String(r.path).includes('teams'))).toBe(false);
	});

	it('the AI can only read: writes, ATTACH and multiple statements are refused', () => {
		expect(() => runQuery(reader, 'DELETE FROM games', 10)).toThrow();
		expect(() => runQuery(reader, "UPDATE meta SET value = 'x'", 10)).toThrow();
		expect(() => runQuery(reader, "ATTACH DATABASE 'other.sqlite' AS o", 10)).toThrow(/ATTACH/);
		expect(() => runQuery(reader, 'SELECT 1; DELETE FROM games', 10)).toThrow();
		expect(() => runQuery(reader, 'CREATE TABLE x (a)', 10)).toThrow();
		const capped = runQuery(reader, 'SELECT * FROM players', 3);
		expect(capped.rows.length).toBe(3);
		expect(capped.truncated).toBe(true);
	});
});
