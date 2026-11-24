import path from 'path';

type Perm = { playerIndex: number; opponentIndex: number };
type Settings = { isTeams?: boolean | null; players: { playerIndex: number; teamId?: number | null }[] } | undefined;

let enabled = false;

/**
 * slippi-js computes stats only in singles: its computers pair players with getSinglesPlayerPermutationsFromSettings,
 * which returns nothing for 3–4 players, so a doubles replay has no stocks, action counts or inputs. For the game
 * history, give every doubles player one opponent so the per-player computers (stocks, actions, inputs) run.
 * Conversion-based stats (openings, neutral, punishes) still pair one attacker with one victim — in doubles they
 * would miss or double-count hits, so historyRows leaves them NULL for teams and takes damage / KOs from frames.
 * Only call it in the history worker (its own module instances) — the app's live stats are untouched.
 * ponytail: patches a slippi-js internal; historyDb.test checks doubles get stats — recheck on a slippi-js upgrade.
 */
export function enableTeamsStats() {
	if (enabled) return;
	enabled = true;
	const file = path.join(path.dirname(require.resolve('@slippi/slippi-js/package.json')), 'dist/common/stats/common.cjs');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const common = require(file) as { getSinglesPlayerPermutationsFromSettings: (s: Settings) => Perm[] };
	const singles = common.getSinglesPlayerPermutationsFromSettings;
	common.getSinglesPlayerPermutationsFromSettings = (settings: Settings) => {
		if (!settings?.isTeams || settings.players.length < 3) return singles(settings);
		return settings.players.map((p) => ({
			playerIndex: p.playerIndex,
			opponentIndex: settings.players.find((o) => o.teamId !== p.teamId)?.playerIndex ?? p.playerIndex,
		}));
	};
}
