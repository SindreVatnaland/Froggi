import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { newId } from '../../../utils/functions';
import type { ControllerButtons } from '../../../../frontend/src/lib/models/types/controller';
import { commandSchema, toCommand } from './automationShared';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

const ALL_BUTTONS_FALSE: ControllerButtons = {
	isAPressed: false, isBPressed: false,
	isDPadLeftPressed: false, isDPadRightPressed: false, isDPadUpPressed: false, isDPadDownPressed: false,
	isLPressed: false, isRPressed: false, isStartPressed: false,
	isXPressed: false, isYPressed: false, isZPressed: false,
};

const buttonsSchema = z.object({
	isAPressed: z.boolean().optional(), isBPressed: z.boolean().optional(),
	isDPadLeftPressed: z.boolean().optional(), isDPadRightPressed: z.boolean().optional(),
	isDPadUpPressed: z.boolean().optional(), isDPadDownPressed: z.boolean().optional(),
	isLPressed: z.boolean().optional(), isRPressed: z.boolean().optional(), isStartPressed: z.boolean().optional(),
	isXPressed: z.boolean().optional(), isYPressed: z.boolean().optional(), isZPressed: z.boolean().optional(),
});

export function registerAutomationComboTools(server: McpServer) {
	server.registerTool(
		'add_controller_command',
		{
			description: 'Bind a physical controller button combo (e.g. L+R+Start) to an OBS action. Only set the buttons that must be held — check list_automations first to avoid rebinding an existing combo.',
			inputSchema: { buttons: buttonsSchema, command: commandSchema },
		},
		async ({ buttons, command }) => {
			mcpContext.commandStore!.addControllerCommand({
				id: newId(),
				inputs: { ...ALL_BUTTONS_FALSE, ...buttons },
				command: toCommand(command),
			});
			return text({ ok: true });
		},
	);

	server.registerTool(
		'delete_controller_command',
		{ description: 'Remove a controller combo binding by id (see list_automations for ids).', inputSchema: { commandId: z.string() } },
		async ({ commandId }) => {
			mcpContext.commandStore!.deleteControllerCommand(commandId);
			return text({ ok: true });
		},
	);

	server.registerTool(
		'toggle_controller_commands',
		{ description: 'Enable or disable controller-combo automation entirely (the bindings themselves are kept either way).', inputSchema: { enabled: z.boolean() } },
		async ({ enabled }) => {
			if (mcpContext.commandStore!.getControllerCommandsState() !== enabled) mcpContext.commandStore!.toggleControllerCommandsState();
			return text({ ok: true, enabled });
		},
	);
}
