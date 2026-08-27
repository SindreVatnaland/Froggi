import { LiveStatsScene } from '../../../../../frontend/src/lib/models/enum';
import { Scene } from '../../../../../frontend/src/lib/models/types/overlay';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/** Before/after Scene snapshot pairs for AI-initiated overlay edits — powers MCP undo tools. */
@Entity()
export class OverlayHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  overlayId: string;

  @Column()
  statsScene: LiveStatsScene;

  @Column({ type: "simple-json" })
  beforeScene: Scene;

  @Column({ type: "simple-json" })
  afterScene: Scene;

  @Column({ default: '' })
  label: string = '';

  @Column({ type: "datetime", nullable: true })
  undoneAt: Date | null = null;

  @CreateDateColumn()
  createdAt: Date;
}
