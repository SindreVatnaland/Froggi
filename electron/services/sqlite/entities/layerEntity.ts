import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GridContentItem } from '../../../../frontend/src/lib/models/types/overlay';
import { SceneEntity } from './sceneEntity';

@Entity()
export class LayerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-json' })
  items: GridContentItem[];

  @Column()
  preview: boolean;

  @ManyToOne(() => SceneEntity, (scene) => scene.layers)
  scene: SceneEntity;
}
