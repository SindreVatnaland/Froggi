import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

export function registerAutomationReadTools(server: McpServer) {
	server.registerTool(
		'list_automations',
		{
			description: 'List both existing automations: controller button-combos that trigger an OBS action, and per-game-scene (menu/inGame/postGame/etc.) triggers. Check this before adding a new one to spot conflicts (e.g. a combo already bound, or a scene that already has a trigger).',
			inputSchema: {},
		},
		async () => {
			const commandStore = mcpContext.commandStore!;
			return text({
				controllerCombos: { enabled: commandStore.getControllerCommandsState(), combos: commandStore.getControllerCommandInputs() },
				sceneTriggers: commandStore.getSceneCommands(),
			});
		},
	);
}
