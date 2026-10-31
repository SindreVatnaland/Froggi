import type { ActionCountsType, FrameEntryType, GameEndType, GameStartType, OverallType, PlayerType, PostFrameUpdateType, PreFrameUpdateType, StatsType } from './slippiTypes';
import type { BestOf } from "../enum";
import type { Rating } from "openskill";

export interface SlippiCharacter {
    character: string;
    gameCount: number;
    id: number;
}

export interface Character {
    characterName: string;
    characterId: number;
    characterColorId: number | undefined;
    gameCount: number;
    gameCountPercent: number;
}

export interface CurrentPlayer extends Player {
    rank: CurrentPlayerRank | undefined
}

export interface CurrentPlayerRank extends Rank {
    new: RankedNetplayProfile | undefined;
}

export interface EdgeGuard {
    totalAttempts: number;
    successfulAttempts: number;
    unsuccessfulAttempts: number;
    successfulAttemptsPercent: number
    unsuccessfulAttemptsPercent: number
}

export interface Recovery {
    totalRecoveries: number;
    successfulRecoveries: number;
    unsuccessfulRecoveries: number;
    successfulRecoveriesPercent: number;
    unsuccessfulRecoveriesPercent: number;
}

export interface PlayKey {
    uid: string;
    playKey: string;
    connectCode: string;
    displayName: string;
    latestVersion?: string;
}

export interface Player extends PlayerType {
    rank: Rank | undefined;
}

export interface PlayerFrameType {
    pre: PreFrameUpdateType;
    post: PostFrameUpdateType;
}

export interface Rank {
    current: RankedNetplayProfile | undefined;
    predictedRating: RatingPrediction | undefined;
}



export interface RatingPrediction {
    win: RatingPredictionWithOrdinal;
    loss: RatingPredictionWithOrdinal;
}

export type RatingPredictionWithOrdinal = Rating & { ordinal: number }

export interface RankHistory { }

export type Sets = {
    [Mode in GameStartMode]: GameStats[];
};

export type StatsTypeExtended = StatsType | {
    overall: OverallTypeExtended[]
}

/** A frozen game state for an overlay screenshot (preview page ?state=<id>) — a replay at one moment. */
export interface PreviewState {
    gameSettings: GameStartTypeExtended;
    currentPlayers: Player[];
    gameFrame: FrameEntryType | null;
    postGame: GameStats;
    gameScore: number[];
    fightStats: import('../../utils/fightStats').LiveFightStats;
    /** The replay as the set's only game — per-game summaries and set totals. */
    recentGames: GameStats[];
    matchStats: MatchStats | undefined;
}

/** One of the latest replays in the Slippi folder — offered for loading into the running set. */
export interface ReplaySummary {
    /** File path (also the id; Electron only accepts paths from its own latest-replays list). */
    path: string;
    startAt: string | null;
    stageId: number | null;
    isTeams: boolean;
    matchId: string;
    /** stocks = stocks left when the game ended. */
    players: { playerIndex: number; port: number; characterId: number | null; teamId: number | null; tag: string; won: boolean; stocks: number | null }[];
}

export interface GameStats {
    gameEnd: GameEndType;
    isMock: boolean;
    isReplay: boolean;
    lastFrame: FrameEntryType | null
    postGameStats: StatsType | null;
    score: number[]
    /**
     * Host override of the result: the winner side (0 = Player/Team 1, null = doesn't count) and a
     * note (e.g. "LRAS by mistake", "DQ: illegal controller"). Wins over what the replay says.
     */
    resultOverride?: { winnerSlot: 0 | 1 | null; note: string } | null;
    /** On the set's first game: the host swapped sides (Player/Team 1 ↔ 2) and/or the two players inside a team
     *  (Dashboard → Fix set…). Everything that works out sides from the first game follows (utils/teams.ts setReference). */
    sides?: SetSides | null;
    /** Highlights of this game (frames in the .slp + score). Not written any more — flows keep highlights in lists. */
    highlights?: GameHighlight[] | null;
    /** The game's replay file: relative to the Slippi replay folder (e.g. "2026-10/Game_20261020T1200.slp"),
     *  absolute when it lives elsewhere. With `highlights` it points at every highlight (daily highlights, viewer). */
    replayPath?: string | null;
    settings: GameStartTypeExtended | null;
    timestamp: Date | null;
}

export interface Match {
    stats: MatchStats
    bestOf: BestOf
}

export interface MatchStats {
    actionCounts: ActionCountsType[];
    overall: OverallType[];
}

export interface OverallTypeExtended extends OverallType {
    edgeGuard: EdgeGuard | undefined;
    recovery: Recovery | undefined;
}


export type GameStartTypeExtended = GameStartType & {
    isSimulated: boolean | null;
    /** Unique per game start (also per simulated run) — "game starts" fires once per id. */
    gameStartId?: string;
    /** This game starts a new set (a different match / players, or the last set ended) — flows: {{newSet}}. */
    isNewSet?: boolean;
    matchInfo: MatchInfoExtended;
}

export type GameStartMode = "ranked" | "unranked" | "direct" | "teams" | "local";

export type MatchInfoExtended = {
    sessionId: string | null;
    /** @deprecated since slippi-js 7.2.0 — use sessionId */
    matchId: string | null;
    gameNumber: number | null;
    tiebreakerNumber: number | null;
    mode: GameStartMode | undefined;
    bestOf: number | undefined
}

export interface RankedNetplaySeason {
    continent: string | undefined;
    continentInitials: string | undefined;
    characters: Character[];
    leaderboardPlacement: number | undefined;
    dailyGlobalPlacement: number;
    dailyRegionalPlacement: number;
    losses: number;
    wins: number;
    ratingOrdinal: number;
    rank: string;
}

export interface RankedNetplayProfile {
    connectCode: string;
    continent: string | undefined;
    continentInitials: string | undefined;
    characters: Character[];
    displayName: string;
    leaderboardPlacement: number | undefined;
    dailyGlobalPlacement: number;
    dailyRegionalPlacement: number;
    losses: number;
    lossesPercent: number;
    rating: number;
    rank: string;
    seasons: RankedNetplaySeason[];
    totalGames: number;
    ratingMu: number;
    ratingSigma: number;
    totalSets: number;
    wins: number;
    winsPercent: number;
    isMock?: boolean | undefined;
    userId: string;
    timestamp: Date;
}

export interface SessionStats {
    startRankStats: RankedNetplayProfile | undefined,
    startTime: Date,
    currentRankStats: RankedNetplayProfile | undefined,
    latestUpdate: Date
};

export interface SlippiLauncherSettings {
    appDataPath: string | undefined;
    isoPath: string | undefined;
    useMonthlySubfolders: boolean | undefined;
    rootSlpPath: string | undefined;
    spectateSlpPath: string | undefined;
    useNetplayBeta: boolean
}

export interface StageData {
    name: string;
    leftXBoundary: number;
    rightXBoundary: number;
    upperYBoundary: number;
    lowerYBoundary: number;
    mainPlatformHeight: number;
    sidePlatformHeight?: number;
    topPlatformHeight?: number;
    leftLedgeX: number;
    rightLedgeX: number;
    viewbox: string;
    platforms: string[][];
    mainStage: string[];
    blastZones: number[][];
    getRandallPosition: ((frame: number) => number[][] | undefined) | undefined;
}

/** A highlight of a stored game: frames in its replay and the score the flow gave it. */
export interface GameHighlight {
    startFrame: number;
    endFrame: number;
    score: number;
}

/** Host fixes to who is Player/Team 1 and 2 for a set (stored on its first game). */
export interface SetSides {
    /** Player/Team 1 ↔ 2. */
    swapped?: boolean;
    /** Doubles: the two players inside Team 1 / Team 2 swapped (who is "Player 1" vs "Player 3"). */
    teamOrder?: [boolean, boolean];
}
