import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpContext } from '../mcpContext';
import type { Flow } from '../../../../frontend/src/lib/models/types/flow';
import { DEMO_FLOWS } from '../../../../frontend/src/lib/content/demoFlows';
import { flattenState, SAMPLE_GAME_STATE } from '../../../../frontend/src/lib/utils/flowState';
import { flowProblems } from '../../../../frontend/src/lib/utils/flowProblems';
import { actionSchema, FIRES_WHEN, keyInfoText, RUN_KEY_INFO, sampleObject, strikeStateSchema, triggerSchema } from '../../../../frontend/src/lib/utils/flowKeys';
import { SAMPLE_TOKENS } from '../../../../frontend/src/lib/utils/flowEngine';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const error = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true });

const SCHEMA = `Flow = { id, name, enabled, nodes, edges }.
nodes: { id, kind: "trigger"|"condition"|"action", position: {x,y}, data }. edges: { id, source, target, sourceHandle? } — trigger → conditions → actions; a flow may have several trigger nodes (any of them starts its own path). Outputs (Homey style, edge sourceHandle): condition (And card) → no handle = Yes (holds), \"false\" = No; action → no handle = Continue (after it ran/worked) — actions never answer yes/no: put decisions in And cards (e.g. compare {{gameCount}} > 0) before the action; actions that can fail (httpPost, OBS actions incl. obsSaveReplay, setHighlightVideo, obsReplayBufferSettings) also \"error\" = it failed, with key {{error}} = the reason (connect a log card: \"… {{error}}\"). Cards run in order; cards after a calculate card can use its {{key}}. Put a note node right beside the cards it explains. Old ✓/✕ action edges are migrated on load (✓ → Continue, ✕ → error).
Triggers (data.type): sequence {kind: \"punish\"|\"combo\", player?: any|p1|p2|current (attacker's side)} — a punish (every hit until the opponent escapes, incl. edgeguards and kills) or combo (hitstun chain) ENDS, live, Slippi's own definitions (same as Project Clippi); keys kind, player/playerName/character (attacker, slot 1–4), victim/victimName/victimCharacter, hits, damage, startPercent, endPercent, seconds, hitsPerSecond, didKill, gameEnding (it took the last stock), teamKills (KOs by the attacker's team in the last 5 s incl. this — doubles multi-kill), openingType (neutral-win|counter-attack|trade, punishes), moves (\"Nair, Uthrow, Uair\"), lastMove, offstage (victim off stage at the end — edgeguard), victimStocksLeft, winChanceBefore/winChanceAfter/winChanceSwing (attacker's side, game, percent), setChanceSwing, startTime/endTime (wall ms — for where a moment is in a replay-buffer file; SDs are no sequence), startFrame/endFrame (game frames — Highlight Replay windows); sceneChange {scene?}; obsReplaySaved (OBS saved its replay buffer — keys path, fileName); strikeAction {event?: \"any\" (default = any player choice)|\"all\" (any change)|rps|order|strike|ban|pick|character|agreement|change} — \"Stage Striking\", the ONLY striking trigger: a player's choice (phone, or the host for a player) or event \"change\" = anything else (a game reported, a set starting…); keys event, player, playerName, phase, stage (struck / banned / picked), character (picked), rps (hand); the whole striking state is {{state.strike…}}; controllerCombo (WINDOWS ONLY — Froggi reads controllers from Dolphin memory; on macOS/Linux suggest another trigger) {buttons: {isLPressed, isRPressed, isAPressed, isBPressed, isXPressed, isYPressed, isZPressed, isStartPressed, isDPadUp/Down/Left/RightPressed: true}}; gameStart (keys incl. newSet = this game starts a new set); gameEnd; damageTaken {player?: any|p1|p2|current, minDamage?}; stockLost {player?}; rankChange; setStart (the host started a set on the Dashboard); dolphinConnection {connected?: true|false (omit = both)}.
Conditions — Game state: gameFormat {format: "singles"|"doubles"} (1v1 vs any teams game, offline or online — use this for singles/doubles); gameMode {modes: [local|direct|teams|unranked|ranked]} (Slippi's mode: local = offline; teams = Slippi's online Teams mode); playerStocks / playerPercent {player: p1|p2|current, compare: "<="|">="|"==", value}. Froggi: scene {scene}; strikePhase {phase}. OBS: obsScene {sceneName}; obsReplayBuffer {active}. Compare: compare {left, op: "=="|"!="|"<"|"<="|">"|">="|"contains", right} — both sides are text with {{keys}} filled; numeric when both are numbers, else case-insensitive text.
Actions: httpPost {method?: "POST"(default)|"GET"|any other e.g. "PUT"/"PATCH"/"DELETE", url, bearerToken? | oauth?: {tokenUrl, clientId, clientSecret, scope?, credentials?: "body"(default)|"basic"} (OAuth 2 client credentials — Froggi fetches + caches the access token, refreshes on 401; the user enters the secret in the editor, never ask for it in chat), headers?: [{name, value}] (values may hold {{keys}}; override the defaults), body: "trigger"|"gameState"|"custom"|<webhook event name e.g. "StrikeState">, template?} — default POSTs {flow, trigger, timestamp, tokens, payload} (payload shapes = get_webhook_reference); body "custom" sends the template with {{key}} filled — any text; sent as application/json when it parses as JSON, else text/plain (in JSON put text keys inside quotes: {"who":"{{playerName}}","pct":{{percent}}}). GET/HEAD send no body; {{keys}} in the URL are URL-encoded. Services decide the body they accept — e.g. Discord channel webhooks need a custom JSON body with "content", {"content":"{{playerName}} lost a stock"} (the default envelope gets a 400). Debug: notify {message} — toast in Froggi; log {message} — line in Froggi's log ({{keys}} filled). setScene {scene} (switch Froggi's scene); Math: calculate {key, formula, description? (what the value means — shown when hovering the key in later cards; write one)} — {{key}} = the result; the value belongs to the flow and STAYS (also for its next runs) until a clearValues card clears it — never set / cleared reads as empty (0 in a formula); clearValues {keys: \"a, b\"} — empties those values / lists; put it after the event that should start them over (e.g. gameStart → clearValues gameList; gameStart + And {{newSet}} == true → clearValues setList). Nothing resets on its own — no hidden lifetimes; chain them, each can use keys calculated before it (formula: SAFE JavaScript-style expressions (parsed, never executed) — keys as {{key}} OR bare names / paths (total, didKill, state.players.1.percent, gameList[-1].score, gameList.length), \"text\" / 'text', + - * / %, ( ), == != === !== < <= > >= → 1/0 (text compares as text, case-insensitive), && || !, a ? b : c, min max abs round floor ceil clamp(x,lo,hi) nth(k, a, b, …) (k-th highest) also as Math.min …; list formulas may be lambdas: item => item.score * 2 (x.field = {{item.field}}); true/false/null = 1/0/0; no other globals, no assignments, no statements; key = letters/digits/_). Highlights are built ONLY from generic cards (no highlight-specific cards): sequence trigger keys startFrame/endFrame (game frames) + startTime/endTime (wall ms), calculate for windows, list for highlight lists, obsSaveReplay for video files; Froggi never deletes replay files; list {key, description? (what the list holds), op: \"add\"|\"addList\"|\"sort\"|\"filter\"|\"map\"|\"limit\"|\"limitPer\"|\"shuffle\", fields? ([{name, value}] — add: the item's fields, {{keys}} filled, numbers stay numbers; every item also gets \"added\" = ms when added), from? (addList), formula? (sort / filter / map: a formula run per item with {{item.<field>}}), order? (\"high\"|\"low\", sort), field? (map: the field to set), count? (limit / limitPer = keep the first N — a number or a formula, e.g. \"max(10, min(30, round(count(dayList) * 0.05)))\"), op \"limitPer\" {field, count} = keep the first N per value of field (e.g. 3 per game)} — a list of items (objects), per flow, kept until a clearValues card clears it; cards after it see {{key.count}}; formulas anywhere read lists with count(list), count(list, where), sum / avg / lowest / highest(list, value), find(list, where, value) — where / value are formulas over {{item.<field>}}; setHighlightVideo {key?, path, start?, end?} — \"Set media\": a key holds ONE thing — path = a file id ({{file}} from obsSaveReplay, {{list[i].file}}), a local video (MP4/MOV/WebM) / image path, or an http(s) link; start/end = seconds into the video (formulas, empty = whole video); empty path clears the key; every Media element (2100, key mode) with that key shows it in sync; error when unusable. To play a list one by one LOOP with an index: calculate i = 0 → compare {{list.count}} > 0 → setHighlightVideo {{list[i].file}} (start {{list[i].start}}, end {{list[i].end}}) → timer {key: \"loop-game\", seconds: \"max({{list[i].seconds}}, 1)\"} → calculate i = {{i}} + 1 → compare {{i}} >= {{list.count}}: No (sourceHandle \"false\") → back to the count check; Yes → (list shuffle →) calculate i = 0 → back (route Set media's error output to the timer); a gameStart → cancelTimer stops it. setVideoVolume {key, volume 0-100} — \"Set media volume\": overrides the Media element's own volume; obsReplayBufferSettings {seconds?, format?: hybrid_mp4|mp4|hybrid_mov|mov, fileName? (replay file name prefix, {{keys}} filled, no folders — OBS's own Filename Formatting adds those)} — no-op when already set, else restarts the buffer. Installed flow id \"highlights\" (off by default; demo \"demo-highlights\") is THE REFERENCE for highlight rules: gameStart → obsReplayBufferSettings 30 s (starts the buffer) and cancelTimer loop-game/set/daily → setHighlightVideo empty for game/set/daily → clearValues \"slippiReplayGame, replayBufferGame\" → And {{newSet}} == true → clearValues \"slippiReplaySet, replayBufferSet\" (setStart → the same); sequence (punish) → calculate kill / damage / speed / swing / multi / long → depth = 1 + 0.2 * (1 - {{gameStocksLeft}} / {{gameStocksTotal}}) + 0.1 * (gameNumber - 1) / (bestOf - 1) → total = (sum) * {{depth}} (a note beside each) → compare {{total}} >= 40 → calculate toFrame = {{endFrame}} + 60, fromFrame = max({{startFrame}} - 150, {{toFrame}} - 600) → list add to slippiReplayGame / slippiReplaySet / slippiReplayToday {replay: {{state.replay.file}}, startFrame: {{fromFrame}}, endFrame: {{toFrame}}, score: {{total}}, game: {{state.replay.file}}} → timer save-{{startFrame}} 1.5 s → obsSaveReplay (error → log) → calculate clipEnd = min({{fileSeconds}}, {{fileSeconds}} - ({{savedAt}} - {{endTime}}) / 1000 + 1), clipStart = max(0, {{fileSeconds}} - ({{savedAt}} - {{startTime}}) / 1000 - 2.5, {{clipEnd}} - 10), clipSeconds → list add to replayBufferGame / Set / Today {file, start, end, seconds, score, game}; gameEnd → 5 s → for both prefixes (slippiReplay, replayBuffer): Game sort score high → limit 5 → sort added low; Set the same with 15; Today filter {{item.added}} >= {{state.time.today}}; Daily = clear → addList Today → sort high → limitPer game 3 → limit max(20, min(100, round(count(<prefix>Today) * 0.2))) → then three index loops (Media keys game / set / daily over replayBufferGame / Set / Daily; daily shuffles at the end). Highlight Replay elements read slippiReplayGame / Set / Daily directly. Demo overlay \"Highlights\" shows Media + Highlight Replay in Post Game / Post Set / Menu. Everything is visible in cards — never rely on hidden logic; a user must be able to read the whole rule set. When a user describes what a highlight is for them, get_flow \"highlights\" (or the demo), then change/add/remove its calculate cards (+ the notes beside them, + the total formula), the threshold, the list limits/sorting and the trigger kind to match — one rule per card — and save_flow; explain the rules back in plain words. timer {key (may hold {{keys}}, e.g. save-{{startFrame}} = one timer per punish), seconds (a number or a formula, e.g. \"{{list[i].seconds}}\")} — a TIMER card: the cards connected after it run when it fires (their conditions are checked then); starting a running key restarts it; keys are shared by all flows; cancelTimer {key}. OBS: obsScene {sceneName}; obsToggleSource {sourceName}; obsVolume {inputName, volume 0-1}; obsSaveReplay — saves the replay buffer, WAITS for OBS's file and hands on {{file}} (its id — store this in lists, never the path), {{path}}, {{fileSeconds}} (its length, shorter early in a game) and {{savedAt}} (when the file ends = Froggi's save request, wall ms); error when no file comes. A moment at {{startTime}} begins {{fileSeconds}} - ({{savedAt}} - {{startTime}}) / 1000 s into the file. Game state {{state.time.now}} / {{state.time.today}} (local midnight, ms); {{state.replay.file}} = the running game's .slp as a file id (for Highlight Replay items).
Trigger keys — what each one means (the editor shows the same text on its key chips; players.N.* is the same for N 1–4, before.* like after.*):
${keyInfoText()}
Run keys: error = why the card before failed (behind an Error output) · file / path / fileSeconds / savedAt after obsSaveReplay. Calculate / List cards add their own keys (a list: {{name.count}}, items by position {{name.1.score}}, {{name.first.…}}, {{name.last.…}}, {{name[0].…}}, {{name[-1].…}}; one item in list formulas: {{item.<field>}}).
Game state (every trigger, live when the flow runs): one nested object — read any leaf as {{state.<path>}} with list positions 1-based, e.g. {{state.players.1.percent}}, {{state.players.2.rank.rating}}, {{state.teams.1.stocks}}, {{state.strike.turn.name}}, {{state.rules.stocks}}, {{state.links.tailscale}} / {{state.links.ngrok}} (this computer's public address, null when off). The same object is the POST body "gameState". Shape (example values, a doubles game): ${JSON.stringify(SAMPLE_GAME_STATE)}. Players are in slot order (Player 1/2; doubles 1/2 = each team's first player, 3/4 = partners); teams only exist in doubles (team 1 = players 1+3). strike = the stage striking object (null without a set; get_flow_schemas lists every field\'s meaning): phase, gameNumber, bestOf, score.p1/p2, turn {player: p1|p2, name, action}, p1 / p2 {name, character (name), partnerCharacter, rps, dsr}, rpsWinner, stage (the stage to play), history (every strike / ban / pick of the set in order: {order, game, action, stage, stageKey, player, name}, e.g. {{state.strike.history.1.stage}}), stages.<fountainOfDreams|battlefield|finalDestination|dreamLand|yoshisStory|pokemonStadium> {name, status, isAvailable, isLocked, isStruck, isBanned, isDsr, isPicked, by: p1|p2, byName, order (place in this game\'s strikes / bans / pick)} — e.g. {{state.strike.stages.dreamLand.isBanned}}; lastGame = the GameEnd payload (get_webhook_reference). The editor's "Game state…" picker shows this as an expandable tree with live values. Unknown keys are a validation error.
The editor's Test button runs every action once with example trigger values + the live game state and shows each response (HTTP status + body).
Controller combos must be held 0.5s; then 1s cooldown.\nScenes are switched ONLY by flows: the shipped flow id \"scene-switching\" (enabled by default) holds the rules as cards — edit it with save_flow to change them (explain_topic scene-switching). The default is also readable any time: get_flow \"demo-scene-switching\" (compare it with the user's copy, get_flow \"scene-switching\"). If it is gone, the user can press Restore default on the Flows page, or save_flow the demo \"demo-scene-switching\" (get_flow it first) with id \"scene-switching\" and enabled:true. state.set.isActive / state.set.isComplete = a striking set runs / the set is decided. state.odds.game.1/2 (null outside a game) and state.odds.set.1/2 = win chance in percent for Player 1's / Player 2's side (game chance leans to the timeout winner as the timer runs out); state.odds.secondsLeft = timer left (null without timer), state.odds.stockSeconds.avg/min/max/count = how long stocks lasted this set. Before editing scene rules read explain_topic scene-switching: each scene has different data (live frames only In Game; Post Game stats arrive 1–3 s after the game from the replay; Rank Change only for ranked; Stage Striking needs a Dashboard set) — never switch away from In Game during a game. Note nodes: kind \"note\", data {type:\"note\", text} — not connected, never run; use them to explain a flow.
Scenes: waitingForDolphin, menu, inGame, postGame, postSet, rankChange, strikePhase.`;

export function registerFlowReadTools(server: McpServer) {
	server.registerTool(
		'list_flows',
		{
			description: 'Automation flows (Froggi → Stream → Automation → Flows): WHEN a game event happens AND conditions hold THEN send a web request (POST/GET), show a notification or control OBS — like Homey flows. Lists every flow with its trigger and actions. ' + SCHEMA,
			inputSchema: {},
		},
		async () =>
			text({
				flows: mcpContext.flowService!.getFlows(),
				// Ready-made examples (Flows page → Demo flows → Use) — get_flow "<id>" gives one in full. To start
				// from one, adapt it and save_flow it with a new id.
				demoFlows: DEMO_FLOWS.map(({ id, name, description }) => ({ id, name, description })),
			}),
	);
	server.registerTool(
		'get_flow_schemas',
		{
			description:
				'The output schema of every When card (what fires it; every key it hands on with type, meaning, example; a sample object), of the action cards that hand keys on (obsSaveReplay, Calculate, List), and of the stage striking state {{state.strike…}} (meaning of every field). Same data as the editor\'s "Output schema" popups. Use it before writing conditions / formulas / templates with keys, and to explain a trigger to the user.',
			inputSchema: { trigger: z.string().optional().describe('Only this trigger type, e.g. "sequence" or "strikeAction"') },
		},
		async ({ trigger }) => {
			const triggers = (Object.keys(FIRES_WHEN) as (keyof typeof FIRES_WHEN)[])
				.filter((t) => !trigger || t === trigger)
				.map((t) => {
					const rows = triggerSchema(t, SAMPLE_TOKENS);
					return { type: t, firesWhen: FIRES_WHEN[t], keys: rows.map(({ key, type, meaning, example }) => ({ key, type, meaning, example })), sample: sampleObject(rows) };
				});
			if (trigger && !triggers.length) return error(`No trigger "${trigger}" — one of ${Object.keys(FIRES_WHEN).join(', ')}`);
			const strike = strikeStateSchema(flattenState(SAMPLE_GAME_STATE, 'state'));
			return text({
				triggers,
				actions: {
					obsSaveReplay: actionSchema({ type: 'obsSaveReplay' }),
					calculate: actionSchema({ type: 'calculate', key: '<key>' }),
					list: actionSchema({ type: 'list', key: '<list>' }, ['id', 'score', 'added']),
					errorOutput: [{ key: 'error', type: 'text', meaning: RUN_KEY_INFO.error }],
				},
				strikeState: { meanings: strike.map(({ key, meaning }) => ({ key, meaning })), sample: SAMPLE_GAME_STATE.strike },
				note: 'Web request cards hand on nothing structured (their response is not a key).',
			});
		},
	);
	server.registerTool(
		'get_flow_problems',
		{
			description:
				'Flows → Problems (same list as the page): enabled flows that do not validate, recent action failures (web request errors, OBS not accepting a command, …), and scenes no enabled flow switches to (Froggi changes scenes only through "Set Froggi scene" cards). Use it when the user says scenes or automations "do nothing". Fix ideas: open/repair the flow, connect OBS, or Restore default on the problems page for the Scene switching flow.',
			inputSchema: {},
		},
		async () => text({ problems: flowProblems(mcpContext.flowService!.getFlows(), mcpContext.flowService!.getFailures()) }),
	);
	server.registerTool(
		'get_flow',
		{ description: 'One flow in full (nodes + edges) — the user\'s, or a demo flow by its id (list_flows → demoFlows, e.g. "demo-highlights"). ' + SCHEMA, inputSchema: { flowId: z.string() } },
		async ({ flowId }) => {
			const flow = mcpContext.flowService!.getFlow(flowId) ?? DEMO_FLOWS.find((f) => f.id === flowId);
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
					nodes: z.array(z.object({ id: z.string(), kind: z.enum(['trigger', 'condition', 'action', 'note']), position: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }), data: z.record(z.string(), z.any()) })),
					edges: z.array(z.object({ id: z.string().optional(), source: z.string(), target: z.string(), sourceHandle: z.enum(['true', 'false', 'error']).optional() })),
				}),
			},
		},
		async ({ flow }) => {
			const full = {
				...flow,
				id: flow.id || `flow-${Date.now().toString(36)}`,
				edges: flow.edges.map((e, i) => ({ id: e.id || `e${i}-${e.source}-${e.target}`, source: e.source, target: e.target, ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}) })),
			} as Flow;
			const result = await mcpContext.flowService!.saveFlow(full);
			if (!result.ok) return error(`Not saved: ${result.problems.join('; ')}`);
			return text({ ok: true, flowId: result.flow.id, enabled: result.flow.enabled, note: 'Open Froggi → Stream → Automation → Flows to see it on the canvas.' });
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
