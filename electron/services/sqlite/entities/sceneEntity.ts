import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';
import { Background, Font, Scene, SceneAnimation, } from '../../../../frontend/src/lib/models/types/overlay';
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
    eager: true,
  })
  layers: LayerEntity[];
}