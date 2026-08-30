import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

export function registerDiagnosticsTools(server: McpServer) {
	server.registerTool(
		'get_app_status',
		{ description: 'Snapshot of Froggi\'s current state: Dolphin/OBS connection, game state, injected overlays, ngrok/Tailscale remote access, and what screen the user is on.', inputSchema: {} },
		async () => {
			return text({
				dolphinConnection: mcpContext.storeDolphin!.getDolphinConnectionState(),
				obsConnection: mcpContext.storeObs!.getConnectionState(),
				gameState: mcpContext.storeLiveStats!.getGameState(),
				statsScene: mcpContext.storeLiveStats!.getStatsScene(),
				injectedOverlayIds: mcpContext.overlayInjector!.injectedOverlayIds,
				ngrok: mcpContext.ngrokService!.getStatus(),
				tailscale: mcpContext.messageHandler!.getTailscaleStatus(),
				currentScreen: mcpContext.routeStore!.getCurrentRoute(),
			});
		},
	);

	server.registerTool(
		'read_recent_logs',
		{ description: 'Recent log lines for the current app session (scrubbed of personal data — same as what crash reports send).', inputSchema: {} },
		async () => {
			const tail = mcpContext.errorReporter!.readLogTail();
			return text(tail || 'No logs available for this session.');
		},
	);

	server.registerTool(
		'get_injection_status',
		{ description: 'Overlay-injection state: whether injection is supported (Windows only), if Dolphin is connected, whether auto-inject-on-connect is enabled, the overlays currently injected, and the persisted set toggled to auto-inject.', inputSchema: {} },
		async () => text({
			supported: process.platform === 'win32',
			platform: process.platform,
			dolphinConnected: mcpContext.storeDolphin!.getDolphinConnectionState(),
			autoInjectEnabled: mcpContext.froggiStore!.getAutoInjectEnabled(),
			injectedOverlayIds: mcpContext.overlayInjector!.injectedOverlayIds,
			autoInjectOverlayIds: mcpContext.froggiStore!.getAutoInjectOverlayIds(),
		}),
	);

	server.registerTool(
		'get_sqlite_debug',
		{ description: 'SQLite host health for debugging crashes: mode (utilityProcess vs in-process), whether the host is alive, restart/crash counts, the last exit (code + time), pending call count, and the last ~40 DB ops (kind/entity/method). The last op before an exit is the prime suspect for a native abort. Pair with read_recent_logs to see [dbHost stderr] lines.', inputSchema: {} },
		async () => text(mcpContext.sqliteOrm!.getDebugInfo()),
	);

	server.registerTool(
		'get_current_screen',
		{ description: 'The route/page currently shown in the Froggi desktop window — use this to know what the user is looking at before assuming which overlay they mean.', inputSchema: {} },
		async () => text({ route: mcpContext.routeStore!.getCurrentRoute() }),
	);
}
