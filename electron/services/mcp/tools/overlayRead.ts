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
