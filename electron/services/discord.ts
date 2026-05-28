import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { Client, Presence } from 'discord-rpc';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import type { FrameEntryType } from '@slippi/slippi-js/dist/types';
import { GameStartType } from '@slippi/slippi-js';
import type { BingoStatePayload, BingoSession } from '../../frontend/src/lib/models/types/bingo';
import type { IronManStatePayload, IronManSession } from '../../frontend/src/lib/models/types/ironman';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronPlayersStore } from './store/storePlayers';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { debounce, startCase } from 'lodash';

const FROGGI_URL = 'https://sindrevatnaland.github.io/Froggi/';

@singleton()
export class DiscordRpc {
	rpc: Client = new Client({ transport: 'ipc' });
	activity: Presence;
	private activeBingoSession: BingoSession | null = null;
	private activeIronManSession: IronManSession | null = null;

	constructor(
		@inject('ElectronLog') private log: ElectronLog,
		@inject('LocalEmitter') private localEmitter: TypedEmitter,
		@inject('Dev') private dev: boolean,
		@inject(delay(() => ElectronGamesStore)) private storeGames: ElectronGamesStore,
		@inject(delay(() => ElectronLiveStatsStore)) private storeLiveStats: ElectronLiveStatsStore,
		@inject(delay(() => ElectronPlayersStore)) private storePlayers: ElectronPlayersStore,
		@inject(delay(() => ElectronCurrentPlayerStore))
		private storeCurrentPlayer: ElectronCurrentPlayerStore,
	) {
		if (this.dev) return;
		this.initDiscordJs();
	}

	initDiscordJs() {
		this.log.info('Initializing Discord RPC');
		this.rpc
			.login({ clientId: '1143955754643112016' })
			.catch((err) => this.log.error('err', err));
		this.rpc.on('ready', async () => {
			this.setNonGameActivity('Menu');
			this.initDiscordEvents();
		});
	}

	private initDiscordEvents = () => {
		this.localEmitter.on('LiveStatsSceneChange', async (scene: LiveStatsScene) => {
			if ([LiveStatsScene.InGame].includes(scene)) return;
			await this.setNonGameActivity('Menu');
		});

		this.localEmitter.on('GameSettings', async (settings: GameStartType | undefined) => {
			if (!settings) return;
			const mode = startCase(this.storeLiveStats.getGameSettings()?.matchInfo.mode ?? 'Local');
			const score = this.storeGames.getGameScore() ?? [0, 0];
			const currentPlayer = await this.storeCurrentPlayer.getCurrentPlayer();
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const timer = futureTimerEpoch(8 * 60 * 1000 + 2000);

			this.activity = {
				...this.activity,
				details: `${mode} - In Game`,
				endTimestamp: timer,
				buttons: [
					buttonBuilder(player1?.connectCode, player1?.characterId, player1?.startStocks),
					buttonBuilder(player2?.connectCode, player2?.characterId, player2?.startStocks),
				],
				largeImageKey: `stage_${settings.stageId}`,
				largeImageText: StageConversion[settings.stageId ?? 2],
				smallImageKey: rankImageKey(currentPlayer?.rank?.current?.rank),
				state: `${player1?.connectCode ?? 'Player1'} (${score?.at(0)} - ${score.at(1)}) ${player2?.connectCode ?? 'Player2'}`,
			};
			this.updateActivity();
		});

		this.localEmitter.on('GameFrame', debounce((frame: FrameEntryType | undefined | null) => {
			if (!frame) return;
			if (this.storeLiveStats.getStatsScene() !== LiveStatsScene.InGame) return;
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const player1frame = frame.players?.[player1?.playerIndex ?? 0]?.post;
			const player2frame = frame.players?.[player2?.playerIndex ?? 0]?.post;
			const timer = futureTimerEpoch(
				8 * 60 * 1000 - (8 * 60 * 1000 * (frame.frame > 0 ? frame.frame : 0)) / (60 * 60 * 8),
			);
			this.activity = {
				...this.activity,
				buttons: [
					buttonBuilder(player1?.connectCode, player1?.characterId, player1frame?.stocksRemaining, player1frame?.percent),
					buttonBuilder(player2?.connectCode, player2?.characterId, player2frame?.stocksRemaining, player2frame?.percent),
				],
				endTimestamp: timer,
			};
			this.updateActivity();
		}, 1000, { trailing: true, maxWait: 1200 }));

		this.localEmitter.on('PostGameStats', async () => {
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const score = this.storeGames.getGameScore() ?? [0, 0];
			const mode = this.storeLiveStats.getGameSettings()?.matchInfo.mode ?? 'Local';
			const details = `${mode} - Menu`;
			const state = `${player1?.connectCode ?? 'Player1'} (${score?.at(0)} - ${score.at(1)}) ${player2?.connectCode ?? 'Player2'}`;
			await this.setNonGameActivity(details, state);
		});

		this.localEmitter.on('GameScore', (score: number[]) => {
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			this.activity = {
				...this.activity,
				state: `${player1?.connectCode ?? 'Player1'} - ${player2?.connectCode ?? 'Player2'} (${score.join(' - ')})`,
			};
			this.updateActivity();
		});

		// ── Minigame presence ────────────────────────────────────────────────────

		this.localEmitter.on('BingoState', debounce((data: BingoStatePayload) => {
			if (data.session) {
				this.activeBingoSession = data.session;
				this.setBingoActivity(data.session);
			} else {
				this.activeBingoSession = null;
				if (!this.activeIronManSession) this.setNonGameActivity('Menu');
			}
		}, 2000, { trailing: true, maxWait: 5000 }));

		this.localEmitter.on('IronManState', debounce((data: IronManStatePayload) => {
			if (data.session) {
				this.activeIronManSession = data.session;
				this.setIronManActivity(data.session);
			} else {
				this.activeIronManSession = null;
				if (!this.activeBingoSession) this.setNonGameActivity('Menu');
			}
		}, 2000, { trailing: true, maxWait: 5000 }));
	};

	private setBingoActivity(session: BingoSession) {
		const { board, settings, localName, opponentName, role, startedAt, winState } = session;
		const wc = winConditionLabel(settings.winCondition);
		const localCompleted = board.boxes.filter(b => b.completedBy === 'local' || b.completedBy === 'both').length;
		const oppCompleted = board.boxes.filter(b => b.completedBy === 'opponent' || b.completedBy === 'both').length;
		const total = board.boxes.length;

		let state: string;
		if (winState) {
			state = winState.localWinner ? `${localName} wins!` : `${opponentName ?? 'Opponent'} wins!`;
		} else if (role === 'solo') {
			state = `${localCompleted}/${total} tiles · ${settings.difficulty}`;
		} else {
			state = `${localName} ${localCompleted} – ${oppCompleted} ${opponentName ?? 'Opponent'}`;
		}

		this.activity = {
			...this.activity,
			details: `Bingo · ${board.size}×${board.size} · ${wc}`,
			state: state.slice(0, 128),
			startTimestamp: startedAt,
			endTimestamp: undefined,
			largeImageKey: 'menu',
			largeImageText: 'Bingo',
			smallImageKey: undefined,
			buttons: [{ label: 'Get Froggi', url: FROGGI_URL }],
		};
		this.updateActivity();
	}

	private setIronManActivity(session: IronManSession) {
		const { settings, localRoster, opponentRoster, localName, opponentName, role, startedAt, winner } = session;
		const variantLabel = settings.variant === 'standard' ? 'Standard'
			: settings.variant === 'full_roster' ? 'Full Roster'
			: 'Challenge';
		const localProgress = settings.variant === 'standard'
			? localRoster.slots.filter(s => !s.depleted).length
			: localRoster.slots.filter(s => s.completed).length;
		const total = localRoster.slots.length;

		let state: string;
		if (winner) {
			state = winner === 'local' ? `${localName} wins!` : `${opponentName ?? 'Opponent'} wins!`;
		} else if (role === 'solo') {
			state = `${localProgress}/${total} · ${variantLabel}`;
		} else {
			const oppProgress = opponentRoster
				? (settings.variant === 'standard'
					? opponentRoster.slots.filter(s => !s.depleted).length
					: opponentRoster.slots.filter(s => s.completed).length)
				: 0;
			state = `${localName} ${localProgress}/${total} · ${opponentName ?? 'Opponent'} ${oppProgress}/${opponentRoster?.slots.length ?? total}`;
		}

		this.activity = {
			...this.activity,
			details: `Iron Man · ${variantLabel} · ${total} chars`,
			state: state.slice(0, 128),
			startTimestamp: startedAt,
			endTimestamp: undefined,
			largeImageKey: 'menu',
			largeImageText: 'Iron Man',
			smallImageKey: undefined,
			buttons: [{ label: 'Get Froggi', url: FROGGI_URL }],
		};
		this.updateActivity();
	}

	setNonGameActivity = async (menuActivity: string, state: string | undefined = undefined) => {
		this.log.info('Discord activity:', menuActivity);
		const currentPlayer = await this.storeCurrentPlayer.getCurrentPlayer();

		// If a minigame is active between Slippi games, show minigame presence instead
		if (!state && this.activeBingoSession) {
			this.setBingoActivity(this.activeBingoSession);
			return;
		}
		if (!state && this.activeIronManSession) {
			this.setIronManActivity(this.activeIronManSession);
			return;
		}

		this.activity = {
			...this.activity,
			buttons: [{ label: 'Get Froggi', url: FROGGI_URL }],
			details: menuActivity,
			endTimestamp: undefined,
			largeImageKey: 'menu',
			largeImageText: menuActivity,
			smallImageKey: rankImageKey(currentPlayer?.rank?.current?.rank),
			state: state ?? `${currentPlayer?.rank?.current?.rank ?? 'No rank'} - ${currentPlayer?.rank?.current?.rating?.toFixed(1) ?? 'No rating'}`,
		};
		this.updateActivity();
	};

	updateActivity() {
		try {
			this.rpc.setActivity(this.activity);
		} catch (err) {
			this.log.error(err);
		}
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const futureTimerEpoch = (milliseconds: number) => {
	return new Date(Date.now() + milliseconds).getTime();
};

const rankImageKey = (rank: string | undefined): string | undefined => {
	if (!rank) return undefined;
	return rank.toLowerCase().replace(/ /g, '_');
};

const winConditionLabel = (wc: import('../../frontend/src/lib/models/types/bingo').BingoWinCondition): string => {
	if (wc === 'full') return 'Full Board';
	if (wc === 'lockout') return 'Lockout';
	if (wc === 'rowcontrol') return 'Row Control';
	return `${wc} line${wc > 1 ? 's' : ''}`;
};

const buttonBuilder = (
	connectCode: string | undefined,
	characterId: number | null | undefined,
	stocks: number | null | undefined = 4,
	percent: number | null | undefined = 0,
) => {
	let label = connectCode ? `${connectCode.split('#').at(0)}` : 'Player';
	if (characterId != null) label += ` - ${CharacterConversion[characterId] ?? '?'}`;
	if (stocks != null) label += ` - ${stocks}`;
	if (percent != null) label += ` - ${percent.toFixed()}%`;
	const url = `https://slippi.gg${connectCode ? `/user/${connectCode.replace('#', '-')}` : '/leaderboards'}`;
	return { label: label.slice(0, 32), url };
};

const CharacterConversion: Record<number, string> = {
	0: 'CF', 1: 'DK', 2: 'Fox', 3: 'G&W', 4: 'Kirby', 5: 'Bowser',
	6: 'Link', 7: 'Luigi', 8: 'Mario', 9: 'Marth', 10: 'Mew2', 11: 'Ness',
	12: 'Peach', 13: 'Pika', 14: 'ICs', 15: 'Puff', 16: 'Samus', 17: 'Yoshi',
	18: 'Zelda', 19: 'Sheik', 20: 'Falco', 21: 'YLink', 22: 'Dr.M',
	23: 'Roy', 24: 'Pichu', 25: 'Ganon',
};

const StageConversion: Record<number, string> = {
	2: 'Fountain of Dreams', 3: 'Pokémon Stadium', 4: "Peach's Castle",
	5: 'Kongo Jungle', 6: 'Brinstar', 7: 'Corneria', 8: "Yoshi's Story",
	9: 'Onett', 10: 'Mute City', 11: 'Rainbow Cruise', 12: 'Jungle Japes',
	13: 'Great Bay', 14: 'Temple', 15: 'Brinstar Depths', 16: "Yoshi's Island",
	17: 'Green Greens', 18: 'Fourside', 19: 'Mushroom Kingdom', 20: 'Mushroom Kingdom II',
	22: 'Venom', 23: 'Poké Floats', 24: 'Big Blue', 25: 'Icicle Mountain',
	27: 'Flat Zone', 28: 'Dream Land', 29: "Yoshi's Island", 30: 'Kongo Jungle',
	31: 'Battlefield', 32: 'Final Destination',
};
