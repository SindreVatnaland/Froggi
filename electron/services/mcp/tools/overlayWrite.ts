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

// Grid placement. The overlay grid is 512x512 units; x/y is the top-left, w/h the size.
// Right corner example: a 90x90 element at the top-right ≈ { x: 412, y: 10, w: 90, h: 90 }.
const gridPositionSchema = z.object({
	x: z.number().min(0).max(512).optional(),
	y: z.number().min(0).max(512).optional(),
	w: z.number().min(1).max(512).optional(),
	h: z.number().min(1).max(512).optional(),
});

export function registerOverlayWriteTools(server: McpServer) {
	server.registerTool(
		'create_overlay',
		{
			description: 'Create a new, empty custom overlay and return its id. The overlay ships with all stats scenes (WaitingForDolphin, Menu, InGame, PostGame, PostSet, RankChange, StrikePhase), each with one empty layer (index 0). After creating, use add_overlay_element to design it (start with statsScene "inGame", layerIndex 0), then obs_add_overlay_browser_source to put it in OBS.',
			inputSchema: {
				title: z.string().optional().describe('Overlay name shown in Froggi. Defaults to an auto-generated name.'),
				aspectRatio: z.object({ width: z.number().positive(), height: z.number().positive() }).optional().describe('Overlay aspect ratio, e.g. {width:16,height:9}. Defaults to 16:9.'),
			},
		},
		async ({ title, aspectRatio }) => {
			const aspect = aspectRatio ?? { width: 16, height: 9 };
			const overlayId = await mcpContext.overlayStore!.createOverlay(aspect, title);
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			return text({
				ok: true,
				overlayId,
				title: overlay?.title,
				scenes: STATS_SCENES,
				next: 'Use add_overlay_element with this overlayId (statsScene e.g. "inGame", layerIndex 0), then obs_add_overlay_browser_source.',
			});
		},
	);

	server.registerTool(
		'add_overlay_element',
		{
			description: 'Add a new element to a layer. Records undo history. Pass a partial payload (e.g. {"string": "Hello", "css": {"color": "#ff0000ff"}}) — anything you omit uses sensible defaults. Omit `position` to auto-place in the first free grid slot, or pass it to place at a specific grid coordinate/size (512x512 grid; e.g. top-right corner ≈ {x:412,y:10,w:90,h:90}).',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
				elementId: z.number().refine((v) => ELEMENT_TYPES.includes(v as CustomElement), 'Unknown elementId — see list_elements or the CustomElement enum'),
				payload: partialPayloadSchema,
				position: gridPositionSchema.optional(),
			},
		},
		async ({ overlayId, statsScene, layerIndex, elementId, payload, position }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);
			if (!sceneBefore.layers[layerIndex]) return error(`No layer at index ${layerIndex} in "${statsScene}"`);

			const merged: ElementPayload = { ...getDefaultElementPayload(), ...(payload as Partial<ElementPayload> | undefined) };
			const afterScene = await mcpContext.overlayStore!.addItemToLayer(overlayId, statsScene as LiveStatsScene, layerIndex, elementId as CustomElement, merged, undefined, position);
			if (!afterScene) return error('Failed to add element — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `add ${CustomElement[elementId as CustomElement]}`);
			return text({ ok: true, addedItemId: afterScene.layers[layerIndex]?.items.at(-1)?.id });
		},
	);

	server.registerTool(
		'move_overlay_element',
		{
			description: 'Move/resize an existing element within its layer\'s grid (512x512 units; x/y = top-left, w/h = size). Omitted fields keep their current value. Records undo history. Use after add_overlay_element to place things in a corner, e.g. top-right ≈ {x:412,y:10,w:90,h:90}.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
				itemId: z.string(),
				position: gridPositionSchema,
			},
		},
		async ({ overlayId, statsScene, layerIndex, itemId, position }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);
			const item = sceneBefore.layers[layerIndex]?.items.find((i) => i.id === itemId);
			if (!item) return error(`No element "${itemId}" in layer ${layerIndex} of "${statsScene}"`);

			const afterScene = await mcpContext.overlayStore!.moveItemInLayer(overlayId, statsScene as LiveStatsScene, layerIndex, itemId, position);
			if (!afterScene) return error('Failed to move element — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `move ${itemId}`);
			return text({ ok: true, movedItemId: itemId });
		},
	);

	server.registerTool(
		'configure_overlay_scene',
		{
			description: 'Enable/disable a scene and/or set its fallback. A disabled scene (active:false) is not shown; the overlay falls back to the fallback scene while that game state is active. Use this to keep an overlay visible only in some states, e.g. a controller overlay active in inGame + menu, every other scene disabled with fallback "menu". Records undo history.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				active: z.boolean().optional().describe('true = scene shown, false = disabled (falls back)'),
				fallback: z.enum(STATS_SCENES as [string, ...string[]]).optional().describe('Scene to show instead while this one is disabled, e.g. "menu"'),
			},
		},
		async ({ overlayId, statsScene, active, fallback }) => {
			if (active === undefined && fallback === undefined) return error('Provide active and/or fallback.');
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);

			const afterScene = await mcpContext.overlayStore!.setSceneConfig(overlayId, statsScene as LiveStatsScene, {
				active,
				fallback: fallback as LiveStatsScene | undefined,
			});
			if (!afterScene) return error('Failed to configure scene — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `configure ${statsScene} (active=${active}, fallback=${fallback})`);
			return text({ ok: true, statsScene, active: afterScene.active, fallback: afterScene.fallback });
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
