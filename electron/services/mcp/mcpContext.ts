import type { ElectronOverlayStore } from '../store/storeOverlay';
import type { SqliteOverlayHistory } from '../sqlite/sqliteOverlayHistory';
import type { SqliteOrm } from '../sqlite/initiSqlite';
import type { ObsWebSocket } from '../obs';
import type { ElectronObsStore } from '../store/storeObs';
import type { ElectronCommandStore } from '../store/storeCommands';
import type { ElectronSettingsStore } from '../store/storeSettings';
import type { ElectronLiveStatsStore } from '../store/storeLiveStats';
import type { ElectronDolphinStore } from '../store/storeDolphin';
import type { ElectronRouteStore } from '../store/storeRoute';
import type { ElectronFroggiStore } from '../store/storeFroggi';
import type { MessageHandler } from '../messageHandler';
import type { NgrokService } from '../ngrokService';
import type { OverlayInjector } from '../injectOverlay';
import type { ErrorReporter } from '../errorReporter';

/**
 * Module-level holder for resolved singletons, populated once by McpServerService's
 * constructor. Tool handlers read from this at call time rather than capturing DI
 * references directly — the MCP SDK rebuilds the McpServer (and re-runs tool
 * registration) fresh on every request, so reading live state here (instead of a
 * snapshot taken at registration time) is what makes settings/route/data changes
 * visible on the very next call with no extra plumbing.
 */
export const mcpContext: {
	overlayStore?: ElectronOverlayStore;
	overlayHistory?: SqliteOverlayHistory;
	sqliteOrm?: SqliteOrm;
	obsWebSocket?: ObsWebSocket;
	storeObs?: ElectronObsStore;
	commandStore?: ElectronCommandStore;
	storeSettings?: ElectronSettingsStore;
	storeLiveStats?: ElectronLiveStatsStore;
	storeDolphin?: ElectronDolphinStore;
	routeStore?: ElectronRouteStore;
	froggiStore?: ElectronFroggiStore;
	messageHandler?: MessageHandler;
	ngrokService?: NgrokService;
	overlayInjector?: OverlayInjector;
	errorReporter?: ErrorReporter;
} = {};
