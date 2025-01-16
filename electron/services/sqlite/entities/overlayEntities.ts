import { AspectRatio, Overlay } from '../../../../frontend/src/lib/models/types/overlay';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import 'reflect-metadata';
import { SceneEntity } from './sceneEntity';

@Entity()
export class OverlayEntity implements Overlay {
  @PrimaryColumn()
  id: string;

  @Column({ type: "simple-json" })
  aspectRatio: AspectRatio;

  @Column()
  isDemo: boolean;

  @Column()
  description: string;

  @Column()
  froggiVersion: string;

  @Column()
  title: string;

  @OneToOne(() => SceneEntity, { cascade: true, eager: true })
  @JoinColumn()
  waitingForDolphin: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, eager: true })
  @JoinColumn()
  menu: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, eager: true })
  @JoinColumn()
  inGame: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, eager: true })
  @JoinColumn()
  postGame: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, eager: true })
  @JoinColumn()
  postSet: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, eager: true })
  @JoinColumn()
  rankChange: SceneEntity;
}

