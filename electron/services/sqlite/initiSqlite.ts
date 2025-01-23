import { inject, singleton } from "tsyringe";
import { DataSource } from "typeorm";
import path from 'path';
import { ElectronLog } from "electron-log";
import fs from 'fs';
import { LayerEntity } from "./entities/layerEntity";
import { OverlayEntity } from "./entities/overlayEntity";
import { SceneEntity } from "./entities/sceneEntity";

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

    this.AppDataSource = new DataSource({
      type: 'sqlite',
      database: dbPath,
      entities: [OverlayEntity, SceneEntity, LayerEntity],
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
