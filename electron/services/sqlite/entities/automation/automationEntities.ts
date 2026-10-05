import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { WebhookAuthType, WebhookEvent } from '../../../../../frontend/src/lib/models/types/webhook';
import type { Command, CommandFormat } from '../../../../../frontend/src/lib/models/types/commandTypes';
import type { ControllerButtons } from '../../../../../frontend/src/lib/models/types/controller';
import type { LiveStatsScene } from '../../../../../frontend/src/lib/models/enum';

/** Outbound webhook profile (was electron-store `webhook.profiles`). */
@Entity()
export class WebhookProfileEntity {
  @PrimaryColumn() id: string;
  @Column({ default: '' }) name: string;
  @Column({ default: '' }) url: string;
  @Column({ default: true }) enabled: boolean;
  @Column({ type: 'text', default: 'none' }) authType: WebhookAuthType;
  @Column({ default: '' }) bearerToken: string;
  @Column({ default: '' }) clientId: string;
  @Column({ default: '' }) clientSecret: string;
  @Column({ default: '' }) loginUrl: string;
  @Column({ type: 'simple-json' }) events: WebhookEvent[];
}

/** Controller button combo → OBS command (was electron-store `command.controller.inputCommands`). */
@Entity()
export class ControllerCommandEntity {
  @PrimaryColumn() id: string;
  @Column({ type: 'simple-json' }) inputs: ControllerButtons;
  @Column({ type: 'simple-json' }) command: Command;
  @Column({ type: 'text', default: 'any' }) format: CommandFormat;
}

/** Froggi scene → OBS command (was electron-store `command.sceneSwitch.<scene>`). */
@Entity()
export class SceneCommandEntity {
  @PrimaryColumn() id: string;
  @Column({ type: 'text' }) scene: LiveStatsScene;
  @Column({ type: 'simple-json' }) command: Command;
  @Column({ type: 'text', default: 'any' }) format: CommandFormat;
}
