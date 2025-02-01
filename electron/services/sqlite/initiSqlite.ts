import { inject, singleton } from "tsyringe";
import { DataSource } from "typeorm";
import path from 'path';
import { ElectronLog } from "electron-log";
import fs from 'fs';
import { LayerEntity } from "./entities/overlay/layerEntity";
import { OverlayEntity } from "./entities/overlay/overlayEntity";
import { SceneEntity } from "./entities/overlay/sceneEntity";
import { PlayerTypeEntity } from "./entities/player/playerEntity";
import { GameStatsEntity } from "./entities/game/gameStatsEntity";
import { GameSettingsEntity } from "./entities/game/gameSettingsEntity";
import { GameEndTypeEntity } from "./entities/game/gameEndTypeEntity";
import { MatchInfoEntity } from "./entities/game/matchInfoEntity";
import { PostGameStatsEntity } from "./entities/game/postGameStatsEntity";
import { FrameEntryTypeEntity } from "./entities/game/frameEntryTypeEntity";
import { FrameStartTypeEntity } from "./entities/game/frameStartTypeEntity";
import { CurrentPlayerEntity } from "./entities/currentPlayer/currentPlayerEntity";
import { CurrentPlayerRankEntity } from "./entities/currentPlayer/currentPlayerRankEntity";
import { GameInfoTypeEntity } from "./entities/game/gameInfoBlockEntity";

@singleton()
export class SqliteOrm {
  AppDataSource: DataSource;
  initializing: Promise<void>;
  constructor(
    @inject('AppDir') private appDir: string,
    @inject('Dev') private isDev: boolean,
    @inject('ElectronLog') private log: ElectronLog,
  ) {
    this.initializing = this.initOrm();
  }

  private async initOrm() {
    this.log.info("Initializing SqliteOrm")

    const dbPath = this.isDev
      ? path.resolve("./database.sqlite")
      : path.join(this.appDir, "database.sqlite");

    const directory = path.dirname(dbPath);
    if (!fs.existsSync(directory)) {
      this.log.info(`Creating directory ${directory}`);
      fs.mkdirSync(directory, { recursive: true });
    }

    const overlayEntities = [OverlayEntity, SceneEntity, LayerEntity];
    const currentPlayerEntities = [CurrentPlayerEntity, CurrentPlayerRankEntity];
    const playerEntities = [PlayerTypeEntity];
    const gameEntities = [GameStatsEntity, GameSettingsEntity, GameEndTypeEntity, GameStatsEntity, MatchInfoEntity, PostGameStatsEntity, FrameEntryTypeEntity, FrameStartTypeEntity, GameInfoTypeEntity];

    this.AppDataSource = new DataSource({
      type: 'sqlite',
      database: dbPath,
      entities: [...overlayEntities, ...currentPlayerEntities, ...playerEntities, ...gameEntities],
      synchronize: true,
      logging: false,
    });

    await this.initialize();
  }

  async initialize() {
    try {
      await this.AppDataSource.initialize();
      this.log.info("SqliteOrm successfully initialized.");
    } catch (error) {
      this.log.error("Error during DataSource initialization:", error);
    }
  }

}
