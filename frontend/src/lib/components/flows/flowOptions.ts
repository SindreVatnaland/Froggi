import { LiveStatsScene } from '$lib/models/enum';
import type { FlowAction, FlowCondition, FlowNode, FlowTrigger } from '$lib/models/types/flow';
import { WebhookEvent } from '$lib/models/types/webhook';

/** Labels + defaults for the flow editor (the AI assistant gets the same schema from the MCP tools). */
export const TRIGGERS: { type: FlowTrigger['type']; label: string; make: () => FlowTrigger }[] = [
	{ type: 'sceneChange', label: 'Scene changes', make: () => ({ type: 'sceneChange', scene: LiveStatsScene.InGame }) },
	{ type: 'controllerCombo', label: 'Controller button combo', make: () => ({ type: 'controllerCombo', buttons: { isLPressed: true, isRPressed: true } }) },
	{ type: 'gameStart', label: 'Game starts', make: () => ({ type: 'gameStart' }) },
	{ type: 'gameEnd', label: 'Game ends', make: () => ({ type: 'gameEnd' }) },
	{ type: 'damageTaken', label: 'A player takes damage', make: () => ({ type: 'damageTaken', player: 'any', minDamage: 0 }) },
	{ type: 'stockLost', label: 'A player loses a stock', make: () => ({ type: 'stockLost', player: 'any' }) },
	{ type: 'rankChange', label: 'Rank changes', make: () => ({ type: 'rankChange' }) },
	{ type: 'strikeChange', label: 'Stage striking changes', make: () => ({ type: 'strikeChange', action: 'any' }) },
];

export const CONDITIONS: { type: FlowCondition['type']; label: string; make: () => FlowCondition }[] = [
	{ type: 'gameMode', label: 'Game mode is', make: () => ({ type: 'gameMode', modes: ['local'] }) },
	{ type: 'scene', label: 'Scene is', make: () => ({ type: 'scene', scene: LiveStatsScene.InGame }) },
	{ type: 'playerStocks', label: 'Player stocks', make: () => ({ type: 'playerStocks', player: 'current', compare: '<=', value: 1 }) },
	{ type: 'playerPercent', label: 'Player percent', make: () => ({ type: 'playerPercent', player: 'current', compare: '>=', value: 100 }) },
	{ type: 'strikePhase', label: 'Stage striking phase is', make: () => ({ type: 'strikePhase', phase: 'stageBan' }) },
];

export const ACTIONS: { type: FlowAction['type']; label: string; make: () => FlowAction }[] = [
	{ type: 'httpPost', label: 'Send HTTP POST', make: () => ({ type: 'httpPost', url: 'https://', body: 'trigger' }) },
	{ type: 'obsScene', label: 'OBS: switch scene', make: () => ({ type: 'obsScene', sceneName: '' }) },
	{ type: 'obsToggleSource', label: 'OBS: show/hide source', make: () => ({ type: 'obsToggleSource', sourceName: '' }) },
	{ type: 'obsVolume', label: 'OBS: set volume', make: () => ({ type: 'obsVolume', inputName: '', volume: 1 }) },
	{ type: 'obsSaveReplay', label: 'OBS: save replay', make: () => ({ type: 'obsSaveReplay' }) },
];

export const SCENES = Object.values(LiveStatsScene);
export const STRIKE_ACTIONS = ['any', 'pickCharacter', 'rps', 'chooseStrikeOrder', 'strike', 'ban', 'pick', 'answerAgreement', 'play', 'done'];
export const STRIKE_PHASES = ['charSelect', 'rps', 'rpsResult', 'striking', 'stageBan', 'stagePick', 'charLock', 'charPick', 'playing', 'setComplete'];
export const BUTTONS: { key: string; label: string }[] = [
	{ key: 'isAPressed', label: 'A' }, { key: 'isBPressed', label: 'B' }, { key: 'isXPressed', label: 'X' }, { key: 'isYPressed', label: 'Y' },
	{ key: 'isZPressed', label: 'Z' }, { key: 'isLPressed', label: 'L' }, { key: 'isRPressed', label: 'R' }, { key: 'isStartPressed', label: 'Start' },
	{ key: 'isDPadUpPressed', label: 'D↑' }, { key: 'isDPadDownPressed', label: 'D↓' }, { key: 'isDPadLeftPressed', label: 'D←' }, { key: 'isDPadRightPressed', label: 'D→' },
];
export const POST_BODIES: { value: string; label: string }[] = [
	{ value: 'trigger', label: 'The event that started the flow' },
	{ value: 'gameState', label: 'Game state snapshot' },
	...Object.values(WebhookEvent).map((e) => ({ value: e, label: `Latest ${e} payload` })),
];

const who = (p?: string) => (p === 'current' ? 'You' : p === 'p1' ? 'Player 1' : p === 'p2' ? 'Player 2' : 'Any player');

/** One-line summary shown on a node. */
export function describe(node: FlowNode): string {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const d = node.data as Record<string, any>;
	switch (d.type) {
		case 'sceneChange': return d.scene ? `Scene → ${d.scene}` : 'Any scene change';
		case 'controllerCombo': return `Hold ${BUTTONS.filter((b) => (d.buttons as Record<string, boolean>)?.[b.key]).map((b) => b.label).join(' + ') || '…'}`;
		case 'gameStart': return 'Game starts';
		case 'gameEnd': return 'Game ends';
		case 'damageTaken': return `${who(d.player as string)} takes ≥ ${d.minDamage ?? 0}% damage`;
		case 'stockLost': return `${who(d.player as string)} loses a stock`;
		case 'rankChange': return 'Rank changes';
		case 'strikeChange': return !d.action || d.action === 'any' ? 'Stage striking changes' : `Striking: ${d.action}`;
		case 'gameMode': return `Mode is ${(d.modes as string[]).join(' / ')}`;
		case 'scene': return `Scene is ${d.scene}`;
		case 'playerStocks': return `${who(d.player as string)} stocks ${d.compare} ${d.value}`;
		case 'playerPercent': return `${who(d.player as string)} percent ${d.compare} ${d.value}`;
		case 'strikePhase': return `Striking phase is ${d.phase}`;
		case 'httpPost': return `POST ${(d.url as string)?.replace(/^https?:\/\//, '') || '…'}`;
		case 'obsScene': return `Switch to "${d.sceneName || '…'}"`;
		case 'obsToggleSource': return `Toggle "${d.sourceName || '…'}"`;
		case 'obsVolume': return `Volume "${d.inputName || '…'}" → ${Math.round((d.volume as number) * 100)}%`;
		case 'obsSaveReplay': return 'Save replay buffer';
	}
	return '';
}
