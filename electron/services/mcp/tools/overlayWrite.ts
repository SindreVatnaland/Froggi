import { z } from 'zod';
import { cloneDeep } from 'lodash';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import type { ElementPayload } from '../../../../frontend/src/lib/models/types/overlay';
import { getDefaultElementPayload } from '../../../../frontend/src/lib/utils/overlayElementDefaults';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene);
const ELEMENT_TYPES = Object.values(CustomElement).filter((v) => typeof v === 'number') as CustomElement[];

// Loose passthrough — MCP tool callers supply a partial payload; the shape is merged over
// getDefaultElementPayload() before use, so no field here needs to be required.
const partialPayloadSchema = z.record(z.string(), z.unknown()).optional();

export function registerOverlayWriteTools(server: McpServer) {
	server.registerTool(
		'add_overlay_element',
		{
			description: 'Add a new element to a layer, auto-placed in the first free grid space. Records undo history. Pass a partial payload (e.g. {"string": "Hello", "css": {"color": "#ff0000ff"}}) — anything you omit uses sensible defaults.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
				elementId: z.number().refine((v) => ELEMENT_TYPES.includes(v as CustomElement), 'Unknown elementId — see list_elements or the CustomElement enum'),
				payload: partialPayloadSchema,
			},
		},
		async ({ overlayId, statsScene, layerIndex, elementId, payload }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);
			if (!sceneBefore.layers[layerIndex]) return error(`No layer at index ${layerIndex} in "${statsScene}"`);

			const merged: ElementPayload = { ...getDefaultElementPayload(), ...(payload as Partial<ElementPayload> | undefined) };
			const afterScene = await mcpContext.overlayStore!.addItemToLayer(overlayId, statsScene as LiveStatsScene, layerIndex, elementId as CustomElement, merged);
			if (!afterScene) return error('Failed to add element — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `add ${CustomElement[elementId as CustomElement]}`);
			return text({ ok: true, addedItemId: afterScene.layers[layerIndex]?.items.at(-1)?.id });
		},
	);

	server.registerTool(
		'update_overlay_element',
		{
			description: 'Merge a partial payload patch into an existing element (styling, text, etc.) — sibling fields not mentioned are preserved. Records undo history.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
				itemId: z.string(),
				payload: partialPayloadSchema,
			},
		},
		async ({ overlayId, statsScene, layerIndex, itemId, payload }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);

			const afterScene = await mcpContext.overlayStore!.updateItemInLayer(overlayId, statsScene as LiveStatsScene, layerIndex, itemId, (payload ?? {}) as Partial<ElementPayload>);
			if (!afterScene) return error(`No element "${itemId}" at layer ${layerIndex} in "${statsScene}"`);

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `update ${itemId}`);
			return text({ ok: true });
		},
	);

	server.registerTool(
		'delete_overlay_element',
		{
			description: 'Remove an element from a layer. Records undo history.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
				itemId: z.string(),
			},
		},
		async ({ overlayId, statsScene, layerIndex, itemId }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);

			const afterScene = await mcpContext.overlayStore!.deleteItemFromLayer(overlayId, statsScene as LiveStatsScene, layerIndex, itemId);
			if (!afterScene) return error(`No layer at index ${layerIndex} in "${statsScene}"`);

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `delete ${itemId}`);
			return text({ ok: true });
		},
	);
}
