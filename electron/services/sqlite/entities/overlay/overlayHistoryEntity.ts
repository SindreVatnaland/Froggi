import { LiveStatsScene } from '../../../../../frontend/src/lib/models/enum';
import { Scene } from '../../../../../frontend/src/lib/models/types/overlay';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/** LEGACY (AI-only whole-scene snapshots). Converted once into OverlayChangeEntity rows by SqliteOverlayHistory, then emptied. */
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
