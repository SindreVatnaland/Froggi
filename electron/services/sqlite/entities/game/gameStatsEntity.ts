import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { GameStartTypeExtended, GameStats } from '../../../../../frontend/src/lib/models/types/slippiData';
import { StatsType } from "@slippi/slippi-js";
import { GameEndTypeEntity } from "./gameEndTypeEntity";
import { FrameEntryTypeEntity } from "./frameEntryTypeEntity";
import { PostGameStatsEntity } from "./postGameStatsEntity";

@Entity()
export class GameStatsEntity implements GameStats {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => GameEndTypeEntity)
  @JoinColumn()
  gameEnd: GameEndTypeEntity;

  @Column({ type: "boolean" })
  isMock: boolean;

  @Column({ type: "boolean" })
  isReplay: boolean;

  @OneToOne(() => FrameEntryTypeEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  lastFrame: FrameEntryTypeEntity | null;

  @OneToOne(() => PostGameStatsEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  postGameStats: StatsType | null;

  @Column({ type: "simple-json" })
  score: number[];

  @OneToOne(() => FrameEntryTypeEntity)
  @JoinColumn()
  settings: GameStartTypeExtended | null;

  @Column({ type: "datetime", nullable: true })
  timestamp: Date | null;
}

