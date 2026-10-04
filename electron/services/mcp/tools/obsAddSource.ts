import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { ConnectionState } from '../../../../frontend/src/lib/models/enum';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

// The stream view for BOTH minigames is /obs/game-preview (it shows whichever game is active) —
// /obs/bingo and /obs/ironman are the host/settings pages, not stream views. 800×1100 like the
// "Game Preview" row on the Minigames page.
const MINIGAME_VIEW = { path: '/obs/game-preview', title: 'Froggi Minigame', aspectRatio: { width: 8, height: 11 } };

export function registerObsAddSourceTools(server: McpServer) {
	server.registerTool(
		'obs_add_overlay_browser_source',
		{
			description: 'Add a Froggi overlay, or the minigame view (Bingo / Iron Man board, progress and win screen — one view that follows whichever game is active), into OBS as a browser source, sized to match. Requires an active OBS connection (see get_obs_status / obs_enable_and_connect). Users can also do this themselves: the Minigames page shows the "Game Preview" URL to add as a browser source (800×1100).',
			inputSchema: {
				overlayId: z.string().optional().describe('An existing custom overlay id (see list_overlays) — omit if using minigame instead'),
				minigame: z.enum(['bingo', 'ironman']).optional().describe('Add the minigame view instead of a custom overlay (same view for both games)'),
			},
		},
		async ({ overlayId, minigame }) => {
			if (mcpContext.storeObs!.getConnectionState() !== ConnectionState.Connected) {
				return error('Not connected to OBS — call obs_enable_and_connect or obs_manual_connect first.');
			}
			if (!overlayId && !minigame) return error('Provide either overlayId or minigame.');

			const base = mcpContext.storeSettings!.getLocalUrl().local;

			if (minigame) {
				await mcpContext.obsWebSocket!.addBrowserSource(`${base}${MINIGAME_VIEW.path}`, MINIGAME_VIEW.title, MINIGAME_VIEW.aspectRatio);
				return text({ ok: true, added: MINIGAME_VIEW.title, url: `${base}${MINIGAME_VIEW.path}` });
			}

			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId!);
			if (!overlay) return error(`No overlay with id "${overlayId}"`);

			await mcpContext.obsWebSocket!.addBrowserSource(`${base}/obs/overlay/${overlay.id}`, overlay.title, overlay.aspectRatio);
			return text({ ok: true, added: overlay.title });
		},
	);
}
