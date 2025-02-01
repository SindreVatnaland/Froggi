import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { GameStats } from '../../../../../frontend/src/lib/models/types/slippiData';
import { GameEndTypeEntity } from "./gameEndTypeEntity";
import { FrameEntryTypeEntity } from "./frameEntryTypeEntity";
import { PostGameStatsEntity } from "./postGameStatsEntity";
import { GameSettingsEntity } from "./gameSettingsEntity";

@Entity()
export class GameStatsEntity implements GameStats {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => GameEndTypeEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  gameEnd: GameEndTypeEntity;

  @Column({ type: "integer", default: false })
  isMock: boolean;

  @Column({ type: "integer", default: false })
  isReplay: boolean;

  @OneToOne(() => FrameEntryTypeEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  lastFrame: FrameEntryTypeEntity | null;

  @OneToOne(() => PostGameStatsEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  postGameStats: PostGameStatsEntity | null;

  @Column({ type: "simple-json", default: "[0,0]" })
  score: number[];

  @OneToOne(() => GameSettingsEntity, { cascade: true, eager: false, onDelete: "CASCADE" })
  @JoinColumn()
  settings: GameSettingsEntity | null;

  @Column({ type: "datetime", nullable: true })
  timestamp: Date | null;

}

