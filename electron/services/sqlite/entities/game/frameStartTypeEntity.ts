import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import type { FrameStartType } from '../../../../../frontend/src/lib/models/types/slippiTypes';
import { FrameEntryTypeEntity } from "./frameEntryTypeEntity";

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

  @OneToOne(() => FrameEntryTypeEntity, frameEntry => frameEntry.start)
  frameEntry: FrameStartType | undefined;
}

