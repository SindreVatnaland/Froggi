import { inject, singleton } from "tsyringe";
import { ElectronLog } from "electron-log";
import { SqliteOrm } from "./initiSqlite";
import { Repository } from "typeorm";
import { CurrentPlayerEntity } from "./entities/currentPlayer/currentPlayerEntity";
import { CurrentPlayer, Player, RankedNetplayProfile } from "../../../frontend/src/lib/models/types/slippiData";
import { CurrentPlayerRankEntity } from "./entities/currentPlayer/currentPlayerRankEntity";
import { fixCurrentPlayer } from "../../utils/playerHelp";

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

  async addOrUpdateCurrentPlayerBaseData(player: Player): Promise<CurrentPlayer | null> {
    await this.sqlite.initializing;

    this.log.info("Add or update current player:", player);

    try {
      let currentPlayer = await this.currentPlayerRepo.findOne({
        where: { connectCode: player.connectCode },
        relations: ["rank"],
      });

      const updatedPlayer = { ...player, ...currentPlayer } as CurrentPlayerEntity;

      await this.currentPlayerRepo.save(updatedPlayer);
      return updatedPlayer;
    } catch (error) {
      this.log.error("Error saving player:", error);
      return null;
    }
  }

  async addOrUpdateCurrentPlayerCurrentRankStats(rank: RankedNetplayProfile): Promise<CurrentPlayer | null> {
    await this.sqlite.initializing;

    this.log.info("Add or update current rank:", rank.connectCode);

    try {
      let currentPlayer = await this.currentPlayerRepo.findOne({
        where: { connectCode: rank.connectCode },
        relations: ["rank"],
      });

      currentPlayer = fixCurrentPlayer(currentPlayer, rank);

      if (!currentPlayer.rank) {
        this.log.warn(`Rank entity not found for player ${rank.connectCode}, creating a new one.`);
        currentPlayer.rank = { current: rank, new: undefined } as CurrentPlayerRankEntity;
      } else {
        currentPlayer.rank.current = rank;
      }

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

      currentPlayer = fixCurrentPlayer(currentPlayer, rank);

      if (!currentPlayer.rank) {
        this.log.warn(`Rank entity not found for player ${rank.connectCode}, creating a new one.`);
        currentPlayer.rank = { current: undefined, new: rank } as CurrentPlayerRankEntity;
      } else {
        currentPlayer.rank.new = rank;
      }

      await this.currentPlayerRepo.save(currentPlayer);
      return currentPlayer;
    } catch (error) {
      this.log.error("Error saving new rank:", error);
      return null;
    }
  }
}
