export type RpsChoice = 'rock' | 'paper' | 'scissors';

export type StrikePhase =
	| 'lobby'
	| 'rps'
	| 'rpsResult'
	| 'striking'
	| 'stageBan'
	| 'stagePick'
	| 'charSelect'
	| 'charLock'
	| 'charPick'
	| 'playing'
	| 'setComplete';

export interface GameRecord {
	stageId: number;
	winner: 1 | 2 | null;
	p1Char: number | null;
	p2Char: number | null;
	warmup: boolean;
}

export interface StrikeState {
	p1Name: string;
	p2Name: string;
	bestOf: 3 | 5;
	score: { p1: number; p2: number };
	gameNum: number;

	phase: StrikePhase;

	starters: number[];
	counterpicks: number[];
	stages: number[];
	strikes: number[];
	finalStageId: number | null;

	currentStriker: 1 | 2 | null;
	strikeOrder: [1 | 2, number][];
	strikeOrderIndex: number;

	rps: {
		p1: RpsChoice | null;
		p2: RpsChoice | null;
		winner: 1 | 2 | null;
	};
	/** Epoch ms when the RPS countdown ends. Set once both players are connected. null = not started. */
	rpsDeadline: number | null;

	characters: {
		p1: number | null;
		p2: number | null;
	};

	dsrStages: { p1: number[]; p2: number[] };
	lastWinner: 1 | 2 | null;

	games: GameRecord[];
	connectedPlayers: (1 | 2)[];
}
