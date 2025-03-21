import { delay, inject, singleton } from "tsyringe";
import { ElectronLog } from "electron-log";
import { SqliteOrm } from "./initiSqlite";
import { FindOptionsWhere, Repository } from "typeorm";
import { GameStartMode, GameStats } from "../../../frontend/src/lib/models/types/slippiData";
import { GameStatsEntity } from "./entities/game/gameStatsEntity";
import { ElectronGamesStore } from "../../services/store/storeGames";
import { MessageHandler } from "../../services/messageHandler";

@singleton()
export class SqliteGame {
  private gameStatsRepo: Repository<GameStatsEntity>;
  constructor(
    @inject('ElectronLog') private log: ElectronLog,
    @inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
    @inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
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
      const savedStats = await this.gameStatsRepo.save(game);
      await this.storeGames.setRecentGameId(savedStats.settings?.matchInfo.matchId ?? "");
      await this.sendRecentGames();
      return gameStats;
    } catch (error) {
      this.log.error("Error saving game stats:", error);
      return null;
    }
  }

  async addGameStatsBatch(gameStatsList: GameStats[]): Promise<GameStats[] | null> {
    await this.sqlite.initializing;

    this.log.info(`Adding batch of ${gameStatsList.length} game stats`);

    const games = gameStatsList.map((gameStats) => this.gameStatsRepo.create(gameStats));

    try {
      await this.gameStatsRepo.save(games); // Bulk save
      await this.storeGames.setRecentGameId(gameStatsList[0].settings?.matchInfo.matchId ?? "");
      await this.sendRecentGames();
      return gameStatsList;
    } catch (error) {
      this.log.error("Error saving batch of game stats:", error);
      return null;
    }
  }


  async getGamesById(matchId: string, mode?: GameStartMode): Promise<GameStats[]> {
    await this.sqlite.initializing;
    try {
      const query = { settings: { matchInfo: { matchId, mode } } } as FindOptionsWhere<GameStatsEntity>;

      const games = await this.gameStatsRepo.find({ where: query });
      return games || [];
    } catch (error) {
      this.log.error("Error getting games by id:", error);
      return [];
    }
  }

  async deleteGameStatsByMatchId(matchId: string): Promise<boolean> {
    await this.sqlite.initializing;
    try {
      const games = await this.gameStatsRepo.find({ where: { settings: { matchInfo: { matchId: matchId } } } });
      await this.gameStatsRepo.remove(games);
      await this.sendRecentGames();
      return true;
    } catch (error) {
      this.log.error("Error deleting game stats:", error);
      return false
    }
  }

  async deleteLocalGameStats(): Promise<boolean> {
    await this.sqlite.initializing;
    try {
      const localGames = await this.gameStatsRepo.find({ where: { settings: { matchInfo: { mode: "local" } } } });
      const simulatedGames = await this.gameStatsRepo.find({ where: { settings: { isSimulated: true } } });
      const mockedGames = await this.gameStatsRepo.find({ where: { isMock: true } });
      const games = [...localGames, ...simulatedGames, ...mockedGames];
      if (!localGames) return false;
      await this.gameStatsRepo.remove(games);
      await this.sendRecentGames();
      return true;
    } catch (error) {
      this.log.error("Error deleting game stats:", error);
      return false
    }
  }

  private async sendRecentGames() {
    const recentGameId = this.storeGames.getRecentGameId()
    const recentGames = await this.getGamesById(recentGameId)
    recentGames.sort((a, b) => (new Date(a.timestamp ?? 0).getTime()) - (new Date(b.timestamp ?? 0).getTime()));
    this.messageHandler.sendMessage('RecentGames', recentGames);
  }
}