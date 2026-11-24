import fs from 'fs';
import path from 'path';
import { cloneDeep } from 'lodash';
import { COL } from '../../frontend/src/lib/models/const';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import type { Layer, Overlay, Scene } from '../../frontend/src/lib/models/types/overlay';
import {
	applyChange, diffScenes, invertChange, latestRedoable, latestUndoable, manualChangesSinceAi, summarizeChange,
	type ChainRow, type SceneChange,
} from '../../electron/utils/overlayHistory';

// Overlay edit history: a save = a sequence of per-element / per-layer changes; undo reverts one at a time.
const demo = (file: string) => (JSON.parse(fs.readFileSync(path.join(__dirname, '../../../demo-overlays', file), 'utf8')) as Overlay)[LiveStatsScene.PostGame];

let nextLayerId = 1000;
/** Like the database: every layer gets an id when saved. */
const saved = (scene: Scene): Scene => ({ ...scene, layers: scene.layers.map((l) => ({ ...l, id: l.id ?? nextLayerId++ })) });
const withIds = (scene: Scene) => saved(cloneDeep(scene));

/** Layer order, names and which elements (by content) each holds — layer ids and item order don't matter. */
const shape = (layers: Layer[]) => JSON.parse(JSON.stringify(layers.map((l) => ({
	title: l.title || null, preview: l.preview ?? true,
	items: [...l.items].sort((a, b) => a.id.localeCompare(b.id)),
}))));

const applyAll = (layers: Layer[], changes: SceneChange[]) => changes.reduce((acc, change) => {
	const r = applyChange(acc, change);
	if ('error' in r) throw new Error(`${change.kind}: ${r.error}`);
	return r.layers;
}, layers);

/** diff(prev, next) applied to prev gives next; undoing every change newest first gives prev back. */
function roundTrip(prev: Scene, next: Scene) {
	const changes = diffScenes(prev, next);
	const forward = applyAll(prev.layers, changes);
	expect(shape(forward)).toEqual(shape(next.layers));
	const back = applyAll(next.layers, [...changes].reverse().map(invertChange));
	expect(shape(back)).toEqual(shape(prev.layers));
	return changes;
}

describe('overlay history', () => {
	const base = withIds(demo('GameStats.json'));

	it('no change → no entries (key order / undefined fields from the editor do not count)', () => {
		const echo = JSON.parse(JSON.stringify(base));
		echo.layers[0].items[0] = { ...echo.layers[0].items[0], data: { ...echo.layers[0].items[0].data, unused: undefined } };
		expect(diffScenes(base, echo)).toEqual([]);
	});

	it('a move is one itemUpdate with a short summary', () => {
		const next = cloneDeep(base);
		const item = next.layers[1].items[0];
		item[COL] = { ...item[COL], x: item[COL].x + 10 };
		const changes = roundTrip(base, next);
		expect(changes).toHaveLength(1);
		expect(summarizeChange(changes[0])).toMatch(/^moved \(/);
	});

	it('changing an element into another type = delete + create', () => {
		const next = cloneDeep(base);
		next.layers[0].items[0] = { ...next.layers[0].items[0], elementId: 1 as never };
		expect(roundTrip(base, next).map((c) => c.kind)).toEqual(['itemDelete', 'itemCreate']);
	});

	it('deleting a layer: its elements first, then the layer — undo restores the layer, then each element', () => {
		const next = cloneDeep(base);
		const count = next.layers[2].items.length;
		next.layers.splice(2, 1);
		const changes = roundTrip(base, next);
		expect(changes.map((c) => c.kind)).toEqual([...Array(count).fill('itemDelete'), 'layerDelete']);
	});

	it('everything at once: reorder, rename, new layer with elements, element moved to another layer, delete', () => {
		const next = cloneDeep(base);
		const moved = next.layers[3].items.shift()!;
		next.layers[0].items.splice(0, 1);
		next.layers.reverse();
		next.layers[1].title = 'Renamed';
		next.layers.splice(2, 0, { index: 0, id: undefined, preview: true, title: 'New', items: [{ ...cloneDeep(base.layers[0].items[1]), id: 'brand-new' }] });
		next.layers[0].items.push(moved);
		const changes = roundTrip(base, saved(next));
		expect(new Set(changes.map((c) => c.kind))).toEqual(new Set(['itemDelete', 'layerOrder', 'layerCreate', 'layerUpdate', 'itemCreate', 'itemUpdate']));
	});

	it('reverting an OLD entry works by element id, and is refused when the scene moved on', () => {
		const a = cloneDeep(base);
		a.layers[1].items[0][COL].x += 5;
		const [move] = diffScenes(base, a);
		const b = cloneDeep(a);
		b.layers[1].items.splice(1, 1); // a later, unrelated edit
		const undone = applyChange(b.layers, invertChange(move));
		expect('layers' in undone && undone.layers[1].items[0][COL].x).toBe(base.layers[1].items[0][COL].x);
		// a later colour change of the same element survives undoing the older move
		const c = cloneDeep(a);
		c.layers[1].items[0].data = { ...c.layers[1].items[0].data, string: 'later edit' };
		const kept = applyChange(c.layers, invertChange(move));
		expect('layers' in kept && kept.layers[1].items[0].data.string).toBe('later edit');
		expect('layers' in kept && kept.layers[1].items[0][COL].x).toBe(base.layers[1].items[0][COL].x);
		const gone = cloneDeep(a);
		gone.layers[1].items.splice(0, 1);
		expect(applyChange(gone.layers, invertChange(move))).toEqual({ error: expect.stringMatching(/no longer exists/) });
	});

	it('undo / redo walk: edits only, redo by original time, only while the forward history is clear', () => {
		// edits created at t = id s; undoneAt = t s; log rows (undo / redo entries) are ignored by the walk
		const edit = (id: number, undoneAt: number | null = null): ChainRow => ({ id, source: 'manual', action: 'edit', itemId: 'x', undoneAt: undoneAt === null ? null : new Date(undoneAt * 1000).toISOString(), createdAt: new Date(id * 1000).toISOString() });
		const log = (id: number, action: 'undo' | 'redo', at: number): ChainRow => ({ id, source: 'manual', action, itemId: 'x', undoneAt: null, createdAt: new Date(at * 1000).toISOString() });
		// A(1) B(2) C(3); undo C (10), undo B (11)
		let rows = [log(5, 'undo', 11), log(4, 'undo', 10), edit(3, 10), edit(2, 11), edit(1)];
		expect(latestUndoable(rows)?.id).toBe(1);
		expect(latestRedoable(rows)?.id).toBe(2); // earliest original first: B, then C
		// redo B (logged at 12) — a redo is not an edit, so C stays redoable
		rows = [log(6, 'redo', 12), ...rows.slice(0, 2), edit(3, 10), edit(2), edit(1)];
		expect(latestRedoable(rows)?.id).toBe(3);
		expect(latestUndoable(rows)?.id).toBe(2);
		// a new edit D (13) after undoing C: redo is done; C stays in the history
		rows = [edit(13), ...rows];
		expect(latestRedoable(rows)).toBeUndefined();
		expect(latestUndoable(rows)?.id).toBe(13);
		// D undone (20): only D can be redone; undo walks past C (abandoned) to B
		rows = [edit(13, 20), ...rows.slice(1)];
		expect(latestRedoable(rows)?.id).toBe(13);
		expect(latestUndoable(rows)?.id).toBe(2);
	});

	it('manual changes since the AI last edited', () => {
		const r = (id: number, source: ChainRow['source'], itemId: string, action: ChainRow['action'] = 'edit'): ChainRow => ({ id, source, itemId, action, undoneAt: null, createdAt: '' });
		expect(manualChangesSinceAi([r(3, 'manual', 'a'), r(2, 'manual', 'b'), r(1, 'manual', 'a')])).toEqual({ overlay: undefined, items: {} });
		expect(manualChangesSinceAi([r(5, 'manual', 'a'), r(4, 'manual', 'a'), r(3, 'manual', 'c'), r(2, 'ai', 'b'), r(1, 'ai', 'a')]))
			.toEqual({ overlay: 3, items: { a: 2 } });
		// the user's undo of the AI's edit counts as their change
		expect(manualChangesSinceAi([r(3, 'manual', 'a', 'undo'), r(2, 'ai', 'b'), r(1, 'ai', 'a')])).toEqual({ overlay: 1, items: { a: 1 } });
	});
});
