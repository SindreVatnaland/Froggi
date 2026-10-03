import { z } from 'zod';
import crypto from 'crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

type Verdict = 'local' | 'dev' | 'benign';

/**
 * Known error signatures → verdict + fix. Anything not matched comes back "unclassified" and the
 * assistant judges it. Add an entry whenever a new error turns out to be a known, recurring cause.
 */
const KNOWN_ISSUES: { id: string; match: RegExp; verdict: Verdict; title: string; fix: string }[] = [
	{
		id: 'slippi-replay-folder-missing',
		match: /ENOENT[^\n]*scandir[^\n]*Slippi/i,
		verdict: 'local',
		title: 'Slippi replay folder not found',
		fix: 'Froggi looks for replays in the folder set in Slippi Launcher, and that folder does not exist (post-game stats and rank change will not work). Open Slippi Launcher → Settings → Replays and set the folder your replays are actually saved to (on Windows often OneDrive\\Documents\\Slippi rather than Documents\\Slippi), then restart Froggi.',
	},
	{
		id: 'obs-websocket-disabled',
		match: /OBS Websocket is not enabled/i,
		verdict: 'local',
		title: 'OBS WebSocket server is off',
		fix: 'In OBS: Tools → WebSocket Server Settings → Enable WebSocket server. Or, with write access, call obs_enable_and_connect.',
	},
	{
		id: 'port-in-use',
		match: /EADDRINUSE/,
		verdict: 'local',
		title: 'A port Froggi needs is already in use',
		fix: 'Another Froggi instance (or another app) is using port 3100, 3200 or 3300. Close other Froggi windows/instances (check the tray) and restart Froggi.',
	},
	{
		id: 'tailscale-serve-noop',
		match: /failed to remove web serve: handler does not exist/i,
		verdict: 'benign',
		title: 'Tailscale serve cleanup no-op',
		fix: 'Harmless: Froggi tried to remove a Tailscale serve handler that was never created. Nothing to do.',
	},
	{
		id: 'injection-module-load',
		match: /Failed to load overlay injection module/i,
		verdict: 'dev',
		title: 'Overlay injection native module failed to load',
		fix: 'Expected on macOS/Linux. On Windows this is a packaging problem (or antivirus quarantining the DLL) — report it.',
	},
	{
		id: 'native-abi-mismatch',
		match: /NODE_MODULE_VERSION/,
		verdict: 'dev',
		title: 'Native module built for the wrong runtime',
		fix: 'A packaging problem in this build — report it.',
	},
];

type LogError = {
	id: string;
	level: string;
	message: string;
	count: number;
	firstSeen: string;
	lastSeen: string;
	verdict: Verdict | 'unclassified';
	known?: { id: string; title: string; fix: string };
	context?: string;
};

const ENTRY_RE = /^\[(\d{4}-\d{2}-\d{2} [\d:.]+)\] \[(\w+)\]/;
const CONTEXT_ENTRIES = 12;
const MAX_ENTRY_CHARS = 3000;
const MAX_ERRORS = 15;

/** Groups error entries (and optionally warnings) from the last `sessions` app sessions by signature. */
export function extractErrors(sessions: number, includeWarnings = false): { sessionsRead: number; errors: LogError[] } {
	const log = mcpContext.errorReporter!.readLogSessions(sessions);
	// An entry is a timestamped line plus its continuation lines (stack traces, JSON).
	const entries: { time: string; level: string; text: string }[] = [];
	for (const line of log.split(/\r?\n/)) {
		const m = ENTRY_RE.exec(line);
		if (m) entries.push({ time: m[1], level: m[2], text: line });
		else if (entries.length) entries[entries.length - 1].text += '\n' + line;
	}

	const byId = new Map<string, LogError>();
	entries.forEach((entry, i) => {
		if (entry.level !== 'error' && !(includeWarnings && entry.level === 'warn')) return;
		const message = entry.text.replace(ENTRY_RE, '').trim();
		const firstLine = message.split('\n')[0].slice(0, 300);
		// ponytail: digit-stripping signature; group by stack frame if distinct errors start colliding.
		const id = crypto.createHash('sha1').update(entry.level + firstLine.replace(/\d+/g, '#')).digest('hex').slice(0, 8);
		const known = KNOWN_ISSUES.find((k) => k.match.test(message));
		const existing = byId.get(id);
		const context = entries
			.slice(Math.max(0, i - CONTEXT_ENTRIES), i + 1)
			.map((e) => e.text.slice(0, MAX_ENTRY_CHARS))
			.join('\n');
		if (existing) {
			existing.count++;
			existing.lastSeen = entry.time;
			existing.context = context; // keep the latest occurrence
			return;
		}
		byId.set(id, {
			id,
			level: entry.level,
			message: firstLine,
			count: 1,
			firstSeen: entry.time,
			lastSeen: entry.time,
			verdict: known?.verdict ?? 'unclassified',
			known: known && { id: known.id, title: known.title, fix: known.fix },
			context,
		});
	});

	const sessionsRead = entries.filter((e) => e.text.includes('Starting app')).length;
	const errors = [...byId.values()]
		.sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1))
		.slice(0, MAX_ERRORS);
	return { sessionsRead, errors };
}

export function registerCrashDiagnosisReadTools(server: McpServer) {
	server.registerTool(
		'diagnose_errors',
		{
			description:
				'Reads Froggi\'s log (personal data scrubbed) for the last few app sessions — including the session before a crash/restart — and returns each distinct error with how often/when it happened and the log lines leading up to it. Errors matching a known issue come with a verdict: "local" (the user can fix it — walk them through `known.fix`), "benign" (ignore), or "dev" (a bug — offer to report it). For "unclassified" errors, judge from the message and context: a missing file/folder, a disabled setting, a closed/blocked app, or a port/permission problem is usually local; a TypeError, unhandled rejection in Froggi code, or a crash in a native module usually needs the developer. If it needs the developer, ASK the user whether to send a crash report; only call submit_crash_report after they agree.',
			inputSchema: {
				sessions: z.number().int().min(1).max(10).default(4).describe('How many recent app sessions to read (current = 1).'),
				includeWarnings: z.boolean().default(false),
			},
		},
		async ({ sessions, includeWarnings }) => {
			const result = extractErrors(sessions, includeWarnings);
			if (!result.errors.length) return text(`No errors in the last ${result.sessionsRead || sessions} session(s).`);
			// Known local/benign issues don't need the raw context — keep the payload small.
			for (const e of result.errors) if (e.verdict === 'local' || e.verdict === 'benign') delete e.context;
			return text(result);
		},
	);
}

export function registerCrashDiagnosisWriteTools(server: McpServer) {
	server.registerTool(
		'submit_crash_report',
		{
			description:
				'Sends a crash report to the Froggi developer: your diagnosis plus the scrubbed log excerpts for the given error ids (from diagnose_errors). ONLY call this after the user explicitly agreed in this conversation to send it — tell them first what will be sent (your summary + the log lines around those errors, with paths/usernames/connect codes/IPs removed).',
			inputSchema: {
				summary: z.string().min(10).max(3000).describe('What the user was doing, what went wrong, and your diagnosis.'),
				errorIds: z.array(z.string()).min(1).max(10),
				sessions: z.number().int().min(1).max(10).default(4).describe('Same value used with diagnose_errors.'),
				userConfirmed: z.literal(true).describe('Set only after the user agreed to send the report.'),
			},
		},
		async ({ summary, errorIds, sessions }) => {
			const { errors } = extractErrors(sessions, true);
			const picked = errors.filter((e) => errorIds.includes(e.id));
			if (!picked.length) return text('None of those error ids were found — call diagnose_errors again and use its ids.');
			const reporter = mcpContext.errorReporter!;
			const attachment = picked
				.map((e) => `### ${e.id} ×${e.count} (${e.firstSeen} → ${e.lastSeen})\n${e.message}\n\n${e.context ?? ''}`)
				.join('\n\n');
			const ok = await reporter.submitFeedback('bug', `[via AI assistant]\n${reporter.scrub(summary)}`, true, attachment);
			return text(ok ? `Crash report sent (${picked.length} error(s)).` : 'Sending failed — this build may have no report channel, or the network is down. Suggest the user report it via Settings → Feedback instead.');
		},
	);
}
