import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * A highlight a flow marked (Mark highlight) — kept so it can be shown again after a restart (Daily) and
 * by the replay view: its wall-clock window, score and frames; the OBS replay-buffer clip once saved
 * (file + seconds before the file's end); the game's .slp once the game is stored.
 */
@Entity()
export class HighlightEntity {
  /** {{highlight}} — what List cards store. */
  @PrimaryColumn()
  id: string;

  /** Wall-clock window to show (ms). */
  @Column({ type: 'float' })
  start: number;

  @Column({ type: 'float' })
  end: number;

  @Column({ type: 'float', default: 0 })
  score: number;

  /** The same window in game frames (the replay view plays these). */
  @Column({ type: 'int', nullable: true })
  startFrame: number | null;

  @Column({ type: 'int', nullable: true })
  endFrame: number | null;

  /** The OBS replay-buffer file holding it (absolute path) and where: seconds before the file's end. */
  @Column({ type: 'varchar', nullable: true })
  file: string | null;

  @Column({ type: 'float', nullable: true })
  fromEnd: number | null;

  @Column({ type: 'float', nullable: true })
  toEnd: number | null;

  /** The game's replay (absolute .slp path), set when the game is stored. */
  @Column({ type: 'varchar', nullable: true })
  replayPath: string | null;

  /** The set it belongs to (the stored game's match id). */
  @Column({ type: 'varchar', nullable: true })
  setId: string | null;
}
