import { inject, singleton } from "tsyringe";
import { ElectronLog } from "electron-log";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";
import { CurrentPlayerEntity } from "./entities/currentPlayer/currentPlayerEntity";
import { CurrentPlayer, RankedNetplayProfile } from "../../../frontend/src/lib/models/types/slippiData";
import { CurrentPlayerRankEntity } from "./entities/currentPlayer/currentPlayerRankEntity";

@singleton()
export class SqliteCurrentPlayer {
  private currentPlayerRepo: Repository<CurrentPlayerEntity>
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject(SqliteOrm) private sqlite: SqliteOrm,
  ) {
    this.initializeRepositories();
  }

  async initializeRepositories() {
    await this.sqlite.initializing;
    this.currentPlayerRepo = this.sqlite.AppDataSource.getRepository(CurrentPlayerEntity);
  }

  async getCurrentPlayer(connectCode: string): Promise<CurrentPlayer | null> {
    await this.sqlite.initializing;
    const currentPlayer = await this.currentPlayerRepo.findOne({ where: { connectCode: connectCode } });
    return currentPlayer as CurrentPlayer;
  }

  async addOrUpdateCurrentPlayerCurrentRankStats(rank: RankedNetplayProfile): Promise<CurrentPlayer | null> {
    await this.sqlite.initializing;

    this.log.info("Add or update current rank:", rank.connectCode);

    try {
      let currentPlayer = await this.currentPlayerRepo.findOne({
        where: { connectCode: rank.connectCode },
        relations: ["rank"],
      });

      currentPlayer = this.fixCurrentPlayer(currentPlayer, rank);

      await this.currentPlayerRepo.save(currentPlayer);
      return currentPlayer;
    } catch (error) {
      this.log.error("Error saving current rank:", error);
      return null;
    }
  }

  async addOrUpdateCurrentPlayerNewRankStats(rank: RankedNetplayProfile) {
    await this.sqlite.initializing;

    this.log.info("Add or update new rank:", rank.connectCode);

    try {
      let currentPlayer = await this.currentPlayerRepo.findOne({
        where: { connectCode: rank.connectCode },
        relations: ["rank"],
      });

      currentPlayer = this.fixCurrentPlayer(currentPlayer, rank);

      await this.currentPlayerRepo.save(currentPlayer);
      return currentPlayer;
    } catch (error) {
      this.log.error("Error saving new rank:", error);
      return null;
    }
  }

  private fixCurrentPlayer = (currentPlayer: CurrentPlayerEntity | null, rank: RankedNetplayProfile) => {
    if (!currentPlayer) {
      currentPlayer = {
        connectCode: rank.connectCode,
      } as CurrentPlayerEntity;
      this.log.warn(`Player with connectCode ${rank.connectCode} not found.`);
    }

    if (!currentPlayer.rank) {
      this.log.warn(`Rank entity not found for player ${rank.connectCode}, creating a new one.`);
      currentPlayer.rank = { current: rank, new: undefined } as CurrentPlayerRankEntity;
    } else {
      currentPlayer.rank.current = rank;
    }
    return currentPlayer;
  }
}
