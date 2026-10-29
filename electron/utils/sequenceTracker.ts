import { ComboComputer, ConversionComputer, Stats, moves } from '@slippi/slippi-js';
import type { ComboType as SlpComboType, FrameEntryType as SlpFrameEntryType, GameStartType as SlpGameStartType } from '@slippi/slippi-js';
import type { ComboType, ConversionType, FrameEntryType, GameStartType } from '../../frontend/src/lib/models/types/slippiTypes';
import { nulled, unnulled } from '../../frontend/src/lib/models/types/slippiTypes';
import { isOffStage } from './framesPredicates';
import { STAGE_DATA } from '../../frontend/src/lib/models/constants/stageData';

/** Stocks / percent / position of one player on one frame. */
export interface PlayerSnapshot {
	stocks: number;
	percent: number;
	x: number;
	y: number;
	lastHitBy: number | null;
}

/** A finished punish or combo (Slippi's own definitions — the same as Project Clippi). */
export interface SequenceEvent {
	kind: 'punish' | 'combo';
	attackerIndex: number;
	victimIndex: number;
	/** First hit … the kill, or the last hit. */
	startFrame: number;
	endFrame: number;
	/** Wall-clock ms of those frames (when Froggi received them). */
	startTime: number;
	endTime: number;
	hits: number;
	damage: number;
	startPercent: number;
	endPercent: number;
	didKill: boolean;
	/** Punishes: neutral-win / counter-attack / trade. Combos: "". */
	openingType: string;
	moves: string[];
	/** Victim off the stage at the last hit (an edgeguard). */
	offstage: boolean;
	/** Every player right before the first hit and right after the end. */
	before: Record<number, PlayerSnapshot>;
	after: Record<number, PlayerSnapshot>;
	/** KOs by the attacker's team in the last 5 s, this one included (doubles multi-kills). */
	teamKills: number;
}

const MULTI_KILL_MS = 5000;

/**
 * Live punish / combo detection: feeds every frame to slippi-js's ConversionComputer and ComboComputer
 * and reports each sequence when it ends. Keeps a small snapshot per frame (stocks, percent, position) and
 * the wall-clock time each frame arrived, so a highlight window maps onto the stream recording.
 */
export class SequenceTracker {
	private stats: Stats | null = null;
	private settings: GameStartType | null = null;
	private snapshots = new Map<number, Record<number, PlayerSnapshot>>();
	private times = new Map<number, number>();
	private kills: { team: number; at: number }[] = [];
	private latestFrame = 0;

	constructor(
		private onSequence: (e: SequenceEvent) => void,
		private now = () => Date.now(),
	) {}

	start(settings: GameStartType) {
		this.settings = settings;
		this.snapshots.clear();
		this.times.clear();
		this.kills = [];
		this.latestFrame = 0;
		const conversions = new ConversionComputer();
		const combos = new ComboComputer();
		// The event carries the LAST sequence in the list, which can be another player's when two overlap —
		// so report every one that has ended since.
		// slippi-js objects: reported by identity, converted to Froggi's shape (null for missing) when reported.
		const reported = new Set<SlpComboType>();
		const flush = (kind: SequenceEvent['kind'], list: SlpComboType[]) => {
			for (const c of list) if (c.endFrame != null && !reported.has(c)) (reported.add(c), this.report(kind, nulled(c) as ComboType));
		};
		conversions.on('CONVERSION', () => flush('punish', conversions.fetch())); // fetch fills in openingType
		combos.on('COMBO_END', () => flush('combo', combos.fetch()));
		this.stats = new Stats({ processOnTheFly: true });
		this.stats.register(conversions, combos); // before setup — setup sets up the registered computers
		this.stats.setup(unnulled<SlpGameStartType>(settings));
		if ((settings.players?.length ?? 0) > 2) this.everyPair(settings, conversions, combos);
	}

	stop() {
		this.stats = null;
	}

	frame(frame: FrameEntryType | null | undefined) {
		if (!this.stats || frame?.frame == null) return;
		const snap: Record<number, PlayerSnapshot> = {};
		for (const [index, data] of Object.entries(frame.players ?? {})) {
			const post = data?.post;
			if (post) snap[Number(index)] = { stocks: post.stocksRemaining ?? 0, percent: post.percent ?? 0, x: post.positionX ?? 0, y: post.positionY ?? 0, lastHitBy: post.lastHitBy ?? null };
		}
		this.snapshots.set(frame.frame, snap);
		this.times.set(frame.frame, this.now());
		this.latestFrame = frame.frame;
		this.stats.addFrame(unnulled<SlpFrameEntryType>(frame));
	}

	/** When a frame arrived (frames Froggi missed: estimated at 60 fps from the newest one). */
	/**
	 * slippi-js only pairs players in singles. Doubles: give its computers every attacker → opponent pair.
	 * They count any damage on the victim, so report() keeps only hits Slippi credits to the attacker.
	 * ponytail: sets slippi-js internals (playerPermutations / state) — recheck on a slippi-js upgrade.
	 */
	private everyPair(settings: GameStartType, ...computers: (ConversionComputer | ComboComputer)[]) {
		const players = settings.players ?? [];
		const pairs = players.flatMap((a) =>
			players
				.filter((v) => v.playerIndex !== a.playerIndex && (!settings.isTeams || v.teamId !== a.teamId))
				.map((v) => ({ playerIndex: a.playerIndex, opponentIndex: v.playerIndex })),
		);
		for (const c of computers) {
			const internals = c as unknown as { playerPermutations: unknown[]; state: Map<unknown, unknown> };
			internals.playerPermutations = pairs;
			internals.state = new Map(pairs.map((p) => [p, { conversion: undefined, combo: undefined, move: undefined, resetCounter: 0, lastHitAnimation: undefined, event: undefined }]));
		}
	}

	/** Did Slippi credit the hit on `victim` around `frame` to `attacker`? (lastHitBy can lag a few frames) */
	private creditedTo(attacker: number, victim: number, frame: number) {
		for (let f = frame; f <= frame + 3; f++) if (this.snapshots.get(f)?.[victim]?.lastHitBy === attacker) return true;
		return false;
	}

	private timeOf(frame: number) {
		return this.times.get(frame) ?? (this.times.get(this.latestFrame) ?? this.now()) - ((this.latestFrame - frame) / 60) * 1000;
	}

	private teamOf(index: number) {
		const p = this.settings?.players?.find((s) => s.playerIndex === index);
		return this.settings?.isTeams && p?.teamId != null ? 100 + p.teamId : index;
	}

	private report(kind: SequenceEvent['kind'], combo: ComboType | ConversionType | undefined) {
		if (!combo || combo.lastHitBy == null) return;
		const attacker = combo.lastHitBy;
		const doubles = (this.settings?.players?.length ?? 0) > 2;
		// Doubles: only the attacker's own hits (a teammate's hits on the same victim are their sequence).
		const hits = doubles ? combo.moves.filter((m) => this.creditedTo(attacker, combo.playerIndex, m.frame)) : combo.moves;
		if (!hits.length) return;
		const didKill = combo.didKill && (!doubles || combo.endFrame == null || this.creditedTo(attacker, combo.playerIndex, combo.endFrame - 3));
		const startFrame = hits[0].frame;
		const endFrame = didKill && combo.endFrame != null ? combo.endFrame : hits[hits.length - 1].frame;
		const before = this.snapshots.get(startFrame - 1) ?? this.snapshots.get(startFrame) ?? {};
		const after = this.snapshots.get(endFrame + (didKill ? 1 : 0)) ?? this.snapshots.get(endFrame) ?? {};
		// Edgeguard = the victim was off stage when last hit (at the kill they are always at the blast zone).
		const victimAtEnd = this.snapshots.get(hits[hits.length - 1].frame)?.[combo.playerIndex];
		const stageId = this.settings?.stageId ?? -1;
		const offstage =
			!!victimAtEnd && !!STAGE_DATA[stageId] &&
			isOffStage(stageId, { players: { [combo.playerIndex]: { post: { positionX: victimAtEnd.x, positionY: victimAtEnd.y } } } } as unknown as FrameEntryType, combo.playerIndex);
		const endTime = this.timeOf(endFrame);
		let teamKills = 0;
		if (didKill) {
			const team = this.teamOf(attacker);
			this.kills = [...this.kills.filter((k) => endTime - k.at < MULTI_KILL_MS), { team, at: endTime }];
			teamKills = this.kills.filter((k) => k.team === team).length;
		}
		this.onSequence({
			kind,
			attackerIndex: attacker,
			victimIndex: combo.playerIndex,
			startFrame,
			endFrame,
			startTime: this.timeOf(startFrame),
			endTime,
			hits: hits.length,
			damage: Math.round(doubles ? hits.reduce((n, m) => n + m.damage, 0) : (combo.endPercent ?? combo.currentPercent) - combo.startPercent),
			startPercent: Math.round(combo.startPercent),
			endPercent: Math.round(combo.endPercent ?? combo.currentPercent),
			didKill,
			openingType: kind === 'punish' ? (combo as ConversionType).openingType : '',
			moves: hits.map((m) => moves.getMoveShortName(m.moveId)),
			offstage,
			before,
			after,
			teamKills,
		});
	}
}
