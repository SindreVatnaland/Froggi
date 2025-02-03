import { inject, singleton } from "tsyringe";
import { ElectronLog } from "electron-log";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";
import { GameStats } from "../../../frontend/src/lib/models/types/slippiData";
import { GameStatsEntity } from "./entities/game/gameStatsEntity";

@singleton()
export class SqliteGame {
  private gameStatsRepo: Repository<GameStatsEntity>;
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject(SqliteOrm) private sqlite: SqliteOrm,
  ) {
    this.initializeRepositories();
  }

  async initializeRepositories() {
    await this.sqlite.initializing;
    this.gameStatsRepo = this.sqlite.AppDataSource.getRepository(GameStatsEntity);
  }

  async addGameStats(gameStats: GameStats): Promise<GameStats | null> {
    await this.sqlite.initializing;
    this.log.info("Adding game stats:", gameStats.settings?.matchInfo.matchId);

    const game = this.gameStatsRepo.create(gameStats);

    try {
      await this.gameStatsRepo.save(game);
      return gameStats;
    } catch (error) {
      this.log.error("Error saving game stats:", error);
      return null;
    }
  }

  async getGamesById(matchId: string): Promise<GameStats[]> {
    await this.sqlite.initializing;
    try {
      const games = await this.gameStatsRepo.find({ where: { settings: { matchInfo: { matchId: matchId } } } });
      if (!games) return [];
      return games as GameStats[];
    } catch (error) {
      this.log.error("Error getting games by id:", error);
      return [];
    }
  }

  async deleteGameStats(matchId: string): Promise<boolean> {
    await this.sqlite.initializing;
    try {
      const game = await this.gameStatsRepo.find({ where: { settings: { matchInfo: { matchId: matchId } } } });
      if (!game) return false;
      await this.gameStatsRepo.remove(game);
      return true;
    } catch (error) {
      this.log.error("Error deleting game stats:", error);
      return false;
    }
  }

  async deleteLocalGameStats(): Promise<boolean> {
    await this.sqlite.initializing;
    try {
      const game = await this.gameStatsRepo.find({ where: { settings: { matchInfo: { matchId: "" } } } });
      if (!game) return false;
      await this.gameStatsRepo.remove(game);
      return true;
    } catch (error) {
      this.log.error("Error deleting game stats:", error);
      return false
    }
  }
}