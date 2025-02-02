import { STAGE_DATA, Stage } from "../../lib/models/constants/stageData";
import type { GameStartMode, GameStats } from "../../lib/models/types/slippiData";
import type { GameEndType, GameStartType, PostFrameUpdateType } from "@slippi/slippi-js";
import { isNil } from "lodash";

// TODO: Figure out how tied game placements look
export const getWinnerIndex = (game: GameStats | undefined): number | undefined => {
    if (!game) return;
    if (isHandwarmers(game)) return;
    if (isTiedGame(game)) return
    const lrasIndex = game.gameEnd.lrasInitiatorIndex ?? -1
    if (lrasIndex >= 0) return lrasIndex === 0 ? 1 : 0

    const placements = game.gameEnd.placements;
    if (placements.filter(placement => placement.position === 0).length >= 2) return
    return placements.find(placement => placement.position === 0)?.playerIndex
}

export const isTiedGame = (game: GameStats | undefined | null) => {
    if (!game) return false
    if (hasGameBombRain(game)) return true
    const players = Object.values(game.lastFrame?.players ?? {})
    if (players.every((player) => isNil(player) || player.post.stocksRemaining === 0)) return true
    if (players.every(player => {
        const reference = players[0];
        if (!reference) return;
        return reference.post.stocksRemaining === player?.post.stocksRemaining && Math.floor(reference.post.percent ?? 0) === Math.floor(player?.post.percent ?? -1)
    })) return true
    return false
}

export const getGameScore = (recentGames: GameStats[]) => {
    const gameScore = recentGames
        .reduce((score: number[], game: GameStats | undefined) => {
            if (!game) return score

            if (isTiedGame(game)) return score

            const winnerIndex = getWinnerIndex(game)
            if (isNil(winnerIndex)) return score
            score[winnerIndex] += 1
            return score
        }, [0, 0]) ?? [0, 0]
    return gameScore
}

export const getGameMode = (settings: GameStartType): GameStartMode => {
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

        gameStats.postGameStats.stocks.forEach((stock) => {
            if (stock.playerIndex == 0) {
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