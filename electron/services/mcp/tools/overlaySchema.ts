import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Animation } from '../../../../frontend/src/lib/models/enum';
import { CustomElement } from '../../../../frontend/src/lib/models/constants/customElement';
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
	{ min: 1000, max: 1999, label: 'Text / dynamic strings (percent, tags, scores, rank data)' },
	{ min: 2000, max: 2999, label: 'Character render images' },
	{ min: 3000, max: 3999, label: 'Boxes, iframes & controller inputs' },
	{ min: 4000, max: 4599, label: 'Game HUD (timer, countdown, ready/go, stocks, combos)' },
	{ min: 4600, max: 5399, label: 'Per-character / per-stock icon sets' },
	{ min: 6000, max: 6299, label: 'Character & rank images' },
	{ min: 7000, max: 7599, label: 'Stage striking' },
	{ min: 8000, max: 8299, label: 'Action state, bingo, rank graph' },
	{ min: 9000, max: 9999, label: 'Misc' },
];

const labelFor = (id: number) => RANGE_LABELS.find((r) => id >= r.min && id <= r.max)?.label ?? 'Other';

/** { id, name, kind } for every CustomElement, from the enum reverse map. `kind` (text|image|box)
 *  is the render/styling class the editor uses — it tells you which payload options apply. */
const ALL_ELEMENTS = Object.entries(CustomElement)
	.filter(([, v]) => typeof v === 'number')
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

## Payload shape (data)
Pass a partial payload to add_overlay_element / update_overlay_element; omitted fields use defaults.
- \`string\`: text content (for text elements).
- \`css\`: { background, color, borderTop/Right/Bottom/Left (rem), borderColor, opacity (0-1),
  fill, fillOpacity, stroke, strokeWidth (SVG/controller elements), customParent/customBox/customText/customImage
  (raw CSS strings applied to those DOM layers when advancedStyling is on) }.
- \`class\`: { alignment, rounded }.
- \`transform\`: { rotate (deg), scale ("x, y"), translate {x,y} } — use to rotate/flip/nudge.
- \`shadow\`: { x, y, spread, color } (box shadow). \`textStroke\`: { size, color }.
- \`font\`: { family, src }. \`image\`: { name, src, objectFit }.
- \`percent\`: { startColor, endColor } — for percent elements, the text color interpolates from
  startColor (0%) toward endColor as the value rises. Default reddens (#ffffff → #6f1622).
- \`advancedStyling\`: true to enable the raw custom* CSS fields.
- \`animationTrigger\` and \`visibility\`: see list_overlay_conditions / list_overlay_animations.

## Animations (data.animationTrigger & data.visibility)
Both carry \`{ in: AnimationSettings, out: AnimationSettings, selectedOptions }\`.
- **visibility**: element shows only while its conditions hold; plays \`in\` when it appears and
  \`out\` when it hides. \`selectedOptions\` is an ARRAY of objects mapping a VisibilityOption label →
  toggle (0 Disabled / 1 must-be-true / 2 must-be-false).
- **animationTrigger**: replays \`in\` (then \`out\`) whenever a game event fires. \`selectedOptions\` is
  an OBJECT mapping an AnimationTrigger label → boolean.
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
Both support \`percent.startColor\`/\`percent.endColor\`. Percent reads as 0 when the player is dead or
not in game (the underlying value is null then).

## Default Smash HUD layout (Melee & modern Ultimate)
Standard bottom HUD: **Player 1 bottom-LEFT, Player 2 bottom-RIGHT**. Each side = a row of character
stock icons with that player's damage percent just below. Same for Melee and Ultimate (Ultimate usually
adds the player name above the stocks; Melee uses the port-colored panel) — the stock ORDER rule is
identical for both.

**Stock icons** — use InGamePlayer1CharacterIcon (6220) / InGamePlayer2CharacterIcon (6230), one
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
			description: 'Condition options for showing elements and triggering animations. kind="visibility" → VisibilityOption values (element visible only while conditions hold; encoded as an array of {label: 0 Disabled|1 True|2 False} in data.visibility.selectedOptions). kind="trigger" → AnimationTrigger values (replay animation on event; encoded as {label: boolean} in data.animationTrigger.selectedOptions). Omit kind for both.',
			inputSchema: { kind: z.enum(['visibility', 'trigger']).optional() },
		},
		async ({ kind }) => {
			const out: Record<string, unknown> = {};
			if (kind !== 'trigger') {
				out.visibility = {
					toggle: { Disabled: VisibilityToggle.Disabled, True: VisibilityToggle.True, False: VisibilityToggle.False },
					encoding: 'data.visibility.selectedOptions = [ { "<label>": 1 }, ... ]',
					options: Object.values(VisibilityOption),
				};
			}
			if (kind !== 'visibility') {
				out.trigger = {
					encoding: 'data.animationTrigger.selectedOptions = { "<label>": true }',
					options: Object.values(AnimationTrigger),
				};
			}
			return text(out);
		},
	);
}
