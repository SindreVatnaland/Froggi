import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

export function registerInjectionWriteTools(server: McpServer) {
	server.registerTool(
		'set_auto_inject',
		{
			description: 'Enable/disable auto-injecting the toggled overlay set into Dolphin whenever it connects. This is the same setting as Settings → Overlay Injection → Auto-inject on connect.',
			inputSchema: { enabled: z.boolean() },
		},
		async ({ enabled }) => {
			mcpContext.froggiStore!.setAutoInjectEnabled(enabled);
			return text({ ok: true, autoInjectEnabled: enabled });
		},
	);

	server.registerTool(
		'set_overlay_injection',
		{
			description: 'Toggle a specific overlay in the inject set. enabled:true adds it (and injects now if Dolphin is connected on Windows); enabled:false removes it (and closes it if injected). Overlays in the set auto-inject on Dolphin connect when auto-inject is on. Injection itself is Windows-only, but the toggle persists on any OS.',
			inputSchema: { overlayId: z.string(), enabled: z.boolean() },
		},
		async ({ overlayId, enabled }) => {
			const overlay = await mcpContext.overlayStore!.getOverlayById(overlayId);
			if (!overlay) return text(`No overlay with id "${overlayId}"`);
			const autoInjectOverlayIds = await mcpContext.overlayInjector!.setOverlayInjection(overlayId, enabled);
			return text({ ok: true, overlayId, enabled, autoInjectOverlayIds });
		},
	);
}
