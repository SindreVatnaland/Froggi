/**
 * Character asset packs: one image per Melee character per skin (costume), used by the
 * "Player 1 / Player 2 / Current Player Character" overlay elements.
 *
 * - Built-in packs point at the bundled files /image/characters/<char>/<skin>/<builtinFile>.
 * - Custom packs live in appData/public/asset-packs/<id>/ (manifest.json + <char>/<file>) and are
 *   served from /public/asset-packs/<id>/<char>/<file>.
 *
 * Lookup for a character + skin: the pack's skin → the pack's skin 0 → the pack's `fallback`
 * built-in pack (same character + skin).
 */
export interface AssetPack {
	id: string;
	title: string;
	builtIn: boolean;
	/** Built-in packs: file name inside /image/characters/<char>/<skin>/ */
	builtinFile?: string;
	/** Custom packs: slots[characterId][skinId] = file name inside <pack>/<characterId>/ */
	slots: Record<string, Record<string, string>>;
	/** Built-in pack id used for characters missing from this pack */
	fallback: string;
	createdAt?: string;
}

export const BUILTIN_ASSET_PACKS: AssetPack[] = [
	{ id: 'builtin-stock', title: 'Default stock icons', builtIn: true, builtinFile: 'stock.png', slots: {}, fallback: 'builtin-stock' },
	{ id: 'builtin-portrait', title: 'Default portraits', builtIn: true, builtinFile: 'portrait.png', slots: {}, fallback: 'builtin-portrait' },
	{ id: 'builtin-render-left', title: 'Default renders (left)', builtIn: true, builtinFile: 'vs-left.png', slots: {}, fallback: 'builtin-render-left' },
	{ id: 'builtin-render-right', title: 'Default renders (right)', builtIn: true, builtinFile: 'vs-right.png', slots: {}, fallback: 'builtin-render-right' },
];

export const DEFAULT_ASSET_PACK_ID = 'builtin-stock';

const builtinUrl = (pack: AssetPack, characterId: number, skinId: number) =>
	`/image/characters/${characterId}/${skinId}/${pack.builtinFile ?? 'stock.png'}`;

/**
 * Image URL for a character + skin from a pack (see the lookup order above). `resourceBase` is the
 * origin serving /public (urls.localResource / externalResource); built-in images are same-origin.
 */
export function resolvePackImage(
	packs: AssetPack[],
	packId: string | undefined,
	characterId: number,
	skinId: number,
	resourceBase = '',
): string {
	const all = [...BUILTIN_ASSET_PACKS, ...packs];
	const pack = all.find((p) => p.id === (packId || DEFAULT_ASSET_PACK_ID)) ?? BUILTIN_ASSET_PACKS[0];
	if (pack.builtIn) return builtinUrl(pack, characterId, skinId);
	const charSlots = pack.slots?.[characterId];
	const file = charSlots?.[skinId] ?? charSlots?.[0];
	if (file) return `${resourceBase}/public/asset-packs/${pack.id}/${characterId}/${encodeURIComponent(file)}`;
	const fallback = BUILTIN_ASSET_PACKS.find((p) => p.id === pack.fallback) ?? BUILTIN_ASSET_PACKS[0];
	return builtinUrl(fallback, characterId, skinId);
}
