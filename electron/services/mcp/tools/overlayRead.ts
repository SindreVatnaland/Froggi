import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import { BACKEND_PORT, COL } from '../../../../frontend/src/lib/models/const';
import { HUD_REFERENCES } from '../../../../frontend/src/lib/content/hudReferences';
import fs from 'fs';
import path from 'path';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene);

// Loopback origins only — the preview iframe and edit link never point at a LAN/remote address.
const LOOPBACK_ORIGINS = [`http://127.0.0.1:${BACKEND_PORT}`, `http://localhost:${BACKEND_PORT}`];
const PREVIEW_UI_URI = 'ui://froggi/overlay-preview';
const loopbackUrls = (overlayId: string, statsScene?: string, background?: string) => ({
	previewUrl: `${LOOPBACK_ORIGINS[0]}/obs/overlay/${overlayId}/preview?controls${statsScene ? `&scene=${statsScene}` : ''}${background ? `&bg=${background}` : ''}`,
	editUrl: `${LOOPBACK_ORIGINS[0]}/obs/overlay/${overlayId}?edit`,
});

// MCP App (ui:// resource) for clients that render MCP Apps (e.g. Claude Desktop): a sandboxed view
// that iframes the loopback preview page. Hand-rolled postMessage JSON-RPC — no SDK needed.
const PREVIEW_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:transparent;font:13px system-ui,sans-serif;color:#888}
#wrap{position:relative;width:100%;background:#111;border-radius:6px;overflow:hidden}
iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
#bar{display:flex;justify-content:space-between;align-items:center;padding:6px 2px}
a{color:#4ade80;cursor:pointer}
</style></head><body>
<div id="wrap"><iframe id="f" title="Froggi overlay preview"></iframe></div>
<div id="bar"><span id="t">Waiting for Froggi…</span><a id="e" hidden>Open in editor ↗</a></div>
<script>
let id = 0; const pending = {};
const send = (m) => window.parent.postMessage(m, '*');
const request = (method, params) => new Promise((res) => { const i = ++id; pending[i] = res; send({ jsonrpc: '2.0', id: i, method, params }); });
const size = () => send({ jsonrpc: '2.0', method: 'ui/notifications/size-changed', params: { width: document.body.scrollWidth, height: document.body.scrollHeight } });
function show(d) {
	if (!d || !d.previewUrl) return;
	const a = d.aspectRatio || { width: 16, height: 9 };
	document.getElementById('wrap').style.aspectRatio = a.width + '/' + a.height;
	document.getElementById('f').src = d.previewUrl;
	document.getElementById('t').textContent = (d.title || 'Overlay') + (d.statsScene ? ' · ' + d.statsScene : '');
	const e = document.getElementById('e'); e.hidden = false;
	e.onclick = () => request('ui/open-link', { url: d.editUrl }).catch(() => window.open(d.editUrl, '_blank'));
	setTimeout(size, 50);
}
window.addEventListener('message', (ev) => {
	const m = ev.data; if (!m || m.jsonrpc !== '2.0') return;
	if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; return; }
	if (m.method === 'ui/notifications/tool-result') show(m.params && m.params.structuredContent);
});
window.addEventListener('resize', size);
request('ui/initialize', { protocolVersion: '2025-06-18', appCapabilities: {}, appInfo: { name: 'froggi-overlay-preview', version: '1.0.0' } })
	.then(() => { send({ jsonrpc: '2.0', method: 'ui/notifications/initialized', params: {} }); size(); });
</script></body></html>`;

function summarizeOverlay(overlay: Record<string, unknown> & { id: string; title: string; isDemo: boolean; aspectRatio: unknown; deletedAt?: string | null }) {
	const scenes: Record<string, { layers: number; items: number; active: boolean; fallback?: string }> = {};
	for (const statsScene of STATS_SCENES) {
		const scene = overlay[statsScene] as { layers?: { items?: unknown[] }[]; active?: boolean; fallback?: string } | undefined;
		const layers = scene?.layers ?? [];
		scenes[statsScene] = {
			layers: layers.length,
			items: layers.reduce((sum, l) => sum + (l.items?.length ?? 0), 0),
			active: scene?.active ?? false,
			fallback: scene?.fallback,
		};
	}
	return { id: overlay.id, title: overlay.title, isDemo: overlay.isDemo, aspectRatio: overlay.aspectRatio, deletedAt: overlay.deletedAt ?? undefined, scenes };
}

export function registerOverlayReadTools(server: McpServer) {
	const uiMeta = { ui: { csp: { frameDomains: LOOPBACK_ORIGINS }, prefersBorder: false } };
	server.registerResource(
		'overlay_preview',
		PREVIEW_UI_URI,
		{ description: 'Live preview of a Froggi overlay (loopback iframe)', mimeType: 'text/html;profile=mcp-app', _meta: uiMeta },
		async () => ({ contents: [{ uri: PREVIEW_UI_URI, mimeType: 'text/html;profile=mcp-app', text: PREVIEW_HTML, _meta: uiMeta }] }),
	);

	server.registerTool(
		'get_game_hud_reference',
		{
			description: 'Reference screenshots of the GAME\'s own HUD (timer, stock icons, damage percent) with approximate positions on the overlay grid (512 columns × 288 rows). Use it two ways: (1) ADD to the game HUD — place extra elements (names, ranks, controller inputs, stats) in the free space around these regions without covering them; (2) REPLACE the game HUD — put custom stock/percent/timer elements exactly on these regions for a custom HUD. References are 16:9; pass aspectRatio (e.g. {width:4,height:3} or {width:73,height:60}) to get the center crop for a narrower overlay — regions are re-mapped to that overlay\'s grid and the screenshot is cropped. Without id: lists references.',
			inputSchema: {
				id: z.string().optional(),
				aspectRatio: z.object({ width: z.number().positive(), height: z.number().positive() }).optional().describe('Target overlay aspect ratio; must be equal to or narrower than the reference'),
			},
		},
		async ({ id, aspectRatio }) => {
			if (!id) return text(HUD_REFERENCES.map(({ id, title, game, aspectRatio }) => ({ id, title, game, aspectRatio })));
			const ref = HUD_REFERENCES.find((r) => r.id === id);
			if (!ref) return error(`No HUD reference "${id}" — call without id to list them.`);
			const { image, regions, ...info } = ref;

			// Narrower targets are a centered crop of the reference (full height kept).
			const keep = aspectRatio ? aspectRatio.width / aspectRatio.height / (ref.aspectRatio.width / ref.aspectRatio.height) : 1;
			if (keep > 1.0001) return error(`Target ${aspectRatio!.width}:${aspectRatio!.height} is wider than the ${ref.aspectRatio.width}:${ref.aspectRatio.height} reference — only center crops of narrower ratios are supported.`);
			const offset = ((1 - keep) / 2) * 512;
			const mapped = regions.map((r) => {
				const x = Math.round((r.x - offset) / keep);
				const w = Math.round(r.w / keep);
				return { ...r, x, w, ...(x < 0 || x + w > 512 ? { outsideCrop: x + w <= 0 || x >= 512 ? 'fully' : 'partly' } : {}) };
			});

			// Built frontend (build/image/…) in production; frontend/static in dev before a build.
			const root = path.join(__dirname, '../../../../..'); // build_electron/electron/services/mcp/tools → app root
			const file = [path.join(root, 'build/image/hud-references', image), path.join(root, 'frontend/static/image/hud-references', image)].find((f) => fs.existsSync(f));
			const content: ({ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string })[] = [
				{
					type: 'text',
					text: JSON.stringify({
						...info,
						overlayAspectRatio: aspectRatio ?? ref.aspectRatio,
						grid: '512 columns × 288 rows on the overlay (any aspect ratio); x/y top-left, w/h size; approximate',
						regions: mapped,
					}, null, 2),
				},
			];
			if (file) {
				const { nativeImage } = await import('electron');
				let img = nativeImage.createFromPath(file);
				if (keep < 1) {
					const { width, height } = img.getSize();
					const cropW = Math.round(width * keep);
					img = img.crop({ x: Math.round((width - cropW) / 2), y: 0, width: cropW, height });
				}
				content.push({ type: 'image', data: img.toJPEG(85).toString('base64'), mimeType: 'image/jpeg' });
			} else {
				content.push({ type: 'text', text: '(Screenshot not bundled in this build — use the description and regions.)' });
			}
			return { content };
		},
	);

	server.registerTool(
		'test_overlay_animation',
		{
			description: 'Replay element animations in every open preview of an overlay (the show_overlay_preview view, or a preview page in a browser) — like the editor\'s "Test animation" button, but for the user\'s preview. Plays each element\'s animation-trigger out→in and, for elements with visibility animations, hides then shows them. Pass itemId to animate one element (ids from list_elements), or omit for all. Use it after adding animations so the user can see them; the preview also has a "▶ Test animations" button.',
			inputSchema: { overlayId: z.string(), itemId: z.string().optional() },
		},
		async ({ overlayId, itemId }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);
			mcpContext.messageHandler!.sendMessage('PreviewTestAnimation', overlayId, itemId);
			return text(`Replaying ${itemId ? `element ${itemId}` : 'all element'} animations in open previews of "${overlay.title}". If the user has no preview open, call show_overlay_preview first.`);
		},
	);

	server.registerTool(
		'show_overlay_preview',
		{
			description: 'Show a live preview of an overlay inside the chat (clients that support MCP Apps render it as an embedded view of Froggi on this machine). Call it after creating an overlay and again after meaningful changes so the user sees what you built. Pass statsScene to pin the scene you are working on (e.g. "inGame") — otherwise it follows the live game state, which shows the waiting/menu scene while Dolphin is idle. If the client cannot render the view, give the user editUrl (opens Froggi\'s editor in a browser on this machine) and previewUrl as links. Both are loopback-only. For in-game scenes pass background = a get_game_hud_reference id (matching the user\'s game/HUD; "melee-16x9-no-hud" when the overlay replaces the game HUD) so the overlay is shown over a real game screenshot — narrower overlays get the center crop automatically.',
			inputSchema: {
				overlayId: z.string(),
				statsScene: z.enum(STATS_SCENES as [string, ...string[]]).optional(),
				background: z.string().optional().describe('HUD reference id to draw behind the overlay'),
			},
			_meta: { ui: { resourceUri: PREVIEW_UI_URI } },
		},
		async ({ overlayId, statsScene, background }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);
			if (background && !HUD_REFERENCES.some((r) => r.id === background)) return error(`Unknown background "${background}" — use an id from get_game_hud_reference.`);
			const data = { overlayId, title: overlay.title, statsScene, aspectRatio: overlay.aspectRatio, ...loopbackUrls(overlayId, statsScene, background) };
			return {
				content: [{ type: 'text' as const, text: `Preview of "${overlay.title}"${statsScene ? ` (${statsScene})` : ''}: ${data.previewUrl}\nEdit in browser: ${data.editUrl}` }],
				structuredContent: data,
			};
		},
	);

	server.registerTool(
		'list_overlays',
		{
			description: 'List overlays with per-scene layer/item counts. Deleted overlays are hidden unless includeDeleted:true (they carry deletedAt; restore with restore_overlay). Use get_overlay for full detail on one.',
			inputSchema: { includeDeleted: z.boolean().optional() },
		},
		async ({ includeDeleted }) => {
			const overlays = await mcpContext.overlayStore!.getOverlays();
			return text(Object.values(overlays).filter((o) => includeDeleted || !o.deletedAt).map((o) => summarizeOverlay(o as never)));
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

	server.registerTool(
		'get_overlay_preview_url',
		{
			description: 'The URL(s) that render a custom overlay live (the same page OBS loads as a browser source). Returns the local URL, and a public URL when a tunnel is up. The overlay is a square 1:1 page that shows the current game state; with Dolphin idle it shows idle/empty art. Use the local URL for an OBS browser source or a browser on this machine; the public URL (ngrok, or Tailscale only if Funnel is on) is the one an external viewer or an in-chat iframe could load — a tailnet-only Tailscale URL and a localhost URL are NOT reachable from outside this machine.',
			inputSchema: { overlayId: z.string() },
		},
		async ({ overlayId }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);
			const route = `/obs/overlay/${overlay.id}`;
			const local = mcpContext.storeSettings!.getLocalUrl();
			const ts = mcpContext.messageHandler!.getTailscaleStatus?.();
			const ngrok = mcpContext.ngrokService!.getStatus?.().url ?? mcpContext.messageHandler!.getNgrokUrl?.();
			// Tailscale Funnel serves the app/overlay port (BACKEND_PORT) publicly over real HTTPS with
			// no interstitial — the preferred embed source. Tailnet-only serve does NOT map this port.
			const tailscaleFunnelUrl = ts?.funnelActive ? mcpContext.messageHandler!.getTailscaleUrl?.() : undefined;
			const ngrokUrl = ngrok ? `${ngrok}${route}` : undefined;
			const tsUrl = tailscaleFunnelUrl ? `${tailscaleFunnelUrl}${route}` : undefined;
			return text({
				overlayId: overlay.id,
				title: overlay.title,
				aspectRatio: overlay.aspectRatio,
				aspectRatioCss: overlay.aspectRatio ? `${overlay.aspectRatio.width}/${overlay.aspectRatio.height}` : '16/9',
				localUrl: `${local.local}${route}`,
				editUrl: loopbackUrls(overlay.id).editUrl,
				localNetworkUrl: `${local.external}${route}`,
				// Prefer Tailscale Funnel for embedding: HTTPS, no warning page. ngrok works but its
				// free-tier interstitial can't be clicked through inside an iframe.
				publicUrl: tsUrl ?? ngrokUrl,
				tailscaleFunnelUrl: tsUrl,
				ngrokUrl,
				tailscaleFunnelActive: ts?.funnelActive ?? false,
				note: tsUrl
					? 'publicUrl is the Tailscale Funnel URL — HTTPS, no interstitial, best for an in-chat iframe.'
					: ngrokUrl
						? 'Only ngrok is public. It works but its free-tier browser-warning page blocks iframe embeds (you cannot click through inside the chat). Enable Tailscale Funnel (Settings → Remote Access) for a clean, interstitial-free HTTPS URL.'
						: 'No public tunnel is up. Enable Tailscale Funnel (recommended, Settings → Remote Access) or ngrok. Tailnet-only Tailscale serve does NOT expose the overlay port. Otherwise open localUrl on this machine or add it to OBS.',
			});
		},
	);
}
