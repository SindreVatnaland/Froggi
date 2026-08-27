import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { LiveStatsScene } from '../../../../frontend/src/lib/models/enum';
import { commandSchema, toCommand } from './automationShared';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

const STATS_SCENES = Object.values(LiveStatsScene);

export function registerAutomationSceneTriggerTools(server: McpServer) {
	server.registerTool(
		'add_scene_command',
		{
			description: 'Run an OBS action automatically whenever Froggi\'s game state reaches a given scene — e.g. requestType SetCurrentProgramScene + sceneName "Menu" on statsScene "postGame" switches OBS to your Menu scene when the game ends. Check list_automations first for existing triggers on that scene.',
			inputSchema: { statsScene: z.enum(STATS_SCENES as [string, ...string[]]), command: commandSchema },
		},
		async ({ statsScene, command }) => {
			mcpContext.commandStore!.addSceneCommand(statsScene as LiveStatsScene, toCommand(command));
			return text({ ok: true });
		},
	);

	server.registerTool(
		'delete_scene_command',
		{ description: 'Remove a scene trigger by id (see list_automations for ids).', inputSchema: { statsScene: z.enum(STATS_SCENES as [string, ...string[]]), commandId: z.string() } },
		async ({ statsScene, commandId }) => {
			mcpContext.commandStore!.deleteSceneCommand(statsScene as LiveStatsScene, commandId);
			return text({ ok: true });
		},
	);

	server.registerTool(
		'toggle_scene_switch_commands',
		{ description: 'Enable or disable scene-trigger automation entirely (the triggers themselves are kept either way).', inputSchema: { enabled: z.boolean() } },
		async ({ enabled }) => {
			if (mcpContext.commandStore!.getSceneSwitchCommandsState() !== enabled) mcpContext.commandStore!.toggleSceneSwitchCommandsState();
			return text({ ok: true, enabled });
		},
	);
}
