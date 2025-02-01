import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { FrameStartType } from "@slippi/slippi-js";
import { FrameEntryTypeEntity } from "./frameEntryTypeEntity";
import { GameSettingsEntity } from "./gameSettingsEntity";

@Entity()
export class FrameStartTypeEntity implements FrameStartType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "integer", nullable: true })
  frame: number | null;

  @Column({ type: "integer", nullable: true })
  seed: number | null;

  @Column({ type: "integer", nullable: true })
  sceneFrameCounter: number | null;

  @OneToOne(() => FrameEntryTypeEntity, { cascade: true, eager: true })
  @JoinColumn()
  frameEntry: FrameStartType | undefined;

  @OneToOne(() => GameSettingsEntity, { cascade: true, eager: true })
  @JoinColumn()
  gameSettings: GameSettingsEntity | undefined;
}

