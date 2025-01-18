import { inject, singleton } from "tsyringe";
import { OverlayEntity } from "./entities/overlayEntity";
import { ElectronLog } from "electron-log";
import { Overlay, Scene } from "../../../frontend/src/lib/models/types/overlay";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";
import { SceneEntity } from "./entities/sceneEntity";
import { LiveStatsScene } from "../../../frontend/src/lib/models/enum";

@singleton()
export class SqliteOverlay {
  private overlayRepo: Repository<OverlayEntity>
  private sceneRepo: Repository<SceneEntity>
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject(SqliteOrm) private sqlite: SqliteOrm,
  ) {
    this.overlayRepo = this.sqlite.AppDataSource.getRepository(OverlayEntity);
    this.sceneRepo = this.sqlite.AppDataSource.getRepository(SceneEntity);
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

    try {
      const savedOverlay = await this.overlayRepo.save(overlayEntity);
      return savedOverlay;
    } catch (error) {
      this.log.error("Error saving overlay:", error);
    }
    return null;
  }

  async deleteOverlayById(overlayId: string) {
    this.log.info("Deleting overlay:", overlayId)
    const overlay = await this.overlayRepo.findOne({ where: { id: overlayId } })
    if (!overlay) return;

    for (const key of Object.keys(LiveStatsScene)) {
      if (!isNaN(Number(key))) continue;
      const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
      await this.sceneRepo.delete({ id: overlay[statsScene].id });
    }
    await this.overlayRepo.delete({ id: overlayId })
  }

  async getScene(sceneId: number): Promise<SceneEntity | null> {
    const scenes = await this.sceneRepo.findOneBy({ id: sceneId })
    scenes?.layers.sort((a, b) => a.index - b.index);
    return scenes;
  }

  async addOrUpdateScene(scene: Scene): Promise<SceneEntity> {
    this.log.debug("Adding scene:", scene.id);
    const sceneEntity = this.sceneRepo.create(scene);
    return await this.sceneRepo.save(sceneEntity);
  }

  async deleteLayer(layerId: number) {
    this.log.info("Deleting layer:", layerId)
    const deleted = await this.sceneRepo.delete({ id: layerId })
    return deleted
  }
}
