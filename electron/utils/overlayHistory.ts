import { AsyncLocalStorage } from 'async_hooks';
import { cloneDeep, isEqual } from 'lodash';
import type { GridContentItem, Layer, Scene } from '../../frontend/src/lib/models/types/overlay';
import { COL } from '../../frontend/src/lib/models/const';

/**
 * Overlay edit history (local only — never exported, never sent to the frontend; read by the MCP and
 * used for undo). Every scene save is diffed into per-element / per-layer changes. The changes are in
 * SEQUENCE: applying them one by one turns the old scene into the new one, so each change is valid on
 * the scene the changes before it produced — that is what lets undo revert ONE change at a time.
 */

export type ChangeSource = 'manual' | 'ai';

/**
 * Who is saving: MCP requests run inside { source: 'ai' }, anything else is 'manual'. Undo / redo saves
 * run with record: false — the store logs them itself as an undo / redo entry pointing at the change.
 */
export const changeContext = new AsyncLocalStorage<{ source: ChangeSource; record?: false }>();
export const currentChangeSource = () => changeContext.getStore() ?? { source: 'manual' as ChangeSource };

export type LayerMeta = { title: string | null; preview: boolean };

export type SceneChange =
	| { kind: 'itemCreate'; itemId: string; layer: number; position: number; after: GridContentItem }
	| { kind: 'itemDelete'; itemId: string; layer: number; position: number; before: GridContentItem }
	| { kind: 'itemUpdate'; itemId: string; before: { layer: number; item: GridContentItem }; after: { layer: number; item: GridContentItem } }
	| { kind: 'layerCreate'; layer: number; after: LayerMeta }
	| { kind: 'layerDelete'; layer: number; before: LayerMeta }
	| { kind: 'layerUpdate'; layer: number; before: LayerMeta; after: LayerMeta }
	/** order[i] = index (before this change) of the layer that ends up at i. */
	| { kind: 'layerOrder'; order: number[] };

const meta = (layer: Layer): LayerMeta => ({ title: layer.title || null, preview: layer.preview ?? true });

/** Old scene → new scene as a sequence of changes. Layers are matched by id, items by id. */
export function diffScenes(prevScene: Scene, nextScene: Scene): SceneChange[] {
	// Compare what is stored: JSON drops undefined fields the editor's copy may still carry.
	const prev: Scene = JSON.parse(JSON.stringify(prevScene));
	const next: Scene = JSON.parse(JSON.stringify(nextScene));
	const changes: SceneChange[] = [];
	const prevIds = new Set(prev.layers.map((l) => l.id).filter((id) => id != null));
	const nextIds = new Set(next.layers.map((l) => l.id).filter((id) => id != null));
	const isNewLayer = (l: Layer) => l.id == null || !prevIds.has(l.id);
	const survives = (l: Layer) => l.id != null && nextIds.has(l.id);
	const nextItems = new Map<string, { layer: number; position: number; item: GridContentItem }>();
	next.layers.forEach((l, layer) => l.items.forEach((item, position) => nextItems.set(item.id, { layer, position, item })));
	const prevLayerOf = new Map<string, Layer>();
	prev.layers.forEach((l) => l.items.forEach((item) => prevLayerOf.set(item.id, l)));
	// An element changed into another element type counts as delete + create (user decision).
	const kept = (item: GridContentItem) => {
		const n = nextItems.get(item.id);
		return !!n && n.item.elementId === item.elementId && survives(prevLayerOf.get(item.id)!);
	};

	let work: Layer[] = prev.layers.map((l) => ({ ...l, items: [...l.items] }));

	// 1. deleted items (incl. everything on deleted layers), back to front so positions stay valid
	work.forEach((l, layer) => {
		for (let position = l.items.length - 1; position >= 0; position--) {
			const item = l.items[position];
			if (kept(item)) continue;
			changes.push({ kind: 'itemDelete', itemId: item.id, layer, position, before: cloneDeep(item) });
			l.items.splice(position, 1);
		}
	});
	// 2. deleted layers, back to front
	for (let layer = work.length - 1; layer >= 0; layer--) {
		if (survives(work[layer])) continue;
		changes.push({ kind: 'layerDelete', layer, before: meta(work[layer]) });
		work.splice(layer, 1);
	}
	// 3. layer order of the layers both scenes have
	const order = next.layers.filter((l) => !isNewLayer(l)).map((l) => work.findIndex((w) => w.id === l.id));
	if (order.some((from, to) => from !== to)) {
		changes.push({ kind: 'layerOrder', order });
		work = order.map((i) => work[i]);
	}
	// 4. new layers (empty — their items come in step 6), front to back
	next.layers.forEach((l, layer) => {
		if (!isNewLayer(l)) return;
		changes.push({ kind: 'layerCreate', layer, after: meta(l) });
		work.splice(layer, 0, { ...l, items: [] });
	});
	// 5. renamed / preview toggled layers
	next.layers.forEach((l, layer) => {
		if (isNewLayer(l) || isEqual(meta(work[layer]), meta(l))) return;
		changes.push({ kind: 'layerUpdate', layer, before: meta(work[layer]), after: meta(l) });
	});
	// 6. changed + new items
	const workLayerOf = (itemId: string) => work.findIndex((l) => l.items.some((i) => i.id === itemId));
	for (const [itemId, n] of nextItems) {
		const from = workLayerOf(itemId);
		if (from === -1) {
			changes.push({ kind: 'itemCreate', itemId, layer: n.layer, position: n.position, after: cloneDeep(n.item) });
			work[n.layer].items.splice(n.position, 0, n.item);
			continue;
		}
		const old = work[from].items.find((i) => i.id === itemId)!;
		if (from === n.layer && isEqual(old, n.item)) continue;
		changes.push({ kind: 'itemUpdate', itemId, before: { layer: from, item: cloneDeep(old) }, after: { layer: n.layer, item: cloneDeep(n.item) } });
		work[from].items = work[from].items.filter((i) => i.id !== itemId);
		work[n.layer].items.splice(n.position, 0, n.item);
	}
	return changes;
}

/** The change that undoes `change`. */
export function invertChange(change: SceneChange): SceneChange {
	switch (change.kind) {
		case 'itemCreate': return { kind: 'itemDelete', itemId: change.itemId, layer: change.layer, position: change.position, before: change.after };
		case 'itemDelete': return { kind: 'itemCreate', itemId: change.itemId, layer: change.layer, position: change.position, after: change.before };
		case 'itemUpdate': return { kind: 'itemUpdate', itemId: change.itemId, before: change.after, after: change.before };
		case 'layerCreate': return { kind: 'layerDelete', layer: change.layer, before: change.after };
		case 'layerDelete': return { kind: 'layerCreate', layer: change.layer, after: change.before };
		case 'layerUpdate': return { kind: 'layerUpdate', layer: change.layer, before: change.after, after: change.before };
		case 'layerOrder': {
			const inverse: number[] = [];
			change.order.forEach((from, to) => (inverse[from] = to));
			return { kind: 'layerOrder', order: inverse };
		}
	}
}

/**
 * Applies one change to a scene's layers (returns new layers, the input is not touched) or says why it
 * can't. Undoing the newest change always applies; an older one (the AI picking any entry) is applied
 * by item id where it can and refused where the scene moved on (layer gone, layer not empty, …).
 */
export function applyChange(layers: Layer[], change: SceneChange): { layers: Layer[] } | { error: string } {
	const out: Layer[] = layers.map((l) => ({ ...l, items: [...l.items] }));
	const findItem = (itemId: string) => out.findIndex((l) => l.items.some((i) => i.id === itemId));
	switch (change.kind) {
		case 'itemCreate': {
			if (findItem(change.itemId) !== -1) return { error: `element ${change.itemId} already exists` };
			const layer = out[change.layer];
			if (!layer) return { error: `layer ${change.layer} no longer exists` };
			layer.items.splice(Math.min(change.position, layer.items.length), 0, cloneDeep(change.after));
			return { layers: out };
		}
		case 'itemDelete': {
			const at = findItem(change.itemId);
			if (at === -1) return { error: `element ${change.itemId} no longer exists` };
			out[at].items = out[at].items.filter((i) => i.id !== change.itemId);
			return { layers: out };
		}
		case 'itemUpdate': {
			const at = findItem(change.itemId);
			if (at === -1) return { error: `element ${change.itemId} no longer exists` };
			const target = out[change.after.layer];
			if (!target) return { error: `layer ${change.after.layer} no longer exists` };
			const position = out[at].items.findIndex((i) => i.id === change.itemId);
			const [current] = out[at].items.splice(position, 1);
			target.items.splice(at === change.after.layer ? position : target.items.length, 0, patch(current, change.before.item, change.after.item) as GridContentItem);
			return { layers: out };
		}
		case 'layerCreate':
			out.splice(Math.min(change.layer, out.length), 0, { index: 0, items: [], id: undefined, preview: change.after.preview, title: change.after.title ?? undefined });
			return { layers: out };
		case 'layerDelete': {
			const layer = out[change.layer];
			if (!layer) return { error: `layer ${change.layer} no longer exists` };
			if (layer.items.length) return { error: `layer ${change.layer} has elements — remove them first` };
			out.splice(change.layer, 1);
			return { layers: out };
		}
		case 'layerUpdate': {
			const layer = out[change.layer];
			if (!layer) return { error: `layer ${change.layer} no longer exists` };
			out[change.layer] = { ...layer, title: change.after.title ?? undefined, preview: change.after.preview };
			return { layers: out };
		}
		case 'layerOrder':
			if (change.order.length !== out.length) return { error: 'the scene has a different number of layers now' };
			return { layers: change.order.map((i) => out[i]) };
	}
}

const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * `current` with only what changed from `from` to `to` applied — so reverting an OLD entry keeps later
 * edits of other fields (undo a move → a colour changed after it stays). For the newest entry
 * current = from, which gives exactly `to`.
 */
function patch(current: unknown, from: unknown, to: unknown): unknown {
	if (isEqual(from, to)) return current;
	if (!plain(current) || !plain(from) || !plain(to)) return cloneDeep(to);
	const out: Record<string, unknown> = { ...current };
	for (const key of new Set([...Object.keys(from), ...Object.keys(to)])) {
		if (!(key in to)) delete out[key];
		else out[key] = patch(current[key], from[key], to[key]);
	}
	return out;
}

const pos = (item: GridContentItem) => item[COL] ?? { x: 0, y: 0, w: 0, h: 0 };

/** Changed paths of two values, `depth` levels deep (font.color, animationTrigger, …). */
function changedPaths(a: unknown, b: unknown, depth: number, prefix = ''): string[] {
	if (isEqual(a, b)) return [];
	const objects = a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b);
	if (!objects || depth === 0) return [prefix || '(value)'];
	const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
	return [...keys].flatMap((k) => changedPaths((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], depth - 1, prefix ? `${prefix}.${k}` : k));
}

/** One line for the AI's compact history list ("moved (10,20) → (40,20), changed font.color"). */
export function summarizeChange(change: SceneChange): string {
	switch (change.kind) {
		case 'itemCreate': return `added on layer ${change.layer} at (${pos(change.after).x},${pos(change.after).y}) ${pos(change.after).w}×${pos(change.after).h}`;
		case 'itemDelete': return `deleted from layer ${change.layer}`;
		case 'layerCreate': return `added layer ${change.layer}${change.after.title ? ` "${change.after.title}"` : ''}`;
		case 'layerDelete': return `deleted layer ${change.layer}${change.before.title ? ` "${change.before.title}"` : ''}`;
		case 'layerUpdate': return `layer ${change.layer}: ${change.before.title !== change.after.title ? `renamed "${change.before.title ?? ''}" → "${change.after.title ?? ''}"` : `preview ${change.after.preview ? 'on' : 'off'}`}`;
		case 'layerOrder': return `reordered layers (new order of old indexes: ${change.order.join(', ')})`;
		case 'itemUpdate': {
			const parts: string[] = [];
			const a = pos(change.before.item), b = pos(change.after.item);
			if (change.before.layer !== change.after.layer) parts.push(`layer ${change.before.layer} → ${change.after.layer}`);
			if (a.x !== b.x || a.y !== b.y) parts.push(`moved (${a.x},${a.y}) → (${b.x},${b.y})`);
			if (a.w !== b.w || a.h !== b.h) parts.push(`resized ${a.w}×${a.h} → ${b.w}×${b.h}`);
			const data = changedPaths(change.before.item.data, change.after.item.data, 2);
			if (data.length) parts.push(`changed ${data.slice(0, 6).join(', ')}${data.length > 6 ? ` +${data.length - 6} more` : ''}`);
			return parts.join(', ') || 'changed grid settings';
		}
	}
}

/** edit = a change someone made; undo / redo = a log entry of undoing / redoing that change (originId). */
export type ChangeAction = 'edit' | 'undo' | 'redo';

/** The light fields of a history entry the undo walk and the AI hint need. */
export type ChainRow = { id: number; itemId: string | null; source: ChangeSource; action: ChangeAction; undoneAt: string | null; createdAt: string };

/**
 * The undo walk only looks at EDIT entries; undo / redo entries are the log. Every edit carries a mark
 * while it is undone (undoneAt). Undo = the newest edit without a mark: apply it in reverse, mark it, log
 * an undo entry. Redo = see latestRedoable: apply it, clear the mark, log a redo entry. Strictly in
 * order, so every step applies to the scene it was made on. Rows newest first (by id = original order).
 */
export const latestUndoable = <T extends ChainRow>(rows: T[]) => rows.find((r) => r.action === 'edit' && r.undoneAt === null);

/**
 * Next edit redo re-applies — only while the forward history is clear: edits undone AFTER the scene's
 * newest edit (undo 4×, then edit = redo is done; those stay in the history but are never redone).
 * Undo always takes the newest edit, so the redoable ones are the newest edits in original order and
 * the next redo is the one with the EARLIEST original time (undo C, then B → redo B, then C). Undo /
 * redo entries are not edits, so redoing B never ends the redo of C.
 */
export function latestRedoable<T extends ChainRow>(rows: T[]): T | undefined {
	const edits = rows.filter((r) => r.action === 'edit');
	const lastEdit = Math.max(0, ...edits.map((r) => Date.parse(r.createdAt)));
	// rows are newest first, so the last match is the earliest original
	return edits.filter((r) => r.undoneAt !== null && Date.parse(r.undoneAt) > lastEdit).at(-1);
}

/**
 * What the user did since the AI last acted (hint on the MCP overlay reads): the user's entries — edits,
 * undos, redos — newer than the AI's newest entry, per overlay and per element the AI touched. Nothing
 * when the AI never acted on it. Rows newest first.
 */
export function manualChangesSinceAi(rows: ChainRow[]): { overlay?: number; items: Record<string, number> } {
	const items: Record<string, number> = {};
	const pending: Record<string, number> = {};
	const aiSeen = new Set<string>();
	let overlay: number | undefined;
	let manual = 0;
	for (const row of rows) {
		if (row.source === 'ai') {
			if (overlay === undefined) overlay = manual;
			if (row.itemId && !aiSeen.has(row.itemId)) {
				aiSeen.add(row.itemId);
				if (pending[row.itemId]) items[row.itemId] = pending[row.itemId];
			}
		} else {
			if (overlay === undefined) manual++;
			if (row.itemId && !aiSeen.has(row.itemId)) pending[row.itemId] = (pending[row.itemId] ?? 0) + 1;
		}
	}
	return { overlay: overlay || undefined, items };
}
