import { inject, singleton } from "tsyringe";
import { OverlayEntity } from "./entities/overlay/overlayEntity";
import { ElectronLog } from "electron-log";
import { Overlay, Scene } from "../../../frontend/src/lib/models/types/overlay";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";
import { SceneEntity } from "./entities/overlay/sceneEntity";
import { LiveStatsScene } from "../../../frontend/src/lib/models/enum";

@singleton()
export class SqliteOverlay {
  private overlayRepo: Repository<OverlayEntity>
  private sceneRepo: Repository<SceneEntity>
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject(SqliteOrm) private sqlite: SqliteOrm,
  ) {
    this.initializeRepositories();
  }

  async initializeRepositories() {
    await this.sqlite.initializing;
    this.overlayRepo = this.sqlite.AppDataSource.getRepository(OverlayEntity);
    this.sceneRepo = this.sqlite.AppDataSource.getRepository(SceneEntity);
  }

  async getOverlays() {
    await this.sqlite.initializing;
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
    await this.sqlite.initializing;

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
    await this.sqlite.initializing;
    this.log.info("Deleting overlay:", overlayId)

    try {
      const overlay = await this.overlayRepo.findOne({ where: { id: overlayId } })
      if (!overlay) return;

      for (const key of Object.keys(LiveStatsScene)) {
        if (!isNaN(Number(key))) continue;
        const statsScene = LiveStatsScene[key as keyof typeof LiveStatsScene];
        await this.sceneRepo.delete({ id: overlay[statsScene]?.id });
      }
      await this.overlayRepo.delete({ id: overlayId })
    } catch (error) {
      this.log.error("Error deleting overlay:", error);
    }
  }

  async getScene(sceneId: number): Promise<SceneEntity | null> {
    await this.sqlite.initializing;
    try {

      const scenes = await this.sceneRepo.findOneBy({ id: sceneId })
      scenes?.layers.sort((a, b) => a.index - b.index);
      return scenes;
    } catch (error) {
      this.log.error("Error getting scene:", error);
      return null;
    }
  }

  async addOrUpdateScene(scene: Scene): Promise<SceneEntity | null> {
    await this.sqlite.initializing;
    this.log.debug("Adding scene:", scene.id);
    const sceneEntity = this.sceneRepo.create(scene);
    try {
      return await this.sceneRepo.save(sceneEntity);
    } catch (error) {
      this.log.error("Error saving scene:", error);
    }
    return null
  }

  async deleteLayer(layerId: number) {
    await this.sqlite.initializing;
    this.log.info("Deleting layer:", layerId)
    try {
      const deleted = await this.sceneRepo.delete({ id: layerId })
      return deleted
    } catch (error) {
      this.log.error("Error deleting layer:", error);
      return null
    }
  }
}
