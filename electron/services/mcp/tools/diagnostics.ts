import { z } from 'zod';
import { obsStatus } from '../../../../frontend/src/lib/utils/obsStatus';
import { isObsRunning } from '../../../utils/obsProcess';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

export function registerDiagnosticsTools(server: McpServer) {
	server.registerTool(
		'get_app_status',
		{ description: 'Snapshot of Froggi\'s current state: Dolphin/OBS connection, game state, injected overlays, ngrok/Tailscale remote access, whether a host password is set (hostPasswordSet — remote devices can only control Froggi with it), and what screen the user is on.', inputSchema: {} },
		async () => {
			return text({
				dolphinConnection: mcpContext.storeDolphin!.getDolphinConnectionState(),
				obsConnection: mcpContext.storeObs!.getConnectionState(),
				// connected / connecting / openNotConnected / closed (set up before) / notSetUp (never connected)
				obsStatus: obsStatus(mcpContext.storeObs!.getConnection(), await isObsRunning()),
				gameState: mcpContext.storeLiveStats!.getGameState(),
				statsScene: mcpContext.storeLiveStats!.getStatsScene(),
				// Scenes change only through flows — false = no enabled flow switches scenes (Restore default on the Flows page)
				sceneSwitchingFlowEnabled: mcpContext.flowService!.getFlows().some((f) => f.enabled && f.nodes.some((n) => n.kind === 'action' && n.data.type === 'setScene')),
				injectedOverlayIds: mcpContext.overlayInjector!.injectedOverlayIds,
				ngrok: mcpContext.ngrokService!.getStatus(),
				tailscale: mcpContext.messageHandler!.getTailscaleStatus(),
				// Whether remote devices can control Froggi at all (never the password itself). See explain_topic host-password.
				hostPasswordSet: Boolean(mcpContext.storeSettings!.getAuthorizationKey()),
				currentScreen: mcpContext.routeStore!.getCurrentRoute(),
			});
		},
	);

	server.registerTool(
		'read_recent_logs',
		{
			description:
				"Froggi's log (scrubbed of personal data — same as crash reports), newest last. Filter instead of reading everything: search (case-insensitive text or /regex/, e.g. \"Dolphin\" → was Dolphin found / CONNECTED, \"Flows\" → flow runs, \"OBS\", \"Slippi\", \"replay\"), level (error / warn = warnings and errors), and sessions (1 = since Froggi last started, up to 5 to look at earlier runs — each run starts with a \"Starting app\" line). Returns the last `lines` matching lines. For grouped, classified errors use diagnose_errors.",
			inputSchema: {
				search: z.string().optional(),
				level: z.enum(['all', 'warn', 'error']).default('all'),
				sessions: z.number().int().min(1).max(5).default(1),
				lines: z.number().int().min(1).max(1000).default(200),
			},
		},
		async ({ search, level, sessions, lines }) => {
			const log = mcpContext.errorReporter!.readLogSessions(sessions);
			if (!log) return text('No logs available.');
			const re = search?.match(/^\/(.+)\/([a-z]*)$/);
			let test: (line: string) => boolean = () => true;
			if (search) {
				try {
					const rx = re ? new RegExp(re[1], re[2].includes('i') ? re[2] : `${re[2]}i`) : null;
					const needle = search.toLowerCase();
					test = rx ? (l) => rx.test(l) : (l) => l.toLowerCase().includes(needle);
				} catch {
					return text(`Invalid regex: ${search}`);
				}
			}
			const levels = level === 'error' ? /\[error\]/ : level === 'warn' ? /\[(warn|error)\]/ : null;
			const all = log.split('\n');
			const matching = all.filter((l) => l.trim() && (!levels || levels.test(l)) && test(l));
			const shown = matching.slice(-lines);
			return text(
				shown.length
					? `${shown.length} of ${matching.length} matching lines (${all.length} lines in ${sessions} session${sessions > 1 ? 's' : ''}):\n${shown.join('\n')}`
					: 'No matching log lines.',
			);
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
