import { inject, singleton } from "tsyringe";
import { OverlayEntity } from "./entities/overlay/overlayEntity";
import { ElectronLog } from "electron-log";
import { Overlay, Scene } from "../../../frontend/src/lib/models/types/overlay";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";
import { SceneEntity } from "./entities/overlay/sceneEntity";
import { LiveStatsScene } from "../../../frontend/src/lib/models/enum";
import type { FindManyOptions } from "typeorm";

// Loading an overlay pulls its 7 OneToOne scenes, each with a OneToMany layers relation. TypeORM's
// default 'join' strategy (and eager relations always use join) emits ONE query joining all 7 scenes'
// layers → a CARTESIAN PRODUCT of the per-scene layer counts, which explodes into millions of rows and
// OOMs the better-sqlite3 host (~4GB heap, exit code 6 — "no overlays" + Dolphin instability). Disable
// eager loading and request the relations explicitly with the 'query' strategy so each loads via its
// own small query instead. (relationLoadStrategy is ignored for EAGER relations, hence loadEagerRelations:false.)
const OVERLAY_LOAD_OPTIONS: Pick<FindManyOptions<OverlayEntity>, 'loadEagerRelations' | 'relationLoadStrategy' | 'relations'> = {
  loadEagerRelations: false,
  relationLoadStrategy: 'query',
  relations: {
    waitingForDolphin: { layers: true },
    menu: { layers: true },
    inGame: { layers: true },
    postGame: { layers: true },
    postSet: { layers: true },
    rankChange: { layers: true },
    strikePhase: { layers: true },
  },
};

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
    this.overlayRepo = this.sqlite.getRepository(OverlayEntity);
    this.sceneRepo = this.sqlite.getRepository(SceneEntity);
  }

  async getOverlays() {
    await this.sqlite.initializing;
    const overlays = await this.overlayRepo.find(OVERLAY_LOAD_OPTIONS);
    overlays.forEach(overlay => {
      overlay.waitingForDolphin?.layers.sort((a, b) => a.index - b.index);
      overlay.menu?.layers.sort((a, b) => a.index - b.index);
      overlay.inGame?.layers.sort((a, b) => a.index - b.index);
      overlay.postGame?.layers.sort((a, b) => a.index - b.index);
      overlay.postSet?.layers.sort((a, b) => a.index - b.index);
      overlay.rankChange?.layers.sort((a, b) => a.index - b.index);
      overlay.strikePhase?.layers.sort((a, b) => a.index - b.index);
    });
    return overlays;
  }

  async addOrUpdateOverlay(overlay: Overlay) {
    await this.sqlite.initializing;

    this.log.info("Add or updating overlay:", overlay.id);

    try {
      const existing = await this.overlayRepo.findOne({ where: { id: overlay.id }, ...OVERLAY_LOAD_OPTIONS });
      if (existing) {
        // Merge into the loaded entity so TypeORM issues UPDATE, not INSERT
        this.overlayRepo.merge(existing, overlay);
        return await this.overlayRepo.save(existing);
      }
      const overlayEntity = this.overlayRepo.create(overlay);
      return await this.overlayRepo.save(overlayEntity);
    } catch (error) {
      this.log.error("Error saving overlay:", error);
    }
    return null;
  }

  async deleteOverlayById(overlayId: string) {
    await this.sqlite.initializing;
    this.log.info("Deleting overlay:", overlayId)

    try {
      const overlay = await this.overlayRepo.findOne({ where: { id: overlayId }, ...OVERLAY_LOAD_OPTIONS })
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
    try {
      if (scene.id) {
        const existing = await this.sceneRepo.findOne({ where: { id: scene.id } });
        if (existing) {
          this.sceneRepo.merge(existing, scene);
          return await this.sceneRepo.save(existing);
        }
      }
      const sceneEntity = this.sceneRepo.create(scene);
      return await this.sceneRepo.save(sceneEntity);
    } catch (error) {
      this.log.error("Error saving scene:", error);
    }
    return null;
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
