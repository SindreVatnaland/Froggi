import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { LiveStatsScene } from '../../../../../frontend/src/lib/models/enum';
import type { ChangeAction, ChangeSource, SceneChange } from '../../../../utils/overlayHistory';

/**
 * One element / layer change of an overlay scene (utils/overlayHistory.ts). Local only: never exported
 * with the overlay and never sent to the frontend — the MCP reads it and undo / redo replay it.
 * Kept until the overlay is permanently deleted. Nothing is ever removed: undo / redo add log entries
 * (action undo | redo, originId → the edit) and toggle the edit's undone mark.
 */
@Entity()
export class OverlayChangeEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column({ type: 'text' })
	overlayId: string;

	@Column({ type: 'text' })
	statsScene: LiveStatsScene;

	@Column({ type: 'text' })
	kind: SceneChange['kind'];

	@Column({ type: 'text', nullable: true })
	itemId: string | null;

	@Column({ type: 'integer', nullable: true })
	elementId: number | null;

	@Column({ type: 'simple-json' })
	change: SceneChange;

	/** Who: manual | ai (legacy rows: undo | redo, converted at startup). */
	@Column({ type: 'text' })
	source: ChangeSource;

	/** edit = a change; undo / redo = undoing / redoing the edit `originId` (`change` = what was applied). */
	@Column({ type: 'text', default: 'edit' })
	action: ChangeAction;

	@Column({ type: 'integer', nullable: true })
	originId: number | null;

	/** The original change's time — the edit's own createdAt; on undo / redo entries the edit's. Gives the real order. */
	@Column({ type: 'text', nullable: true })
	originAt: string | null;

	/** Changes made by one save share a group. */
	@Column({ type: 'text' })
	groupId: string;

	/** Edits only: set while the edit is undone (when + who; the undo entry logs it too). Null = live. */
	@Column({ type: 'text', nullable: true })
	undoneAt: string | null;

	@Column({ type: 'text', nullable: true })
	undoneBy: ChangeSource | null;

	/** LEGACY links of the first undo-entry design — read once by SqliteOverlayHistory.convertRevertEntries. */
	@Column({ type: 'integer', nullable: true })
	revertOf: number | null;

	@Column({ type: 'integer', nullable: true })
	revertedBy: number | null;

	/** ISO time. */
	@Column({ type: 'text' })
	createdAt: string;
}
