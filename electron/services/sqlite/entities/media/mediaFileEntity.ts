import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * A file a flow uses (an OBS replay-buffer clip, a game's .slp, a video Set media shows), by id — overlays
 * ask for /media/<id> or a replay window by id, never for a path. Kept so ids in flow lists still work
 * after a restart.
 */
@Entity()
export class MediaFileEntity {
  /** First 12 hex characters of the SHA-1 of the path. */
  @PrimaryColumn()
  id: string;

  @Column()
  path: string;
}
