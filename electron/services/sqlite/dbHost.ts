/**
 * SQLite host — runs in an Electron utilityProcess (a separate Node process), NOT the main
 * process. better-sqlite3 is fully synchronous; running it here keeps every query off the
 * main thread so a large read can never freeze the UI (macOS was hang-killing the app on a
 * big startup read). Main talks to this host via the SqliteOrm bridge (initiSqlite.ts) over
 * a tiny request/response protocol; all TypeORM entity materialization + JSON parsing happens
 * here, and main only receives already-structured-cloned plain objects.
 */
import 'reflect-metadata';
import { DataSource, type EntityTarget, type ObjectLiteral } from 'typeorm';
import { ENTITIES, createDataSource } from './dataSource';

const ENTITY_MAP = new Map<string, EntityTarget<ObjectLiteral>>(ENTITIES.map((e) => [e.name, e]));

type Req =
	| { id: number; kind: 'init'; dbPath: string }
	| { id: number; kind: 'repo'; entity: string; method: string; args: unknown[] }
	| { id: number; kind: 'clear' };

let dataSource: DataSource | null = null;

async function handle(msg: Req): Promise<unknown> {
	switch (msg.kind) {
		case 'init': {
			if (dataSource) return { ready: true };
			dataSource = createDataSource(msg.dbPath);
			await dataSource.initialize();
			return { ready: true };
		}
		case 'repo': {
			if (!dataSource) throw new Error('DB not initialized');
			const target = ENTITY_MAP.get(msg.entity);
			if (!target) throw new Error(`Unknown entity "${msg.entity}"`);
			const repo = dataSource.getRepository(target) as unknown as Record<string, (...a: unknown[]) => unknown>;
			const fn = repo[msg.method];
			if (typeof fn !== 'function') throw new Error(`Unknown repo method "${msg.method}"`);
			return await fn.apply(repo, msg.args);
		}
		case 'clear': {
			if (!dataSource) throw new Error('DB not initialized');
			const runner = dataSource.createQueryRunner();
			await runner.connect();
			await runner.query('PRAGMA foreign_keys = OFF;');
			for (const table of await runner.getTables()) await runner.clearTable(table.name);
			await runner.query('PRAGMA foreign_keys = ON;');
			await runner.release();
			return { cleared: true };
		}
	}
}

// parentPort is present when spawned via utilityProcess.fork.
const port = process.parentPort;
port.on('message', async (e: Electron.MessageEvent) => {
	const msg = e.data as Req;
	try {
		const result = await handle(msg);
		port.postMessage({ id: msg.id, ok: true, result });
	} catch (err) {
		port.postMessage({ id: msg.id, ok: false, error: err instanceof Error ? (err.stack ?? err.message) : String(err) });
	}
});
