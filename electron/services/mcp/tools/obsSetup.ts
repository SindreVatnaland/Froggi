import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { ConnectionState } from '../../../../frontend/src/lib/models/enum';
import { enableObsWebsocket, getObsWebsocketConfig } from '../../../utils/obsProcess';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

/** searchForObs()/connectToObs() swallow their own errors and always resolve — poll real state instead of trusting the await. */
async function waitForConnected(timeoutMs = 8000): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (mcpContext.storeObs!.getConnectionState() === ConnectionState.Connected) return true;
		await new Promise((r) => setTimeout(r, 300));
	}
	return mcpContext.storeObs!.getConnectionState() === ConnectionState.Connected;
}

export function registerObsSetupTools(server: McpServer) {
	server.registerTool(
		'get_obs_status',
		{ description: 'Current OBS connection state, and whether OBS itself is running with its WebSocket server enabled (password never included).', inputSchema: {} },
		async () => {
			const connection = mcpContext.storeObs!.getConnection();
			const config = getObsWebsocketConfig();
			return text({
				connectionState: connection.state,
				scenes: connection.scenes,
				obsRunning: config !== undefined,
				obsWebsocketEnabled: config?.server_enabled ?? false,
				obsWebsocketPort: config?.server_port,
			});
		},
	);

	server.registerTool(
		'obs_enable_and_connect',
		{
			description: 'One-click OBS pairing: reads OBS\'s own config to find/enable its WebSocket server, then connects. This is the flow behind the "Configure OBS automatically" button — requires OBS to already be running.',
			inputSchema: {},
		},
		async () => {
			if (mcpContext.storeObs!.getConnectionState() === ConnectionState.Connected) return text({ ok: true, alreadyConnected: true });

			const config = getObsWebsocketConfig();
			if (!config) return error('OBS not found. Make sure OBS is running.');

			if (!config.server_enabled) {
				const enabled = enableObsWebsocket();
				if (!enabled) return error('Could not enable OBS\'s WebSocket server automatically — enable it in OBS → Tools → WebSocket Server Settings, then retry.');
			}

			mcpContext.storeObs!.setIpAddress('127.0.0.1');
			mcpContext.storeObs!.setPort(String(config.server_port ?? 4455));
			mcpContext.storeObs!.setPassword(config.auth_required ? (config.server_password ?? '') : '');
			await mcpContext.obsWebSocket!.searchForObs();

			const connected = await waitForConnected();
			return connected ? text({ ok: true }) : error('Enabled OBS\'s WebSocket server but could not connect — OBS may need a restart to pick up the change.');
		},
	);

	server.registerTool(
		'obs_manual_connect',
		{
			description: 'Connect to OBS with an explicit host/port/password, for when auto-detection fails (e.g. OBS on a different machine).',
			inputSchema: { ipAddress: z.string(), port: z.string(), password: z.string().optional() },
		},
		async ({ ipAddress, port, password }) => {
			await mcpContext.obsWebSocket!.connectToObs(ipAddress, port, password ?? '');
			const connected = await waitForConnected();
			return connected ? text({ ok: true }) : error(`Could not connect to OBS at ${ipAddress}:${port} — check the address, port, and password.`);
		},
	);

	server.registerTool(
		'obs_create_scene',
		{ description: 'Create a new, empty scene in OBS (e.g. a dedicated "Minigames" scene before adding overlay sources to it).', inputSchema: { sceneName: z.string() } },
		async ({ sceneName }) => {
			if (mcpContext.storeObs!.getConnectionState() !== ConnectionState.Connected) return error('Not connected to OBS — call obs_enable_and_connect or obs_manual_connect first.');
			try {
				await mcpContext.obsWebSocket!.executeCommand('CreateScene', { sceneName });
				return text({ ok: true });
			} catch (err) {
				return error(`Could not create scene "${sceneName}": ${err instanceof Error ? err.message : String(err)}`);
			}
		},
	);
}
