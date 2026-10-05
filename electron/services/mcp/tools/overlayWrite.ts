import { z } from 'zod';
import { cloneDeep, merge } from 'lodash';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { Animation, LiveStatsScene, SceneBackground } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import type { ElementPayload, Scene } from '../../../../frontend/src/lib/models/types/overlay';
import { getDefaultElementPayload } from '../../../../frontend/src/lib/utils/overlayElementDefaults';
import { newId } from '../../../utils/functions';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene);

// Fonts built into Froggi (the editor's font dropdown). A custom font file is registered by
// CustomFontHandler under the SCENE NAME (scene font) or the ELEMENT ID (element font), and rendered
// via font-family = font.family — so a custom src only shows if family is that scene name / item id.
const BUILTIN_FONTS = ['default', 'sans-serif', 'Melee', 'Ultimate', 'A-OTF Folk Pro M', 'Roboto', 'Roboto Bold Italic', 'Wix'];
const withCustomFontFamily = <T extends { family?: string; src?: string } | undefined>(font: T, registeredAs: string): T =>
	font?.src && !BUILTIN_FONTS.includes(font.family ?? '') ? ({ ...font, family: registeredAs } as T) : font;
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

// Grid placement. The overlay grid is 512 columns × 288 rows (COL × ROW) for EVERY aspect ratio — it
// stretches to the overlay; x/y is the top-left, w/h the size.
// Right corner example: a 90x90 element at the top-right ≈ { x: 412, y: 10, w: 90, h: 90 }.
const gridPositionSchema = z.object({
	x: z.number().min(0).max(512).optional(),
	y: z.number().min(0).max(288).optional(),
	w: z.number().min(1).max(512).optional(),
	h: z.number().min(1).max(288).optional(),
});

export function registerOverlayWriteTools(server: McpServer) {
	server.registerTool(
		'create_overlay',
		{
			description: 'Create a new, empty custom overlay and return its id. The overlay ships with all stats scenes (WaitingForDolphin, Menu, InGame, PostGame, PostSet, RankChange, StrikePhase), each with one empty layer (index 0) and the "fly automatic" scene-switch animation already applied. Plan layers first (add_overlay_layer) when elements will sit close together, then add elements (start with statsScene "inGame"), then obs_add_overlay_browser_source to put it in OBS.',
			inputSchema: {
				title: z.string().optional().describe('Overlay name shown in Froggi. Defaults to an auto-generated name.'),
				aspectRatio: z.object({ width: z.number().positive(), height: z.number().positive() }).optional().describe('Overlay aspect ratio, e.g. {width:16,height:9}, {width:4,height:3}, {width:19,height:9}. Ask the user which ratio (stream canvas or game window) before creating — 16:9 only if they have no preference.'),
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
		'duplicate_overlay',
		{
			description: 'Copy a whole overlay (all scenes, layers, elements and its custom images/fonts) into a new, editable overlay — the way to start from a demo overlay (demos themselves are read-only). Returns the new id.',
			inputSchema: {
				overlayId: z.string(),
				title: z.string().min(1).max(100).optional().describe('Title for the copy (default "<original> - copy")'),
			},
		},
		async ({ overlayId, title }) => {
			const source = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!source) return error(`No overlay with id "${overlayId}"`);
			const newId = await mcpContext.overlayStore!.copyOverlay(overlayId, title);
			if (!newId) return error('Failed to duplicate overlay — see logs');
			return text({ ok: true, overlayId: newId, title: title || `${source.title} - copy` });
		},
	);

	server.registerTool(
		'add_overlay_layer',
		{
			description: 'Add empty layer(s) to a scene. Layer order: index 0 is drawn ON TOP, higher indexes are further BEHIND (so backgrounds/panels go on a higher index than the text drawn over them). Use separate layers for elements that sit close together or overlap — e.g. all stock icons on one layer, percentages on another; HUD elements can share a layer unless they are close together. Default appends at the end (behind everything); pass atIndex to insert elsewhere (existing layers at/after it shift +1). Records undo history. Returns the scene\'s new layer count and the added indexes.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				count: z.number().int().min(1).max(10).default(1),
				atIndex: z.number().int().min(0).optional().describe('Insert position; omit to append (behind all existing layers)'),
				titles: z.array(z.string().max(60)).max(10).optional().describe('Names for the new layers, in order (e.g. ["Timer", "P1 panel backdrop"]). Always name layers so the user can find them in the layer panel.'),
			},
		},
		async ({ overlayId, statsScene, count, atIndex, titles }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);
			const start = Math.min(atIndex ?? sceneBefore.layers.length, sceneBefore.layers.length);

			const added = Math.max(count, titles?.length ?? 0);
			const afterScene = await mcpContext.overlayStore!.addLayersToScene(overlayId, statsScene as LiveStatsScene, added, start, titles);
			if (!afterScene) return error('Failed to add layer — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `add ${added} layer(s) to ${statsScene}`);
			return text({ ok: true, layerCount: afterScene.layers.length, addedLayerIndexes: Array.from({ length: added }, (_, i) => start + i), note: 'Index 0 is on top; higher = further behind.' });
		},
	);

	server.registerTool(
		'rename_overlay_layer',
		{
			description: 'Name a layer (shown in the editor\'s layer panel; empty string clears it). Name every layer you create or restructure after what it holds — "Timer", "P1 panel", "Stock-loss icons", "GO callout" — so the user can find it. Records undo history.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
				title: z.string().max(60),
			},
		},
		async ({ overlayId, statsScene, layerIndex, title }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);
			if (!sceneBefore.layers[layerIndex]) return error(`No layer at index ${layerIndex} in "${statsScene}"`);
			const afterScene = await mcpContext.overlayStore!.renameLayer(overlayId, statsScene as LiveStatsScene, layerIndex, title);
			if (!afterScene) return error('Failed to rename layer — see logs');
			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `rename layer ${layerIndex}`);
			return text({ ok: true, layerIndex, title: afterScene.layers[layerIndex]?.title ?? null });
		},
	);

	server.registerTool(
		'move_overlay_layer',
		{
			description: 'Reorder a scene\'s layers: move the layer at layerIndex to toIndex (others shift). Index 0 is drawn on top, higher = further behind. Records undo history.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
				toIndex: z.number().int().min(0),
			},
		},
		async ({ overlayId, statsScene, layerIndex, toIndex }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);
			if (!sceneBefore.layers[layerIndex]) return error(`No layer at index ${layerIndex} in "${statsScene}"`);
			const afterScene = await mcpContext.overlayStore!.moveLayerTo(overlayId, statsScene as LiveStatsScene, layerIndex, toIndex);
			if (!afterScene) return error('Failed to move layer — see logs');
			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `move layer ${layerIndex} → ${toIndex}`);
			return text({ ok: true, layerCount: afterScene.layers.length, movedTo: Math.min(toIndex, afterScene.layers.length - 1) });
		},
	);

	server.registerTool(
		'duplicate_overlay_layer',
		{
			description: 'Copy a layer with all its elements (new element ids, same positions/styling, custom files copied). The copy is inserted at layerIndex — i.e. ON TOP of the original, which shifts to layerIndex+1. Handy for giving several elements a matching backdrop: duplicate, then turn the lower copy\'s elements into background boxes (update/delete elements, or move_overlay_layer). Records undo history.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]),
				layerIndex: z.number().int().min(0),
			},
		},
		async ({ overlayId, statsScene, layerIndex }) => {
			const overlayBefore = await mcpContext.overlayStore!.getOverlayById(overlayId);
			const sceneBefore = overlayBefore?.[statsScene as LiveStatsScene];
			if (!sceneBefore) return error(`No scene "${statsScene}" on overlay "${overlayId}"`);
			if (!sceneBefore.layers[layerIndex]) return error(`No layer at index ${layerIndex} in "${statsScene}"`);
			const afterScene = await mcpContext.overlayStore!.duplicateSceneLayer(overlayId, statsScene as LiveStatsScene, layerIndex);
			if (!afterScene) return error('Failed to duplicate layer — see logs');
			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `duplicate layer ${layerIndex}`);
			return text({
				ok: true,
				copyLayerIndex: layerIndex,
				originalNowAt: layerIndex + 1,
				copyItemIds: afterScene.layers[layerIndex]?.items.map((i) => i.id),
			});
		},
	);

	server.registerTool(
		'update_overlay_settings',
		{
			description: 'Rename an overlay, change its description, or change its aspect ratio (e.g. {width:16,height:9} landscape, {width:9,height:16} portrait). Element grid positions are relative, so they stretch to the new ratio. Not recorded in scene undo history — tell the user the previous values.',
			inputSchema: {
				overlayId: z.string(),
				title: z.string().min(1).max(100).optional(),
				description: z.string().max(500).optional(),
				aspectRatio: z.object({ width: z.number().int().min(1).max(64), height: z.number().int().min(1).max(64) }).optional(),
			},
		},
		async ({ overlayId, title, description, aspectRatio }) => {
			if (title === undefined && description === undefined && !aspectRatio) return error('Provide at least one of title, description, aspectRatio.');
			const before = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!before) return error(`No overlay with id "${overlayId}"`);
			if (before.isDemo) return error('Demo overlays are read-only — duplicate it in Froggi first.');
			const after = await mcpContext.overlayStore!.updateOverlaySettings(overlayId, { title, description, aspectRatio });
			if (!after) return error('Failed to update overlay — see logs');
			return text({
				ok: true,
				before: { title: before.title, description: before.description, aspectRatio: before.aspectRatio },
				after: { title: after.title, description: after.description, aspectRatio: after.aspectRatio },
			});
		},
	);

	server.registerTool(
		'add_overlay_image',
		{
			description: 'Store an image for an overlay and get its file name. Use the source the user gave: `url` for a link; `filePath` for a local file path (e.g. an image the user dropped into Claude Code); `base64` (data URI or raw base64 + fileName) only if you actually have the image bytes. If the user attached an image in chat that you cannot access as a path/URL/bytes — or gave nothing — use `picker: true`: Froggi opens a file dialog on their machine and waits for them to choose (tell them to look for it). Then use the returned fileName: on a CustomImage element (elementId 2000) as payload {"image": {"name": fileName, "objectFit": "contain"}}, or as a scene background via configure_overlay_scene background {type:"Custom Image", customImage:{name: fileName, objectFit:"cover"}}.',
			inputSchema: {
				overlayId: z.string(),
				url: z.string().url().optional(),
				filePath: z.string().optional(),
				base64: z.string().optional(),
				picker: z.boolean().optional(),
				fileName: z.string().max(80).optional().describe('Optional name to save as (extension is taken from the image)'),
			},
		},
		async ({ overlayId, url, filePath, base64, picker, fileName }) => {
			const sources = [url, filePath, base64, picker || undefined].filter((v) => v !== undefined);
			if (sources.length !== 1) return error('Pass exactly one of url, filePath, base64, picker:true.');
			const result = await mcpContext.overlayStore!.saveOverlayImage(overlayId, { url, filePath, base64, picker }, fileName);
			if ('error' in result) return error(result.error);
			if ('canceled' in result) return text('The user closed the file picker without choosing an image.');
			return text({ ok: true, fileName: result.fileName });
		},
	);

	server.registerTool(
		'delete_overlay',
		{
			description: 'Move an overlay to Deleted Overlays (soft delete — restorable with restore_overlay or from the Deleted Overlays page in Froggi). ONLY call after the user explicitly confirmed in this conversation that this overlay (say its title) should be deleted. You can never permanently delete — only the user can, from the Deleted Overlays page.',
			inputSchema: {
				overlayId: z.string(),
				userConfirmed: z.literal(true).describe('Set only after the user agreed to delete this overlay.'),
			},
		},
		async ({ overlayId }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);
			if (overlay.deletedAt) return text(`"${overlay.title}" is already in Deleted Overlays.`);
			await mcpContext.overlayStore!.deleteOverlay(overlayId);
			return text(`Moved "${overlay.title}" to Deleted Overlays. It can be restored with restore_overlay or from Froggi → Overlays → Deleted.`);
		},
	);

	server.registerTool(
		'restore_overlay',
		{
			description: 'Restore an overlay from Deleted Overlays (find ids with list_overlays includeDeleted:true).',
			inputSchema: { overlayId: z.string() },
		},
		async ({ overlayId }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return error(`No overlay with id "${overlayId}" — permanently deleted overlays cannot be restored.`);
			if (!overlay.deletedAt) return text(`"${overlay.title}" is not deleted.`);
			await mcpContext.overlayStore!.restoreOverlay(overlayId);
			return text(`Restored "${overlay.title}".`);
		},
	);

	server.registerTool(
		'add_overlay_element',
		{
			description: 'Add a new element to a layer. Records undo history. Pass a partial payload (e.g. {"string": "Hello", "css": {"color": "#ff0000ff"}}) — anything you omit uses sensible defaults. Omit `position` to auto-place in the first free grid slot, or pass it to place at a specific grid coordinate/size (512 columns × 288 rows; e.g. top-right corner ≈ {x:412,y:10,w:90,h:90}, bottom-right ≈ {x:412,y:188,w:90,h:90}).',
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
			const itemId = newId();
			merged.font = withCustomFontFamily(merged.font, itemId);
			const afterScene = await mcpContext.overlayStore!.addItemToLayer(overlayId, statsScene as LiveStatsScene, layerIndex, elementId as CustomElement, merged, itemId, position);
			if (!afterScene) return error('Failed to add element — see logs');

			await mcpContext.overlayHistory!.recordEdit(overlayId, statsScene as LiveStatsScene, cloneDeep(sceneBefore), cloneDeep(afterScene), `add ${CustomElement[elementId as CustomElement]}`);
			return text({ ok: true, addedItemId: afterScene.layers[layerIndex]?.items.at(-1)?.id });
		},
	);

	server.registerTool(
		'add_overlay_elements',
		{
			description: 'Add MULTIPLE elements to one scene in a single call (one save, one undo entry) — use this to build a whole HUD at once instead of many add_overlay_element calls. Each element: elementId (required); optional payload (partial, deep-merged over defaults); optional position {x,y,w,h} on the 512×288 grid (x 0-512, y 0-288); optional layerIndex (default 0; index 0 is on top — add layers first with add_overlay_layer). Elements without a position auto-place, accounting for others added earlier in the same batch.',
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

			const items = elements.map((e) => {
				const id = newId();
				const payload: ElementPayload = merge(getDefaultElementPayload(), e.payload as Partial<ElementPayload> | undefined);
				payload.font = withCustomFontFamily(payload.font, id);
				return { id, layerIndex: e.layerIndex ?? 0, elementId: e.elementId as CustomElement, payload, position: e.position };
			});
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
			description: 'Move/resize an existing element within its layer\'s grid (512 columns × 288 rows; x/y = top-left, w/h = size). Omitted fields keep their current value. Records undo history. Use after add_overlay_element to place things in a corner, e.g. top-right ≈ {x:412,y:10,w:90,h:90}.',
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
					family: z.string().optional().describe(`Built-in: ${'"default" | "sans-serif" | "Melee" | "Ultimate" | "A-OTF Folk Pro M" | "Roboto" | "Roboto Bold Italic" | "Wix"'}. For a custom font just pass src (from add_overlay_font) — family is set for you`),
					src: z.string().optional().describe('Custom font filename uploaded under the overlay; omit/empty for the default font'),
				}).optional().describe('Scene default font — applies to text elements that use the scene font'),
				background: z.object({
					type: z.enum(BACKGROUND_TYPES).optional().describe('None | Color | Image | Custom Image | In Game Stage Image | Post Game Stage Image'),
					color: z.string().optional().describe('CSS color, used when type=Color'),
					opacity: z.number().min(0).max(100).optional(),
					customImage: z.object({
						name: z.string().describe('File name returned by add_overlay_image'),
						objectFit: z.enum(['cover', 'contain', 'fill', 'none']).optional(),
					}).optional().describe('Used when type="Custom Image"'),
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
				font: withCustomFontFamily(font, statsScene) as Scene['font'] | undefined,
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
			description: 'Add a custom font to an overlay. Sources (pass exactly one): `googleFont` — a Google Fonts family NAME ("Bebas Neue", "Press Start 2P") or a fonts.google.com/specimen link (optionally `weight`, e.g. 700); `url` — a direct .ttf/.otf/.woff/.woff2 file URL; `filePath` — a font file on this machine; `picker: true` — Froggi opens a file dialog for the user. If the user wants a different look but names no font, suggest 2–3 fitting Google Fonts by name (e.g. bold display: "Bebas Neue", "Anton"; esports/tech: "Rajdhani", "Orbitron"; retro: "Press Start 2P") and ask which they like, or ask for a name/link. Returns `fileName`; apply it with configure_overlay_scene font:{ src: fileName } for the scene default (elements left on the "default" font use it), or update_overlay_element payload {"font":{"src":fileName}} for one element — family is set automatically.',
			inputSchema: {
				overlayId: z.string(),
				googleFont: z.string().min(2).max(200).optional().describe('Google Fonts family name or fonts.google.com/specimen link'),
				weight: z.number().int().min(100).max(900).optional().describe('Google Fonts weight, e.g. 400 or 700'),
				url: z.string().url().optional().describe('Direct https URL to a .ttf/.otf/.woff/.woff2 file'),
				filePath: z.string().optional(),
				picker: z.boolean().optional(),
				fileName: z.string().optional().describe('Base name to save as (no extension)'),
			},
		},
		async ({ overlayId, googleFont, weight, url, filePath, picker, fileName }) => {
			const sources = [googleFont, url, filePath, picker || undefined].filter((v) => v !== undefined);
			if (sources.length !== 1) return error('Pass exactly one of googleFont, url, filePath, picker:true.');
			const store = mcpContext.overlayStore!;
			let family: string | undefined;
			let result: { fileName: string } | { error: string } | { canceled: true };
			if (googleFont || (url && /fonts\.google(apis)?\.com/.test(url))) {
				const resolved = await store.resolveGoogleFont((googleFont ?? url)!, weight);
				if ('error' in resolved) return error(resolved.error);
				family = resolved.family;
				result = await store.downloadFont(overlayId, resolved.url, fileName ?? `${family}${weight ? `-${weight}` : ''}`);
			} else if (url) {
				result = await store.downloadFont(overlayId, url, fileName);
			} else {
				result = await store.saveFontFile(overlayId, { filePath, picker }, fileName);
			}
			if ('error' in result) return error(result.error);
			if ('canceled' in result) return text('The user closed the file picker without choosing a font.');
			family ??= result.fileName.replace(/\.[^.]+$/, '');
			return text({
				ok: true,
				fileName: result.fileName,
				family,
				apply: `Whole scene: configure_overlay_scene font:{ src:"${result.fileName}" } (text elements on "default" font use it). One element: payload {"font":{"src":"${result.fileName}"}} in add_overlay_element(s) or update_overlay_element. Froggi sets the matching family automatically.`,
			});
		},
	);

	server.registerTool(
		'update_overlay_element',
		{
			description: 'Merge a partial payload patch into an existing element (styling, text, etc.) — sibling fields not mentioned are preserved. Custom font on one element: payload {"font":{"src":"<fileName from add_overlay_font>"}} (family is set for you). Records undo history.',
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

			const patch = { ...(payload ?? {}) } as Partial<ElementPayload>;
			if (patch.font) patch.font = withCustomFontFamily(patch.font, itemId) as ElementPayload['font'];
			const afterScene = await mcpContext.overlayStore!.updateItemInLayer(overlayId, statsScene as LiveStatsScene, layerIndex, itemId, patch);
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
