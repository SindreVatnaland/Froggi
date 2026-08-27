import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ALL_TOPICS, getTopic, renderAsMarkdown } from '../../../../frontend/src/lib/content';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

export function registerExplainTools(server: McpServer) {
	server.registerTool(
		'list_explainer_topics',
		{ description: 'List available Froggi topics you can explain to the user (OBS setup, overlay building, remote access, minigames, automation).', inputSchema: {} },
		async () => text(ALL_TOPICS.map((t) => ({ id: t.id, title: t.title, category: t.category, summary: t.summary }))),
	);

	server.registerTool(
		'explain_topic',
		{ description: 'Get the full explanation for one topic id (see list_explainer_topics).', inputSchema: { topicId: z.string() } },
		async ({ topicId }) => {
			const topic = getTopic(topicId);
			if (!topic) return error(`Unknown topic "${topicId}" — call list_explainer_topics first.`);
			return text(renderAsMarkdown(topic));
		},
	);
}
