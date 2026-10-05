import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import type { Server } from 'node:http';
import http from 'node:http';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { app, shell } from 'electron';
import { execFile, spawn } from 'node:child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { FroggiOAuthProvider } from './mcpOAuth';
import { scopedLog } from '../../utils/logger';
import { TypedEmitter } from '../../../frontend/src/lib/utils/customEventEmitter';
import { MessageHandler } from '../messageHandler';
import { ElectronFroggiStore } from '../store/storeFroggi';
import { ElectronOverlayStore } from '../store/storeOverlay';
import { SqliteOverlayHistory } from '../sqlite/sqliteOverlayHistory';
import { SqliteOrm } from '../sqlite/initiSqlite';
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
import { MCP_SERVER_PORT, MCP_SERVER_PATH } from '../../../frontend/src/lib/models/const';
import { NotificationType } from '../../../frontend/src/lib/models/enum';
import { mcpContext } from './mcpContext';
import { registerExplainTools } from './tools/explain';
import { registerDiagnosticsTools } from './tools/diagnostics';
import { registerOverlayReadTools } from './tools/overlayRead';
import { registerOverlaySchemaTools } from './tools/overlaySchema';
import { registerOverlayWriteTools } from './tools/overlayWrite';
import { registerOnlinePlayReadTools, registerOnlinePlayWriteTools } from './tools/onlinePlay';
import { BingoService } from '../bingoService';
import { IronManService } from '../ironmanService';
import { registerOverlayUndoTools } from './tools/overlayUndo';
import { registerObsSetupTools } from './tools/obsSetup';
import { registerObsAddSourceTools } from './tools/obsAddSource';
import { registerAutomationReadTools } from './tools/automationRead';
import { registerAutomationComboTools } from './tools/automationCombo';
import { registerAutomationSceneTriggerTools } from './tools/automationSceneTrigger';
import { registerInjectionWriteTools } from './tools/injectionWrite';
import { registerCrashDiagnosisReadTools, registerCrashDiagnosisWriteTools } from './tools/crashDiagnosis';

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
When the user refers to a game's look or HUD ("like Ultimate", "modernize the Melee HUD", "around the game HUD"), call get_game_hud_reference FIRST (list, then the matching game/HUD with the overlay's aspectRatio) and look at the screenshots — they show the layout (portrait, percent, name plate, stocks, timer, radar positions). Base your proposal on them instead of asking the user to describe positions or styles, and show the result with show_overlay_preview using that reference as background.
Users describe overlays in plain language — don't ask them technical questions (grid units, CSS, easing, layer indexes). Pick sensible defaults from the guide (standard placement, readable sizes, the game HUD reference), build it, show the preview, then offer to adjust in plain terms ("bigger?", "move it to the top?"). Only ask when a choice really changes the result (e.g. which game/HUD placement, which players to show).
Fonts: when the look matters (a themed or esports-style overlay), ask once if they have a font in mind — a Google Fonts name or link, a font file, or let you suggest 2–3 that fit — then add it with add_overlay_font. Animations: new overlays already use "fly automatic" for scene changes. For elements whose value changes during play (score, percent, stocks, rank, set count), ask the user once whether they'd like a short animation when the value updates (recommend a quick fade or small fly-in) and apply it via the element's animationTrigger if they agree.

Before suggesting how to DISPLAY an overlay, check what's actually available and make the user aware of the options:
- Call get_obs_status: if OBS is connected or connectable, offer to add the overlay as an OBS browser source (obs_enable_and_connect, then obs_add_overlay_browser_source).
- Call get_injection_status: on Windows you can ALSO inject overlays directly into the Dolphin game window — offer this (set_overlay_injection to toggle one, set_auto_inject to auto-inject on Dolphin connect). Overlay injection is WINDOWS-ONLY; on macOS/Linux only OBS is available, so don't offer injection there.
- When both are available, tell the user about both and which is possible right now.

When you build an overlay, show it: call show_overlay_preview right after creating it and again after meaningful changes, pinning the scene you're working on (statsScene, e.g. "inGame"). Clients that support MCP Apps render it inline as a live view of Froggi on this machine; otherwise give the user the returned editUrl (opens Froggi's editor in their browser, this machine only) and previewUrl as links. Only if the user wants a preview reachable from outside this machine, use get_overlay_preview_url's publicUrl (needs Tailscale Funnel or ngrok).

Early in a conversation (once, alongside your first Froggi call), run diagnose_errors. If unreportedDeveloperErrors is non-empty, briefly tell the user Froggi logged errors that look like bugs and offer to send a crash report to the developer (with their OK) — don't push if they decline; offer mark_errors "resolved" instead so it isn't raised again. Never re-suggest an error that already has a flag.

For simple in-app tasks, explain how to do it in Froggi first (where to click) so the user learns the app; only do it for them with a tool if they ask you to.

Playing minigames online: only the HOST needs ngrok; guests just need Froggi and the code. Use get_online_play_status and follow its nextStep: explain installing ngrok, signing in (authtoken — best pasted in Froggi Settings → Remote Access, not in chat) and starting the tunnel; run ngrok_setup only if they want you to. Then explain where the Share Code / join link is and how the friend enters it (howToShareAndJoin) — don't hand out or enter codes yourself. You can also help show the minigame on stream: OBS browser source (obs_add_overlay_browser_source with minigame, or the "Game Preview" URL on the Minigames page). Minigames can also go into a custom overlay via the BingoBoard (9000) and IronManRoster (9010) elements — that overlay can be injected into Dolphin (Windows).

When the user reports something broken, crashing, or not showing up, call diagnose_errors (it covers the last few sessions, including the one before a crash). Fix "local" issues with the user; ignore "benign" ones. If an error needs the developer, explain why and ASK whether to send a crash report — only call submit_crash_report after they say yes (it needs write access; if unavailable, point them to Settings → Feedback → Bug report).

Ask before destructive edits (deleting overlays/elements). delete_overlay only moves an overlay to Deleted Overlays (restore_overlay brings it back); you can never permanently delete anything. Keep changes reversible (undo/revert tools exist).`;

@singleton()
export class McpServerService {
	private httpServer: Server | null = null;
	private starting: Promise<void> | null = null;
	private readonly oauthProvider = new FroggiOAuthProvider();

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
		@inject(ElectronFroggiStore) private froggiStore: ElectronFroggiStore,
		@inject(ElectronOverlayStore) private overlayStore: ElectronOverlayStore,
		@inject(SqliteOverlayHistory) private overlayHistory: SqliteOverlayHistory,
		@inject(SqliteOrm) private sqliteOrm: SqliteOrm,
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
		@inject(delay(() => BingoService)) private bingoService: BingoService,
		@inject(delay(() => IronManService)) private ironmanService: IronManService,
	) {
		this.log = scopedLog(this.log, 'MCP');
		this.log.info('Initializing MCP Server Service');

		mcpContext.overlayStore = this.overlayStore;
		mcpContext.overlayHistory = this.overlayHistory;
		mcpContext.sqliteOrm = this.sqliteOrm;
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
		mcpContext.bingoService = this.bingoService;
		mcpContext.ironmanService = this.ironmanService;
		mcpContext.clientEmitter = this.clientEmitter;

		void this.applyDesiredState();
		this.clientEmitter.on('SetMcpReadEnabled', () => void this.applyDesiredState());
		this.clientEmitter.on('SetMcpWriteEnabled', () => void this.applyDesiredState());
		this.clientEmitter.on('InstallClaudeExtension', () => void this.installClaudeExtension());
	}

	/**
	 * Hand the bundled froggi.mcpb (packed by scripts/build-mcpb.mjs) to the OS. Claude Desktop owns the
	 * .mcpb file type, so opening it shows its one-click install dialog for the fully-local stdio
	 * extension. Copied to temp first — a file inside app.asar can't be opened by another app.
	 */
	private async installClaudeExtension() {
		const notify = (msg: string, type: NotificationType) => this.messageHandler.sendMessage('Notification', msg, type);
		try {
			const bundled = path.join(__dirname, '..', '..', 'froggi.mcpb');
			const target = path.join(app.getPath('temp'), 'Froggi.mcpb');
			fs.writeFileSync(target, fs.readFileSync(bundled));
			const err = await this.openWithClaude(target);
			if (err) {
				this.log.warn('Opening Froggi.mcpb failed:', err);
				shell.showItemInFolder(target);
				notify('Claude Desktop not found — install it, then double-click Froggi.mcpb', NotificationType.Danger);
				return;
			}
			notify('Opening Claude Desktop to install the Froggi extension', NotificationType.Info);
		} catch (err) {
			this.log.error('Failed to install Claude extension:', err);
			notify('Could not prepare the Claude Desktop extension — see logs', NotificationType.Danger);
		}
	}

	// Claude Desktop doesn't register itself as the default .mcpb handler (macOS or Windows), so a plain
	// open shows the "choose an app" dialog. Hand the file to Claude explicitly. Resolves '' on success.
	private async openWithClaude(file: string): Promise<string> {
		if (process.platform === 'darwin')
			return new Promise((resolve) => execFile('open', ['-a', 'Claude', file], (e) => resolve(e ? e.message : '')));
		if (process.platform !== 'win32') return shell.openPath(file);
		const local = process.env.LOCALAPPDATA ?? '';
		const candidates = [
			path.join(local, 'Microsoft', 'WindowsApps', 'Claude.exe'), // MSIX/Store install (app execution alias)
			path.join(local, 'AnthropicClaude', 'claude.exe'), // legacy Squirrel install
		]; // no existsSync: libuv can't stat app execution aliases, so just try spawning
		for (const exe of candidates) {
			const err = await new Promise<string>((resolve) => {
				const child = spawn(exe, [file], { detached: true, stdio: 'ignore' });
				child.once('spawn', () => { child.unref(); resolve(''); });
				child.once('error', (e) => resolve(e.message));
			});
			if (!err) return '';
			this.log.warn(`Launching ${exe} failed:`, err);
		}
		return 'Claude Desktop not found';
	}

	private buildMcpServer(): McpServer {
		const server = new McpServer(
			{ name: 'froggi', version: this.froggiStore.getFroggiConfig().version ?? '0.0.0' },
			{ instructions: MCP_INSTRUCTIONS },
		);

		if (this.froggiStore.getMcpReadEnabled()) {
			registerExplainTools(server);
			registerDiagnosticsTools(server);
			registerCrashDiagnosisReadTools(server);
			registerOverlayReadTools(server);
			registerOverlaySchemaTools(server);
			registerAutomationReadTools(server);
			registerOnlinePlayReadTools(server);
		}
		if (this.froggiStore.getMcpWriteEnabled()) {
			registerOverlayWriteTools(server);
			registerOverlayUndoTools(server);
			registerObsSetupTools(server);
			registerObsAddSourceTools(server);
			registerAutomationComboTools(server);
			registerAutomationSceneTriggerTools(server);
			registerInjectionWriteTools(server);
			registerCrashDiagnosisWriteTools(server);
			registerOnlinePlayWriteTools(server);
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

			// OAuth endpoints (metadata / dynamic client registration / authorize / token) so Claude
			// Desktop's "Add connector" UI, which mandates the MCP Authorization flow, can connect. The
			// provider auto-approves — loopback is the real boundary. Mounted at root; the MCP endpoint
			// below is deliberately left open so token-less clients (mcp-remote http-only, Claude Code
			// type:http) keep working. Issuer/resource use the loopback origin, so add the connector
			// with the http://127.0.0.1:3300/froggi/mcp URL (all these endpoints live on :3300).
			try {
				const base = `http://127.0.0.1:${MCP_SERVER_PORT}`;
				app.use(mcpAuthRouter({
					provider: this.oauthProvider,
					issuerUrl: new URL(base),
					resourceServerUrl: new URL(`${base}${MCP_SERVER_PATH}`),
					resourceName: 'Froggi',
				}));
			} catch (err) {
				this.log.error('Failed to mount MCP OAuth router:', err);
			}

			const handlePost = async (req: express.Request, res: express.Response) => {
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
			};
			const methodNotAllowed = (_req: express.Request, res: express.Response) => {
				res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
			};
			// Primary namespaced path + legacy "/mcp" alias so existing client configs keep working.
			for (const p of [MCP_SERVER_PATH, '/mcp']) {
				app.post(p, handlePost);
				app.get(p, methodNotAllowed);
				app.delete(p, methodNotAllowed);
			}

			await new Promise<void>((resolve, reject) => {
				const server = http.createServer(app);
				server.once('error', reject);
				server.listen(MCP_SERVER_PORT, '127.0.0.1', () => {
					server.off('error', reject);
					this.httpServer = server;
					this.log.info(`MCP server listening on http://127.0.0.1:${MCP_SERVER_PORT}${MCP_SERVER_PATH} (alias /mcp)`);
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
