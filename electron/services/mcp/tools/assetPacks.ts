import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { BUILTIN_ASSET_PACKS } from '../../../../frontend/src/lib/models/types/assetPack';
import { MELEE_CHARACTER_SKINS } from '../../../../frontend/src/lib/models/constants/meleeCharacterSkins';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const TOTAL_SLOTS = MELEE_CHARACTER_SKINS.reduce((n, c) => n + c.skins.length, 0);

export function registerAssetPackReadTools(server: McpServer) {
	server.registerTool(
		'list_asset_packs',
		{
			description: 'Character asset packs: sets of character images (one per Melee character per skin/costume) used by the "Character" overlay elements (InGamePlayer1Character 6225, InGamePlayer2Character 6235, InGameCurrentPlayerCharacter 6215 — set payload.assetPack to a pack id). Built-in packs: stock icons (default), portraits, renders left/right. Custom packs are made on Froggi → Overlays → Assets. Returns each pack with how many of the ' + TOTAL_SLOTS + ' character/skin slots are filled.',
			inputSchema: {},
		},
		async () => {
			const custom = mcpContext.assetPackService!.getPacks();
			return text([
				...BUILTIN_ASSET_PACKS.map((p) => ({ id: p.id, title: p.title, builtIn: true, filled: TOTAL_SLOTS })),
				...custom.map((p) => ({
					id: p.id,
					title: p.title,
					builtIn: false,
					fallback: p.fallback,
					filled: Object.values(p.slots).reduce((n, s) => n + Object.keys(s).length, 0),
					of: TOTAL_SLOTS,
				})),
			]);
		},
	);

	server.registerTool(
		'get_asset_pack',
		{
			description: 'One asset pack in detail: for every Melee character (id, name) each skin slot with its skin id and costume name (e.g. Fox 0 Default, 1 Red, 2 Blue, 3 Green — the in-game characterColor) and whether it has an image. Skin 0 is required; missing skins fall back to that character\'s skin 0, missing characters to the pack\'s built-in fallback. Use it to tell the user exactly which slots are still empty and which costume each slot is ("Marth — Blue is skin 2"), and guide them through Froggi → Overlays → Assets → the pack → click the slot to upload (or "Import folder" with <characterId>/<skinId>.png files).',
			inputSchema: { packId: z.string(), onlyMissing: z.boolean().optional().describe('Only list characters with empty slots') },
		},
		async ({ packId, onlyMissing }) => {
			const pack = mcpContext.assetPackService!.getPack(packId);
			if (!pack) return error(`No asset pack "${packId}" — see list_asset_packs`);
			const characters = MELEE_CHARACTER_SKINS.map((c) => {
				const slots = c.skins.map((name, skinId) => ({ skinId, costume: name, filled: pack.builtIn || !!pack.slots[c.id]?.[skinId] }));
				return { characterId: c.id, character: c.name, skin0Missing: !slots[0].filled, missing: slots.filter((s) => !s.filled).map((s) => `${s.skinId} ${s.costume}`), slots };
			}).filter((c) => !onlyMissing || c.missing.length);
			return text({ id: pack.id, title: pack.title, builtIn: pack.builtIn, fallback: pack.fallback, characters });
		},
	);
}

export function registerAssetPackWriteTools(server: McpServer) {
	server.registerTool(
		'create_asset_pack',
		{
			description: 'Create an empty custom asset pack (or duplicate an existing/built-in pack with fromPackId, which copies all its images). Adding images is mostly a human job on Froggi → Overlays → Assets; you can add single images with set_asset_pack_slot.',
			inputSchema: {
				title: z.string().min(1).max(80).optional(),
				fromPackId: z.string().optional().describe('Duplicate this pack instead of starting empty'),
				fallback: z.enum(BUILTIN_ASSET_PACKS.map((p) => p.id) as [string, ...string[]]).optional().describe('Built-in pack used for characters missing from this pack'),
			},
		},
		async ({ title, fromPackId, fallback }) => {
			const service = mcpContext.assetPackService!;
			if (fromPackId) {
				const copy = service.duplicatePack(fromPackId);
				if ('error' in copy) return error(copy.error);
				if (title || fallback) service.updatePack(copy.id, { title, fallback });
				return text({ ok: true, packId: copy.id });
			}
			const pack = service.createPack(title ?? 'My character pack', fallback);
			return text({ ok: true, packId: pack.id });
		},
	);

	server.registerTool(
		'set_asset_pack_slot',
		{
			description: 'Put an image into one character/skin slot of a custom pack. Pass exactly one source: url, filePath (a local file), base64, or picker:true (Froggi opens a file dialog for the user). Images over 1024px are downsampled; GIF and WebP are kept as-is. Look up characterId/skinId with get_asset_pack (skin = costume, e.g. Falco 0 Default, 1 Red, 2 Blue, 3 Green).',
			inputSchema: {
				packId: z.string(),
				characterId: z.number().int().min(0).max(25),
				skinId: z.number().int().min(0).max(5),
				url: z.string().url().optional(),
				filePath: z.string().optional(),
				base64: z.string().optional(),
				picker: z.boolean().optional(),
			},
		},
		async ({ packId, characterId, skinId, url, filePath, base64, picker }) => {
			const sources = [url, filePath, base64, picker || undefined].filter((v) => v !== undefined);
			if (sources.length !== 1) return error('Pass exactly one of url, filePath, base64, picker:true.');
			const r = await mcpContext.assetPackService!.setSlot(packId, characterId, skinId, { url, filePath, base64, picker });
			if ('error' in r) return error(r.error);
			if ('canceled' in r) return text('The user closed the file picker.');
			return text({ ok: true, fileName: r.fileName });
		},
	);
}
