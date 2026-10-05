import { delay, inject, singleton } from 'tsyringe';
import type { ElectronLog } from 'electron-log';
import { ElectronStrikeStore } from './store/storeStrike';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { scopedLog } from '../utils/logger';
import type { GameRecord, RpsChoice, StrikeState } from '../../frontend/src/lib/models/types/stageStriking';
import type { GameStats } from '../../frontend/src/lib/models/types/slippiData';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import { getPlayerSlot, getWinnerIndex } from '../../frontend/src/lib/utils/gamePredicates';
import { MessageHandler } from './messageHandler';
import crypto from 'crypto';

// Melee singles ruleset (2025 majors): starters FoD, Yoshi's, Dream Land, Battlefield, FD;
// counterpick Pokémon Stadium.
export const DEFAULT_STARTERS = [2, 8, 28, 31, 32];
export const DEFAULT_COUNTERPICKS = [3];
const RPS_DURATION_MS = 30000;
/** A set nobody touched for this long is ended on startup. */
export const SET_IDLE_MS = 3 * 60 * 60 * 1000;
const RPS_CHOICES: RpsChoice[] = ['rock', 'paper', 'scissors'];

export function makeLobbyState(): StrikeState {
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
		bans: [],
		allowAgreement: true,
		agreement: null,
		setPlayers: null,
		setWinner: null,
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

const key = (player: 1 | 2): 'p1' | 'p2' => (player === 1 ? 'p1' : 'p2');
const other = (player: 1 | 2): 1 | 2 => (player === 1 ? 2 : 1);

/**
 * Set flow (Melee ruleset):
 *  Game 1: charSelect (double blind) → rps → rpsResult (winner picks strike order) → striking (1-2-1
 *          over the starters) → playing.
 *  Game 2+: stageBan (previous winner bans 1; skipped in Bo5) → stagePick (loser, minus their DSR
 *          stages) → charLock (winner) → charPick (loser) → playing.
 * Winners come from Slippi automatically (PostGameStats) or from the TO's buttons.
 * Scenes: only the host starts a set. A game end shows Post Game as usual; the first striking action
 * after it (character pick, RPS, strike/ban/pick) switches to the Strike Phase scene. Only games with
 * the set's own players count, and never ranked/unranked.
 */
@singleton()
export class ElectronSetService {
	private state: StrikeState = makeLobbyState();
	/** States before each striking action — host undo (in memory only). */
	private history: StrikeState[] = [];
	private rpsTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('ClientEmitter') private clientEmitter: TypedEmitter,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject(delay(() => ElectronStrikeStore)) private strikeStore: ElectronStrikeStore,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => MessageHandler)) private messageHandler: MessageHandler,
	) {
		this.log = scopedLog(this.log, 'StageStriking');
		this.log.info('Initializing Set Service');
		const persisted = this.strikeStore.getStrikeState();
		if (persisted) this.state = persisted;
		if (this.state.phase !== 'lobby' && this.state.updatedAt && Date.now() - this.state.updatedAt > SET_IDLE_MS) {
			this.log.info('Ending a set that was idle for over 3 hours');
			this.state = makeLobbyState();
			this.strikeStore.setStrikeState(this.state);
		}
		this.resumeRpsTimer();
		this.initListeners();
	}

	// ── Phone links ─────────────────────────────────────────────────────────────────────────────
	// Each player's QR link carries a secret token (/set/p/1?t=…). Phones aren't authorised, so their
	// striking actions are only accepted with a token, and only for that player / on their turn. The
	// host (app window or a browser with the password) sends no token and may do anything.
	private tokens(): { 1: string; 2: string } {
		let tokens = this.strikeStore.getPlayerTokens();
		if (!tokens) {
			tokens = { 1: crypto.randomBytes(12).toString('hex'), 2: crypto.randomBytes(12).toString('hex') };
			this.strikeStore.setPlayerTokens(tokens);
		}
		return tokens;
	}

	private sendTokens() {
		this.messageHandler.sendHostMessage('StrikePlayerTokens', this.tokens());
	}

	/** Which player a token belongs to; undefined = no token (host). null = invalid token. */
	private tokenPlayer(token: string | undefined): 1 | 2 | null | undefined {
		if (token === undefined) return undefined;
		const tokens = this.tokens();
		return token === tokens[1] ? 1 : token === tokens[2] ? 2 : null;
	}

	/** May this caller act as `player`? (host always; a phone only as its own player) */
	allowedAs(token: string | undefined, player: 1 | 2 | null | undefined): boolean {
		const who = this.tokenPlayer(token);
		if (who === undefined) return true;
		if (this.state.paused) return false; // the host paused striking
		return who !== null && who === player;
	}

	getState(): StrikeState {
		return this.state;
	}

	private setState(state: StrikeState) {
		this.state = { ...state, updatedAt: Date.now() };
		this.strikeStore.setStrikeState(this.state);
	}

	/** A striking action happened: show the Strike Phase scene (never interrupting a running game). */
	private enterStrikeScene() {
		const scene = this.storeLiveStats.getStatsScene();
		if (scene === LiveStatsScene.StrikePhase || scene === LiveStatsScene.InGame) return;
		this.storeLiveStats.setStatsScene(LiveStatsScene.StrikePhase);
	}

	private clearRpsTimer() {
		if (this.rpsTimer) { clearTimeout(this.rpsTimer); this.rpsTimer = null; }
	}

	/** After a restart mid-RPS, finish the countdown that was running (resolves at once if it expired). */
	private resumeRpsTimer() {
		if (this.state.phase !== 'rps' || this.state.rpsDeadline === null) return;
		this.rpsTimer = setTimeout(() => this.onRpsTimeout(), Math.max(0, this.state.rpsDeadline - Date.now()));
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
			s.rps = { ...s.rps, winner };
			s.rpsDeadline = null;
			this.clearRpsTimer();
			// The RPS winner chooses whether to strike first or second.
			s.currentStriker = winner;
			s.phase = 'rpsResult';
		}
		this.setState(s);
	}

	startSet(p1Name: string, p2Name: string, bestOf: 3 | 5, allowAgreement = true) {
		this.clearRpsTimer();
		this.history = [];
		this.setState({
			...makeLobbyState(),
			p1Name: p1Name || 'Player 1',
			p2Name: p2Name || 'Player 2',
			bestOf,
			allowAgreement,
			phase: 'charSelect',
			connectedPlayers: this.state.connectedPlayers ?? [],
		});
		this.log.info(`Set started: ${p1Name} vs ${p2Name} BO${bestOf}`);
	}

	rpsChoice(player: 1 | 2, choice: RpsChoice) {
		const s = { ...this.state, rps: { ...this.state.rps } };
		if (s.phase !== 'rps') return;
		s.rps[key(player)] = choice;
		this.resolveRps(s);
	}

	rpsWinnerOrder(firstStriker: 1 | 2) {
		const s = { ...this.state };
		if (s.phase !== 'rpsResult') return;
		// 1-2-1 over the 5 starters: first strikes 1, second strikes 2, first strikes 1 → 1 stage left.
		s.strikeOrder = [[firstStriker, 1], [other(firstStriker), 2], [firstStriker, 1]];
		s.strikeOrderIndex = 0;
		s.currentStriker = firstStriker;
		s.stages = [...s.starters];
		s.strikes = [];
		s.phase = 'striking';
		this.setState(s);
	}

	strikeStage(stageId: number) {
		const s = { ...this.state };
		if (s.phase !== 'striking' && s.phase !== 'stageBan') return;
		if (!s.stages.includes(stageId) || s.strikes.includes(stageId)) return;
		s.strikes = [...s.strikes, stageId];

		if (s.phase === 'stageBan') {
			s.bans = [...(s.bans ?? []), stageId];
			s.stages = s.stages.filter((id) => !s.strikes.includes(id));
			s.strikes = [];
			s.currentStriker = s.lastWinner ? other(s.lastWinner) : 1;
			s.phase = 'stagePick';
			this.setState(s);
			return;
		}

		// G1 striking — advance when the current striker has struck their share
		const strikesNeeded = s.strikeOrder.slice(0, s.strikeOrderIndex + 1).reduce((n, [, count]) => n + count, 0);
		if (s.strikes.length >= strikesNeeded) {
			s.strikeOrderIndex++;
			if (s.strikeOrderIndex >= s.strikeOrder.length) {
				// Characters were picked before striking, so the game can start.
				s.finalStageId = s.stages.find((id) => !s.strikes.includes(id)) ?? null;
				s.phase = 'playing';
				s.currentStriker = null;
			} else {
				s.currentStriker = s.strikeOrder[s.strikeOrderIndex][0];
			}
		}
		this.setState(s);
	}

	pickStage(stageId: number) {
		const s = { ...this.state };
		if (s.phase !== 'stagePick') return;
		if (!s.stages.includes(stageId)) return;
		s.finalStageId = stageId;
		s.phase = 'charLock';
		s.currentStriker = s.lastWinner;
		s.characters = { p1: null, p2: null };
		this.setState(s);
	}

	selectCharacter(player: 1 | 2, charId: number) {
		const s = { ...this.state };
		if (s.phase === 'charSelect') {
			s.characters = { ...s.characters, [key(player)]: charId };
			if (s.characters.p1 !== null && s.characters.p2 !== null) {
				// Game 1 stage not decided yet → RPS + striking; a replayed warmup keeps its stage.
				s.phase = s.finalStageId !== null ? 'playing' : 'rps';
				this.maybeStartRpsTimer(s);
			}
		} else if (s.phase === 'charLock') {
			if (player !== s.lastWinner) return;
			s.characters = { ...s.characters, [key(player)]: charId };
			s.currentStriker = other(player);
			s.phase = 'charPick';
		} else if (s.phase === 'charPick') {
			if (!s.lastWinner || player !== other(s.lastWinner)) return;
			s.characters = { ...s.characters, [key(player)]: charId };
			s.phase = 'playing';
		} else {
			return;
		}
		this.setState(s);
	}

	reportWinner(player: 1 | 2, playedStageId?: number) {
		const s = { ...this.state };
		if (s.phase !== 'playing') return;

		const winnerKey = key(player);
		s.score = { ...s.score, [winnerKey]: s.score[winnerKey] + 1 };
		s.lastWinner = player;
		s.bans = [];
		s.agreement = null;

		// DSR tracks the stage actually played (Slippi), falling back to the agreed one.
		const stageId = playedStageId ?? s.finalStageId;
		if (stageId !== null && stageId !== undefined && !s.dsrStages[winnerKey].includes(stageId)) {
			s.dsrStages = { ...s.dsrStages, [winnerKey]: [...s.dsrStages[winnerKey], stageId] };
		}

		const game: GameRecord = {
			stageId: stageId ?? -1,
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

		// Next game: loser picks from all stages minus the stages they already won on (DSR).
		const loser = other(player);
		const allStages = [...s.starters, ...s.counterpicks];
		const available = allStages.filter((id) => !s.dsrStages[key(loser)].includes(id));
		s.stages = available.length > 0 ? available : allStages;
		s.strikes = [];
		s.finalStageId = null;
		s.characters = { p1: null, p2: null };
		if (s.bestOf === 5) {
			// Bo5: no winner bans — the loser picks straight away.
			s.currentStriker = loser;
			s.phase = 'stagePick';
		} else {
			s.currentStriker = player;
			s.phase = 'stageBan';
		}
		this.setState(s);
	}

	/** The picker asks to play a stage DSR blocks for them; the other player must accept. */
	requestAgreement(player: 1 | 2, stageId: number) {
		const s = { ...this.state };
		if (s.phase !== 'stagePick' || s.allowAgreement === false || player !== s.currentStriker) return;
		if (![...s.starters, ...s.counterpicks].includes(stageId) || s.bans?.includes(stageId)) return;
		if (!s.dsrStages[key(player)].includes(stageId)) return; // not blocked — just pick it
		s.agreement = { stageId, requestedBy: player };
		this.setState(s);
	}

	/** The other player accepts/declines; the requester may withdraw (accept=false). */
	answerAgreement(player: 1 | 2, accept: boolean) {
		const s = { ...this.state };
		if (s.phase !== 'stagePick' || !s.agreement) return;
		if (player === s.agreement.requestedBy) {
			if (accept) return; // can't accept your own request
			this.setState({ ...s, agreement: null });
			return;
		}
		const { stageId } = s.agreement;
		s.agreement = null;
		this.setState(s);
		if (accept) {
			this.setState({ ...this.state, stages: [...new Set([...this.state.stages, stageId])] });
			this.pickStage(stageId);
		}
	}

	/**
	 * The host ends the match early. With a winner the set completes with that result (kept for result
	 * reporting, e.g. start.gg); without one the set is cancelled. Phone links stay the same.
	 */
	endMatch(winner: 1 | 2 | null) {
		this.clearRpsTimer();
		if (winner === null) {
			this.setState({ ...makeLobbyState(), connectedPlayers: this.state.connectedPlayers ?? [] });
			this.log.info('Match cancelled by the host');
			return;
		}
		const s = { ...this.state };
		if (s.phase === 'lobby') return;
		s.setWinner = winner;
		s.lastWinner = winner;
		s.phase = 'setComplete';
		s.currentStriker = null;
		s.agreement = null;
		this.setState(s);
		this.log.info(`Match ended by the host — winner: player ${winner}`);
	}

	/** Does this Slippi game belong to the running set? (same players; never ranked/unranked) */
	private gameBelongsToSet(game: GameStats): boolean {
		const mode = game.settings?.matchInfo?.mode;
		if (mode === 'ranked' || mode === 'unranked') return false;
		const players = (game.settings?.players ?? []).filter((p) => p);
		const known = this.state.setPlayers;
		if (!known?.length) return true;
		return players.every((p) =>
			p.connectCode
				? known.some((k) => k.connectCode === p.connectCode)
				: known.some((k) => !k.connectCode && k.playerIndex === p.playerIndex),
		);
	}

	/** Run a striking action; if it changed the state, remember the state before it (host undo). */
	private act<T>(fn: () => T): T {
		const before = structuredClone(this.state);
		const result = fn();
		const strip = (st: StrikeState) => JSON.stringify({ ...st, updatedAt: 0, rpsDeadline: 0, connectedPlayers: [] });
		if (strip(before) !== strip(this.state)) {
			this.history.push(before);
			if (this.history.length > 50) this.history.shift();
		}
		return result;
	}

	/** Host: step back one striking action. */
	undoAction() {
		const prev = this.history.pop();
		if (!prev) return;
		this.clearRpsTimer();
		// Keep who is connected and any pause; everything else returns to before the action.
		this.setState({ ...prev, connectedPlayers: this.state.connectedPlayers, paused: this.state.paused, rpsDeadline: null });
		this.log.info('Host undid the last striking action');
	}

	/** Host: start the current step over. */
	restartStep() {
		this.act(() => this.restartStepNow());
	}

	private restartStepNow() {
		const s = { ...this.state };
		switch (s.phase) {
			case 'charSelect':
				s.characters = { p1: null, p2: null };
				break;
			case 'rps':
			case 'rpsResult':
				s.rps = { p1: null, p2: null, winner: null };
				s.rpsDeadline = null;
				s.phase = 'rps';
				s.currentStriker = null;
				break;
			case 'striking':
				s.strikes = [];
				s.strikeOrderIndex = 0;
				s.currentStriker = s.strikeOrder[0]?.[0] ?? s.currentStriker;
				break;
			case 'stageBan':
			case 'stagePick':
			case 'charLock':
			case 'charPick': {
				// Back to this game's ban (or pick in Bo5) with the full stage list for the loser.
				const loser = s.lastWinner ? other(s.lastWinner) : 2;
				const allStages = [...s.starters, ...s.counterpicks];
				const available = allStages.filter((id) => !s.dsrStages[key(loser)].includes(id));
				s.stages = available.length ? available : allStages;
				s.strikes = [];
				s.bans = [];
				s.agreement = null;
				s.finalStageId = null;
				s.characters = { p1: null, p2: null };
				s.phase = s.bestOf === 5 ? 'stagePick' : 'stageBan';
				s.currentStriker = s.bestOf === 5 ? loser : s.lastWinner;
				break;
			}
			default:
				return;
		}
		this.setState(s);
		this.maybeStartRpsTimer(this.state);
		this.log.info(`Host restarted the ${s.phase} step`);
	}

	setPaused(paused: boolean) {
		this.setState({ ...this.state, paused });
	}

	/** Report a finished Slippi game. Set Player 1 = Froggi's Player 1 (the lower port of the set). */
	async reportFromGame(game: GameStats | undefined) {
		if (!game || this.state.phase !== 'playing' || game.settings?.isSimulated) return;
		if (!this.gameBelongsToSet(game)) {
			this.log.info('Ignoring a game that is not part of the running set');
			return;
		}
		if (!this.state.setPlayers?.length) {
			const players = (game.settings?.players ?? []).filter((p) => p);
			const tag = (i: number, fallback: string) => players[i]?.displayName || players[i]?.connectCode || fallback;
			this.setState({
				...this.state,
				setPlayers: players.map((p) => ({ connectCode: p.connectCode ?? '', playerIndex: p.playerIndex })),
				// Names left at the default get the players' tags once Slippi knows them.
				p1Name: this.state.p1Name === 'Player 1' ? tag(0, 'Player 1') : this.state.p1Name,
				p2Name: this.state.p2Name === 'Player 2' ? tag(1, 'Player 2') : this.state.p2Name,
			});
		}
		const winnerIndex = getWinnerIndex(game);
		if (winnerIndex === undefined) return; // tie / handwarmers / no result → TO decides
		const recentGames = await this.storeGames.getRecentGames();
		const reference = recentGames.find((g) => g.settings?.players?.length)?.settings?.players;
		const slot = getPlayerSlot(game, winnerIndex, reference);
		if (slot !== 0 && slot !== 1) return;
		this.log.info(`Auto-reporting game winner: set player ${slot + 1}`);
		this.act(() => this.reportWinner(slot === 0 ? 1 : 2, game.settings?.stageId ?? undefined));
	}

	markWarmup() {
		const s = { ...this.state };
		if (s.phase !== 'playing') return;
		s.games = [
			...s.games,
			{ stageId: s.finalStageId ?? -1, winner: null, p1Char: s.characters.p1, p2Char: s.characters.p2, warmup: true },
		];
		s.characters = { p1: null, p2: null };
		// gameNum 1 = first counted game: re-pick blind on the same stage; later games use charLock
		if (s.gameNum === 1) {
			s.phase = 'charSelect';
			s.currentStriker = null;
		} else {
			s.phase = 'charLock';
			s.currentStriker = s.lastWinner;
		}
		this.setState(s);
	}

	undoLastGame() {
		const s = { ...this.state };
		if (!s.games.length) return;

		const last = s.games[s.games.length - 1];
		s.games = s.games.slice(0, -1);

		if (!last.warmup && last.winner !== null) {
			const scoreKey = key(last.winner);
			s.score = { ...s.score, [scoreKey]: Math.max(0, s.score[scoreKey] - 1) };
			if (last.stageId !== -1) {
				s.dsrStages = { ...s.dsrStages, [scoreKey]: s.dsrStages[scoreKey].filter((id) => id !== last.stageId) };
			}
			s.gameNum = Math.max(1, s.gameNum - 1);
		}

		s.phase = 'playing';
		s.finalStageId = last.stageId !== -1 ? last.stageId : null;
		s.characters = { p1: last.p1Char, p2: last.p2Char };
		const prevCounted = [...s.games].filter((g) => !g.warmup).slice(-1)[0];
		s.lastWinner = prevCounted?.winner ?? null;
		this.setState(s);
	}

	playerConnect(player: 1 | 2) {
		const s = { ...this.state };
		const already = s.connectedPlayers ?? [];
		if (!already.includes(player)) {
			s.connectedPlayers = [...already, player];
			this.maybeStartRpsTimer(s); // starts the 30s clock once both are in
		}
		this.setState(s);
	}

	private initListeners() {
		this.clientEmitter.on('StartSet', async (p1Name, p2Name, bestOf, allowAgreement) => {
			// Start first so player actions right after the start aren't dropped while games clear.
			this.startSet(p1Name, p2Name, bestOf, allowAgreement ?? true);
			await this.storeGames.clearRecentGames();
			this.storeLiveStats.setStatsScene(LiveStatsScene.StrikePhase);
		});
		// Player striking actions also bring the Strike Phase scene up (after Post Game).
		const striking = <A extends unknown[]>(fn: (...args: A) => unknown) => (...args: A) => {
			if (this.state.phase === 'lobby' || this.state.phase === 'setComplete') return;
			if (this.act(() => fn(...args)) === false) return; // rejected (wrong player / not their turn)
			this.enterStrikeScene();
		};
		// Phones may only act as themselves (player-argument events) or on their own turn.
		const own = (token: string | undefined, player: 1 | 2) => this.allowedAs(token, player);
		const turn = (token: string | undefined) => this.allowedAs(token, this.state.currentStriker);
		this.clientEmitter.on('RpsChoice', striking((player, choice, token) => own(token, player) && this.rpsChoice(player, choice)));
		this.clientEmitter.on('RpsWinnerOrder', striking((first, token) => this.allowedAs(token, this.state.rps.winner) && this.rpsWinnerOrder(first)));
		this.clientEmitter.on('StrikeStage', striking((stageId, token) => turn(token) && this.strikeStage(stageId)));
		this.clientEmitter.on('PickStage', striking((stageId, token) => turn(token) && this.pickStage(stageId)));
		this.clientEmitter.on('SelectCharacter', striking((player, charId, token) => own(token, player) && this.selectCharacter(player, charId)));
		this.clientEmitter.on('StrikeAgreeRequest', striking((player, stageId, token) => own(token, player) && this.requestAgreement(player, stageId)));
		this.clientEmitter.on('StrikeAgreeResponse', striking((player, accept, token) => own(token, player) && this.answerAgreement(player, accept)));
		this.clientEmitter.on('StrikeEndMatch', (winner) => this.endMatch(winner));
		this.clientEmitter.on('StrikeUndoAction', () => this.undoAction());
		this.clientEmitter.on('StrikeRestartStep', () => this.restartStep());
		this.clientEmitter.on('StrikePause', (paused) => this.setPaused(paused));
		this.clientEmitter.on('ReportWinner', (player) => this.act(() => this.reportWinner(player)));
		this.localEmitter.on('PostGameStats', (game) => void this.reportFromGame(game));
		this.clientEmitter.on('MarkWarmup', () => this.markWarmup());
		this.clientEmitter.on('UndoLastGame', () => this.undoLastGame());
		this.clientEmitter.on('ResetSet', () => {
			this.clearRpsTimer();
			this.setState(makeLobbyState());
			// New links for the next set — old QR codes stop working.
			this.strikeStore.setPlayerTokens({ 1: crypto.randomBytes(12).toString('hex'), 2: crypto.randomBytes(12).toString('hex') });
			this.sendTokens();
		});
		this.clientEmitter.on('StrikePlayerTokensRequest', () => this.sendTokens());
		this.clientEmitter.on('StrikePlayerConnect', (player, token) => {
			if (this.allowedAs(token, player)) this.playerConnect(player);
		});
	}
}
