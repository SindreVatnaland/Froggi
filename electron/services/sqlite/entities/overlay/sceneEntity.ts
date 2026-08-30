import { LiveStatsScene } from '../../../../../frontend/src/lib/models/enum';
import { Background, Font, Scene, SceneAnimation, } from '../../../../../frontend/src/lib/models/types/overlay';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { LayerEntity } from './layerEntity';

@Entity()
export class SceneEntity implements Scene {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  active: boolean = true;

  @Column({ type: "simple-json" })
  animation: SceneAnimation;

  @Column({ type: "simple-json" })
  background: Background;

  @Column({ default: LiveStatsScene.Menu })
  fallback: LiveStatsScene = LiveStatsScene.Menu;

  @Column({ type: "simple-json" })
  font: Font;

  @OneToMany(() => LayerEntity, (layer) => layer.scene, {
    cascade: true,
    onDelete: "CASCADE",
    // Without this, re-saving a scene INSERTS the new layers but leaves the previous ones attached to
    // the same scene — every re-persist piled up duplicate layers (1→2→…→N), which then blew up the
    // eager-join cartesian into a multi-GB OOM. orphanedRowAction deletes layers dropped from the set.
    orphanedRowAction: "delete",
    eager: true,
  })
  layers: LayerEntity[];
}