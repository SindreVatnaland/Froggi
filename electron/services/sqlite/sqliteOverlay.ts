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
    return this.overlayRepo.find();
  }

  async addOrUpdateOverlay(overlay: Overlay) {
    this.log.info("Add or updating overlay:", overlay.id);

    Object.keys(LiveStatsScene)
      .filter(key => isNaN(Number(key)))
      .forEach(key => {
        const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
        overlay[statsScene].layers.forEach(layer => {
          delete layer.id;
        })
        delete overlay[statsScene].id
      })

    const overlayEntity = this.overlayRepo.create(overlay);

    const savedOverlay = await this.overlayRepo.save(overlayEntity);
    return savedOverlay;
  }

  async deleteOverlayById(overlayId: string) {
    console.log("Deleting overlay:", overlayId)
    this.overlayRepo.delete({ id: overlayId })
  }
}
