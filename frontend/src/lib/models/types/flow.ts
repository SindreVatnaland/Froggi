import type { LiveStatsScene } from '../enum';
import type { ControllerButtons } from './controller';
import type { StrikePhase } from './stageStriking';
import type { WebhookEvent } from './webhook';

/**
 * Flows (Homey-style automation): WHEN a trigger fires, AND every condition on the path holds, THEN run
 * the actions. Stored in SQLite (FlowEntity); run in Electron (flowService). The graph is nodes + edges
 * like Svelte Flow: trigger → conditions → actions; an action runs when a path of passing conditions
 * connects it to the trigger.
 */
/** What a player did on their phone during stage striking (trigger "Stage Striking"). */
/** What happened in stage striking: a player's choice, or `change` — anything else (game reported, set start, host…). */
export type StrikeEvent = 'rps' | 'order' | 'strike' | 'ban' | 'pick' | 'character' | 'agreement' | 'change';

export type FlowFormat = 'any' | 'singles' | 'doubles';
export type FlowPlayer = 'any' | 'p1' | 'p2' | 'current';
export type FlowCompare = '<=' | '>=' | '==';
/** Compare condition: numbers compare as numbers when both sides are numeric, otherwise as text. */
export type FlowCompareOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'contains';
export type FlowGameMode = 'local' | 'direct' | 'teams' | 'unranked' | 'ranked';

export type FlowTrigger =
	| { type: 'sceneChange'; scene?: LiveStatsScene }
	| { type: 'controllerCombo'; buttons: Partial<ControllerButtons> }
	| { type: 'gameStart' }
	| { type: 'gameEnd' }
	| { type: 'damageTaken'; player?: FlowPlayer; minDamage?: number }
	| { type: 'stockLost'; player?: FlowPlayer }
	/** A punish (every hit until the opponent escapes — incl. edgeguards and kills) or a combo (hitstun
	 *  chain) ends — Slippi's definitions. player = the attacker's side. */
	| { type: 'sequence'; kind?: 'punish' | 'combo'; player?: FlowPlayer }
	| { type: 'rankChange' }
	| { type: 'setStart' }
	| { type: 'dolphinConnection'; connected?: boolean }
	/** Stage Striking: event `all` = every change, `any` (default) = any player choice, else that event. */
	| { type: 'strikeAction'; event?: StrikeEvent | 'any' | 'all' }
	| { type: 'obsReplaySaved' };

export type FlowCondition =
	| { type: 'gameMode'; modes: FlowGameMode[] }
	| { type: 'gameFormat'; format: 'singles' | 'doubles' }
	/** Free comparison: both sides are text with {{keys}} filled (trigger keys + {{state.…}}). */
	| { type: 'compare'; left: string; op: FlowCompareOp; right: string }
	| { type: 'scene'; scene: LiveStatsScene }
	| { type: 'playerStocks'; player: Exclude<FlowPlayer, 'any'>; compare: FlowCompare; value: number }
	| { type: 'playerPercent'; player: Exclude<FlowPlayer, 'any'>; compare: FlowCompare; value: number }
	| { type: 'strikePhase'; phase: StrikePhase }
	| { type: 'obsScene'; sceneName: string }
	| { type: 'obsReplayBuffer'; active: boolean };

/** HTTP POST body: the event that fired the flow, the latest payload of a webhook event, a game-state
 *  snapshot, or a custom template (any text — JSON or not) with {{key}} placeholders filled. */
export type FlowPostBody = 'trigger' | 'gameState' | 'custom' | WebhookEvent;

/** OAuth 2 client credentials: Froggi gets an access token from tokenUrl, caches it until it expires,
 *  and sends it as "Authorization: Bearer …" (replaces bearerToken). Credentials go in the form body
 *  (default) or as HTTP Basic auth — providers differ. */
export interface FlowOAuth {
	tokenUrl: string;
	clientId: string;
	clientSecret: string;
	scope?: string;
	credentials?: 'body' | 'basic';
}

/** Extra request header; {{keys}} in the value are filled. */
export interface FlowHeader {
	name: string;
	value: string;
}

/** Values a trigger hands to its actions (Homey "tokens"), e.g. {{damage}}, {{percent}}, {{playerName}}. */
export type FlowTokens = Record<string, string | number | boolean | null>;

export type FlowAction =
	/** HTTP request (type name kept from when it was POST-only). method: POST (default), GET, or any
	 *  other (PUT, PATCH, DELETE…). GET/HEAD send no body; {{keys}} in the URL are filled. */
	| { type: 'httpPost'; method?: string; url: string; bearerToken?: string; oauth?: FlowOAuth; headers?: FlowHeader[]; body: FlowPostBody; template?: string }
	/** "Set media": ONE thing on media key `key` — `path` = a file id ({{file}} from OBS: save replay), a file
	 *  path or a web link (http/https); `start` / `end` = seconds into the video (empty = all; numbers or
	 *  formulas). Empty path = clear the key. Images show as images. */
	| { type: 'setHighlightVideo'; key?: string; path: string; start?: string | number; end?: string | number }
	/** List card (utils/flowList.ts): change list `key` — add an item (`fields`, {{keys}} filled), add all of
	 *  list `from`, sort by / keep where (`formula` over {{item.<field>}}, sort `order`), set `field` of
	 *  every item to `formula` (map), keep the first `count`, or shuffle. Lists stay until Clear values. */
	| { type: 'list'; key: string; op: import('../../utils/flowList').ListOp; fields?: import('../../utils/flowList').ListField[]; from?: string; formula?: string; order?: import('../../utils/flowList').ListOrder; field?: string; /** A number or a formula. */ count?: number | string; /** What the list holds — shown when hovering its key in later cards. */ description?: string }
	/** Clear values: empty these values / lists (names, comma-separated) — put it after any event. */
	| { type: 'clearValues'; keys: string }
	/** Calculate: {{key}} = the formula's result. The value belongs to this flow and stays (also for its next
	 *  runs) until a Clear values card clears it; never set / cleared reads as empty (0 in a formula). */
	| { type: 'calculate'; key: string; formula: string; /** What the value means — shown when hovering its key in later cards. */ description?: string }
	/** Volume (0–100) for the Media elements showing `key` — overrides the element's own volume. */
	| { type: 'setVideoVolume'; key: string; volume: number }
	/** OBS replay buffer length (s), file format and file name prefix ({{keys}} filled, no folders);
	 *  nothing happens when already set. */
	| { type: 'obsReplayBufferSettings'; seconds?: number; format?: string; fileName?: string }
	/** Switch Froggi's scene (what overlays show). Works with automatic scene switching on or off. */
	| { type: 'setScene'; scene: LiveStatsScene }
	/** Timer card: the cards after it run when it fires (their conditions are checked then). Starting a
	 *  timer whose key is already running restarts it. Keys are shared by all flows and may hold {{keys}}
	 *  (e.g. save-{{startFrame}}: one timer per punish). `seconds`: a number or a formula. */
	| { type: 'timer'; key: string; seconds: number | string }
	| { type: 'cancelTimer'; key: string }
	/** Debug: a toast in Froggi; {{keys}} filled. */
	| { type: 'notify'; message: string }
	/** Debug: a line in Froggi's log; {{keys}} filled. */
	| { type: 'log'; message: string }
	| { type: 'obsScene'; sceneName: string }
	| { type: 'obsToggleSource'; sourceName: string }
	| { type: 'obsVolume'; inputName: string; volume: number }
	/** Saves the replay buffer, waits for OBS's file and hands on SAVE_KEYS: {{file}} (its id), {{path}},
	 *  {{fileSeconds}} (its length) and {{savedAt}} (when it ends — the save request, wall clock ms). */
	| { type: 'obsSaveReplay' };

export type FlowNode =
	| { id: string; kind: 'trigger'; position: { x: number; y: number }; data: FlowTrigger }
	| { id: string; kind: 'condition'; position: { x: number; y: number }; data: FlowCondition }
	| { id: string; kind: 'action'; position: { x: number; y: number }; data: FlowAction }
	/** A note on the canvas — not connected, never runs. */
	| { id: string; kind: 'note'; position: { x: number; y: number }; data: { type: 'note'; text: string } };

export interface FlowEdge {
	id: string;
	source: string;
	target: string;
	/** Which output of the source card: a condition (And card) → none / "true" = Yes (holds), "false" = No;
	 *  an action → none = Continue (after it ran / worked), "error" = it failed (FLOW_ERROR_ACTIONS) —
	 *  {{error}} holds the reason. Decisions belong in And cards, never in actions. */
	sourceHandle?: 'true' | 'false' | 'error';
}

/** An action that failed while a flow ran (kept in memory for Flows → Problems). */
export interface FlowFailure {
	at: string;
	flowId: string;
	flowName: string;
	action: string;
	message: string;
}

/** OBS replay-buffer formats a browser source can play (OBS profile value → name). */
export const REPLAY_FORMATS: Record<string, string> = { hybrid_mp4: 'Hybrid MP4', mp4: 'MP4', hybrid_mov: 'Hybrid MOV', mov: 'MOV' };

/** Actions that can fail: an Error output ({{error}} = the reason). */
export const FLOW_ERROR_ACTIONS: FlowAction['type'][] = ['httpPost', 'setHighlightVideo', 'obsReplayBufferSettings', 'obsScene', 'obsToggleSource', 'obsVolume', 'obsSaveReplay'];
/** Actions that change {{keys}} for the cards after them. */
export const FLOW_TOKEN_ACTIONS: FlowAction['type'][] = ['calculate', 'list', 'clearValues'];

/** What "OBS: save replay" hands on. */
export const SAVE_KEYS = ['file', 'path', 'fileSeconds', 'savedAt'];
/** Keys every flow can use besides its triggers' and Calculate / List cards' keys: the last error, and
 *  what OBS: save replay hands on. */
export const FLOW_RUN_KEYS = ['error', ...SAVE_KEYS];


/** A Calculate card's key: a plain name (letters, digits, _), not a {{state.…}} path. */
export const CALC_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface Flow {
	id: string;
	name: string;
	enabled: boolean;
	/** Legacy (before the "Game format is" condition) — migrateFlow turns it into a condition node. */
	format?: FlowFormat;
	nodes: FlowNode[];
	edges: FlowEdge[];
	updatedAt?: string;
}

/** Something that happened (raised by the backend) — matched against flow triggers. */
export type FlowEvent =
	| { type: 'sceneChange'; scene: LiveStatsScene }
	| { type: 'controllerCombo'; buttons: Partial<ControllerButtons> }
	| { type: 'gameStart'; payload?: unknown }
	| { type: 'gameEnd'; payload?: unknown }
	| { type: 'damageTaken'; player: 1 | 2; isCurrentPlayer: boolean; damage: number; payload?: unknown }
	| { type: 'stockLost'; player: 1 | 2; isCurrentPlayer: boolean; payload?: unknown }
	| { type: 'sequence'; kind: 'punish' | 'combo'; player: 1 | 2; isCurrentPlayer: boolean; payload?: unknown }
	| { type: 'rankChange'; payload?: unknown }
	| { type: 'setStart'; payload?: unknown }
	| { type: 'dolphinConnection'; connected: boolean; payload?: unknown }
	| { type: 'strikeAction'; event: StrikeEvent; payload?: unknown }
	| { type: 'obsReplaySaved'; payload?: unknown };

/** Event + the keys it exposes to actions. */
/** One run of a flow (a trigger firing): its own copy of the keys, and the Calculate keys this run set itself
 *  — those stay the run's own across timers; other values are read as they are now. */
export type FlowEventWithTokens = FlowEvent & { tokens?: FlowTokens; computed?: Set<string> };

/** Game state the conditions read. Players are Player 1 / Player 2 (slot order). */
export interface FlowContext {
	scene: LiveStatsScene | undefined;
	mode: FlowGameMode | undefined;
	isTeams: boolean;
	players: { stocks: number | undefined; percent: number | undefined }[];
	/** 0/1 = which slot is the current (local) player, if known. */
	currentPlayerSlot: number | undefined;
	strikePhase: StrikePhase | undefined;
	obsScene?: string;
	replayBufferActive?: boolean;
}
