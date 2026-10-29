import type { FrameEntryType } from '../models/types/slippiTypes';
import { playerKey, type TeamsPlayer } from './teams';

/**
 * Live fight stats from game frames — singles and doubles. Per player (keyed by `playerKey`, so a
 * player keeps their stats across games even if teams swap colours):
 *  - damage: percent dealt to opponents (attributed to the victim's `lastHitBy`; teammates excluded)
 *  - kos / koPercent: KOs scored and the victims' summed percent at death → avg KO %
 *  - deaths / deathPercent: own deaths (incl. SDs) and summed percent at death → avg death %
 * Game = current game; match = finished games of the set + the current game.
 */
export interface FightStats {
	damage: number;
	kos: number;
	koPercent: number;
	deaths: number;
	deathPercent: number;
}
export type FightStatsByPlayer = Record<string, FightStats>;
export interface LiveFightStats {
	game: FightStatsByPlayer;
	match: FightStatsByPlayer;
	/** How long each stock lost lasted, seconds (respawn included) — the pace for win chance on a timer. */
	stockSeconds?: { game: number[]; match: number[] };
}

export const emptyFightStats = (): FightStats => ({ damage: 0, kos: 0, koPercent: 0, deaths: 0, deathPercent: 0 });

const add = (a: FightStats, b: FightStats): FightStats => ({
	damage: a.damage + b.damage,
	kos: a.kos + b.kos,
	koPercent: a.koPercent + b.koPercent,
	deaths: a.deaths + b.deaths,
	deathPercent: a.deathPercent + b.deathPercent,
});

/** Sum of several players' stats (a team). */
export const sumFightStats = (list: (FightStats | undefined)[]) => list.reduce<FightStats>((acc, s) => (s ? add(acc, s) : acc), emptyFightStats());

export const avgKoPercent = (s: FightStats | undefined) => (s?.kos ? s.koPercent / s.kos : 0);
export const avgDeathPercent = (s: FightStats | undefined) => (s?.deaths ? s.deathPercent / s.deaths : 0);

const addAll = (a: FightStatsByPlayer, b: FightStatsByPlayer): FightStatsByPlayer => {
	const out = { ...a };
	for (const [key, s] of Object.entries(b)) out[key] = add(out[key] ?? emptyFightStats(), s);
	return out;
};

export class FightStatsTracker {
	private last = new Map<number, { stocks: number; percent: number }>();
	private players = new Map<number, { key: string; teamId?: number | null }>();
	private byIndex = new Map<number, FightStats>();
	private lastAttacker = new Map<number, number>();
	private pending = new Map<number, number>();
	private teams = false;
	private finished: FightStatsByPlayer = {};
	private lossFrame = new Map<number, number>();
	private stockSeconds: number[] = [];
	private finishedStockSeconds: number[] = [];

	/** Current game, keyed by player. */
	get game(): FightStatsByPlayer {
		const out: FightStatsByPlayer = {};
		for (const [index, { key }] of this.players) out[key] = this.byIndex.get(index) ?? emptyFightStats();
		return out;
	}

	/** Call on game start. The previous game folds into the match unless a new set starts. */
	startGame(players: (TeamsPlayer | null | undefined)[], isTeams: boolean, newSet: boolean) {
		this.finished = newSet ? {} : this.match();
		this.finishedStockSeconds = newSet ? [] : [...this.finishedStockSeconds, ...this.stockSeconds];
		this.stockSeconds = [];
		this.lossFrame.clear();
		this.byIndex.clear();
		this.last.clear();
		this.lastAttacker.clear();
		this.pending.clear();
		this.teams = isTeams;
		this.setPlayers(players);
	}

	/** New identities for the current game's players (host fixed who is who) — stats move with them. */
	setPlayers(players: (TeamsPlayer | null | undefined)[]) {
		this.players = new Map(players.filter((p): p is TeamsPlayer => !!p).map((p) => [p.playerIndex, { key: playerKey(p), teamId: p.teamId }]));
	}

	/** Forget the current game (between games, after loading games into the set). */
	clearGame() {
		this.stockSeconds = [];
		this.lossFrame.clear();
		this.byIndex.clear();
		this.players.clear();
		this.last.clear();
		this.lastAttacker.clear();
		this.pending.clear();
	}

	/** Replace the set's finished games (games loaded into the set, or a fixed last game). */
	setFinished(games: FightStatsByPlayer[]) {
		this.finished = games.reduce(addAll, {});
		this.finishedStockSeconds = []; // ponytail: loaded games carry no stock times; the pace falls back to the default
	}

	private stats(playerIndex: number | null | undefined) {
		if (playerIndex == null || !this.players.has(playerIndex)) return undefined;
		if (!this.byIndex.has(playerIndex)) this.byIndex.set(playerIndex, emptyFightStats());
		return this.byIndex.get(playerIndex)!;
	}

	private isOpponent(attacker: number | null | undefined, victim: number) {
		if (attacker == null || attacker === victim || !this.players.has(attacker)) return false;
		return !this.teams || this.players.get(attacker)?.teamId !== this.players.get(victim)?.teamId;
	}

	/** The opponent who hit `victim`: Slippi's lastHitBy (often set a few frames after the damage),
	 * else the last known attacker, else — in singles — the only opponent. */
	private attackerOf(victim: number, lastHitBy: number | null | undefined): number | undefined {
		if (this.isOpponent(lastHitBy, victim)) return lastHitBy!;
		if (lastHitBy != null && this.players.has(lastHitBy)) return undefined; // self / teammate hit
		if (this.lastAttacker.has(victim)) return this.lastAttacker.get(victim);
		if (!this.teams && this.players.size === 2) return [...this.players.keys()].find((i) => i !== victim);
		return undefined;
	}

	/** Feed a frame (frames may be skipped). Returns true when any stat changed. */
	frame(frame: FrameEntryType | null | undefined): boolean {
		let changed = false;
		for (const [index, data] of Object.entries(frame?.players ?? {})) {
			const post = data?.post;
			if (!post || post.stocksRemaining == null) continue;
			const victim = Number(index);
			const now = { stocks: post.stocksRemaining, percent: post.percent ?? 0 };
			const prev = this.last.get(victim);
			this.last.set(victim, now);

			// A known attacker also collects damage that landed before Slippi named them.
			if (this.isOpponent(post.lastHitBy, victim)) {
				this.lastAttacker.set(victim, post.lastHitBy!);
				const pending = this.pending.get(victim) ?? 0;
				if (pending > 0) {
					this.stats(post.lastHitBy)!.damage += pending;
					this.pending.delete(victim);
					changed = true;
				}
			}
			if (!prev) continue;

			if (now.stocks < prev.stocks) {
				if (frame?.frame != null) {
					this.stockSeconds.push(Math.max(0, frame.frame - (this.lossFrame.get(victim) ?? 0)) / 60);
					this.lossFrame.set(victim, frame.frame);
				}
				const self = this.stats(victim);
				if (self) {
					self.deaths++;
					self.deathPercent += prev.percent;
				}
				const killer = this.attackerOf(victim, post.lastHitBy);
				if (killer !== undefined) {
					const k = this.stats(killer)!;
					k.kos++;
					k.koPercent += prev.percent;
					k.damage += this.pending.get(victim) ?? 0;
				}
				this.pending.delete(victim);
				this.lastAttacker.delete(victim);
				changed = true;
			} else if (now.stocks === prev.stocks && now.percent > prev.percent) {
				const delta = now.percent - prev.percent;
				const attacker = this.attackerOf(victim, post.lastHitBy);
				if (attacker !== undefined) {
					this.stats(attacker)!.damage += delta;
					changed = true;
				} else if (post.lastHitBy == null || !this.players.has(post.lastHitBy)) {
					this.pending.set(victim, (this.pending.get(victim) ?? 0) + delta);
				}
			}
		}
		return changed;
	}

	match(): FightStatsByPlayer {
		return addAll(this.finished, this.game);
	}

	snapshot(): LiveFightStats {
		return { game: this.game, match: this.match(), stockSeconds: { game: [...this.stockSeconds], match: [...this.finishedStockSeconds, ...this.stockSeconds] } };
	}
}

/** Fight stats of a finished game from its frames — the same rules as live (for games loaded into a set). */
export function fightStatsFromFrames(players: (TeamsPlayer | null | undefined)[], isTeams: boolean, frames: Record<number, FrameEntryType>): FightStatsByPlayer {
	const t = new FightStatsTracker();
	t.startGame(players, isTeams, true);
	for (const key of Object.keys(frames).map(Number).sort((a, b) => a - b)) t.frame(frames[key]);
	return t.game;
}
