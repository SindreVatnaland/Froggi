import { inject, singleton } from "tsyringe";
import type { ElectronLog } from "electron-log";
import type Store from "electron-store";
import { Repository } from "typeorm";
import { OverlayHistoryEntity } from "./entities/overlay/overlayHistoryEntity";
import { OverlayChangeEntity } from "./entities/overlay/overlayChangeEntity";
import { LiveStatsScene } from "../../../frontend/src/lib/models/enum";
import { SqliteOrm } from "./initiSqlite";
import { diffScenes, invertChange, latestRedoable, latestUndoable, type ChangeAction, type ChangeSource, type SceneChange } from "../../utils/overlayHistory";
import { newId } from "../../utils/functions";

const LEGACY_CONVERTED = 'migrations.overlayHistoryConvertedV1';
const REVERTS_CONVERTED = 'migrations.overlayHistoryUndoLogV1';

/** The light columns (no change JSON) — enough to walk the undo / redo chain. */
export type ChangeRow = Pick<OverlayChangeEntity, 'id' | 'statsScene' | 'kind' | 'itemId' | 'source' | 'action' | 'originId' | 'undoneAt' | 'createdAt'>;
const LIGHT = { id: true, statsScene: true, kind: true, itemId: true, source: true, action: true, originId: true, undoneAt: true, createdAt: true } as const;

/** Overlay edit history (utils/overlayHistory.ts). Local only — not exported, not sent to the frontend. */
@singleton()
export class SqliteOverlayHistory {
  private repo: Repository<OverlayChangeEntity>;
  private ready: Promise<void>;
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject('ElectronStore') private store: Store,
    @inject(SqliteOrm) private sqlite: SqliteOrm,
  ) {
    this.ready = this.init();
  }

  private async init() {
    await this.sqlite.initializing;
    this.repo = this.sqlite.getRepository(OverlayChangeEntity);
    await this.convertLegacy().catch((e) => this.log.error('Converting the old overlay undo history failed:', e));
    await this.convertRevertEntries().catch((e) => this.log.error('Converting undo / redo entries failed:', e));
  }

  /** Saves one save's changes (in order) as edits. Returns the new entry ids. */
  async record(overlayId: string, statsScene: LiveStatsScene, changes: SceneChange[], source: ChangeSource): Promise<number[]> {
    await this.ready;
    return this.insert(overlayId, statsScene, changes.map((change) => ({ change, source, action: 'edit' as const })));
  }

  /**
   * After an undo / redo was applied: logs it as an entry (who, when, what was applied, the edit + its
   * original time) and sets / clears the edit's undone mark. Returns the log entry id.
   */
  async logUndoRedo(edit: OverlayChangeEntity, action: 'undo' | 'redo', source: ChangeSource, applied: SceneChange): Promise<number | undefined> {
    await this.ready;
    const at = new Date().toISOString();
    const [id] = await this.insert(edit.overlayId, edit.statsScene, [{ change: applied, source, action, originId: edit.id, originAt: edit.originAt ?? edit.createdAt }], at);
    await this.setUndone(edit.id, action === 'undo' ? source : null, at);
    return id;
  }

  private async setUndone(id: number, by: ChangeSource | null, at: string) {
    await this.repo.update({ id }, by ? { undoneAt: at, undoneBy: by } : { undoneAt: null, undoneBy: null });
  }

  /** Inserts entries of one group (no waiting for init — the conversions run INSIDE init). */
  private async insert(
    overlayId: string, statsScene: LiveStatsScene,
    entries: { change: SceneChange; source: ChangeSource; action: ChangeAction; originId?: number; originAt?: string }[],
    createdAt = new Date().toISOString(),
  ): Promise<number[]> {
    if (!entries.length) return [];
    const groupId = newId();
    try {
      const rows = entries.map(({ change, source, action, originId, originAt }) => ({
        overlayId, statsScene, kind: change.kind, change, source, action, groupId, createdAt,
        originId: originId ?? null, originAt: originAt ?? createdAt,
        itemId: 'itemId' in change ? change.itemId : null,
        elementId: change.kind === 'itemCreate' ? change.after.elementId : change.kind === 'itemDelete' ? change.before.elementId : change.kind === 'itemUpdate' ? change.after.item.elementId : null,
        undoneAt: null, undoneBy: null, revertOf: null, revertedBy: null,
      }));
      const saved = await this.repo.save(rows as OverlayChangeEntity[]);
      return saved.map((r) => r.id);
    } catch (error) {
      this.log.error('Error recording overlay history:', error);
      return [];
    }
  }

  /** Light rows, newest first. ponytail: loads the overlay's whole chain (no JSON); page in SQL if overlays reach ~100k entries. */
  async rows(overlayId: string, filter: { statsScene?: LiveStatsScene; itemId?: string; source?: ChangeSource } = {}): Promise<ChangeRow[]> {
    await this.ready;
    const where = Object.fromEntries(Object.entries({ overlayId, ...filter }).filter(([, v]) => v !== undefined));
    return this.repo.find({ where, select: LIGHT, order: { id: 'DESC' } });
  }

  async getByIds(ids: number[]): Promise<OverlayChangeEntity[]> {
    await this.ready;
    if (!ids.length) return [];
    // An array of plain where objects (= OR): no TypeORM operators, they can't cross the sqlite host IPC.
    return this.repo.find({ where: ids.map((id) => ({ id })), order: { id: 'DESC' } });
  }

  async latestUndoable(overlayId: string, statsScene: LiveStatsScene) {
    return latestUndoable(await this.rows(overlayId, { statsScene }));
  }

  async latestRedoable(overlayId: string, statsScene: LiveStatsScene) {
    return latestRedoable(await this.rows(overlayId, { statsScene }));
  }

  async deleteForOverlay(overlayId: string) {
    await this.ready;
    await this.repo.delete({ overlayId }).catch((e) => this.log.error('Error deleting overlay history:', e));
  }

  /**
   * One-time: the first undo design stored undo / redo as entries with source undo | redo linked by
   * revertOf → revertedBy. Keep them as log entries (action = undo | redo, originId = the edit at the
   * start of the chain) and set the edit's mark from the chain (an odd number of reverts = undone).
   */
  private async convertRevertEntries() {
    if (this.store.get(REVERTS_CONVERTED)) return;
    const all = await this.repo.find({ select: { id: true, source: true, revertOf: true, revertedBy: true, createdAt: true }, order: { id: 'ASC' } });
    const byId = new Map(all.map((r) => [r.id, r]));
    for (const edit of all.filter((r) => r.source === 'manual' || r.source === 'ai')) {
      const chain: typeof all = [];
      for (let next = edit.revertedBy; next !== null && byId.has(next); next = byId.get(next)!.revertedBy) chain.push(byId.get(next)!);
      for (const revert of chain) {
        await this.repo.update({ id: revert.id }, { action: revert.source as unknown as ChangeAction, source: 'manual', originId: edit.id, originAt: edit.createdAt });
      }
      if (chain.length % 2 === 1) await this.setUndone(edit.id, 'manual', chain[chain.length - 1].createdAt);
    }
    this.store.set(REVERTS_CONVERTED, true);
  }

  /**
   * One-time: the old AI-only history (whole-scene before / after copies) → per-element 'ai' edits; an
   * old undo (it restored the whole scene) undoes all of that edit's entries (marks + undo log entries,
   * newest first like Ctrl+Z). The old rows are deleted afterwards.
   */
  private async convertLegacy() {
    if (this.store.get(LEGACY_CONVERTED)) return;
    const legacy = this.sqlite.getRepository(OverlayHistoryEntity);
    const old = await legacy.find({ order: { id: 'ASC' } });
    const events = old.flatMap((e) => {
      const at = (d: Date | string) => new Date(d).toISOString();
      const edit = { at: at(e.createdAt), entry: e, undo: false };
      return e.undoneAt ? [edit, { at: at(e.undoneAt), entry: e, undo: true }] : [edit];
    }).sort((a, b) => a.at.localeCompare(b.at));
    const editsOf = new Map<number, { ids: number[]; at: string }>();
    for (const { at, entry, undo } of events) {
      const changes = diffScenes(entry.beforeScene, entry.afterScene);
      if (!undo) {
        editsOf.set(entry.id, { at, ids: await this.insert(entry.overlayId, entry.statsScene, changes.map((change) => ({ change, source: 'ai' as const, action: 'edit' as const })), at) });
        continue;
      }
      const edits = editsOf.get(entry.id);
      const ids = edits?.ids ?? [];
      for (let i = ids.length - 1; i >= 0; i--) {
        await this.insert(entry.overlayId, entry.statsScene, [{ change: invertChange(changes[i]), source: 'ai', action: 'undo', originId: ids[i], originAt: edits!.at }], at);
        await this.setUndone(ids[i], 'ai', at);
      }
    }
    if (old.length) await legacy.delete(old.map((e) => e.id));
    this.store.set(LEGACY_CONVERTED, true);
    if (old.length) this.log.info(`Converted ${old.length} old AI undo entries into the overlay history`);
  }
}
