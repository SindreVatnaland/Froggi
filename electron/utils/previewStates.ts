import { SlippiGame } from '@slippi/slippi-js/node';
import crypto from 'crypto';
import type { GameStats, Player, PreviewState } from '../../frontend/src/lib/models/types/slippiData';
import { assignKeys, withKeys } from '../../frontend/src/lib/utils/playerIdentity';
import { orderTeams, slotOrder } from '../../frontend/src/lib/utils/teams';
import { fightStatsFromFrames } from '../../frontend/src/lib/utils/fightStats';
import { getGameScore } from '../../frontend/src/lib/utils/gamePredicates';
import { analyzeMatch } from './analyzeMatch';
import { nulled } from '../../frontend/src/lib/models/types/slippiTypes';

/**
 * Frozen game states for overlay screenshots: built from a replay at one moment and served once to
 * the preview page (GET /preview-state/:id). Only the screenshot page reads them — live overlays,
 * OBS and the dashboard are never touched. Entries expire after a minute.
 */
const states = new Map<string, PreviewState>();
const TTL_MS = 60_000;

export const getPreviewState = (id: string) => states.get(id);

export function storePreviewState(state: PreviewState): string {
	const id = crypto.randomUUID();
	states.set(id, state);
	setTimeout(() => states.delete(id), TTL_MS);
	return id;
}

/** The replay at `atSeconds` after GO (clamped to the game). */
export function previewStateFromReplay(file: string, atSeconds: number): PreviewState | undefined {
	const slp = new SlippiGame(file);
	const settings = nulled(slp.getSettings());
	if (!settings) return undefined;
	const isTeams = !!settings.isTeams;
	const players = withKeys(settings.players, assignKeys(settings.players, isTeams)).filter((p) => p) as typeof settings.players;
	const ordered = isTeams ? slotOrder(orderTeams(players)) : [...players].sort((a, b) => a.playerIndex - b.playerIndex);

	const frames = nulled(slp.getFrames());
	const keys = Object.keys(frames).map(Number).sort((a, b) => a - b);
	const target = Math.min(Math.max(Math.round(atSeconds * 60), keys[0] ?? 0), keys.at(-1) ?? 0);
	const upTo = Object.fromEntries(keys.filter((k) => k <= target).map((k) => [k, frames[k]]));

	const gameSettings = { ...settings, players };
	const postGame = {
		settings: gameSettings,
		gameEnd: nulled(slp.getGameEnd()),
		lastFrame: nulled(slp.getLatestFrame()),
		postGameStats: nulled(slp.getStats()),
		isMock: false,
		isReplay: true,
		score: [0, 0],
		timestamp: null,
	} as unknown as GameStats;
	postGame.score = getGameScore([postGame]);
	const game = fightStatsFromFrames(players, isTeams, upTo);
	return {
		gameSettings: gameSettings as PreviewState['gameSettings'],
		currentPlayers: ordered.map((p) => ({ ...p, rank: {} }) as unknown as Player),
		gameFrame: frames[target] ?? null,
		postGame,
		gameScore: postGame.score,
		fightStats: { game, match: game },
		recentGames: [postGame],
		matchStats: analyzeMatch([postGame]),
	};
}
