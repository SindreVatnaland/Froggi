import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import type { Flow } from '../../../../frontend/src/lib/models/types/flow';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const SCHEMA = `Flow = { id, name, enabled, format: "any"|"singles"|"doubles", nodes, edges }.
nodes: { id, kind: "trigger"|"condition"|"action", position: {x,y}, data }. edges: { id, source, target } — trigger → conditions → actions (an action runs when every condition on its path holds; actions may chain).
Triggers (data.type): sceneChange {scene?}; controllerCombo {buttons: {isLPressed, isRPressed, isAPressed, isBPressed, isXPressed, isYPressed, isZPressed, isStartPressed, isDPadUp/Down/Left/RightPressed: true}}; gameStart; gameEnd; damageTaken {player?: any|p1|p2|current, minDamage?}; stockLost {player?}; rankChange; strikeChange {action?: any|pickCharacter|rps|chooseStrikeOrder|strike|ban|pick|answerAgreement|play|done}.
Conditions: gameMode {modes: [local|direct|unranked|ranked]}; scene {scene}; playerStocks / playerPercent {player: p1|p2|current, compare: "<="|">="|"==", value}; strikePhase {phase}.
Actions: httpPost {url, bearerToken?, body: "trigger"|"gameState"|<webhook event name e.g. "StrikeState">} (POSTs {flow, trigger, timestamp, payload}; payload shapes = get_webhook_reference); obsScene {sceneName}; obsToggleSource {sourceName}; obsVolume {inputName, volume 0-1}; obsSaveReplay.
Scenes: waitingForDolphin, menu, inGame, postGame, postSet, rankChange, strikePhase.`;

export function registerFlowReadTools(server: McpServer) {
	server.registerTool(
		'list_flows',
		{
			description: 'Automation flows (Froggi → OBS → Flows): WHEN a game event happens AND conditions hold THEN POST somewhere or control OBS — like Homey flows. Lists every flow with its trigger and actions. ' + SCHEMA,
			inputSchema: {},
		},
		async () => text(mcpContext.flowService!.getFlows()),
	);
	server.registerTool(
		'get_flow',
		{ description: 'One flow in full (nodes + edges). ' + SCHEMA, inputSchema: { flowId: z.string() } },
		async ({ flowId }) => {
			const flow = mcpContext.flowService!.getFlow(flowId);
			return flow ? text(flow) : error(`No flow "${flowId}" — see list_flows`);
		},
	);
}

export function registerFlowWriteTools(server: McpServer) {
	server.registerTool(
		'save_flow',
		{
			description:
				'Create or replace a flow (same id = update). Explain to the user what it will do first; new flows default to enabled:false unless they asked to turn it on. Lay nodes out left→right about 260 apart (x 40, 300, 560 …). Returns validation problems instead of saving if the flow is incomplete. ' + SCHEMA,
			inputSchema: {
				flow: z.object({
					id: z.string().optional(),
					name: z.string().min(1).max(80),
					enabled: z.boolean().default(false),
					format: z.enum(['any', 'singles', 'doubles']).default('any'),
					nodes: z.array(z.object({ id: z.string(), kind: z.enum(['trigger', 'condition', 'action']), position: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }), data: z.record(z.string(), z.any()) })),
					edges: z.array(z.object({ id: z.string().optional(), source: z.string(), target: z.string() })),
				}),
			},
		},
		async ({ flow }) => {
			const full = {
				...flow,
				id: flow.id || `flow-${Date.now().toString(36)}`,
				edges: flow.edges.map((e, i) => ({ id: e.id || `e${i}-${e.source}-${e.target}`, source: e.source, target: e.target })),
			} as Flow;
			const result = await mcpContext.flowService!.saveFlow(full);
			if (!result.ok) return error(`Not saved: ${result.problems.join('; ')}`);
			return text({ ok: true, flowId: result.flow.id, enabled: result.flow.enabled, note: 'Open Froggi → OBS → Flows to see it on the canvas.' });
		},
	);
	server.registerTool(
		'delete_flow',
		{
			description: 'Delete a flow permanently. Ask the user to confirm in chat first and pass userConfirmed:true.',
			inputSchema: { flowId: z.string(), userConfirmed: z.literal(true) },
		},
		async ({ flowId }) => {
			if (!mcpContext.flowService!.getFlow(flowId)) return error(`No flow "${flowId}"`);
			await mcpContext.flowService!.deleteFlow(flowId);
			return text({ ok: true });
		},
	);
}
