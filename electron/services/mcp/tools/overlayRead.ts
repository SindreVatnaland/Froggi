import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import { BACKEND_PORT, COL } from '../../../../frontend/src/lib/models/const';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const STATS_SCENES = Object.values(LiveStatsScene);

// Loopback origins only — the preview iframe and edit link never point at a LAN/remote address.
const LOOPBACK_ORIGINS = [`http://127.0.0.1:${BACKEND_PORT}`, `http://localhost:${BACKEND_PORT}`];
const PREVIEW_UI_URI = 'ui://froggi/overlay-preview';
const loopbackUrls = (overlayId: string, statsScene?: string) => ({
	previewUrl: `${LOOPBACK_ORIGINS[0]}/obs/overlay/${overlayId}/preview${statsScene ? `?scene=${statsScene}` : ''}`,
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
		'show_overlay_preview',
		{
			description: 'Show a live preview of an overlay inside the chat (clients that support MCP Apps render it as an embedded view of Froggi on this machine). Call it after creating an overlay and again after meaningful changes so the user sees what you built. Pass statsScene to pin the scene you are working on (e.g. "inGame") — otherwise it follows the live game state, which shows the waiting/menu scene while Dolphin is idle. If the client cannot render the view, give the user editUrl (opens Froggi\'s editor in a browser on this machine) and previewUrl as links. Both are loopback-only.',
			inputSchema: { overlayId: z.string(), statsScene: z.enum(STATS_SCENES as [string, ...string[]]).optional() },
			_meta: { ui: { resourceUri: PREVIEW_UI_URI } },
		},
		async ({ overlayId, statsScene }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);
			const data = { overlayId, title: overlay.title, statsScene, aspectRatio: overlay.aspectRatio, ...loopbackUrls(overlayId, statsScene) };
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
