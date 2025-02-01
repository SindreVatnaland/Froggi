import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { GameEndType, GameEndMethod, PlacementType } from "@slippi/slippi-js";
import { GameStatsEntity } from "./gameStatsEntity";

@Entity()
export class GameEndTypeEntity implements GameEndType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer", nullable: true })
  gameEndMethod: GameEndMethod | null;

  @Column({ type: "int", nullable: true })
  lrasInitiatorIndex: number | null;

  @Column({ type: "int", nullable: true })
  placements: PlacementType[];

  @OneToOne(() => GameStatsEntity, gameStats => gameStats.gameEnd, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  gameStats: GameStatsEntity | null;
}

