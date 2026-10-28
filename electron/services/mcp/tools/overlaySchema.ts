import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Animation } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
import { LEGACY_TRIGGERS } from '../../../../frontend/src/lib/utils/elementTriggers';
import {
	AnimationTrigger,
	VisibilityOption,
	VisibilityToggle,
} from '../../../../frontend/src/lib/models/types/animationOption';
import { getDefaultElementPayload } from '../../../../frontend/src/lib/utils/overlayElementDefaults';
import { getElementKind, ELEMENT_KIND_OPTIONS } from '../../../../frontend/src/lib/utils/elementKind';

const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

// Numeric-range → human label for the element catalog. Ranges come from CustomElement.
const RANGE_LABELS: Array<{ min: number; max: number; label: string }> = [
	{ min: 1900, max: 1999, label: 'Doubles (team names/stocks), ports, live fight stats, win chance, edge cancels & edgeguards' },
	{ min: 1000, max: 1999, label: 'Text / dynamic strings (percent, tags, scores, rank data)' },
	{ min: 2000, max: 2999, label: 'Character render images' },
	{ min: 3000, max: 3999, label: 'Boxes, iframes & controller inputs' },
	{ min: 4000, max: 4599, label: 'Game HUD (timer, countdown, ready/go, stocks, combos)' },
	{ min: 4600, max: 5399, label: 'Per-character / per-stock icon sets' },
	{ min: 6000, max: 6299, label: 'Character & rank images' },
	{ min: 7000, max: 7599, label: 'Stage striking' },
	{ min: 8000, max: 8299, label: 'Action state' },
	{ min: 9000, max: 9099, label: 'Minigames (Bingo board; Iron Man rosters, progress bars, character counts)' },
	{ min: 9100, max: 9199, label: 'Rank graph' },
	{ min: 9200, max: 9999, label: 'Misc' },
];

const labelFor = (id: number) => RANGE_LABELS.find((r) => id >= r.min && id <= r.max)?.label ?? 'Other';

/** Group of a condition label, for list_overlay_conditions' first step (labels are self-describing). */
const CONDITION_GROUPS: [RegExp, string][] = [
	[/^strike/i, 'Stage Striking'],
	[/^iron man/i, 'Iron Man'],
	[/^(team \d|doubles)/i, 'Doubles'],
	[/^post ?game/i, 'Post Game / Recent Games'],
	[/^player ?1/i, 'Player 1'],
	[/^player ?2/i, 'Player 2'],
	[/^current ?player/i, 'Current Player'],
	[/^(rank|slippi stats)/i, 'Rank'],
	[/^match/i, 'Match'],
	[/^session/i, 'Session'],
	[/^dolphin/i, 'Dolphin'],
	[/^game \d/i, 'Game Number'],
	[/^(game|radar)/i, 'Game State'],
];
const conditionGroup = (label: string) => CONDITION_GROUPS.find(([re]) => re.test(label))?.[1] ?? 'Other';

/** { id, name, kind } for every CustomElement, from the enum reverse map. `kind` (text|image|box)
 *  is the render/styling class the editor uses — it tells you which payload options apply. */
// Digital controller L/R buttons ship no artwork (render blank) — hide them from the catalog so the
// model can't pick them; the Analog L/R elements are the supported way to show triggers.
const HIDDEN_ELEMENT_IDS = new Set<number>([
	CustomElement.InGameCurrentPlayerControllerButtonL, CustomElement.InGameCurrentPlayerControllerButtonR,
	CustomElement.InGamePlayer1ControllerButtonL, CustomElement.InGamePlayer1ControllerButtonR,
	CustomElement.InGamePlayer2ControllerButtonL, CustomElement.InGamePlayer2ControllerButtonR,
	// Legacy duplicates of CurrentSetGameRecentPlayerNScore (4200/4201) — still render, hidden from the picker.
	CustomElement.MatchPlayer1Score, CustomElement.MatchPlayer2Score,
]);
const ALL_ELEMENTS = Object.entries(CustomElement)
	.filter(([, v]) => typeof v === 'number')
	.filter(([, v]) => !HIDDEN_ELEMENT_IDS.has(v as number))
	.map(([name, id]) => ({ id: id as number, name, kind: getElementKind(id as number), category: labelFor(id as number) }));

const AUTHORING_GUIDE = `# Froggi overlay element authoring

## Element kind decides which options matter
Every element is text, image, or box (by id range — same rule the editor uses). \`list_element_types\`
returns each element's \`kind\`. Set only the payload fields relevant to that kind (below); the rest are
ignored. Percent value elements (ids 1001-1006) are text whose color interpolates via \`percent\`.

## How an element sits on the page
Every element lives in one cell of a square (1:1) CSS grid. The element fills its grid box.
- **Text & images** scale to fill the box on whichever axis is limiting, then align inside it.
  Alignment is \`data.class.alignment\` — a flex utility class (default \`justify-center\`; also
  \`justify-start\`/\`justify-end\` horizontal, and vertical via \`items-start\`/\`items-center\`/\`items-end\`).
- **Images** honor \`data.image.objectFit\` (\`contain\` = fit whole image inside box, default;
  \`cover\` = fill box, crop overflow).
- **Text width:** make the grid box wide enough for the longest expected string. Text is sized to
  the box, so if the box only fits the current value the text will visibly resize as the value's
  length changes (e.g. percent 9% → 199%). Size the box for the max length up front.

## Default placement for per-player elements (don't ask — use the common convention)
When the user doesn't specify positions, use the standard Smash-broadcast layout instead of asking:
**Player 1 on the LEFT, Player 2 on the RIGHT**, anchored to the BOTTOM by default (the current player,
when used, goes wherever a single-player element makes sense — usually bottom-left). "In each corner"
means P1 bottom-left, P2 bottom-right unless the user says top. The grid is 512 columns × 288 rows for EVERY
aspect ratio (it stretches to the overlay), so y never exceeds 288. Bottom-left ≈
{x:8,y:168,w:112,h:112}, bottom-right ≈ {x:392,y:168,w:112,h:112}, top-left ≈ {x:8,y:8,...},
top-right ≈ {x:392,y:8,...}. Only ask if the request is genuinely ambiguous beyond left/right/corner.

## Payload shape (data)
Pass a partial payload to add_overlay_element / update_overlay_element; omitted fields use defaults.
- \`string\`: text content (for text elements).
- \`css\`: { background, color, borderTop/Right/Bottom/Left (rem), borderColor, opacity (0-1),
  fill, fillOpacity, stroke, strokeWidth (SVG/controller elements), customParent/customBox/customText/customImage
  (raw CSS strings applied to those DOM layers when advancedStyling is on) }.
- \`class\`: { alignment, rounded }.
- \`transform\`: { rotate (deg), scale ("x, y"), translate {x,y} } — use to rotate/flip/nudge.
- \`shadow\`: { x, y, spread, color } (box shadow). \`textStroke\`: { size, color }.
- \`font\`: { family, src }. family = a built-in ("default" = the scene font, "Melee", "Ultimate", "Roboto", "sans-serif", …) or, for a custom font, src = a file from add_overlay_font (family is set by the tools). \`image\`: { name, src, objectFit }.
- \`percent\`: { startColor, endColor } — for percent elements, the text color interpolates from
  startColor (0%) toward endColor as the value rises. Default reddens (#ffffff → #6f1622).
- \`advancedStyling\`: true to enable the raw custom* CSS fields.
- \`animationTrigger\` and \`visibility\`: see list_overlay_conditions / list_overlay_animations.

## Animations (data.animationTrigger & data.visibility)
Both carry \`{ in: AnimationSettings, out: AnimationSettings, selectedOptions }\`.
- **visibility**: element shows only while its conditions hold; plays \`in\` when it appears and
  \`out\` when it hides. \`selectedOptions\` is an ARRAY of objects mapping a VisibilityOption label →
  toggle (0 Disabled / 1 must-be-true / 2 must-be-false).
- **animationTrigger** (= animation 1): replays \`in\` (then \`out\`) whenever one of its triggers fires.
  Two kinds of trigger, combine freely (any one fires it):
  - \`elementTriggers\`: \`[{ source, when }]\` — replays when an element of the SAME scene changes what it
    shows. \`source\` = "self" (this element) or another element's item id; \`when\` = "change" | "increase"
    | "decrease" (increase/decrease compare the first number the element shows, e.g. percent going up vs
    resetting to 0 on respawn). An element that is not shown has no value: appearing never fires (scene
    animations / visibility conditions handle appearing). The Video element fires on a new reel for its
    key, not on every clip. This covers EVERY element (win chance, fight/edge stats, video, characters…).
    New elements get \`[{source:"self", when:"change"}]\` by default (does nothing while in/out are "none").
  - \`selectedOptions\`: OBJECT mapping a named AnimationTrigger label → boolean, for game EVENTS that are
    not a shown value — e.g. "Player1 Percent Increase" to shake a character render on damage, stock loss,
    countdown, technique, stage struck. Legacy "value changed" labels (not listed by
    list_overlay_conditions) still work in old overlays but are hidden in the editor — use an element trigger instead.
- **extraAnimationTriggers**: optional array of more \`{ in, out, selectedOptions, elementTriggers }\` on the
  same element (animation 2, 3…), each with its own animation and triggers, nested so they can play at
  once (e.g. a pop on "self increase" + a shake on another element's change). A trigger (named label or
  source+when) belongs to ONE animation of an element — never repeat it across its animations.
- An animation whose in and out are both "none" never replays.
- \`in.type = "count"\` (trigger animations only): instead of replaying, the element's number COUNTS from
  its old value to the new one over \`in.options.duration\` with \`in.options.easing\` (30 ticks/s, keeps
  the new value's format). Only when old and new are both pure numbers (minus, digits, 1,500 grouping,
  decimals, optional trailing %) — otherwise the value just switches. Use it with a trigger that fires on
  the change, e.g. elementTriggers [{source:"self", when:"change"}] on a percent / score / rating element.
- AnimationSettings = { type: Animation, options: { delay, duration, easing, start, x, y } }.
  x/y are used by fly/slide. duration/delay in ms.

## Player percent — which element to use
There are two families of in-game percent element:
- **Pre-animated ("Custom")** — InGamePlayer1PercentCustom (1008), InGamePlayer2PercentCustom (1009),
  InGameCurrentPlayerPercentCustom (1007), + DecimalCustom (1010-1012). Renders per-digit with a
  built-in punch animation on each number as damage rises, plus start→end color interpolation.
  **Default to this** for a player's damage percent unless the user asks for a specific/different
  animation.
- **Vanilla** — InGamePlayer1Percent (1002), InGamePlayer2Percent (1003), InGameCurrentPlayerPercent
  (1001), + Decimal (1004-1006). Plain text number with no built-in per-digit animation. Use this
  when you want to drive a *different* animation yourself via \`animationTrigger\`.
- **Number only** — InGamePlayer1PercentRaw (1014), InGamePlayer2PercentRaw (1015),
  InGameCurrentPlayerPercentRaw (1013): the percent as a plain number without "%" (pair it with a
  CustomString "%" or use a Count animation).
All support \`percent.startColor\`/\`percent.endColor\`. Percent reads as 0 when the player is dead or
not in game (the underlying value is null then).

## Default Smash HUD layout (Melee & modern Ultimate)
Standard bottom HUD: **Player 1 bottom-LEFT, Player 2 bottom-RIGHT**. Each side = a row of character
stock icons with that player's damage percent just below. Same for Melee and Ultimate (Ultimate usually
adds the player name above the stocks; Melee uses the port-colored panel) — the stock ORDER rule is
identical for both.

**Character images (stock icons, portraits, renders)** — use the Character elements:
InGamePlayer1Character (6225), InGamePlayer2Character (6235), InGameCurrentPlayerCharacter (6215), with
payload \`assetPack\` = a pack id from list_asset_packs: "builtin-stock" (default, stock icons),
"builtin-portrait", "builtin-render-left", "builtin-render-right", or a user's custom pack (their own
art per character + skin). The image follows the player's character AND skin automatically. The older
CharacterIcon (6220/6230/6210) and CharacterRender (2003/2004…) elements still render but are legacy.

**Stock icons** — use the Character element (assetPack "builtin-stock" or a custom icon pack), one
element PER stock, laid left→right. Gate each on that stock number via visibility
\`selectedOptions [{ "Player N Stock K": 1 }]\`:
- LEFTMOST icon → "Player N Stock 1", next → "Player N Stock 2", … RIGHTMOST → "Player N Stock <max>".
- "Player N Stock K" is true while the player has AT LEAST K stocks, so icons drop from the RIGHT as
  stocks are lost and the **last remaining stock stays on the LEFT**.
- Use the SAME left→right = 1→max order for BOTH players — P2 is NOT mirrored. (Getting this backwards,
  with the last stock on the right, is the common mistake.)
- Demo hud.json reference: P1 icons x≈119/136/153/170, P2 x≈295/312/329/346, all y≈215, gated Stock
  1→4 left→right.

**Percent** — just below each player's stock row (demo: P1 x≈114, P2 x≈291, y≈239). Default to the
pre-animated Custom variant (see above). Reads 0 when that player is dead.

**Separate layers** — new scenes have ONE layer; add more with add_overlay_layer. Layer 0 is drawn
ON TOP; higher indexes are further behind (backgrounds/panels → higher index than the text over them).
Group by kind, split by proximity: all stock icons can share one layer, percentages go on another;
HUD elements can share a layer, but elements close together (touching / nearly overlapping) go on
different layers. Overlapping items on one layer fight for grid space, and separate layers animate
independently (stock-loss vs percent punch). Name every layer you add (add_overlay_layer titles, or
rename_overlay_layer) after what it holds — the user sees those names in the layer panel.

**Minigames in an overlay** — minigames are overlay elements, so they can sit in a custom layout, in
OBS or injected into Dolphin (Windows, set_overlay_injection):
- BingoBoard (9000): the live board of the current Bingo session.
- Iron Man, one element per piece (Player 1 = this Froggi's player, Player 2 = the opponent; Player 2
  elements are empty in solo): IronManPlayer1Roster / IronManPlayer2Roster (9011/9012) — only the
  characters and which are out; the icons fit the box (up to 96 px at 1080p, the grid reflows), so any box
  shape works. IronManPlayer1/2ProgressBar (9013/9014, box: background/border around the bar; green /
  red fill = characters done: depleted in Standard, completed in Full Roster / Challenge),
  IronManPlayer1/2CharacterTotal (9015/9016) and IronManPlayer1/2CharactersRemaining (9017/9018) are text.
  Names: use MatchPlayer1Tag / MatchPlayer2Tag (4420/4421, also listed under Iron Man in the editor) — they
  follow the game's player order, not you/opponent. Conditions (group "Iron Man"): Iron Man Active, Mode Standard / Full Roster /
  Challenge, Player 1 / Player 2 Won, Carry-over Pending. The old combined IronManRoster (9010) still
  renders in existing overlays but isn't offered in the editor — don't add it to new overlays.
The Bingo board shows a sample in the editor and "No active … session" when nothing is running. The full-page
alternative is the "Game Preview" browser source (/obs/game-preview).

**Game HUD references** — before placing in-game elements, call get_game_hud_reference (list, then
fetch the one matching the user's game + HUD setup, passing the overlay's aspectRatio — 4:3 / 73:60 are
center crops of the 16:9 references). Ask which HUD placement they use if unsure (default vs. a
centered-HUD gecko code). Use the regions to ADD elements in the free space around the game HUD, or to
REPLACE it with a custom HUD by placing stock/percent/timer elements on those exact regions. Preview
in-game work over the matching screenshot: show_overlay_preview background=<reference id> (use
"melee-16x9-no-hud" for a replacement HUD). The editor has the same screenshots under "Game HUD
background…" next to Add Background. After adding animations, call test_overlay_animation so the user
sees them play in the preview.

**Recoloring images** — any image element (character/stock icons, renders, rank icons, stage, Custom
Image) takes \`colorOverlay: {enabled:true, color:"#ffffff", strength:100}\`: 100 = solid silhouette in
that color (white/black/team color stock icons), lower = tint that keeps detail. Layer a silhouette in
the backdrop's color over a panel for a "hole punch" look.

**Images** — store the image first with add_overlay_image (url, local filePath, base64, or picker:true
to let the user choose a file in Froggi), then use the returned fileName: a CustomImage element (2000)
with payload \`{"image":{"name":fileName,"objectFit":"contain"}}\`, or a scene background via
configure_overlay_scene \`background {type:"Custom Image", customImage:{name:fileName, objectFit:"cover"}}\`.
**Video** (2100, any scene) — plays what a flow points \`key\` at, payload \`{"video":{"key":"game","volume":0}}\`
(volume 0–100, 0 = muted; flow card setVideoVolume overrides it): a highlight reel (buildHighlightReel — clips of
OBS replay-buffer files, no cutting, in order, looping) or one whole file (setHighlightVideo {key, path}). Every
screen plays the same position (shared clock); the next 2 clips are loaded ahead. The installed, off-by-default flow
"highlights" builds keys "game" (best 5 of the game), "set" (the set, game by game) and "tournament" (shuffled);
demo overlay "Highlights" shows them; the Game & set stats demo has "game"/"set" below its stats. MP4/MOV (OBS format
Hybrid MP4 recommended). The element DEPENDS on a flow: until an enabled flow builds a reel / sets a file for its
key it shows nothing (the "highlights" flow ships OFF — turn it on, or build one, when adding Video).
**Videos** — an .mp4/.webm stored the same way plays muted on a loop in a CustomImage element (not as a
scene background: for a moving background use a full-size CustomImage on the bottom layer). The live
overlay preloads its images and videos (current scene first, thin bar at the top while loading).

**Backdrops for several elements** — duplicate_overlay_layer copies a layer ON TOP of the original
(the original moves to layerIndex+1); turn the lower copy's elements into translucent boxes
(CustomBox 3000, e.g. css.background "#00000080") so every element gets a matching backdrop.

**Timer** — elements InGameTimerMinutes (4300), InGameTimerSeconds (4301), and the milliseconds/
centisecond digits InGameTimerMilliseconds1/2/3 (4302/4303/4304). Placement differs by game:
- **Melee**: timer CENTERED at the top, and INCLUDE the centisecond decimals (minutes:seconds + 2 ms
  digits, e.g. 4302+4303).
- **Ultimate**: timer TOP-RIGHT, NO decimals (minutes + seconds only).
Gate timer digits on \`Game Running=True, Game Paused=False, Game Countdown=False, Game Ready=False,
Game Go=False\` so they hide during the intro/countdown.

**Player radar** (InGamePlayerRadar 3200, or InGamePlayerRadarAnimated 3201 = live character graphics):
- **Melee**: NO radar (it shows a magnifying bubble instead). **Ultimate**: include the radar.
- Default to the plain radar (3200); use the animated one (3201) when the user wants live character
  graphics on it. For a full live game view with a following camera use InGameLiveCamera (3202).
- Show it ONLY while someone is off stage, in ONE corner. Ultimate puts it in the top corner on the
  SAME side the first fighter left from (off right → top-right) and keeps it there until everyone is
  back. Use the game conditions "Radar Left" / "Radar Right" — that latch is built in and only one is
  ever on, so two radars never show at once: top-right radar = groups [{Radar Right:1},
  {Game Running:1}, {Game Paused:2}], top-left = the same with "Radar Left". (Other conditions:
  "Player N Off Stage Left/Right" = that player off stage on that side, per player — can be true on
  both sides at once; "Player N Off Stage" = a single fixed radar.)
- Mirror the pair (x and 512-x-w) and keep them clear of the timer (Ultimate's timer is top-right →
  put the right radar under it). Demo HUD: x≈8 / x≈376, y≈44, 128×74.

**Visibility logic** — \`data.visibility.selectedOptions\` is a LIST OF GROUPS. The element is visible
when EVERY group matches; a group matches when ANY of its entries holds (1 = condition true, 2 =
condition false, 0 = ignored). So: AND across groups, OR inside a group. Examples:
- "while Player 1 or Player 2 is dead": one group {Player 1 Alive:2, Player 2 Alive:2}
- "while the game runs AND player 2 has ≥ 3 stocks": groups [{Game Running:1}, {Player 2 Stock 3:1}]
list_elements shows each element's groups as visibleWhen.

**Stock-loss display (Ultimate-style)** — both players' stocks shown big mid-screen while someone is
respawning: a centered row of stock icons where each icon has groups [{Player N Stock K:1},
{Player 1 Alive:2, Player 2 Alive:2}, {Game Running:1}] (it shows while either player is dead, i.e.
between the KO and the respawn). The demo HUD's mid-screen stock set (layers 5–7) is exactly this.

**Countdown & end text** — the "3..2..1" and TIME/GAME callouts:
- Countdown: InGameTimerSecondsCountdown (4305), centered, visible only the last ~5s via visibility
  \`Game Countdown=True, Game Paused=False\`, with \`animationTrigger.in.type = "scale"\` so each number
  pops as it counts.
- Timer runs out → show a "Time" text element gated on visibility \`Game Time\`.
- Game ends (by stocks) → show a "Game" text element gated on visibility \`Game End\`.
- Intro Ready/Go use conditions \`Game Ready\` / \`Game Go\` (see the game-start sequence below).

**Game-start sequence** (how the intro maps to conditions — Slippi frames start at −123, the match
timer starts at frame 0):
- \`Game Ready\` = frame ≤ −36: the intro, before characters can move (Melee shows "READY").
- \`Game Go\` = frames −36 … −1: the "GO!" moment (~0.6s) right before control starts.
- \`Game Running\` = the match is live (frame ≥ 0); \`Game Paused\` while paused.
- \`Game Countdown\` = the LAST 5 seconds of the match timer (the 5…1 before TIME), not the intro.
  Melee has no 3-2-1 at the start; Ultimate shows 3-2-1-GO during its intro (still \`Game Ready\`/\`Game Go\`).
- End: \`Game End\` (stocks), \`Game Time\` (timer ran out), \`Game Tie\`.
Recipe — custom "READY" / "GO!" callouts: two centered CustomString elements, one visible on
\`Game Ready=True\`, the other on \`Game Go=True\`, each with a scale or fade visibility in/out animation.
Hide in-game HUD elements during the intro with \`Game Ready=False, Game Go=False\` (as the timer does).

**Set score** — CurrentSetGameRecentPlayer1Score / 2Score (4200 / 4201) = games each player has won in
the current set (updates after every game). For a "1 - 0" scoreboard: score, a CustomString "-", score.
(MatchPlayer1Score/2Score 4422/4423 are older duplicates kept only so existing overlays still render.)

**Players & doubles** — per-player elements are Player 1 / Player 2 / Current Player. In doubles (Slippi
teams games) Team 1 is the team with the lowest port in the set's first game (colour doesn't matter) and keeps its slot
for the whole set even if colours swap; within a team the lower port is Player 1. Player 1 elements
show Team 1 · Player 1 and Player 2 elements show Team 2 · Player 1 — set payload.playerSlot
("t1p1" | "t1p2" | "t2p1" | "t2p2") on any Player 1/2 element to show another doubles player (e.g. a
Player1 percent with playerSlot "t1p2" = Team 1's second player). Two teammates on the same character:
the higher port's icons are drawn lighter automatically. The set score counts team wins. Visibility
conditions "Player 1/2 …" refer to Team 1 · P1 / Team 2 · P1. Free-for-all (3+ teams) isn't supported.
Doubles elements: Team1Name/Team2Name (1910/1911; the host's team names from the Dashboard, else
"Tag & Tag"), Team1Stocks/Team2Stocks (1920/1921), CurrentPlayerTeamName/OpponentTeamName and
…TeamStocks (1930–1933), Player1Port/Player2Port (1900/1901, "P1"–"P4", slot-aware). Doubles conditions:
"Doubles Game", "Team N Player 2 Alive / Stock 1–4 / Combo / Off Stage (Left/Right)", "Team N Alive",
"Team N Stocks <= 1…8". Live fight stats (singles too; Team = both players, in singles just that
player): Live{Player1|Player2|Team1|Team2}{Damage|Kos|AvgKoPercent|AvgDeathPercent} for this game
(1940–1955) and LiveMatch… for the whole set (1960–1975) — damage dealt to opponents, KOs (last hitter),
average percent of KO'd opponents, average own death percent. Win chance (1976–1979):
WinChance{Game|Set}{Player1|Player2} — "64%" from stocks + percent (doubles: the team), set = this game's
chance + set score with later games 50/50 (explain_topic win-chance); the game one is empty outside a game. Edge stats (Post Game / Post Set, update at
game end): {PostGame|PostGameMatch}{Player1|Player2}{EdgeCancels|EdgeCancelsSlow|Edgeguards|EdgeguardAttempts|
EdgeguardPercent} (1980–1989 this game, 1990–1999 whole set; edgeguards = opponent knocked off stage in
hitstun and lost the stock before getting back). Post-game Player 1/2 stats follow
playerSlot too. The demo overlay "doubles" is a 4:3 game in a 16:9 canvas: team data in the side bands
(teams kept together), per-player stocks + percent along the bottom of the game.
Demo "game-stats" (Game & set stats): Post Game = this game's fight + punish stats per player in the side
bands and the set so far in the middle; Post Set = set totals (incl. L-cancel %, inputs/min) and a row per
game — stage, both characters (loser faded via "Post Game N Summary Player P Win" = False, winner ringed),
4 stock icons each (lost stocks faded: "Post Game N Summary Player P Stock K"), score.

## Designing a good overlay (read before building)
**Ask the aspect ratio first — never assume 16:9.** Ask what the overlay is for and its shape: the
stream canvas / OBS scene (usually 16:9) or the game window when injected (16:9, 4:3, Dolphin's 73:60,
ultrawide 21:9, or a phone-like 19:9). Any ratio works: set it with create_overlay /
update_overlay_settings aspectRatio {width,height} (e.g. 19:9). The grid stays 512×288 for every ratio —
horizontal, 4:3 or vertical — and stretches with it (on a vertical overlay each column is very narrow
and each row tall), so element proportions change with the ratio: check them in show_overlay_preview.
Start from the use: (a) REPLACE the game HUD — injected into Dolphin or over the game in OBS, with
Melee's HUD hidden by a gecko code (rebuild percent, stocks, timer, callouts); (b) ADD around the game
HUD (game HUD stays — use get_game_hud_reference regions and keep off them); (c) full-screen scenes
(Menu, Post Game, Post Set, Strike Phase) where nothing is being played.
- **Keep gameplay clear.** During play only the edges are yours: a bottom band (y ≳ 200 of 288) for
  player panels, the top corners for timer / radar / score. Nothing large in the middle except
  short-lived callouts (READY, GO, GAME, stock-loss display) that hide again by condition.
- **Game narrower than the overlay** (injected or captured: the overlay fills the game height, centred).
  Sides are cropped: visible x ≈ 256·(1 − g/o) … 512 − that, with g = game ratio, o = overlay ratio.
  16:9 overlay on a 4:3 game → x≈64–448; on 73:60 → x≈81–431. A wider game (21:9 on 16:9) gets
  margins instead. Ask which game ratio(s) they play and keep essentials inside the visible band —
  or make the overlay the game's own ratio.
- **Symmetry and order.** P1 left, P2 right, mirrored (x₂ = 512 − x₁ − w); same sizes and styling for
  both; consistent per-player colours (port/team colour accents).
- **Hierarchy.** Percent biggest, then stocks, then name/tag, then small extras (rating, rank icon,
  score). Timer medium. Demo sizes: percent box ≈100×30, stock icons ≈16×16, radar 128×74.
- **Readability over gameplay.** High contrast; a translucent dark backing box (CustomBox,
  "#00000080", rounded) behind text that sits over the stage; one font family per overlay (scene font);
  text boxes sized for the longest value.
- **Show things only when they matter** (this is what makes a HUD feel like a real game):
  HUD hidden during the intro / pause / final countdown (Game Ready/Go/Countdown/Paused = false);
  callouts only at their moment; radar only while someone is off stage, on that side; stock-loss
  display only between KO and respawn; post-game stats in the Post Game scene, not in-game.
- **Motion with purpose.** Scene in/out "fly automatic" (default); a flash/shake on "PlayerN Stock
  Loss"; the pre-animated percent elements; no constant looping animation. Run test_overlay_animation.
- **Structure.** One centred callout per layer; backgrounds/backdrops on lower layers; name every layer.
- **Melee vs Ultimate look.** Melee: timer top-centre with centiseconds, panels in port order along the
  bottom (stocks above percent over the series emblem), no radar, READY → GO!. Ultimate: timer
  top-right, centred bottom panels (portrait + big percent with one decimal, name plate, stock heads
  below), side-aware radar, big mid-screen stocks after a KO. Details: get_game_hud_reference (hudGuide).
- **Check it.** show_overlay_preview with the matching HUD background (and the 4:3 crop if relevant),
  test animations, then show the user.

**Stage striking overlays** (Strike Phase scene) — build them from elements + conditions:
- Plain stage images StrikeStageImageFoD/BF/FD/DL/YS/PS (7600–7650, image kind) — just the picture.
- Per stage exactly one state condition is true: "Strike: <Stage> Available / Locked / Struck Or
  Banned / DSR Blocked / Picked" (Locked = counterpick during game 1 or not in the ruleset). Put the
  images on a low layer and one layer per state above them with a CustomBox over each stage, shown on
  that stage's state (grey #111111b3 locked, yellow #facc158c struck, red #ef44448c DSR, green
  border picked).
- Phases: "Strike Phase: Char Select / RPS / RPS Result / Striking / Stage Ban / Stage Pick /
  Character Pick (game 2+) / Playing / Complete", "Strike: Game 1", "Strike: Stage Agreement
  Pending"; turn: "Strike Player 1/2 Turn" (+ StrikeCurrentStriker 7030 text).
- Picks: StrikePlayer1Character / StrikePlayer2Character (7200/7210) and, in doubles, each team's
  second player's pick StrikePlayer1PartnerCharacter / StrikePlayer2PartnerCharacter (7201/7211);
  names StrikePlayer1Name/2Name (7220/7230; team names in doubles); set score as striking counts it
  (Slippi games + games reported by hand) StrikePlayer1Score/2Score (7240/7250).
- Rock-paper-scissors: StrikeRpsPlayer1Icon / StrikeRpsPlayer2Icon (7001/7011) = the pick as a hand icon
  (built-in Fluent Emoji hands — payload rpsIconStyle "outline" (element text colour, default) | "color" —
  or the user's own files: payload rpsIcons {rock, paper, scissors} = file names in the overlay's image
  folder). Hidden until BOTH picked
  (a ✓ shows a ready player); on the reveal it shuffles ~1.5 s, then lands on the pick (element triggers
  see only the landing). Text versions: StrikeRpsPlayer1Choice/2Choice (7000/7010), winner name
  StrikeRpsWinner (7020).
- Demo "Stage Striking" (id stage-striking) is exactly this — copy it with duplicate_overlay.

## Demo HUD walkthrough (demo "HUD", inGame scene — read it with list_elements)
A complete replacement for Melee's HUD (meant for a no-HUD gecko code), 16:9, font Roboto Bold Italic.
Its 15 layers are named; index 0 is on top. What each does and when it shows:
- 0 "GAME / TIME / TIE banner lines" — two thin full-width CustomBox lines (y≈86 and y≈194) framing the
  end callouts; visible on {Game Tie | Game Time | Game End}.
- 1 "Final countdown" — InGameTimerSecondsCountdown, big and centered; {Game Countdown} AND {NOT Paused};
  animationTrigger "Game Countdown" pops each number.
- 2 / 3 / 4 "TIE" / "TIME" / "GAME" callouts — centered CustomStrings on Game Tie / Game Time / Game End.
- 5–7 Stock-loss display (Ultimate-style), all gated {P1 dead | P2 dead} AND {Game Running}, i.e. from
  a KO until the respawn: 5 = each player's StocksRemaining as a big number (P1 left, P2 right,
  animationTrigger "PlayerN Stock Loss"), 6 = 4 stock icons per player (Stock 1…4) on a band at y≈137,
  7 = the dark CustomBox band behind those icons.
- 8 "PAUSE label" — top-left text on Game Paused.
- 9 "Timer" — top-left MM:SS:mmm (Minutes, ":", Seconds, ":", Milliseconds3); {Game Running} AND NOT
  Paused/Countdown/Ready/Go, so the big countdown (layer 1) takes over in the last 5 seconds.
- 10 "Player HUD: stocks + percent" — the bottom panels: 4 stock icons per player (y≈215) above the
  pre-animated percent (InGamePlayerNPercentDecimalCustom, y≈239). P1 x≈114, P2 x≈291.
- 11 "Player radar (Ultimate: one corner)" — two radars, top-left and top-right (y≈44, under the timer
  row) on "Radar Left" / "Radar Right" AND Running AND NOT Paused: one radar, on the side the first
  fighter went off, held until everyone is back (Ultimate's behaviour).
- 12 "Series symbol (behind percent)" — each character's series emblem under the percent (a lower
  layer so it draws behind layer 10), on Game Running.
- 13 / 14 "GO" / "READY" callouts — centered text on Game Go / Game Ready (NOT Paused).
Why split like this: every centered callout (1–4, 13, 14) occupies the same box, so each has its own
layer; the stock-loss parts overlap each other; the series symbol sits under the percent. Elements that
never overlap (timer digits; one player's stocks + percent) share a layer.
To restyle it: duplicate_overlay "hud", then edit/move elements on these layers (keep each layer's role).

## Controller inputs
**Controller elements are SELF-DRIVING — no triggers, no conditions.** Each button/stick/trigger
element renders its own live state from the game's controller input automatically: buttons show their
pressed art when held, sticks move, triggers fill by depth. In the demos EVERY controller element has
animationTrigger.in = none and NO visibility conditions. Just place the element — do NOT add an
animationTrigger or a "pressed" visibility condition; that's already built in.

**Elements.** Per player there's Player1 (3120-…), Player2, and CurrentPlayer variants. Current player:
A 3100, B 3101, X 3102, Y 3103, DPad 3104, main analog stick 3160, C-stick 3161, Z 3108, Analog trigger
L 3150 / R 3151. (Player1: A/B/X/Y 3120-3123, Z 3124, DPad 3128, sticks 3160.., Analog L/R 3152/3153.)
There is no Start-button element. For L/R ALWAYS use the Analog trigger elements (a fill bar) — the
digital ControllerButtonL/R ship no art and are hidden from the catalog.

**Layout (physical GameCube arrangement).** Read the demo "Current Player Controller" (or "Player1
Controller") with get_overlay for exact coords — replicate that relative arrangement. From the demo
(512×288 grid): AnalogL top-LEFT (x≈50,y≈10) / AnalogR top-RIGHT (x≈331,y≈10) — L left, R right; Z top-right
(x≈466,y≈10); main stick left (x≈66,y≈67); A big center-right (x≈367,y≈71); B lower-left of A
(x≈324,y≈124); X right of A (x≈442,y≈49); Y above A (x≈345,y≈36); C-stick lower-middle (x≈283,y≈185);
D-pad lower-left (x≈132,y≈185). To fill the window, scale the whole set UNIFORMLY (same factor on
x/y/w/h) about the center so the buttons keep their shape and relative positions — never distort
individual elements. Drop the D-pad/other buttons by simply not adding those elements.
Getting L and R swapped (R on the left) is wrong — L is always the LEFT trigger, R the RIGHT.
For a "simple controller in a corner" you can use the whole demo controller as the reference and scale
it into the corner; don't hand-place a broken subset.

## Rank change scene (how the rating-update animation works)
When a RANKED set ends (the best-of is decided), Froggi switches to the \`rankChange\` scene and runs a
TWO-PHASE update so the rating change can be shown/animated (logic in statsDisplay handlePostGame /
handlePredictedRank):
1. **Pre-update phase** — the player's OLD rank + rating are shown first (condition
   \`Rank Stats Pre Update\`).
2. ~2s later Froggi applies the NEW rank stats — from the Slippi API, or a local estimate via
   predictNewRating (predictedRating.win/loss) shown immediately while the API confirms — and the scene
   enters the **post-update phase** (condition \`Rank Stats Post Update\`), where the rating element now
   holds the NEW value.
The same rating element's value going old→new between the two phases is what produces the "rating
updating" effect; the rating-difference element shows the +/- delta.

Elements (see the demo "Rank - Inject.json", \`rankChange\` scene, read it with get_overlay):
- SlippiRankCurrentPlayerRankIcon (6000), SlippiRankCurrentPlayerRankText (4006),
  SlippiRankCurrentPlayerRating (4009), SlippiRankCurrentPlayerConnectCode (4012),
  SlippiRankCurrentPlayerTag (4000) — badge/name/rating, animated in/out with \`fly\`.
- SlippiRankChangeRatingDifference (4140) — the +/- rating delta, gated visible on BOTH
  \`Rank Stats Pre Update\` and \`Rank Stats Post Update\`.
Conditions/triggers: \`Rank Stats Pre Update\` / \`Rank Stats Post Update\` gate each phase;
to animate when the rating changes, give the rating element an element trigger
\`{source:"self", when:"change"}\` (the old named "Rating Change" triggers are legacy). (A rolling numeric counter on the rating is planned but not built yet — today the value swaps
old→new between the phases.)

## Player state, techniques & frame (in-game live data)
Froggi tracks each player's live action state and detects techniques from the action-state sequence
(actionStateService). Overlay elements to surface them:
- **Action state**: InGamePlayer1ActionStateName (8100) / …Player2 (8200) / …CurrentPlayer (8000) show
  the human state name; ActionStateId (8101/8201/8001) the raw id; StateCategory (8115/8215/8015) the
  grouping. Use these for a "player state" readout.
- **Technique**: InGamePlayer1Technique (8116) / …Player2 (8216) / …CurrentPlayer (8016) show the most
  recently detected technique. Detected techniques (13): wavedash, waveland, ledgedash, shield_drop,
  ground_tech ("Tech"), tech_roll, wall_tech, ceiling_tech, pivot, dashdance, moonwalk,
  l_cancel_success, l_cancel_miss. (pivot/dashdance/moonwalk are heuristic/best-effort.)
- **Frame**: InGameFrame (8017) shows the current game frame number.
- Animate on change with the AnimationTrigger conditions "Player1/Player2/Current Player State Change"
  (action state changed) and "Player1/Player2/Current Player Technique Change" (a new technique fired) —
  set on the element's animationTrigger.selectedOptions, e.g. put a scale on InGamePlayer1Technique with
  "Player1 Technique Change" so it pops each time a technique lands. Verify names via
  list_overlay_conditions (kind:"trigger", search:"Technique") / list_elements.

## Recipes (all shipped in the demo overlays — read them with get_overlay)
- **Percent reddens as damage rises**: use a percent element (default to the Custom variant, e.g.
  InGamePlayer1PercentCustom) and set \`percent.startColor\`/\`percent.endColor\`. Built in by default.
- **Percent flashes when that player takes damage**: the Custom variant already animates per digit; to
  add your own effect use the vanilla variant, set \`animationTrigger.in.type\` (e.g. \`scale\`) and
  \`animationTrigger.selectedOptions["Player1 Percent Increase"] = true\`.
- **Countdown / Ready / Go animate**: element with \`animationTrigger.in.type = "scale"\` and trigger
  \`"Game Countdown"\`; put Ready and Go on separate layers, each with its own in/out animation and a
  visibility condition (\`"Game Ready"\` / \`"Game Go"\`).
- **Stocks drop out when lost**: stock element with \`animationTrigger.out\` (e.g. \`fly random\`, shown
  in the app as "Damage" — a hit-styled fly) and trigger \`"Player1 Stock Loss"\` (see demo hud.json
  elements 4314/4315). Use \`fly random\` for any damage/hit-reaction effect.
- **Show only while alive / on a given stock**: visibility \`selectedOptions\` with \`"Player 1 Alive"\`
  or \`"Player 1 Stock 3"\` set to 1.`;

export function registerOverlaySchemaTools(server: McpServer) {
	server.registerTool(
		'describe_element_options',
		{
			description: 'The overlay-authoring guide: how elements fit the grid box, the full element payload schema, styling/transform options, how animations & conditions work, and concrete recipes (percent color, damage/stock-loss animations, Ready/Go). Read this before building or editing an overlay. Includes current default payload values.',
			inputSchema: {},
		},
		async () => text(
			`${AUTHORING_GUIDE}\n\n## Options that apply per kind\n\`\`\`json\n${JSON.stringify(ELEMENT_KIND_OPTIONS, null, 2)}\n\`\`\`` +
			`\n\n## Default payload (getDefaultElementPayload)\n\`\`\`json\n${JSON.stringify(getDefaultElementPayload(), null, 2)}\n\`\`\``,
		),
	);

	server.registerTool(
		'list_element_types',
		{
			description: 'Catalog of CustomElement types (the elementId for add_overlay_element). ~700 exist; pass a filter substring (e.g. "percent", "controller", "stock", "player1", "timer") to narrow. Names are self-describing. Omit filter to get the category legend + counts.',
			inputSchema: { filter: z.string().optional() },
		},
		async ({ filter }) => {
			if (!filter) {
				const byCat: Record<string, number> = {};
				for (const e of ALL_ELEMENTS) byCat[e.category] = (byCat[e.category] ?? 0) + 1;
				return text({ hint: 'Pass a filter substring to list matching elements.', categories: byCat, total: ALL_ELEMENTS.length });
			}
			const f = filter.toLowerCase();
			const matches = ALL_ELEMENTS.filter((e) => e.name.toLowerCase().includes(f)).map(({ id, name, kind }) => ({ id, name, kind }));
			return text(matches.length ? matches : `No element names match "${filter}".`);
		},
	);

	server.registerTool(
		'list_overlay_animations',
		{
			description: 'Available animation types (data.animationTrigger / data.visibility .in/.out .type) and the AnimationSettings options schema.',
			inputSchema: {},
		},
		async () => text({
			types: Object.values(Animation),
			// Human-facing meanings — the stored `type` value stays the enum string (kept stable so
			// existing overlays don't break); only the label shown to users is friendlier.
			labels: {
				[Animation.FlyRandom]: 'Damage — a randomized fly that looks like the element getting knocked by a hit. Use this for damage/stock-loss effects.',
			},
			usesXY: [Animation.Fly, Animation.FlyRandom, Animation.FlyAutomatic, Animation.Slide],
			options: { delay: 'ms before start', duration: 'ms', easing: 'CSS/svelte easing name, e.g. cubicOut', start: 'scale/blur start value', x: 'fly/slide x offset', y: 'fly/slide y offset' },
			note: 'in plays on appear/trigger, out on hide. Set on both visibility (condition-gated) and animationTrigger (event-gated). "fly random" is shown in the app as "Damage".',
		}),
	);

	server.registerTool(
		'list_overlay_conditions',
		{
			description: 'Condition options for showing elements and triggering animations, in two steps to keep answers small: without `group`/`search` it returns the encodings + the groups with counts; then pass `group` (a group name from that list) or `search` (a word, e.g. "stock", "Iron Man") for the labels. kind="visibility" → VisibilityOption labels (element visible only while conditions hold; encoded as an array of {label: 0 Disabled|1 True|2 False} in data.visibility.selectedOptions). kind="trigger" → AnimationTrigger labels (replay animation on event; encoded as {label: boolean} in data.animationTrigger.selectedOptions) + the element-trigger encoding. Omit kind for both.',
			inputSchema: {
				kind: z.enum(['visibility', 'trigger']).optional(),
				group: z.string().optional(),
				search: z.string().optional(),
			},
		},
		async ({ kind, group, search }) => {
			const pick = (labels: string[]) => {
				if (!group && !search) {
					const groups: Record<string, number> = {};
					for (const l of labels) groups[conditionGroup(l)] = (groups[conditionGroup(l)] ?? 0) + 1;
					return { groups };
				}
				const q = search?.toLowerCase();
				return {
					options: labels.filter(
						(l) => (!group || conditionGroup(l).toLowerCase() === group.toLowerCase()) && (!q || l.toLowerCase().includes(q)),
					),
				};
			};
			const out: Record<string, unknown> = {};
			if (kind !== 'trigger') {
				out.visibility = {
					toggle: { Disabled: VisibilityToggle.Disabled, True: VisibilityToggle.True, False: VisibilityToggle.False },
					encoding: 'data.visibility.selectedOptions = [ { "<label>": 1 }, ... ]',
					...pick(Object.values(VisibilityOption)),
				};
			}
			if (kind !== 'visibility') {
				out.trigger = {
					encoding: 'data.animationTrigger.selectedOptions = { "<label>": true }',
					...pick(Object.values(AnimationTrigger).filter((t) => !LEGACY_TRIGGERS.has(t))),
					legacyNote: 'Legacy "value changed" triggers (still work, hidden in the editor) are not listed. For a new overlay use data.animationTrigger.elementTriggers [{source: "self" | <item id>, when: "change" | "increase" | "decrease"}] instead.',
					elementTriggers: 'data.animationTrigger.elementTriggers = [{ "source": "self", "when": "change" }] — see describe_element_options (section Animations).',
				};
			}
			return text(out);
		},
	);
}
