import { inject, singleton } from "tsyringe";
import type { DataSource, EntityTarget, ObjectLiteral, Repository } from "typeorm";
import { utilityProcess, type UtilityProcess } from "electron";
import path from 'path';
import fs from 'fs';
import { ElectronLog } from "electron-log";
import { createDataSource } from "./dataSource";

/**
 * Bridge to the SQLite host (dbHost.ts) running in a utilityProcess. Keeps the same role the
 * old on-main-thread DataSource had — services still call `getRepository(X).find(...)` etc. and
 * await the result — but every op now runs in a separate Node process, so a synchronous
 * better-sqlite3 query can never freeze the UI.
 *
 * Under jest (plain Node, no Electron) `utilityProcess` is undefined; there we fall back to an
 * in-process DataSource so the test harness keeps working exactly as before.
 */
type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

// The repo methods our sqlite services actually use. Kept in sync with the call sites.
const REPO_METHODS = ['find', 'findOne', 'findOneBy', 'save', 'remove', 'update', 'delete', 'count'] as const;

@singleton()
export class SqliteOrm {
  initializing: Promise<void>;
  private child: UtilityProcess | null = null;
  private localDs: DataSource | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();

  constructor(
    @inject('AppDir') private appDir: string,
    @inject('Dev') private isDev: boolean,
    @inject('ElectronLog') private log: ElectronLog,
  ) {
    this.initializing = this.boot();
  }

  private getDbPath(): string {
    const dbPath = path.join(this.appDir, "database.sqlite");
    const directory = path.dirname(dbPath);
    if (!fs.existsSync(directory)) {
      this.log.info(`Creating directory ${directory}`);
      fs.mkdirSync(directory, { recursive: true });
    }
    return dbPath;
  }

  private async boot(): Promise<void> {
    const dbPath = this.getDbPath();

    // No Electron (jest): run the DataSource in-process, same as before the utilityProcess split.
    if (!utilityProcess?.fork) {
      this.log.info("Initializing SqliteOrm (in-process — no utilityProcess)");
      this.localDs = createDataSource(dbPath);
      await this.localDs.initialize();
      return;
    }

    this.log.info("Initializing SqliteOrm (utilityProcess host)");
    const workerPath = path.join(__dirname, 'dbHost.js');
    this.child = utilityProcess.fork(workerPath, [], { serviceName: 'froggi-sqlite' });

    this.child.on('message', (msg: { id: number; ok: boolean; result?: unknown; error?: string }) => {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error(msg.error ?? 'DB host error'));
    });

    this.child.on('exit', (code) => {
      this.log.error(`SQLite host exited (code ${code}). Pending DB calls will reject.`);
      for (const [, p] of this.pending) p.reject(new Error('SQLite host exited'));
      this.pending.clear();
    });

    return new Promise<void>((resolve, reject) => {
      this.child!.once('spawn', async () => {
        try {
          await this.request({ kind: 'init', dbPath });
          this.log.info("SqliteOrm host ready.");
          resolve();
        } catch (error) {
          this.log.error("Error initializing SQLite host:", error);
          reject(error as Error);
        }
      });
    });
  }

  private request(payload: Record<string, unknown>): Promise<unknown> {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      if (!this.child) return reject(new Error('SQLite host not started'));
      this.pending.set(id, { resolve, reject });
      this.child.postMessage({ id, ...payload });
    });
  }

  /**
   * Returns a proxy that mimics a TypeORM Repository for the methods the services use. In-process
   * (test) mode returns the real repository. In host mode each call forwards to the utilityProcess;
   * `create` and `merge` are synchronous, in-memory TypeORM helpers (no DB access), so they run
   * locally instead of round-tripping — the host's `save` normalizes the plain object and applies
   * column defaults. `create` passes the object through; `merge` assigns the sources onto the target.
   */
  getRepository<T extends ObjectLiteral>(entityClass: EntityTarget<T>): Repository<T> {
    if (this.localDs) return this.localDs.getRepository(entityClass);

    const entity = typeof entityClass === 'function' ? entityClass.name : String((entityClass as { name?: string }).name ?? entityClass);
    const proxy: Record<string, unknown> = {
      create: (obj: unknown) => obj,
      merge: (target: Record<string, unknown>, ...sources: unknown[]) => Object.assign(target ?? {}, ...sources),
    };
    for (const method of REPO_METHODS) {
      proxy[method] = (...args: unknown[]) => this.request({ kind: 'repo', entity, method, args });
    }
    return proxy as unknown as Repository<T>;
  }

  /** Dev/test only — wipe every table. Used by the test harness between runs. */
  async clearAllTables(): Promise<void> {
    if (!this.isDev) return;
    await this.initializing;
    if (this.localDs) {
      const runner = this.localDs.createQueryRunner();
      await runner.connect();
      await runner.query('PRAGMA foreign_keys = OFF;');
      for (const table of await runner.getTables()) await runner.clearTable(table.name);
      await runner.query('PRAGMA foreign_keys = ON;');
      await runner.release();
    } else {
      await this.request({ kind: 'clear' });
    }
    this.log.info("All tables cleared.");
  }
}
