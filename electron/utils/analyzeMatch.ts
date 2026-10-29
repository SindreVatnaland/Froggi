import type { ActionCountsType, OverallType } from '../../frontend/src/lib/models/types/slippiTypes';
import { EdgeGuard, GameStats, MatchStats, OverallTypeExtended } from "../../frontend/src/lib/models/types/slippiData";
import { playerKey } from "../../frontend/src/lib/utils/teams";

const sumStat = <T>(items: T[], fn: (item: T) => number): number =>
    items.reduce((acc, item) => acc + fn(item), 0);

const ratioStat = <T>(items: T[], countFn: (item: T) => number, totalFn: (item: T) => number) => {
    const count = sumStat(items, countFn);
    const total = sumStat(items, totalFn);
    return { count, total, ratio: count / (total || 1) };
};

function aggregateActionCounts(counts: ActionCountsType[], playerIndex: number) {
    const s = (fn: (a: ActionCountsType) => number) =>
        sumStat(counts, fn);
    return {
        playerIndex,
        airDodgeCount: s(a => a.airDodgeCount),
        attackCount: {
            jab1: s(a => a.attackCount.jab1),
            jab2: s(a => a.attackCount.jab2),
            jab3: s(a => a.attackCount.jab3),
            jabm: s(a => a.attackCount.jabm),
            dash: s(a => a.attackCount.dash),
            ftilt: s(a => a.attackCount.ftilt),
            utilt: s(a => a.attackCount.utilt),
            dtilt: s(a => a.attackCount.dtilt),
            fsmash: s(a => a.attackCount.fsmash),
            usmash: s(a => a.attackCount.usmash),
            dsmash: s(a => a.attackCount.dsmash),
            nair: s(a => a.attackCount.nair),
            fair: s(a => a.attackCount.fair),
            bair: s(a => a.attackCount.bair),
            uair: s(a => a.attackCount.uair),
            dair: s(a => a.attackCount.dair),
        },
        dashDanceCount: s(a => a.dashDanceCount),
        edgeCancelCount: {
            success: s(a => a.edgeCancelCount.success),
            slow: s(a => a.edgeCancelCount.slow),
        },
        grabCount: {
            success: s(a => a.grabCount.success),
            fail: s(a => a.grabCount.fail),
        },
        groundTechCount: {
            in: s(a => a.groundTechCount.in),
            away: s(a => a.groundTechCount.away),
            neutral: s(a => a.groundTechCount.neutral),
            fail: s(a => a.groundTechCount.fail),
        },
        lCancelCount: {
            success: s(a => a.lCancelCount.success),
            fail: s(a => a.lCancelCount.fail),
        },
        ledgegrabCount: s(a => a.ledgegrabCount),
        rollCount: s(a => a.rollCount),
        spotDodgeCount: s(a => a.spotDodgeCount),
        throwCount: {
            up: s(a => a.throwCount.up),
            down: s(a => a.throwCount.down),
            forward: s(a => a.throwCount.forward),
            back: s(a => a.throwCount.back),
        },
        wavedashCount: s(a => a.wavedashCount),
        wavelandCount: s(a => a.wavelandCount),
        wallTechCount: {
            success: s(a => a.wallTechCount.success),
            fail: s(a => a.wallTechCount.fail),
        },
    };
}

function aggregateOverall(overall: OverallType[], playerIndex: number) {
    const r = (countFn: (o: OverallType) => number, totalFn: (o: OverallType) => number) =>
        ratioStat(overall, countFn, totalFn);
    return {
        playerIndex,
        inputCounts: {
            buttons: sumStat(overall, o => o.inputCounts.buttons),
            triggers: sumStat(overall, o => o.inputCounts.triggers),
            joystick: sumStat(overall, o => o.inputCounts.joystick),
            cstick: sumStat(overall, o => o.inputCounts.cstick),
            total: sumStat(overall, o => o.inputCounts.total),
        },
        conversionCount: sumStat(overall, o => o.conversionCount),
        totalDamage: sumStat(overall, o => o.totalDamage),
        killCount: sumStat(overall, o => o.killCount),
        successfulConversions: r(o => o.successfulConversions.count, o => o.successfulConversions.total),
        inputsPerMinute: r(o => o.inputsPerMinute.count, o => o.inputsPerMinute.total),
        digitalInputsPerMinute: r(o => o.digitalInputsPerMinute.count, o => o.digitalInputsPerMinute.total),
        openingsPerKill: r(o => o.openingsPerKill.count, o => o.openingsPerKill.total),
        damagePerOpening: r(o => o.damagePerOpening.count, o => o.damagePerOpening.total),
        neutralWinRatio: r(o => o.neutralWinRatio.count, o => o.neutralWinRatio.total),
        counterHitRatio: r(o => o.counterHitRatio.count, o => o.counterHitRatio.total),
        beneficialTradeRatio: r(o => o.beneficialTradeRatio.count, o => o.beneficialTradeRatio.total),
        edgeGuard: aggregateEdgeGuard(overall as OverallTypeExtended[]),
    };
}

/** Edgeguards summed over the set (games without the stat are skipped). */
function aggregateEdgeGuard(overall: OverallTypeExtended[]): EdgeGuard | undefined {
    const games = overall.map(o => o.edgeGuard).filter((e): e is EdgeGuard => !!e);
    if (!games.length) return undefined;
    const totalAttempts = games.reduce((n, e) => n + e.totalAttempts, 0);
    const successfulAttempts = games.reduce((n, e) => n + e.successfulAttempts, 0);
    const pct = (n: number) => (totalAttempts > 0 ? (n / totalAttempts) * 100 : 0);
    return {
        totalAttempts,
        successfulAttempts,
        unsuccessfulAttempts: totalAttempts - successfulAttempts,
        successfulAttemptsPercent: pct(successfulAttempts),
        unsuccessfulAttemptsPercent: pct(totalAttempts - successfulAttempts),
    };
}

/**
 * Set totals per player, matched across games by player (connect code online, port offline) — so a
 * port or colour swap between games doesn't mix players, and doubles keeps all four. Only players of
 * the latest game are returned, with that game's playerIndex (what overlay elements look up).
 */
export const analyzeMatch = (gameStats: GameStats[] | undefined): MatchStats | undefined => {
    if (!gameStats?.length) return;
    const keyOf = (game: GameStats, playerIndex: number) => {
        const player = game.settings?.players?.find(p => p.playerIndex === playerIndex);
        return player ? playerKey(player) : `port${playerIndex + 1}`;
    };
    const counts = new Map<string, ActionCountsType[]>();
    const overall = new Map<string, OverallType[]>();
    for (const game of gameStats) {
        for (const a of game.postGameStats?.actionCounts ?? []) counts.set(keyOf(game, a.playerIndex), [...(counts.get(keyOf(game, a.playerIndex)) ?? []), a]);
        for (const o of game.postGameStats?.overall ?? []) overall.set(keyOf(game, o.playerIndex), [...(overall.get(keyOf(game, o.playerIndex)) ?? []), o]);
    }
    const latest = gameStats.at(-1)!;
    const players = (latest.postGameStats?.overall ?? []).map(o => ({ playerIndex: o.playerIndex, key: keyOf(latest, o.playerIndex) }));
    return {
        actionCounts: players.map(p => aggregateActionCounts(counts.get(p.key) ?? [], p.playerIndex)),
        overall: players.map(p => aggregateOverall(overall.get(p.key) ?? [], p.playerIndex)),
    };
};
