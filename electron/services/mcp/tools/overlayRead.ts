import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import { COL } from '../../../../frontend/src/lib/models/const';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene);

function summarizeOverlay(overlay: Record<string, unknown> & { id: string; title: string; isDemo: boolean; aspectRatio: unknown }) {
	const scenes: Record<string, { layers: number; items: number }> = {};
	for (const statsScene of STATS_SCENES) {
		const scene = overlay[statsScene] as { layers?: { items?: unknown[] }[] } | undefined;
		const layers = scene?.layers ?? [];
		scenes[statsScene] = { layers: layers.length, items: layers.reduce((sum, l) => sum + (l.items?.length ?? 0), 0) };
	}
	return { id: overlay.id, title: overlay.title, isDemo: overlay.isDemo, aspectRatio: overlay.aspectRatio, scenes };
}

export function registerOverlayReadTools(server: McpServer) {
	server.registerTool(
		'list_overlays',
		{ description: 'List all overlays with per-scene layer/item counts. Use get_overlay for full detail on one.', inputSchema: {} },
		async () => {
			const overlays = await mcpContext.overlayStore!.getOverlays();
			return text(Object.values(overlays).map((o) => summarizeOverlay(o as never)));
		},
	);

	server.registerTool(
		'get_overlay',
		{
			description: 'Get one overlay by id. Summarized by default (counts only); pass verbose:true for the full raw structure including every element\'s styling.',
			inputSchema: { overlayId: z.string(), verbose: z.boolean().optional() },
		},
		async ({ overlayId, verbose }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);
			return text(verbose ? overlay : summarizeOverlay(overlay as never));
		},
	);

	server.registerTool(
		'list_elements',
		{
			description: 'List elements in one scene of an overlay — id, element type, layer index, and grid position/size. Use get_overlay with verbose:true if you need full styling for a specific element.',
			inputSchema: { overlayId: z.string(), statsScene: z.enum(STATS_SCENES as [string, ...string[]]) },
		},
		async ({ overlayId, statsScene }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const scene = overlay?.[statsScene as LiveStatsScene];
			if (!scene) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);

			const elements = scene.layers.flatMap((layer, layerIndex) =>
				layer.items.map((item) => ({
					id: item.id,
					elementId: item.elementId,
					elementType: CustomElement[item.elementId] ?? `unknown(${item.elementId})`,
					layerIndex,
					position: { x: item[COL]?.x, y: item[COL]?.y, w: item[COL]?.w, h: item[COL]?.h },
					text: item.data?.string || undefined,
				})),
			);
			return text(elements);
		},
	);
}
