import { z } from 'zod';
import { cloneDeep, merge } from 'lodash';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { Animation, LiveStatsScene, SceneBackground } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import type { ElementPayload, Scene } from '../../../../frontend/src/lib/models/types/overlay';
import { getDefaultElementPayload } from '../../../../frontend/src/lib/utils/overlayElementDefaults';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene);
const ELEMENT_TYPES = Object.values(CustomElement).filter((v) => typeof v === 'number') as CustomElement[];
const ANIMATION_TYPES = Object.values(Animation) as [string, ...string[]];
const BACKGROUND_TYPES = Object.values(SceneBackground) as [string, ...string[]];

// Scene switch (transition) animation. `fly automatic` is the recommended automatic scene-switch
// animation — it slides the whole scene in/out on its own. `type` values match list_overlay_animations.
const animSettingsSchema = z.object({
	type: z.enum(ANIMATION_TYPES),
	options: z.object({ delay: z.number(), duration: z.number(), easing: z.string(), start: z.number(), x: z.number(), y: z.number() }).partial().optional(),
});

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

			// Deep-merge over defaults so a partial nested payload (e.g. animationTrigger with only
			// `in`) can't clobber the rest of the structure and leave the editor with an undefined
			// animation slot. Matches updateItemInLayer's merge semantics.
			const merged: ElementPayload = merge(getDefaultElementPayload(), payload as Partial<ElementPayload> | undefined);
			const afterScene = await mcpContext.overlayStore!.addItemToLayer(overlayId, statsScene as LiveStatsScene, layerIndex, elementId as CustomElement, merged, undefined, position);
			if (!afterScene) return error('Failed to add element — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `add ${CustomElement[elementId as CustomElement]}`);
			return text({ ok: true, addedItemId: afterScene.layers[layerIndex]?.items.at(-1)?.id });
		},
	);

	server.registerTool(
		'add_overlay_elements',
		{
			description: 'Add MULTIPLE elements to one scene in a single call (one save, one undo entry) — use this to build a whole HUD at once instead of many add_overlay_element calls. Each element: elementId (required); optional payload (partial, deep-merged over defaults); optional position {x,y,w,h} on the 512x512 grid; optional layerIndex (default 0). Elements without a position auto-place, accounting for others added earlier in the same batch.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				elements: z.array(z.object({
					elementId: z.number().refine((v) => ELEMENT_TYPES.includes(v as CustomElement), 'Unknown elementId — see list_elements or the CustomElement enum'),
					payload: partialPayloadSchema,
					position: gridPositionSchema.optional(),
					layerIndex: z.number().int().min(0).optional(),
				})).min(1),
			},
		},
		async ({ overlayId, statsScene, elements }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);

			const items = elements.map((e) => ({
				layerIndex: e.layerIndex ?? 0,
				elementId: e.elementId as CustomElement,
				payload: merge(getDefaultElementPayload(), e.payload as Partial<ElementPayload> | undefined),
				position: e.position,
			}));
			const missing = items.find((it) => !sceneBefore.layers[it.layerIndex]);
			if (missing) return error(`No layer at index ${missing.layerIndex} in "${statsScene}"`);

			const result = await mcpContext.overlayStore!.addItemsToScene(overlayId, statsScene as LiveStatsScene, items);
			if (!result) return error('Failed to add elements — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(result.scene), `add ${result.addedIds.length} elements`);
			return text({ ok: true, addedItemIds: result.addedIds });
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
			description: 'Configure a whole scene (not individual elements): enable/disable + fallback, the scene default font, the background, and the scene-switch (transition) animation. All fields optional and merged over current values. Examples: keep a controller overlay only in inGame+menu (disable others, fallback "menu"); set a default font for every text element in the scene; give a scene a colored/None background; use "fly automatic" as the automatic scene-switch animation (recommended default). Records undo history.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				active: z.boolean().optional().describe('true = scene shown, false = disabled (falls back)'),
				fallback: z.enum(STATS_SCENES as [string, ...string[]]).optional().describe('Scene to show instead while this one is disabled, e.g. "menu"'),
				font: z.object({
					family: z.string().optional().describe('"default" for the app default font, or a custom family name'),
					src: z.string().optional().describe('Custom font filename uploaded under the overlay; omit/empty for the default font'),
				}).optional().describe('Scene default font — applies to text elements that use the scene font'),
				background: z.object({
					type: z.enum(BACKGROUND_TYPES).optional().describe('None | Color | Image | Custom Image | In Game Stage Image | Post Game Stage Image'),
					color: z.string().optional().describe('CSS color, used when type=Color'),
					opacity: z.number().min(0).max(100).optional(),
				}).optional(),
				animation: z.object({
					in: animSettingsSchema.optional(),
					out: animSettingsSchema.optional(),
					duration: z.number().optional(),
					layerRenderDelay: z.number().optional(),
				}).optional().describe('Scene-switch transition. "fly automatic" is the recommended automatic in/out.'),
			},
		},
		async ({ overlayId, statsScene, active, fallback, font, background, animation }) => {
			if (active === undefined && fallback === undefined && !font && !background && !animation) {
				return error('Provide at least one of active, fallback, font, background, animation.');
			}
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);

			const afterScene = await mcpContext.overlayStore!.setSceneConfig(overlayId, statsScene as LiveStatsScene, {
				active,
				fallback: fallback as LiveStatsScene | undefined,
				font: font as Scene['font'] | undefined,
				background: background as Partial<Scene['background']> as Scene['background'] | undefined,
				animation: animation as Partial<Scene['animation']> as Scene['animation'] | undefined,
			});
			if (!afterScene) return error('Failed to configure scene — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `configure scene ${statsScene}`);
			return text({ ok: true, statsScene, active: afterScene.active, fallback: afterScene.fallback, font: afterScene.font, background: { type: afterScene.background?.type }, animation: { in: afterScene.animation?.in?.type, out: afterScene.animation?.out?.type } });
		},
	);

	server.registerTool(
		'add_overlay_font',
		{
			description: 'Download a font from a URL and add it to an overlay so it can be used as a custom font. Pass a DIRECT font-file URL (.ttf/.otf/.woff/.woff2 — e.g. a Google Fonts fonts.gstatic.com file). Returns the saved filename; then apply it with configure_overlay_scene font:{ family:"<name>", src:"<filename>" } for the scene default, or set an element payload data.font:{ family, src }. https only, font files only, 5MB cap.',
			inputSchema: {
				overlayId: z.string(),
				url: z.string().url().describe('Direct https URL to a .ttf/.otf/.woff/.woff2 file'),
				fileName: z.string().optional().describe('Base name to save as (no extension); defaults to the URL filename'),
			},
		},
		async ({ overlayId, url, fileName }) => {
			const result = await mcpContext.overlayStore!.downloadFont(overlayId, url, fileName);
			if ('error' in result) return error(result.error);
			return text({
				ok: true,
				fileName: result.fileName,
				apply: 'Set this as a custom font: configure_overlay_scene with font:{ family:"<a name>", src:"' + result.fileName + '" } for the whole scene, or set an element\'s data.font:{ family, src } to use it on just that element.',
			});
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
