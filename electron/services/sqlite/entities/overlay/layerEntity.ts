import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GridContentItem } from '../../../../../frontend/src/lib/models/types/overlay';
import { SceneEntity } from './sceneEntity';

@Entity()
export class LayerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-json' })
  items: GridContentItem[];

  @Column({ default: 0 })
  index: number = 0;

  @Column({ default: true })
  preview: boolean = true;

  @ManyToOne(() => SceneEntity, (scene) => scene.layers, {
    onDelete: "CASCADE",
  })
  scene: SceneEntity;
}
