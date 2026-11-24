import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import { summarizeChange, type ChangeSource } from '../../../utils/overlayHistory';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene) as [string, ...string[]];
const SOURCES = ['manual', 'ai'] as const;
const undone = (e: { undoneAt: string | null; undoneBy: string | null }) => (e.undoneAt ? { at: e.undoneAt, by: e.undoneBy ?? undefined } : undefined);

export function registerOverlayHistoryReadTools(server: McpServer) {
	server.registerTool(
		'get_overlay_history',
		{
			description:
				'The overlay\'s edit history, newest first: every element / layer change by the user (source "manual") or you ("ai") — one entry per element change (action "edit"; undone edits carry undone {at, by}), plus an entry for every undo / redo (action "undo" | "redo", origin = the edit it undid / redid), with a one-line summary ("moved (10,20) → (40,20)", "changed font.color, css.color"). Use it to see what the user changed by hand since you last worked on it (get_overlay / list_elements report manualChangesSinceAi), how big a change was (a nudge vs a full move), and why things are where they are. Compact by default; pass ids to get the full before/after element JSON of those entries only. Scene settings (background, font, scene animation) and overlay settings are not in the history. Local only — never exported.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES).optional(),
				itemId: z.string().optional().describe('Only this element'),
				source: z.enum(SOURCES).optional(),
				beforeId: z.number().int().optional().describe('Page: entries older than this id'),
				limit: z.number().int().min(1).max(200).optional().describe('Default 30'),
				ids: z.array(z.number().int()).max(20).optional().describe('Full detail (before / after JSON) of these entries'),
			},
		},
		async ({ overlayId, statsScene, itemId, source, beforeId, limit, ids }) => {
			const history = mcpContext.overlayHistory!;
			if (ids?.length) {
				const entries = (await history.getByIds(ids)).filter((e) => e.overlayId === overlayId);
				return text(entries.map((e) => ({ id: e.id, at: e.createdAt, source: e.source, action: e.action, origin: e.originId ?? undefined, statsScene: e.statsScene, summary: summarizeChange(e.change), undone: undone(e), change: e.change })));
			}
			const rows = (await history.rows(overlayId, { statsScene: statsScene as LiveStatsScene | undefined, itemId, source: source as ChangeSource | undefined }))
				.filter((r) => beforeId === undefined || r.id < beforeId);
			const page = rows.slice(0, limit ?? 30);
			const full = await history.getByIds(page.map((r) => r.id));
			const entries = full.map((e) => ({
				id: e.id,
				at: e.createdAt,
				source: e.source,
				action: e.action === 'edit' ? undefined : e.action,
				origin: e.originId ?? undefined,
				statsScene: e.statsScene,
				kind: e.kind,
				itemId: e.itemId ?? undefined,
				element: e.elementId !== null ? CustomElement[e.elementId] ?? e.elementId : undefined,
				summary: summarizeChange(e.change),
				group: e.groupId,
				undone: undone(e),
			}));
			return text({ entries, more: rows.length > page.length ? { beforeId: page[page.length - 1].id, remaining: rows.length - page.length } : undefined });
		},
	);
}

export function registerOverlayHistoryWriteTools(server: McpServer) {
	server.registerTool(
		'undo_overlay_change',
		{
			description:
				'Undo / redo overlay changes in one scene — the user\'s or yours — exactly like the editor\'s Ctrl+Z / Ctrl+Shift+Z: strictly newest first, one edit per step. count = steps; untilId = undo back to and including that edit (everything newer in the scene is undone too); redo:true re-applies what was undone — only while the forward history is clear (after a new edit, redo is done; the undone edits stay in the history). Nothing is deleted: every undo / redo is logged as its own entry, and undone edits carry undone {at, by}. Ask before undoing the user\'s own edits.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES),
				count: z.number().int().min(1).max(50).optional().describe('Steps. Default 1'),
				untilId: z.number().int().optional().describe('Undo back to and including this entry (from get_overlay_history)'),
				redo: z.boolean().optional(),
			},
		},
		async ({ overlayId, statsScene, count, untilId, redo }) => {
			const store = mcpContext.overlayStore!;
			if (untilId !== undefined) {
				if (redo) return error('untilId only works for undo');
				const r = await store.undoRedo(overlayId, statsScene as LiveStatsScene, { untilId });
				return 'error' in r ? (r.steps?.length ? text({ undone: r.steps, stoppedBecause: r.error }) : error(r.error)) : text({ undone: r.steps });
			}
			const done: number[] = [];
			for (let i = 0; i < (count ?? 1); i++) {
				const r = await store.undoRedo(overlayId, statsScene as LiveStatsScene, { redo });
				if ('error' in r) return done.length ? text({ [redo ? 'redone' : 'undone']: done, stoppedBecause: r.error }) : error(r.error);
				done.push(...r.steps);
			}
			return text({ [redo ? 'redone' : 'undone']: done });
		},
	);
}
