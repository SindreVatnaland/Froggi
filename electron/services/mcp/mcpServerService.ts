import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import type { Server } from 'node:http';
import http from 'node:http';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { scopedLog } from '../../utils/logger';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from '../messageHandler';
import { ElectronFroggiStore } from '../store/storeFroggi';
import { ElectronOverlayStore } from '../store/storeOverlay';
import { SqliteOverlayHistory } from '../sqlite/sqliteOverlayHistory';
import { ObsWebSocket } from '../obs';
import { ElectronObsStore } from '../store/storeObs';
import { ElectronCommandStore } from '../store/storeCommands';
import { ElectronSettingsStore } from '../store/storeSettings';
import { ElectronLiveStatsStore } from '../store/storeLiveStats';
import { ElectronDolphinStore } from '../store/storeDolphin';
import { ElectronRouteStore } from '../store/storeRoute';
import { NgrokService } from '../ngrokService';
import { OverlayInjector } from '../injectOverlay';
import { ErrorReporter } from '../errorReporter';
import { MCP_SERVER_PORT } from '../../../frontend/src/lib/models/const';
import { mcpContext } from './mcpContext';
import { registerExplainTools } from './tools/explain';
import { registerDiagnosticsTools } from './tools/diagnostics';
import { registerOverlayReadTools } from './tools/overlayRead';
import { registerOverlaySchemaTools } from './tools/overlaySchema';
import { registerOverlayWriteTools } from './tools/overlayWrite';
import { registerOverlayUndoTools } from './tools/overlayUndo';
import { registerObsSetupTools } from './tools/obsSetup';
import { registerObsAddSourceTools } from './tools/obsAddSource';
import { registerAutomationReadTools } from './tools/automationRead';
import { registerAutomationComboTools } from './tools/automationCombo';
import { registerAutomationSceneTriggerTools } from './tools/automationSceneTrigger';
import { registerInjectionWriteTools } from './tools/injectionWrite';

/**
 * Embeds an MCP server inside Electron main so a local MCP client (Claude Desktop/Code)
 * can explain setup, diagnose problems, and — if the user allows it — edit overlays and
 * OBS automation. Bound to 127.0.0.1 only, never exposed over Tailscale/ngrok. Stateless
 * StreamableHTTP: a fresh McpServer + transport is built per request (SDK requirement),
 * which also means the registered tool set is recomputed from live settings on every
 * call — toggling mcpReadEnabled/mcpWriteEnabled takes effect on the very next request.
 */
const MCP_INSTRUCTIONS = `You are connected to a running Froggi instance — a Slippi (Melee) → OBS overlay app. Be proactively helpful.

When you build or edit an overlay, first read the overlay authoring guide tool, and prefer the shipped demo overlays as references (list_overlays / get_overlay).

Before suggesting how to DISPLAY an overlay, check what's actually available and make the user aware of the options:
- Call get_obs_status: if OBS is connected or connectable, offer to add the overlay as an OBS browser source (obs_enable_and_connect, then obs_add_overlay_browser_source).
- Call get_injection_status: on Windows you can ALSO inject overlays directly into the Dolphin game window — offer this (set_overlay_injection to toggle one, set_auto_inject to auto-inject on Dolphin connect). Overlay injection is WINDOWS-ONLY; on macOS/Linux only OBS is available, so don't offer injection there.
- When both are available, tell the user about both and which is possible right now.

Ask before destructive edits (deleting overlays/elements). Keep changes reversible (undo/revert tools exist).`;

@singleton()
export class McpServerService {
	private httpServer: Server | null = null;
	private starting: Promise<void> | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(ElectronFroggiStore) private froggiStore: ElectronFroggiStore,
		@inject(ElectronOverlayStore) private overlayStore: ElectronOverlayStore,
		@inject(SqliteOverlayHistory) private overlayHistory: SqliteOverlayHistory,
		@inject(ObsWebSocket) private obsWebSocket: ObsWebSocket,
		@inject(ElectronObsStore) private storeObs: ElectronObsStore,
		@inject(ElectronCommandStore) private commandStore: ElectronCommandStore,
		@inject(ElectronSettingsStore) private storeSettings: ElectronSettingsStore,
		@inject(ElectronLiveStatsStore) private storeLiveStats: ElectronLiveStatsStore,
		@inject(ElectronDolphinStore) private storeDolphin: ElectronDolphinStore,
		@inject(ElectronRouteStore) private routeStore: ElectronRouteStore,
		@inject(NgrokService) private ngrokService: NgrokService,
		@inject(OverlayInjector) private overlayInjector: OverlayInjector,
		@inject(ErrorReporter) private errorReporter: ErrorReporter,
	) {
		this.log = scopedLog(this.log, 'MCP');
		this.log.info('Initializing MCP Server Service');

		mcpContext.overlayStore = this.overlayStore;
		mcpContext.overlayHistory = this.overlayHistory;
		mcpContext.obsWebSocket = this.obsWebSocket;
		mcpContext.storeObs = this.storeObs;
		mcpContext.commandStore = this.commandStore;
		mcpContext.storeSettings = this.storeSettings;
		mcpContext.storeLiveStats = this.storeLiveStats;
		mcpContext.storeDolphin = this.storeDolphin;
		mcpContext.routeStore = this.routeStore;
		mcpContext.froggiStore = this.froggiStore;
		mcpContext.messageHandler = this.messageHandler;
		mcpContext.ngrokService = this.ngrokService;
		mcpContext.overlayInjector = this.overlayInjector;
		mcpContext.errorReporter = this.errorReporter;

		void this.applyDesiredState();
		this.clientEmitter.on('SetMcpReadEnabled', () => void this.applyDesiredState());
		this.clientEmitter.on('SetMcpWriteEnabled', () => void this.applyDesiredState());
	}

	private buildMcpServer(): McpServer {
		const server = new McpServer(
			{ name: 'froggi', version: this.froggiStore.getFroggiConfig().version ?? '0.0.0' },
			{ instructions: MCP_INSTRUCTIONS },
		);

		if (this.froggiStore.getMcpReadEnabled()) {
			registerExplainTools(server);
			registerDiagnosticsTools(server);
			registerOverlayReadTools(server);
			registerOverlaySchemaTools(server);
			registerAutomationReadTools(server);
		}
		if (this.froggiStore.getMcpWriteEnabled()) {
			registerOverlayWriteTools(server);
			registerOverlayUndoTools(server);
			registerObsSetupTools(server);
			registerObsAddSourceTools(server);
			registerAutomationComboTools(server);
			registerAutomationSceneTriggerTools(server);
			registerInjectionWriteTools(server);
		}

		return server;
	}

	private async applyDesiredState() {
		const desired = this.froggiStore.getMcpReadEnabled() || this.froggiStore.getMcpWriteEnabled();
		if (desired && !this.httpServer) await this.start();
		if (!desired && this.httpServer) await this.stop();
		// Reconcile the optional tailnet HTTPS exposure whenever read/write toggles change.
		this.messageHandler.applyMcpTailscaleServe();
	}

	private async start() {
		if (this.starting) return this.starting;
		this.starting = (async () => {
			const app = express();
			app.use(express.json());

			app.post('/mcp', async (req, res) => {
				try {
					const server = this.buildMcpServer();
					const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
					res.on('close', () => {
						void transport.close();
						void server.close();
					});
					await server.connect(transport);
					await transport.handleRequest(req, res, req.body);
				} catch (err) {
					this.log.error('Error handling MCP request:', err);
					if (!res.headersSent) {
						res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null });
					}
				}
			});
			const methodNotAllowed = (_req: express.Request, res: express.Response) => {
				res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
			};
			app.get('/mcp', methodNotAllowed);
			app.delete('/mcp', methodNotAllowed);

			await new Promise<void>((resolve, reject) => {
				const server = http.createServer(app);
				server.once('error', reject);
				server.listen(MCP_SERVER_PORT, '127.0.0.1', () => {
					server.off('error', reject);
					this.httpServer = server;
					this.log.info(`MCP server listening on http://127.0.0.1:${MCP_SERVER_PORT}/mcp`);
					resolve();
				});
			});
		})();
		try {
			await this.starting;
		} catch (err) {
			this.log.error('Failed to start MCP server:', err);
			this.httpServer = null;
		} finally {
			this.starting = null;
		}
	}

	private async stop() {
		const server = this.httpServer;
		if (!server) return;
		this.httpServer = null;
		await new Promise<void>((resolve) => server.close(() => resolve()));
		this.log.info('MCP server stopped');
	}
}
