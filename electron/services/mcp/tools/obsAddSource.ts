import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { ConnectionState } from '../../../../frontend/src/lib/models/enum';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const MINIGAME_VIEWS = {
	bingo: { path: '/obs/bingo', title: 'Froggi Bingo' },
	ironman: { path: '/obs/ironman', title: 'Froggi Iron Man' },
} as const;

export function registerObsAddSourceTools(server: McpServer) {
	server.registerTool(
		'obs_add_overlay_browser_source',
		{
			description: 'Add a Froggi overlay (or a minigame view — Bingo/Iron Man) into OBS as a browser source, sized to match. Requires an active OBS connection (see get_obs_status / obs_enable_and_connect).',
			inputSchema: {
				overlayId: z.string().optional().describe('An existing custom overlay id (see list_overlays) — omit if using minigame instead'),
				minigame: z.enum(['bingo', 'ironman']).optional().describe('Add a minigame view instead of a custom overlay'),
			},
		},
		async ({ overlayId, minigame }) => {
			if (mcpContext.storeObs!.getConnectionState() !== ConnectionState.Connected) {
				return error('Not connected to OBS — call obs_enable_and_connect or obs_manual_connect first.');
			}
			if (!overlayId && !minigame) return error('Provide either overlayId or minigame.');

			const base = mcpContext.storeSettings!.getLocalUrl().local;

			if (minigame) {
				const view = MINIGAME_VIEWS[minigame];
				await mcpContext.obsWebSocket!.addBrowserSource(`${base}${view.path}`, view.title, { width: 1, height: 1 });
				return text({ ok: true, added: view.title });
			}

			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId!);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);

			await mcpContext.obsWebSocket!.addBrowserSource(`${base}/obs/overlay/${overlay.id}`, overlay.title, overlay.aspectRatio);
			return text({ ok: true, added: overlay.title });
		},
	);
}
