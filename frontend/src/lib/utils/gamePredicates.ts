import { STAGE_DATA, Stage } from "../../lib/models/constants/stageData";
import type { GameStartMode, GameStats, Player } from "../../lib/models/types/slippiData";
import type { GameEndType, GameStartType, PostFrameUpdateType } from "@slippi/slippi-js";
import { isNil } from "lodash";

/** The settings entry for a port index. `settings.players` skips empty ports (ports 1 + 3 →
 *  [port1, port3]), so array position ≠ playerIndex — always look players up by playerIndex. */
export const findSettingsPlayer = <T extends { playerIndex: number }>(
    players: (T | null | undefined)[] | null | undefined,
    playerIndex: number | null | undefined,
): T | undefined => {
    if (isNil(playerIndex)) return undefined;
    return players?.find((player) => player?.playerIndex === playerIndex) ?? undefined;
}

/** Winning player's port index (playerIndex), or undefined for ties / handwarmers / no result. */
export const getWinnerIndex = (game: GameStats | undefined): number | undefined => {
    if (!game) return;
    if (isHandwarmers(game)) return;
    if (isTiedGame(game)) return
    const lrasIndex = game.gameEnd.lrasInitiatorIndex ?? -1
    if (lrasIndex >= 0) {
        // The player who did NOT quit wins (singles). Without settings, assume ports 1 + 2.
        const players = game.settings?.players?.filter((player) => player) ?? [];
        if (!players.length) return lrasIndex === 0 ? 1 : 0
        const others = players.filter((player) => player.playerIndex !== lrasIndex);
        return others.length === 1 ? others[0].playerIndex : undefined
    }

    const placements = game.gameEnd.placements;
    if (placements.filter(placement => placement.position === 0).length >= 2) return
    return placements.find(placement => placement.position === 0)?.playerIndex
}

export const isTiedGame = (game: GameStats | undefined | null) => {
    if (!game) return false
    if (hasGameBombRain(game)) return true
    const placements = game.gameEnd.placements ?? [];
    if (placements.length >= 2 && placements.filter(p => p.position === 0).length >= 2) return true;
    const players = Object.values(game.lastFrame?.players ?? {})
    if (players.every((player) => isNil(player) || player.post.stocksRemaining === 0)) return true
    if (players.every(player => {
        const reference = players[0];
        if (!reference) return false;
        return reference.post.stocksRemaining === player?.post.stocksRemaining && Math.floor(reference.post.percent ?? 0) === Math.floor(player?.post.percent ?? -1)
    })) return true
    return false
}

/** Player slot (0 = Player 1, 1 = Player 2) of a port in a set. Slots follow the set's first game
 *  (players ordered by port); later games match by connect code, so swapping ports mid-set keeps the
 *  score with the player. Offline (no codes) the port decides. */
export const getPlayerSlot = (
    game: GameStats | undefined,
    playerIndex: number | undefined,
    referencePlayers?: ({ playerIndex: number; connectCode?: string } | null | undefined)[],
): number | undefined => {
    const players = game?.settings?.players?.filter((player) => player) ?? [];
    const player = findSettingsPlayer(players, playerIndex);
    if (!player) return undefined;
    const reference = (referencePlayers ?? players).filter((p) => p);
    if (player.connectCode) {
        const byCode = reference.findIndex((p) => p?.connectCode === player.connectCode);
        if (byCode >= 0) return byCode;
    }
    const byPort = reference.findIndex((p) => p?.playerIndex === playerIndex);
    return byPort >= 0 ? byPort : players.indexOf(player);
}

/** Running set score [Player 1 wins, Player 2 wins] — indexed by player slot, not by port. */
export const getGameScore = (recentGames: GameStats[]) => {
    const reference = recentGames.find((game) => game?.settings?.players?.length)?.settings?.players;
    return recentGames.reduce((score: number[], game: GameStats | undefined) => {
        if (!game) return score
        if (isTiedGame(game)) return score
        const slot = getPlayerSlot(game, getWinnerIndex(game), reference)
        if (isNil(slot) || slot > 1) return score
        score[slot] += 1
        return score
    }, [0, 0])
}

/** Is `player` ahead in the set score after `game`? */
export const didPlayerWin = (game: GameStats, player: Player): boolean => {
    const slot = getPlayerSlot(game, player.playerIndex) ?? player.playerIndex;
    return (game.score[slot] ?? 0) > (game.score[slot === 0 ? 1 : 0] ?? 0);
}

export const getGameMode = (settings: GameStartType | null): GameStartMode => {
    return settings?.matchInfo?.matchId?.match(/mode\.(\w+)/)?.at(1) as GameStartMode ?? "local";
}


export const getComboCount = (postFrame: PostFrameUpdateType | undefined) => {
    if (isNil(postFrame)) return false;
    return postFrame.currentComboCount ?? 0;
};

export const hasStocksRemaining = (
    postFrame: PostFrameUpdateType | undefined,
    stocks: number,
) => {
    if (isNil(postFrame)) return false;
    return (postFrame.stocksRemaining ?? 0) >= stocks;
};

export const isPlayerAlive = (
    postFrame: PostFrameUpdateType | undefined,
) => {
    if (isNil(postFrame)) return false;
    const actionStateId = postFrame?.actionStateId
    const actionStateCounter = postFrame?.actionStateCounter
    const hasStocks = hasStocksRemaining(postFrame, 1)
    if (isNil(actionStateId) || isNil(actionStateCounter)) return;
    return ((actionStateId ?? 0) > 10 || ((actionStateId ?? 0) <= 10 && actionStateCounter != -1)) && hasStocks;
};

export const isPlayerEnteringOnHalo = (
    postFrame: PostFrameUpdateType | undefined,
) => {
    if (isNil(postFrame)) return false;
    return (postFrame.actionStateId ?? 0) === 12;
};

export const hasGameBombRain = (game: GameStats): boolean => {
    if (game.settings?.gameInfoBlock?.bombRainEnabled) return true
    return false
}

export const getBlastZone = (stage: Stage) => {
    const stageData = STAGE_DATA[stage];
    if (!stageData) return;
    const lines = [
        [stageData.leftXBoundary, stageData.lowerYBoundary],
        [stageData.rightXBoundary, stageData.upperYBoundary],
    ]
    return [
        [lines[0][0], lines[0][1]],
        [lines[1][0], lines[1][1]],
    ];
};

export const getOffStageZone = (stage: Stage) => {
    const lines = getBlastZone(stage);
    if (!lines) return;
    const multiplier = 5;
    const width = (lines[1][0] - lines[0][0]);
    const height = (lines[1][1] - lines[0][1]);
    return [
        [lines[0][0] + width / multiplier, lines[0][1] + height / multiplier],
        [lines[1][0] - width / multiplier, lines[1][1] - height / multiplier],
    ];
};

export const isPauseEnabled = (settings: GameStartType) => {
    return (settings.gameInfoBlock?.gameBitfield3 ?? 0) < 142
}

export const isLrasEnding = (gameEnd: GameEndType) => {
    return gameEnd.gameEndMethod == 7
}

// Inspired from this https://github.com/Sheepolution/Melee-Ghost-Streamer/blob/7c9dd6662e6c3d2850ccfc29afc805f7a9a4ecf3/app/src/compute.js#L20
export const isHandwarmers = (gameStats: GameStats): boolean => {
    if (isNil(gameStats)) return false;
    if (isNil(gameStats.settings)) return false
    if (isNil(gameStats.postGameStats)) return false
    if (isNil(gameStats.lastFrame)) return false
    if (getGameMode(gameStats.settings) === "ranked") return false;

    let weight = 0;

    const startStocks = gameStats.settings.players[0]?.startStocks ?? 4;

    if (gameStats.postGameStats.overall.every(t => t.totalDamage < 50)) {
        weight += 1;
    } else {
        weight -= 1;
    }

    if (isPauseEnabled(gameStats.settings)) {

        if (isLrasEnding(gameStats.gameEnd)) {
            weight += 1;
        } else {
            // If this was handwarmers it's weird that they didn't use lras
            weight -= 1;
        }


        let stocksPlayer1 = 0;
        let stocksPlayer2 = 0;

        const player1Index = gameStats.settings.players.find((player) => player)?.playerIndex ?? 0;
        gameStats.postGameStats.stocks.forEach((stock) => {
            if (stock.playerIndex == player1Index) {
                stocksPlayer1 += 1;
            } else {
                stocksPlayer2 += 1;
            }
        });

        // Checking if the lras was not for the last stock.
        if (stocksPlayer1 < startStocks - 1 && stocksPlayer2 < startStocks - 1) {
            weight += 2;
        }
    } else {
        if (startStocks > 2) {
            if (gameStats.postGameStats.overall.every(t => t.killCount <= 1)) {
                weight += 1;
            }
        }
    }

    if (startStocks > 2) {
        // Check if the game's duration was less than 45 seconds
        if ((gameStats.lastFrame.frame + 123) / 60 < 45) {
            weight += 1;
        }
    }

    return weight >= 2;
}