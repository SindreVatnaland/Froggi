import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { FrameEntryType, ItemUpdateType, PostFrameUpdateType, PreFrameUpdateType } from "@slippi/slippi-js";
import { GameStatsEntity } from "./gameStatsEntity";
import { FrameStartTypeEntity } from "./frameStartTypeEntity";

@Entity()
export class FrameEntryTypeEntity implements FrameEntryType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  frame: number;

  @OneToOne(() => FrameStartTypeEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  start: FrameStartTypeEntity | undefined;

  @Column({ type: "simple-json", nullable: true })
  players: { [playerIndex: number]: { pre: PreFrameUpdateType; post: PostFrameUpdateType; } | null; };

  @Column({ type: "simple-json", nullable: true })
  followers: { [playerIndex: number]: { pre: PreFrameUpdateType; post: PostFrameUpdateType; } | null; };

  @Column({ type: "simple-json", nullable: true })
  items: ItemUpdateType[] | undefined;

  @OneToOne(() => GameStatsEntity, gameStats => gameStats.lastFrame)
  gameStats: GameStatsEntity | null;
}

