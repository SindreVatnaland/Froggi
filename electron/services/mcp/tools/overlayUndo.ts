import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene);

export function registerOverlayUndoTools(server: McpServer) {
	server.registerTool(
		'list_overlay_edit_history',
		{
			description: 'List recent AI-made edits to one overlay scene (most recent first) — id, what changed, when, and whether it\'s already been undone.',
			inputSchema: { overlayId: z.string(), statsScene: z.enum(STATS_SCENES as [string, ...string[]]), limit: z.number().int().min(1).max(50).optional() },
		},
		async ({ overlayId, statsScene, limit }) => {
			const entries = await mcpContext.overlayHistory!.listRecent(overlayId, statsScene as LiveStatsScene, limit);
			return text(entries.map((e) => ({ id: e.id, label: e.label, createdAt: e.createdAt, undoneAt: e.undoneAt })));
		},
	);

	server.registerTool(
		'undo_overlay_edit',
		{
			description: 'Undo the most recent not-yet-undone AI edit to one overlay scene, restoring it to how it was before that edit.',
			inputSchema: { overlayId: z.string(), statsScene: z.enum(STATS_SCENES as [string, ...string[]]) },
		},
		async ({ overlayId, statsScene }) => {
			const entry = await mcpContext.overlayHistory!.getLatestUndoable(overlayId, statsScene as LiveStatsScene);
			if (!entry) return error(`Nothing left to undo for "${statsScene}" on overlay "${overlayId}"`);

			const restored = await mcpContext.overlayStore!.setScene(overlayId, statsScene as LiveStatsScene, entry.beforeScene);
			if (!restored) return error('Failed to restore the previous scene — see logs');

			await mcpContext.overlayHistory!.markUndone(entry.id);
			return text({ ok: true, undone: entry.label });
		},
	);
}
