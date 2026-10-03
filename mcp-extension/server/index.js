#!/usr/bin/env node
// Froggi — Claude Desktop extension (stdio MCP bridge).
//
// Claude Desktop launches this process and speaks MCP over stdin/stdout. Every JSON-RPC message is
// forwarded unchanged to the running Froggi app's MCP endpoint on the local loopback
// (http://127.0.0.1:3300/froggi/mcp) and the replies are written back. Because it's a transparent
// pass-through, every Froggi tool and the server instructions are available with no per-tool code,
// and new tools appear automatically. Nothing leaves this machine.
//
// If Froggi isn't running (or Settings → AI Assistant is off) the bridge still completes the MCP
// handshake, reports why, and polls; once Froggi is reachable it sends tools/list_changed so the
// client reloads the real tool list. Dependency-free: Node 18+ (global fetch), as bundled by Desktop.

const readline = require('node:readline');

const URL_ = process.env.FROGGI_MCP_URL || 'http://127.0.0.1:3300/froggi/mcp';
const OFFLINE_HINT =
	'Froggi is not reachable. Start the Froggi app and turn on Settings → AI Assistant (Read & explain, and "Allow edits" for edit tools). ' +
	`Expected at ${URL_}.`;

const log = (...a) => process.stderr.write(`[froggi-mcp] ${a.join(' ')}\n`);
const write = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');

let online = null; // null = unknown, true/false after the first attempt
let pollTimer = null;

async function post(message) {
	const res = await fetch(URL_, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
		body: JSON.stringify(message),
	});
	if (res.status === 202 || res.status === 204) return []; // notification accepted, no body
	const type = res.headers.get('content-type') || '';
	const text = await res.text();
	if (type.includes('text/event-stream')) {
		// SSE: one JSON-RPC message per `data:` event.
		return text
			.split('\n')
			.filter((l) => l.startsWith('data:'))
			.map((l) => l.slice(5).trim())
			.filter(Boolean)
			.map((d) => JSON.parse(d));
	}
	if (!text.trim()) return [];
	const body = JSON.parse(text);
	return Array.isArray(body) ? body : [body];
}

function startPolling() {
	if (pollTimer) return;
	pollTimer = setInterval(async () => {
		try {
			await post({ jsonrpc: '2.0', id: '__froggi_probe__', method: 'ping' });
			clearInterval(pollTimer);
			pollTimer = null;
			online = true;
			log('Froggi is reachable — asking client to reload tools');
			write({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
		} catch {
			/* still offline */
		}
	}, 5000);
}

// Minimal stand-in replies so the client stays connected while Froggi is down.
function offlineReply(message) {
	if (message.id === undefined) return null; // notifications need no reply
	switch (message.method) {
		case 'initialize':
			return {
				jsonrpc: '2.0',
				id: message.id,
				result: {
					protocolVersion: message.params?.protocolVersion ?? '2025-06-18',
					capabilities: { tools: { listChanged: true } },
					serverInfo: { name: 'froggi', version: 'offline' },
					instructions: OFFLINE_HINT,
				},
			};
		case 'ping':
			return { jsonrpc: '2.0', id: message.id, result: {} };
		case 'tools/list':
			return { jsonrpc: '2.0', id: message.id, result: { tools: [] } };
		case 'tools/call':
			return { jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: OFFLINE_HINT }], isError: true } };
		default:
			return { jsonrpc: '2.0', id: message.id, error: { code: -32000, message: OFFLINE_HINT } };
	}
}

async function handle(line) {
	let message;
	try {
		message = JSON.parse(line);
	} catch {
		log('ignoring non-JSON input');
		return;
	}
	try {
		const replies = await post(message);
		if (online === false) log('Froggi back online');
		online = true;
		replies.forEach(write);
	} catch (err) {
		if (online !== false) log(`Froggi unreachable (${err.cause?.code || err.message})`);
		online = false;
		const reply = offlineReply(message);
		if (reply) write(reply);
		startPolling();
	}
}

readline.createInterface({ input: process.stdin }).on('line', (line) => {
	if (line.trim()) void handle(line);
});
process.stdin.on('end', () => process.exit(0));
log(`bridge started → ${URL_}`);
