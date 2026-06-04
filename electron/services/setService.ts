import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { ElectronStrikeStore } from './store/storeStrike';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import type { GameRecord, RpsChoice, StrikeState } from '../../frontend/src/lib/models/types/stageStriking';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';

const DEFAULT_STARTERS = [2, 8, 28, 31, 32];
const DEFAULT_COUNTERPICKS = [3, 6, 7, 10, 11, 17, 22, 27];
const RPS_DURATION_MS = 30000;
const RPS_CHOICES: RpsChoice[] = ['rock', 'paper', 'scissors'];

function makeLobbyState(): StrikeState {
	return {
		p1Name: 'Player 1',
		p2Name: 'Player 2',
		bestOf: 3,
		score: { p1: 0, p2: 0 },
		gameNum: 1,
		phase: 'lobby',
		starters: DEFAULT_STARTERS,
		counterpicks: DEFAULT_COUNTERPICKS,
		stages: [],
		strikes: [],
		finalStageId: null,
		currentStriker: null,
		strikeOrder: [],
		strikeOrderIndex: 0,
		rps: { p1: null, p2: null, winner: null },
		rpsDeadline: null,
		characters: { p1: null, p2: null },
		dsrStages: { p1: [], p2: [] },
		lastWinner: null,
		games: [],
		connectedPlayers: [],
	};
}

function rpsResolve(p1: RpsChoice, p2: RpsChoice): 1 | 2 | null {
	if (p1 === p2) return null;
	if (
		(p1 === 'rock' && p2 === 'scissors') ||
		(p1 === 'paper' && p2 === 'rock') ||
		(p1 === 'scissors' && p2 === 'paper')
	)
		return 1;
	return 2;
}

@singleton()
export class ElectronSetService {
	private state: StrikeState = makeLobbyState();
	private rpsTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject(delay(() => ElectronStrikeStore)) private strikeStore: ElectronStrikeStore,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
	) {
		this.log.info('Initializing Set Service');
		const persisted = this.strikeStore.getStrikeState();
		if (persisted) this.state = persisted;
		this.initListeners();
	}

	private setState(state: StrikeState) {
		this.state = state;
		this.strikeStore.setStrikeState(state);
	}

	private clearRpsTimer() {
		if (this.rpsTimer) { clearTimeout(this.rpsTimer); this.rpsTimer = null; }
	}

	/** Start the 30s RPS countdown once both players are connected. No-op if already running or not in rps phase. */
	private maybeStartRpsTimer(s: StrikeState) {
		if (s.phase !== 'rps') return;
		if (s.rpsDeadline !== null) return; // already running
		const connected = s.connectedPlayers ?? [];
		if (!connected.includes(1) || !connected.includes(2)) return;
		s.rpsDeadline = Date.now() + RPS_DURATION_MS;
		this.clearRpsTimer();
		this.rpsTimer = setTimeout(() => this.onRpsTimeout(), RPS_DURATION_MS);
	}

	/** Auto-pick a random choice for any player who hasn't chosen, then resolve. */
	private onRpsTimeout() {
		this.rpsTimer = null;
		const s = { ...this.state, rps: { ...this.state.rps } };
		if (s.phase !== 'rps') return;
		if (!s.rps.p1) s.rps.p1 = RPS_CHOICES[Math.floor(Math.random() * 3)];
		if (!s.rps.p2) s.rps.p2 = RPS_CHOICES[Math.floor(Math.random() * 3)];
		this.resolveRps(s);
	}

	/** Apply an RPS result. On a tie, reset choices and restart the countdown. Mutates and commits `s`. */
	private resolveRps(s: StrikeState) {
		if (!s.rps.p1 || !s.rps.p2) { this.setState(s); return; }
		const winner = rpsResolve(s.rps.p1, s.rps.p2);
		if (!winner) {
			// Tie — fresh round, fresh 30s
			s.rps = { p1: null, p2: null, winner: null };
			s.rpsDeadline = Date.now() + RPS_DURATION_MS;
			this.clearRpsTimer();
			this.rpsTimer = setTimeout(() => this.onRpsTimeout(), RPS_DURATION_MS);
		} else {
			const second: 1 | 2 = winner === 1 ? 2 : 1;
			s.rps = { ...s.rps, winner };
			s.rpsDeadline = null;
			this.clearRpsTimer();
			s.strikeOrder = [[winner, 1], [second, 2], [winner, 1]];
			s.strikeOrderIndex = 0;
			s.currentStriker = winner;
			s.stages = [...s.starters];
			s.strikes = [];
			s.phase = 'striking';
		}
		this.setState(s);
	}

	private initListeners() {
		this.clientEmitter.on('StartSet', async (p1Name, p2Name, bestOf) => {
			await this.storeGames.clearRecentGames();
			this.clearRpsTimer();
			const s: StrikeState = {
				...makeLobbyState(),
				p1Name: p1Name || 'Player 1',
				p2Name: p2Name || 'Player 2',
				bestOf,
				phase: 'rps',
				connectedPlayers: this.state.connectedPlayers ?? [],
			};
			this.maybeStartRpsTimer(s); // both may already be connected
			this.setState(s);
			this.storeLiveStats.setStatsScene(LiveStatsScene.StrikePhase);
			this.log.info(`Set started: ${p1Name} vs ${p2Name} BO${bestOf}`);
		});

		this.clientEmitter.on('RpsChoice', (player, choice) => {
			const s = { ...this.state, rps: { ...this.state.rps } };
			if (s.phase !== 'rps') return;
			if (player === 1) s.rps.p1 = choice;
			else s.rps.p2 = choice;
			this.resolveRps(s);
		});

		this.clientEmitter.on('StrikeStage', (stageId) => {
			const s = { ...this.state };
			if (s.phase !== 'striking' && s.phase !== 'stageBan') return;
			if (!s.stages.includes(stageId) || s.strikes.includes(stageId)) return;
			s.strikes = [...s.strikes, stageId];

			if (s.phase === 'stageBan') {
				const remaining = s.stages.filter((id) => !s.strikes.includes(id));
				s.stages = remaining;
				s.strikes = [];
				s.currentStriker = s.lastWinner === 1 ? 2 : 1;
				s.phase = 'stagePick';
				this.setState(s);
				return;
			}

			// G1 striking — check if current step done
			let strikesNeeded = 0;
			for (let i = 0; i <= s.strikeOrderIndex; i++) {
				strikesNeeded += s.strikeOrder[i][1];
			}

			if (s.strikes.length >= strikesNeeded) {
				s.strikeOrderIndex++;
				if (s.strikeOrderIndex >= s.strikeOrder.length) {
					const remaining = s.stages.filter((id) => !s.strikes.includes(id));
					s.finalStageId = remaining[0] ?? null;
					s.phase = 'charSelect';
					s.characters = { p1: null, p2: null };
					s.currentStriker = null;
				} else {
					s.currentStriker = s.strikeOrder[s.strikeOrderIndex][0];
				}
			}
			this.setState(s);
		});

		this.clientEmitter.on('PickStage', (stageId) => {
			const s = { ...this.state };
			if (s.phase !== 'stagePick') return;
			if (!s.stages.includes(stageId)) return;
			s.finalStageId = stageId;
			s.phase = 'charLock';
			s.currentStriker = s.lastWinner;
			s.characters = { p1: null, p2: null };
			this.setState(s);
		});

		this.clientEmitter.on('SelectCharacter', (player, charId) => {
			const s = { ...this.state };
			const key: 'p1' | 'p2' = player === 1 ? 'p1' : 'p2';

			if (s.phase === 'charSelect') {
				s.characters = { ...s.characters, [key]: charId };
				if (s.characters.p1 !== null && s.characters.p2 !== null) s.phase = 'playing';
			} else if (s.phase === 'charLock') {
				if (player !== s.lastWinner) return;
				s.characters = { ...s.characters, [key]: charId };
				s.currentStriker = player === 1 ? 2 : 1;
				s.phase = 'charPick';
			} else if (s.phase === 'charPick') {
				const loser: 1 | 2 = s.lastWinner === 1 ? 2 : 1;
				if (player !== loser) return;
				s.characters = { ...s.characters, [key]: charId };
				s.phase = 'playing';
			} else {
				return;
			}
			this.setState(s);
		});

		this.clientEmitter.on('ReportWinner', (player) => {
			const s = { ...this.state };
			if (s.phase !== 'playing') return;

			const scoreKey: 'p1' | 'p2' = player === 1 ? 'p1' : 'p2';
			s.score = { ...s.score, [scoreKey]: s.score[scoreKey] + 1 };
			s.lastWinner = player;

			if (s.finalStageId !== null) {
				const dsrKey: 'p1' | 'p2' = player === 1 ? 'p1' : 'p2';
				if (!s.dsrStages[dsrKey].includes(s.finalStageId)) {
					s.dsrStages = {
						...s.dsrStages,
						[dsrKey]: [...s.dsrStages[dsrKey], s.finalStageId],
					};
				}
			}

			const game: GameRecord = {
				stageId: s.finalStageId ?? -1,
				winner: player,
				p1Char: s.characters.p1,
				p2Char: s.characters.p2,
				warmup: false,
			};
			s.games = [...s.games, game];
			s.gameNum++;

			const winsNeeded = Math.ceil(s.bestOf / 2);
			if (s.score.p1 >= winsNeeded || s.score.p2 >= winsNeeded) {
				s.phase = 'setComplete';
				this.setState(s);
				return;
			}

			// Next game: winner bans, loser picks from all stages minus loser's DSR
			const loser: 1 | 2 = player === 1 ? 2 : 1;
			const loserDsrKey: 'p1' | 'p2' = loser === 1 ? 'p1' : 'p2';
			const allStages = [...s.starters, ...s.counterpicks];
			const available = allStages.filter((id) => !s.dsrStages[loserDsrKey].includes(id));
			s.stages = available.length > 0 ? available : allStages;
			s.strikes = [];
			s.finalStageId = null;
			s.characters = { p1: null, p2: null };
			s.currentStriker = player;
			s.phase = 'stageBan';
			this.setState(s);
			this.storeLiveStats.setStatsScene(LiveStatsScene.StrikePhase);
		});

		this.clientEmitter.on('MarkWarmup', () => {
			const s = { ...this.state };
			if (s.phase !== 'playing') return;
			s.games = [
				...s.games,
				{
					stageId: s.finalStageId ?? -1,
					winner: null,
					p1Char: s.characters.p1,
					p2Char: s.characters.p2,
					warmup: true,
				},
			];
			s.characters = { p1: null, p2: null };
			// gameNum 1 = first counted game, use charSelect; later games use charLock
			if (s.gameNum === 1) {
				s.phase = 'charSelect';
				s.currentStriker = null;
			} else {
				s.phase = 'charLock';
				s.currentStriker = s.lastWinner;
			}
			this.setState(s);
		});

		this.clientEmitter.on('UndoLastGame', () => {
			const s = { ...this.state };
			if (!s.games.length) return;

			const last = s.games[s.games.length - 1];
			s.games = s.games.slice(0, -1);

			if (!last.warmup && last.winner !== null) {
				const scoreKey: 'p1' | 'p2' = last.winner === 1 ? 'p1' : 'p2';
				s.score = { ...s.score, [scoreKey]: Math.max(0, s.score[scoreKey] - 1) };
				if (last.stageId !== -1) {
					const dsrKey: 'p1' | 'p2' = last.winner === 1 ? 'p1' : 'p2';
					s.dsrStages = {
						...s.dsrStages,
						[dsrKey]: s.dsrStages[dsrKey].filter(id => id !== last.stageId),
					};
				}
				s.gameNum = Math.max(1, s.gameNum - 1);
			}

			s.phase = 'playing';
			s.finalStageId = last.stageId !== -1 ? last.stageId : null;
			s.characters = { p1: last.p1Char, p2: last.p2Char };
			const prevCounted = [...s.games].filter(g => !g.warmup).slice(-1)[0];
			s.lastWinner = prevCounted?.winner ?? null;
			this.setState(s);
		});

		this.clientEmitter.on('ResetSet', () => {
			this.clearRpsTimer();
			this.setState(makeLobbyState());
		});

		this.clientEmitter.on('StrikePlayerConnect', (player) => {
			const s = { ...this.state };
			const already = s.connectedPlayers ?? [];
			if (already.includes(player)) {
				this.setState(s);
				return;
			}
			s.connectedPlayers = [...already, player];
			this.maybeStartRpsTimer(s); // starts the 30s clock once both are in
			this.setState(s);
		});
	}
}
