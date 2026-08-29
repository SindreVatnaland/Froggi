import { inject, singleton } from "tsyringe";
import { ElectronLog } from "electron-log";
import { OverlayHistoryEntity } from "./entities/overlay/overlayHistoryEntity";
import { Scene } from "../../../frontend/src/lib/models/types/overlay";
import { LiveStatsScene } from "../../../frontend/src/lib/models/enum";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";

@singleton()
export class SqliteOverlayHistory {
  private historyRepo: Repository<OverlayHistoryEntity>
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject(SqliteOrm) private sqlite: SqliteOrm,
  ) {
    this.initializeRepositories();
  }

  async initializeRepositories() {
    await this.sqlite.initializing;
    this.historyRepo = this.sqlite.getRepository(OverlayHistoryEntity);
  }

  async recordEdit(overlayId: string, statsScene: LiveStatsScene, beforeScene: Scene, afterScene: Scene, label: string = ''): Promise<OverlayHistoryEntity | null> {
    await this.sqlite.initializing;
    try {
      const entry = this.historyRepo.create({ overlayId, statsScene, beforeScene, afterScene, label });
      return await this.historyRepo.save(entry);
    } catch (error) {
      this.log.error("Error recording overlay history:", error);
      return null;
    }
  }

  /** Most recent not-yet-undone edit for this overlay+scene, or null if there's nothing left to undo. */
  async getLatestUndoable(overlayId: string, statsScene: LiveStatsScene): Promise<OverlayHistoryEntity | null> {
    await this.sqlite.initializing;
    try {
      return await this.historyRepo.findOne({
        where: { overlayId, statsScene, undoneAt: null as unknown as Date },
        order: { id: 'DESC' },
      });
    } catch (error) {
      this.log.error("Error reading overlay history:", error);
      return null;
    }
  }

  async markUndone(id: number): Promise<void> {
    await this.sqlite.initializing;
    try {
      await this.historyRepo.update({ id }, { undoneAt: new Date() });
    } catch (error) {
      this.log.error("Error marking overlay history undone:", error);
    }
  }

  async listRecent(overlayId: string, statsScene: LiveStatsScene, limit: number = 20): Promise<OverlayHistoryEntity[]> {
    await this.sqlite.initializing;
    try {
      return await this.historyRepo.find({
        where: { overlayId, statsScene },
        order: { id: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.log.error("Error listing overlay history:", error);
      return [];
    }
  }
}
