import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import { DUMMY_PAYLOADS, THROTTLE_MS } from '../../webhookService';
import { WebhookEvent } from '../../../../frontend/src/lib/models/types/webhook';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

const host = (url: string) => {
	try {
		return new URL(url).host;
	} catch {
		return '(invalid url)';
	}
};

export function registerWebhookReadTools(server: McpServer) {
	server.registerTool(
		'get_webhook_reference',
		{
			description: 'Outbound webhooks: the exact JSON Froggi POSTs (envelope + a real sample payload for every event, the same body the "Send test" button sends), per-event throttling, and the user\'s configured profiles (name, enabled, events, auth type, target host — secrets and full URLs are never returned). Use it to help integrate Homey / Home Assistant / Node-RED / Streamer.bot (lights that follow game state or percent, tournament lighting, triggering things on another device), and pair it with explain_topic "webhooks-smart-home". Profiles are created by the user in Froggi → OBS → Webhooks.',
			inputSchema: {},
		},
		async () => {
			const profiles = mcpContext.webhookStore?.getProfiles() ?? [];
			return text({
				envelope: { eventName: 'GameStart | GameEnd | …', timestamp: 'ISO 8601', payload: '<event payload below>' },
				transport: 'HTTP POST, Content-Type: application/json. Auth per profile: none, Bearer token, or OAuth2 client credentials.',
				events: Object.values(WebhookEvent).map((event) => ({
					event,
					throttleMs: THROTTLE_MS[event] ?? 50,
					samplePayload: DUMMY_PAYLOADS[event],
				})),
				alternative: 'Every event is also broadcast live over WebSocket (ws://<host>:3100, read-only needs no auth) — see explain_topic "game-state-websocket".',
				profiles: profiles.map((p) => ({ name: p.name, enabled: p.enabled, events: p.events, authType: p.authType, targetHost: host(p.url) })),
			});
		},
	);
}
