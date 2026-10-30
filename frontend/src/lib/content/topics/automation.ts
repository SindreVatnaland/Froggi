import type { ContentTopic } from '../types';

export const automationTopics: ContentTopic[] = [
	{
		id: 'automation-overview',
		title: 'Automating OBS from Froggi',
		category: 'automation',
		summary: 'Two ways to trigger OBS actions automatically: a physical controller button combo, or a Froggi game-state change (e.g. the game ending).',
		blocks: [
			{
				type: 'list',
				text: 'Two trigger types:',
				items: [
					'Controller combo — hold a set of buttons on your GameCube controller (e.g. L+R+Start) to fire an OBS action instantly',
					'Game-state trigger — an OBS action fires automatically when Froggi\'s tracked game state reaches a given scene (Menu, In Game, Post Game, Post Set, Rank Change, Strike Phase, Waiting for Dolphin)',
				],
			},
			{
				type: 'paragraph',
				text: 'Both map to the same set of OBS actions: switch the current program scene, save the replay buffer, set an input\'s volume, or toggle a scene item\'s visibility. "Switch OBS scene to Menu when the game ends" is a game-state trigger on the Post Game scene; "switch to my Game scene when I press L+R+Start" is a controller combo.',
			},
			{
				type: 'note',
				text: 'Each trigger type can be checked for existing bindings before adding a new one, so you don\'t accidentally rebind a combo or double up a trigger on the same scene.',
			},
		],
	},
	{
		id: 'tournament-automation',
		title: 'Tournament & stream automation (lights, scene switching, other devices)',
		category: 'automation',
		summary: 'What Froggi can automate today and how: OBS scenes follow the game, lights/devices follow webhooks, OBS on another PC is reachable by IP. Anything beyond that is a feature request.',
		blocks: [
			{
				type: 'list',
				text: 'Built in:',
				items: [
					'OBS scene switching from game state — Scene Commands (Stream → Automation → Scene Commands) / the Auto scene switch toggle on the Dashboard. Each command is Global, Singles or Doubles (format-specific overrides Global).',
					'Flows (Stream → Automation → Flows) — WHEN/AND/THEN automations with POST and OBS actions; see "automation-flows".',
					'OBS on another computer — Stream → OBS Connection → WebSocket: enter that PC\'s IP, port (4455) and password; Froggi controls it over the network (both on the same LAN, or reachable via Tailscale).',
					'Lights / smart home (Homey, Home Assistant, Node-RED, Streamer.bot) — webhooks: game start/end, percent, stock loss, set score, stage striking phase. Example: tournament stage lighting goes "match" on GameStart, flashes on StockChange, resets on GameEnd. Use get_webhook_reference for exact payloads.',
					'Another app reacting live — the WebSocket stream (ws://<host>:3100) carries every event with no auth for read-only listeners.',
				],
			},
			{
				type: 'note',
				text: 'Not built (suggest the user requests it with submit feedback if they need it): driving SEVERAL OBS instances at once, inbound webhooks (other tools triggering Froggi actions), flow conditions beyond the basic set, and per-setup automation across multiple Froggi installs in a tournament. Explain the workaround first (a flow that POSTs to Home Assistant/Node-RED which calls each OBS), then offer to file the feature request.',
			},
		],
	},
	{
		id: 'scene-switching',
		title: 'How Froggi picks the scene (Scene switching flow)',
		category: 'automation',
		summary: 'Scenes (what overlays show: Waiting, Menu, In Game, Post Game, Post Set, Rank Change, Stage Striking) are switched only by flows. Froggi ships an enabled "Scene switching" flow with the default rules — edit it to change them.',
		blocks: [
			{
				type: 'list',
				text: 'The default rules (the "Scene switching" flow, Stream → Automation → Flows):',
				items: [
					'Dolphin connects → Menu; disconnects → Waiting for Dolphin. A game starts → In Game.',
					'A game ends: set decided + ranked → Rank Change; set decided → Post Set (150 s, then Menu); during a stage striking set → Post Game for 15 s, then Stage Striking (only if Post Game is still showing); otherwise → Post Game (150 s, then Menu).',
					'Rank changes (the new rank arrived) → Rank Change, 8 s later Post Set, then Menu. A set starts on the Dashboard → Stage Striking. A player makes a stage striking choice on their phone (RPS, character, strike, ban, pick) → Stage Striking (never over a running game).',
				],
			},
			{
				type: 'list',
				text: 'What data each scene has — why the default rules are what they are (keep this in mind when editing the flow):',
				items: [
					'Waiting for Dolphin: no Dolphin connection, so no game data at all — only saved data (rank, session, set score, overlays\' static content).',
					'Menu: Dolphin connected but no game running — there are no live frames (percent, stocks, positions, controller inputs are empty). Rank, session and the last game\'s stats are still available.',
					'In Game: the only scene with live frame data (percent, stocks, combos, controller inputs, live fight stats). Live frames are cleared when the game ends, so live elements are empty in every other scene. That is why nothing should switch away from In Game while a game runs (striking choices never do).',
					'Post Game: the game\'s stats are read from the replay file after the game ends — they appear about 1–3 s later and need the replay to be found (Settings → replay folder). Until then the previous game\'s stats are shown. They stay available until the next game ends.',
					'Post Set: set totals across the set\'s games; meaningful once the set is decided (state.set.isComplete).',
					'Rank Change: ranked games only, with your connect code set — the new rank comes from Slippi\'s servers (a few seconds; a predicted rating is shown first when available). Showing it outside ranked sets has no data.',
					'Stage Striking: needs a set started on the Dashboard (stage striking state); without one it is empty.',
					'Timers in the defaults: 15 s of Post Game between games of a set (time to read the stats before striking), 150 s before Post Game/Post Set fall back to Menu (stale stats should not stay up forever), 8 s of Rank Change before Post Set.',
				],
			},
			{
				type: 'paragraph',
				text: 'The flow must be enabled for scenes to change automatically — if no enabled flow switches scenes, the Flows page warns and offers "Restore default" (also brings it back after deleting it). Demo flows → "Scene switching" → Use gives a copy to work from. Picking a scene by hand (Dashboard, scene bar) always works, and any flow can switch scenes with "Set Froggi scene". Timer cards wait, then continue; "Cancel timer" stops one by key (the scene flow uses the key "scene", so a new game or set cancels a pending switch). Note cards hold text and never run.',
			},
		],
	},
	{
		id: 'automation-flows',
		title: 'Flows: WHEN → AND → THEN automation',
		category: 'automation',
		summary: 'Stream → Automation → Flows: build automations on a canvas like Homey flows — WHEN a game event happens, AND conditions hold, THEN send a web request, show a notification or control OBS. A "Game format is" condition limits a flow to singles or doubles.',
		blocks: [
			{
				type: 'list',
				text: 'Building blocks:',
				items: [
					'WHEN (one or more per flow — "+ When"; any of them starts the flow): scene changes, controller button combo, game starts/ends, a player takes damage (min %), a player loses a stock, rank changes, Stage Striking (a player\'s choice on their phone: any event, RPS selected, stage struck / banned / picked, character picked, …), stage striking turn changes (e.g. "time to ban"), a set starts (Start set on the Dashboard), Dolphin connects / disconnects.',
					'AND (any number, on the path) — Game state: game format (singles / doubles — any teams game, offline or online), game mode (Local = offline, Direct, Teams = the Slippi online Teams mode, Unranked, Ranked), a player\'s stocks or percent compared to a number (Player 1/2 or You). Froggi: scene is X, striking phase is X. OBS: OBS scene is X, replay buffer on/off. Compare: "if {{key}} is / is not / > / < / contains value" — numbers compare as numbers, anything else as text.',
					'THEN — Send: web request — POST, GET, or Custom (any method: PUT, PATCH, DELETE…) (URL; authentication: none, a bearer token, or OAuth 2 client credentials — token URL, client ID/secret, optional scope; Froggi fetches the access token, reuses it until it expires and refreshes it on a 401; optional extra headers with {{keys}} in their values — they override the defaults; POST body = the event that fired, a game-state snapshot, the latest payload of any webhook event, or your own text — sent as JSON (Content-Type application/json) when it is valid JSON, else plain text; Prettify tidies JSON). OBS: switch scene, show/hide a source, set volume, save replay. Froggi: set the scene. Note cards: text only. Timer: wait N seconds, then continue with the cards after it (conditions checked then; same key restarts it; keys shared by all flows) · Cancel timer (key). Debug: show a notification in Froggi; write a line to the log.',
					'Stage Striking (one trigger): pick "Any player choice" (a choice on a phone), "Any change" (also a game reported, a set starting…) or one event (RPS, strike order, strike, ban, pick, character, agreement, other change); its keys say who acted and what — stage, character, rps.',
					'Keys: each trigger hands values to its actions (like Homey tokens) — e.g. "takes damage" gives player, playerName, damage and the new percent; "loses a stock" gives stocksLeft; "rank changes" gives the previous and new state (before.rank, before.rating, after.rank, after.rating, wins/losses) plus ratingChange and rankChanged. Every flow can also read the whole game state as {{state.…}} — one nested object with everything Froggi tracks: scene, mode, format, match (id, game number, best of), stage, rules, set score, players 1–4 (name, tag, code, port, character, costume, team colour, stocks, percent, rank, fight stats for the game and set), teams (doubles: colour, players, total stocks/percent, score), stage striking, OBS, and the public addresses of this computer (links.tailscale / links.ngrok — shown as hidden in the picker) — e.g. {{state.players.1.percent}}, {{state.teams.2.stocks}}, {{state.strike.turn.name}}, {{state.strike.stages.dreamLand.isBanned}}, {{state.strike.stages.dreamLand.byName}} (who struck, banned or picked it), {{state.strike.history.1.stage}} (every strike / ban / pick of the set in order), {{state.strike.score.p1}}. Hover a key chip to see what it means; every When card (and Mark highlight / Calculate / List) has an "Output schema" button that shows all its keys with type, meaning and example. "All keys & game state…" opens it as an expandable tree with live values; Game start also hands its players (name, character, code, port, team) and rules as keys. Keys are highlighted in the editor; unknown keys are marked red and block saving. In JSON put text keys inside quotes: "{{playerName}}"; the default body includes the trigger keys as "tokens".',
					'Services decide what body they accept — e.g. a Discord channel webhook needs a custom JSON body with "content": {"content": "{{playerName}} lost a stock"}; the default Froggi envelope is rejected there. Test shows the service\'s answer.',
					'New flows start disabled; "Test" runs every action once with example trigger values and the live game state, and shows each result (HTTP status + response). Controller combos must be held for half a second (then a 1s cooldown).',
					'Highlights: the flow "Highlights" is installed turned off — it is also the reference for your own rules. "A sequence ends" fires live when a punish (every hit until the opponent escapes — edgeguards and kills included) or a combo (hits while the opponent is in hitstun) ends — the same definitions as Slippi and Project Clippi — with keys like hits, damage, seconds, hitsPerSecond, didKill, gameEnding, teamKills (doubles multi-kills), openingType, moves, offstage (edgeguard) and the win-chance swing. Self-destructs are not sequences. Calculate cards (Math: key = formula, e.g. kill = {{didKill}} * 50 — the result is {{kill}} for every card after it; the value stays — also for the flow\'s next runs — until a "Clear values" card clears it, so put a Clear values card after the event that should start it over (e.g. When a game starts → Clear values gameList; Game starts has {{newSet}} for the first game of a set); formulas are safe JavaScript-style expressions — never run as code — with keys as {{key}} or plain names (didKill * 50, total >= 40 && didKill, Math.max(damage, 30), kind === "punish"), + − × ÷, comparisons, a ? b : c, min, max, clamp; list formulas may be lambdas: item => item.score) score each rule, with a Note beside each, and a last one adds them up (total = {{kill}} + {{damage}} + …); a Compare card decides what is good enough; "Mark highlight moment" (its score = your formula, e.g. {{total}} — it only ranks highlights, it is not the in-game score) remembers the sequence from 2 s before its first hit to 2 s after it ends (max length keeps only the end of a long one); "OBS: save replay" saves the replay buffer (the file ends when Froggi asks, so the moment is found in it by time); "Mark highlight" also hands the next cards {{highlight}} (its id) — add it to a list. "List" cards keep lists of items — objects with fields, e.g. { id: {{highlight}}, score: {{total}} }, plus "added" (when) — until a Clear values card clears them: add an item, add all of another list, sort by a formula per item (e.g. {{item.score}}, high → low), keep items where a formula holds, set a field of every item, keep the first N, shuffle; formulas anywhere read lists with count(list[, where]), sum / avg / lowest / highest(list, value) and find(list, where, value); single items by position: {{gameList.1.score}}, {{gameList.first.score}}, {{gameList.last.score}}, {{gameList[-1].score}}; {{list.count}} counts them; "keep the first N per field value" (e.g. at most 3 per game) and "next" (the first item moves to the end — loops a list); how many to keep may be a formula (max(10, min(30, round(count(dayList) * 0.05)))). Values and lists are kept across restarts. Media: a key holds ONE thing at a time — "Set media" puts a video or image file, a web link, or a highlight id (its replay-buffer clip) on a key, with an optional From / To (seconds; empty = the whole video), an empty source clears it; every Media element with that key shows it, in sync on every screen. To play a list one by one, loop: Set media ({{list.first.id}}) → Timer ({{list.first.seconds}}) → List "next" → back to Set media; a game start (Cancel timer) stops the loop. "OBS: save replay" with a highlight waits for OBS\'s file and hands on {{clipPath}}, {{clipStart}}, {{clipEnd}}, {{clipSeconds}} (where the highlight is in that file) — those can go into a list and back into Set media as path + From / To. Mark highlight hands on {{highlight}}, {{highlightSeconds}} (its length) and {{highlightGame}}. "Set replay list" gives a Highlight Replay element (the highlights redrawn from the game replays — no OBS needed, transparent) a whole list to play in order. A Media element (key mode) and a Highlight Replay element show nothing until a flow fills their key (the shipped Highlights flow is off by default — turn it on or build your own); a Media element can instead show an uploaded file (≤ 50 MB). "Set media volume" overrides a Media element\'s volume. {{state.time.today}} = local midnight (ms) — e.g. keep only today\'s items: {{item.added}} >= {{state.time.today}}. The old "Build highlight reel" card still works in existing flows. "OBS: replay buffer settings" sets length, format and the replay file name prefix with {{keys}} (nothing happens when already set). Mark highlight also saves the moment (frames + score) with the game, to watch from the replay later. Every screen shows the same moment at the same time. The shipped flow keeps every candidate from 40 in gameList; at game end the game = best 5 (time order), the set = best 15 (time order), daily = today\'s top 5 % (at least 10, at most 30, at most 3 per game, best first). Media keys "game" / "set" / "daily" loop them (Set media → Timer → next); Highlight Replay keys "replay-game" / "replay-set" / "replay-daily" get the lists. A game start stops the loops and empties the media keys; a new set clears the set lists. Demo overlay "Highlights" shows both kinds (Post Game / Post Set / Menu), and the Game & set stats demo has the game / set video below its stats. Tell the AI assistant what a highlight is for you — it adapts the cards. A 30 s buffer saved after each moment is the default; a 480 s buffer saved once at game end gives one file per game but OBS keeps it in memory (~45 MB per minute).',
					'Outputs (like Homey): an And card has Yes (right) and No (bottom) — decisions always live in And cards. Every Then card has Continue (right — after it ran). Cards that can fail (web request, OBS, Set video, Build highlight reel, replay buffer settings) also have Error (bottom right) — it runs when the card failed, and {{error}} holds the reason, so a "Write to the log" card can record it. Cards run one after another; a card sees the keys as they are when it runs (e.g. a {{key}} a Calculate card set before it).',
					'Flows → Problems lists enabled flows that do not validate, recent action failures, and scenes no enabled flow switches to (scenes change only through flows).',
					'Sharing: Export a flow as a .froggi file (bearer tokens, OAuth client secrets and secret-looking header values are left out); Import brings it in disabled. Demo flows (Flows page) are ready-made examples — "Use" copies one to edit.',
				],
			},
			{
				type: 'paragraph',
				text: 'Examples: lights flash (POST to Homey/Home Assistant) when you lose a stock on your last two stocks; switch OBS to the Game scene when a game starts and to a big camera scene when it ends; POST the StrikeState payload to a tournament display whenever a ban is due. The AI assistant can build flows (save_flow) — it explains the flow first.',
			},
			{
				type: 'note',
				text: 'Simple Scene Commands and Controller Commands have a format too: Global runs in singles and doubles; a Singles or Doubles command for the same trigger (same scene / same button combo) overrides the Global one in that format.',
			},
		],
	},
];
