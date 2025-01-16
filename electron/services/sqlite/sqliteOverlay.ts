import { inject, singleton } from "tsyringe";
import { OverlayEntity } from "./entities/overlayEntities";
import { ElectronLog } from "electron-log";
import { Overlay } from "../../../frontend/src/lib/models/types/overlay";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";
import { LiveStatsScene } from "../../../frontend/src/lib/models/enum";

@singleton()
export class SqliteOverlay {
  private overlayRepo: Repository<OverlayEntity>
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject(SqliteOrm) private sqlite: SqliteOrm,
  ) {
    this.overlayRepo = this.sqlite.AppDataSource.getRepository(OverlayEntity);
  }

  async getOverlays() {
    const overlays = await this.overlayRepo.find();
    overlays.forEach(overlay => {
      overlay.waitingForDolphin?.layers.sort((a, b) => a.index - b.index);
      overlay.menu?.layers.sort((a, b) => a.index - b.index);
      overlay.inGame?.layers.sort((a, b) => a.index - b.index);
      overlay.postGame?.layers.sort((a, b) => a.index - b.index);
      overlay.postSet?.layers.sort((a, b) => a.index - b.index);
      overlay.rankChange?.layers.sort((a, b) => a.index - b.index);
    });
    return overlays;
  }

  async addOrUpdateOverlay(overlay: Overlay) {
    this.log.info("Add or updating overlay:", overlay.id);

    const overlayEntity = this.overlayRepo.create(overlay);

    const savedOverlay = await this.overlayRepo.save(overlayEntity);
    return savedOverlay;
  }

  async deleteOverlayById(overlayId: string) {
    this.log.info("Deleting overlay:", overlayId)
    const deleted = await this.overlayRepo.delete({ id: overlayId })
    return deleted
  }
}
