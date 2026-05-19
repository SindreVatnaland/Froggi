export type RpsChoice = 'rock' | 'paper' | 'scissors';
export type StrikePhase = 'rps' | 'striking' | 'charSelect' | 'charLock' | 'playing' | 'complete';

export interface StrikeState {
    phase: StrikePhase;
    stages: number[];
    strikes: { p1: number[]; p2: number[] };
    currentStriker: 1 | 2 | null;
    finalStageIndex: number | null;
    rps: {
        p1: RpsChoice | null;
        p2: RpsChoice | null;
        winner: 1 | 2 | null;
    };
    characters: {
        p1: number | null;
        p2: number | null;
    };
    /** Each entry is [playerNum, banCount]. E.g. [[2,1],[1,2],[2,1]] */
    strikeOrder: [1 | 2, number][];
    bansRemaining: number | null;
    /** Seconds remaining in the current phase timer. null = no timer. */
    timerSeconds: number | null;
    timerRunning: boolean;
    /** Stage IDs that each player is banned from picking (DSR). */
    dsrStages: { p1: number | null; p2: number | null };
}
