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
					'Keys: each trigger hands values to its actions (like Homey tokens) — e.g. "takes damage" gives player, playerName, damage and the new percent; "loses a stock" gives stocksLeft; "rank changes" gives the previous and new state (before.rank, before.rating, after.rank, after.rating, wins/losses) plus ratingChange and rankChanged. Every flow can also read the whole game state as {{state.…}} — one nested object with everything Froggi tracks: scene, mode, format, match (id, game number, best of), stage, rules, set score, players 1–4 (name, tag, code, port, character, costume, team colour, stocks, percent, rank, fight stats for the game and set), teams (doubles: colour, players, total stocks/percent, score), stage striking, OBS, and the public addresses of this computer (links.tailscale / links.ngrok — shown as hidden in the picker) — e.g. {{state.players.1.percent}}, {{state.teams.2.stocks}}, {{state.strike.turn.name}}, {{state.strike.stages.dreamLand.isBanned}}, {{state.strike.stages.dreamLand.byName}} (who struck, banned or picked it), {{state.strike.history.1.stage}} (every strike / ban / pick of the set in order), {{state.strike.score.p1}}. Hover a key chip to see what it means; every When card (and OBS: save replay / Calculate / List) has an "Output schema" button that shows all its keys with type, meaning and example. "All keys & game state…" opens it as an expandable tree with live values; Game start also hands its players (name, character, code, port, team) and rules as keys. Keys are highlighted in the editor; unknown keys are marked red and block saving. In JSON put text keys inside quotes: "{{playerName}}"; the default body includes the trigger keys as "tokens".',
					'Services decide what body they accept — e.g. a Discord channel webhook needs a custom JSON body with "content": {"content": "{{playerName}} lost a stock"}; the default Froggi envelope is rejected there. Test shows the service\'s answer.',
					'New flows start disabled; "Test" runs every action once with example trigger values and the live game state, and shows each result (HTTP status + response). Controller combos must be held for half a second (then a 1s cooldown).',
					'Highlights: the flow "Highlights" is installed turned off — it is also the reference for your own rules, built only from generic cards. "A sequence ends" fires live when a punish (every hit until the opponent escapes — edgeguards and kills included) or a combo (hits while the opponent is in hitstun) ends — the same definitions as Slippi and Project Clippi — with keys like hits, damage, seconds, hitsPerSecond, didKill, gameEnding, teamKills (doubles multi-kills), openingType, moves, offstage (edgeguard), the win-chance swing, startFrame / endFrame (game frames) and startTime / endTime (wall clock, ms). Self-destructs are not sequences. Calculate cards (key = formula, e.g. kill = {{didKill}} * 50 — the result is {{kill}} for the cards after it and stays until a Clear values card clears it; each run keeps its own results while it waits on a timer; formulas are safe JavaScript-style expressions — never run as code — with keys as {{key}} or plain names, + − × ÷, comparisons, a ? b : c, min, max, clamp, round) score each rule, a depth card makes later moments count a bit more (up to +20 % for the last stocks of a game, +10 % for the last game of a set — keys gameStocksLeft / gameStocksTotal and state.match.gameNumber / bestOf), and a total adds them up. List cards keep lists of items (objects with fields, plus "added" = when): add an item, add all of another list, sort / keep where / set a field with a formula per item ({{item.score}}), keep the first N (a number or a formula), keep the first N per field value (e.g. 3 per game), shuffle; formulas read lists with count, sum, avg, lowest, highest, find; single items by position: {{list.1.score}}, {{list.first.score}}, {{list[-1].score}} — or by a key: {{list[i].file}} with {{i}} counted up by a Calculate card (0 = the first). Lists and values are kept across restarts. Timer keys may hold keys (save-{{startFrame}}: every punish its own timer). "OBS: save replay" waits for OBS\'s file and hands on {{file}} (its id — store that, never a path), {{path}}, {{fileSeconds}} (its length) and {{savedAt}} (when it ends); a moment at {{startTime}} begins {{fileSeconds}} − ({{savedAt}} − {{startTime}}) / 1000 s into the file. {{state.replay.file}} is the running game\'s .slp (id). Media: "Set media" puts ONE thing on a key — a file id, a file path or a web link, with From / To in seconds (empty = the whole video); an empty source clears the key; every Media element with that key shows it in sync. To play a list one by one: Calculate i = 0 → (count > 0?) → Set media {{list[i].file}} → Timer {{list[i].seconds}} → Calculate i = i + 1 → i ≥ count? No → back; Yes → (shuffle →) i = 0 → back; a game start cancels the timer. A Highlight Replay element plays a list by its name — items with replay ({{state.replay.file}}), startFrame and endFrame — redrawn from the replay, no OBS needed. The shipped flow: a punish → score → total ≥ 40 → frames 2.5 s before to 1 s after (at most 10 s) into slippiReplayGame / Set / Today → 1.5 s → save the buffer → where the moment is in the file into replayBufferGame / Set / Today; game end → each kind: game = best 5, set = best 15 (time order), daily = today\'s top 20 % (at least 20, at most 100, at most 5 per game, best first) → Media keys game / set / daily loop their replayBuffer list; Highlight Replay lists slippiReplayGame / Set / Daily. A game start stops the loops and clears the game lists; a new set clears the set lists. Demo overlay "Highlights" shows both kinds. "Set media volume" overrides a Media element\'s volume. "OBS: replay buffer settings" sets length, format and file name prefix, and starts the buffer when it is off. Tell the AI assistant what a highlight is for you — it adapts the cards. Froggi never deletes replay files.',
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
