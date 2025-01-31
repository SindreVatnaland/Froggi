import type { ActionCountsType, FrameEntryType, GameEndType, GameStartType, OverallType, PlayerType, PostFrameUpdateType, PreFrameUpdateType, StatsType } from "@slippi/slippi-js";
import type { BestOf } from "../enum";

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
    game: PlayerGame
    rank: CurrentPlayerRank | undefined
}

export interface CurrentPlayerRank extends Rank {
    new: RankedNetplayProfile | undefined;
    history: RankedNetplayProfile[] | undefined;
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

export type PlayerGame = {
    [mode in GameStartMode]: { [matchId: string]: GameStats[] };
}

export interface Rank {
    current: RankedNetplayProfile | undefined;
}

export interface RankHistory { }

export type Sets = {
    [Mode in GameStartMode]: GameStats[];
};

export type StatsTypeExtended = StatsType | {
    overall: OverallTypeExtended[]
}

export interface GameStats {
    gameEnd: GameEndType;
    isMock: boolean;
    isReplay: boolean;
    lastFrame: FrameEntryType | null
    postGameStats: StatsType | null;
    score: number[]
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
    matchInfo: MatchInfoExtended;
}

export type GameStartMode = "ranked" | "unranked" | "direct" | "local";

export type MatchInfoExtended = {
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
    totalSets: number;
    wins: number;
    winsPercent: number;
    isMock?: boolean | undefined;
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

