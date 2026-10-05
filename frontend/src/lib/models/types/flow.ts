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
export type FlowFormat = 'any' | 'singles' | 'doubles';
export type FlowPlayer = 'any' | 'p1' | 'p2' | 'current';
export type FlowCompare = '<=' | '>=' | '==';
export type FlowGameMode = 'local' | 'direct' | 'unranked' | 'ranked';

export type FlowTrigger =
	| { type: 'sceneChange'; scene?: LiveStatsScene }
	| { type: 'controllerCombo'; buttons: Partial<ControllerButtons> }
	| { type: 'gameStart' }
	| { type: 'gameEnd' }
	| { type: 'damageTaken'; player?: FlowPlayer; minDamage?: number }
	| { type: 'stockLost'; player?: FlowPlayer }
	| { type: 'rankChange' }
	| { type: 'strikeChange'; action?: string };

export type FlowCondition =
	| { type: 'gameMode'; modes: FlowGameMode[] }
	| { type: 'scene'; scene: LiveStatsScene }
	| { type: 'playerStocks'; player: Exclude<FlowPlayer, 'any'>; compare: FlowCompare; value: number }
	| { type: 'playerPercent'; player: Exclude<FlowPlayer, 'any'>; compare: FlowCompare; value: number }
	| { type: 'strikePhase'; phase: StrikePhase }
	| { type: 'obsScene'; sceneName: string }
	| { type: 'obsReplayBuffer'; active: boolean };

/** HTTP POST body: the event that fired the flow, the latest payload of a webhook event, a game-state
 *  snapshot, or a custom JSON template with {{key}} placeholders filled from the trigger's keys. */
export type FlowPostBody = 'trigger' | 'gameState' | 'custom' | WebhookEvent;

/** Values a trigger hands to its actions (Homey "tokens"), e.g. {{damage}}, {{percent}}, {{playerName}}. */
export type FlowTokens = Record<string, string | number | boolean | null>;

export type FlowAction =
	| { type: 'httpPost'; url: string; bearerToken?: string; body: FlowPostBody; template?: string }
	| { type: 'obsScene'; sceneName: string }
	| { type: 'obsToggleSource'; sourceName: string }
	| { type: 'obsVolume'; inputName: string; volume: number }
	| { type: 'obsSaveReplay' };

export type FlowNode =
	| { id: string; kind: 'trigger'; position: { x: number; y: number }; data: FlowTrigger }
	| { id: string; kind: 'condition'; position: { x: number; y: number }; data: FlowCondition }
	| { id: string; kind: 'action'; position: { x: number; y: number }; data: FlowAction };

export interface FlowEdge {
	id: string;
	source: string;
	target: string;
}

export interface Flow {
	id: string;
	name: string;
	enabled: boolean;
	/** Run in singles games, doubles (teams) games, or both. */
	format: FlowFormat;
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
	| { type: 'rankChange'; payload?: unknown }
	| { type: 'strikeChange'; action: string; payload?: unknown };

/** Event + the keys it exposes to actions. */
export type FlowEventWithTokens = FlowEvent & { tokens?: FlowTokens };

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
