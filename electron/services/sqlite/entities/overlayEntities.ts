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

  @Column({ default: false })
  isDemo: boolean = false;

  @Column({ default: "" })
  description: string = "";

  @Column({ default: "0.0.0" })
  froggiVersion: string = "0.0.0";

  @Column({ default: "New Overlay" })
  title: string;

  @OneToOne(() => SceneEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  waitingForDolphin: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  menu: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  inGame: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  postGame: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  postSet: SceneEntity;

  @OneToOne(() => SceneEntity, { cascade: true, onDelete: "CASCADE", eager: true })
  @JoinColumn()
  rankChange: SceneEntity;
}

