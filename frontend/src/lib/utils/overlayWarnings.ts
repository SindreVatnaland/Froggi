import { CustomElement } from '../models/constants/customElement';
import { LiveStatsScene } from '../models/enum';
import { COL } from '../models/const';
import type { Flow } from '../models/types/flow';
import type { GridContentItem, Overlay, Scene } from '../models/types/overlay';
import { SELF, triggerAnimations } from './elementTriggers';

/**
 * Things an overlay points at that don't exist — e.g. after importing someone else's overlay:
 *  - a Media element (key mode) whose key no ENABLED flow sets (Set media), or a Highlight Replay element
 *    whose list no enabled flow has (a List card with that name);
 *  - an element trigger watching an element that is no longer in the scene.
 * Shown in the editor (red outline, layer count, element settings) and to the AI (get_overlay).
 */

/** What the enabled flows fill: "media:<key>" (Set media), "replay:<list>" (any List card's list). */
export function flowVideoKeys(flows: Flow[]): Set<string> {
	const keys = new Set<string>();
	for (const f of flows) {
		if (!f.enabled) continue;
		for (const n of f.nodes) {
			if (n.kind !== 'action') continue;
			if (n.data.type === 'setHighlightVideo') keys.add(`media:${n.data.key?.trim() || 'game'}`);
			if (n.data.type === 'list' && n.data.key?.trim()) keys.add(`replay:${n.data.key.trim()}`);
		}
	}
	return keys;
}

/** The key a Video element plays (payload.video, older payload.highlight; default "game"). */
export const videoKey = (item: GridContentItem) => (item.data?.video?.key ?? item.data?.highlight?.key ?? '').trim() || 'game';

/** Warnings per item id for one scene. */
export function sceneWarnings(scene: Scene | undefined, videoKeys: Set<string>): Record<string, string[]> {
	const items = (scene?.layers ?? []).flatMap((l) => l.items ?? []);
	const ids = new Set(items.map((i) => i.id));
	const out: Record<string, string[]> = {};
	const add = (id: string, w: string) => (out[id] = [...(out[id] ?? []), w]);
	for (const item of items) {
		if (item.elementId === CustomElement.PostGameHighlightVideo && item.data?.video?.source !== 'file' && !videoKeys.has(`media:${videoKey(item)}`))
			add(item.id, `Media key "${videoKey(item)}": no enabled flow sets it (Flows → Set media).`);
		const list = (item.data?.replay?.list ?? '').trim() || 'slippiReplayHighlights';
		if (item.elementId === CustomElement.HighlightReplay && !videoKeys.has(`replay:${list}`))
			add(item.id, `Replay list "${list}": no enabled flow has a List card for it.`);
		triggerAnimations(item.data).forEach((t, i) => {
			const missing = (t.elementTriggers ?? []).filter((e) => e.source !== SELF && !ids.has(e.source));
			if (missing.length) add(item.id, `Animation ${i + 1} watches ${missing.length > 1 ? `${missing.length} elements that are` : 'an element that is'} no longer in this scene.`);
		});
	}
	return out;
}

/** Every warning of an overlay: scene → item id → messages (scenes without warnings left out). */
export function overlayWarnings(overlay: Overlay, flows: Flow[]): Partial<Record<LiveStatsScene, Record<string, string[]>>> {
	const keys = flowVideoKeys(flows);
	const out: Partial<Record<LiveStatsScene, Record<string, string[]>>> = {};
	for (const scene of Object.values(LiveStatsScene)) {
		const w = sceneWarnings(overlay[scene], keys);
		if (Object.keys(w).length) out[scene] = w;
	}
	return out;
}

/** Pairs of element ids whose boxes overlap on one layer ("a|b", a < b). Elements that overlap belong on separate
 *  layers — the editor's grid can't move them, and a write that adds a new pair is refused (storeOverlay.setScene). */
export function layerOverlaps(scene: Scene | undefined | null): Set<string> {
	const pairs = new Set<string>();
	for (const layer of scene?.layers ?? []) {
		const boxes = layer.items.map((i) => ({ ...i[COL], id: i.id })).filter((b) => b.w > 0 && b.h > 0);
		for (let i = 0; i < boxes.length; i++)
			for (let j = i + 1; j < boxes.length; j++) {
				const [a, b] = [boxes[i], boxes[j]];
				if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
					pairs.add([a.id, b.id].sort().join('|'));
			}
	}
	return pairs;
}
