import type { ElectronLog } from 'electron-log';
import { delay, inject, singleton } from 'tsyringe';
import { Client, Presence } from 'discord-rpc';
import { LiveStatsScene } from '../../frontend/src/lib/models/enum';
import type { FrameEntryType } from '@slippi/slippi-js/dist/types';
import { GameStartType } from '@slippi/slippi-js';
import { ElectronLiveStatsStore } from './store/storeLiveStats';
import { ElectronPlayersStore } from './store/storePlayers';
import { ElectronGamesStore } from './store/storeGames';
import { ElectronCurrentPlayerStore } from './store/storeCurrentPlayer';
import { TypedEmitter } from '../../frontend/src/lib/utils/customEventEmitter';
import { debounce, startCase } from 'lodash';

@singleton()
export class DiscordRpc {
	rpc: Client = new Client({ transport: 'ipc' });
	activity: Presence;
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
			this.setMenuActivity('Menu');
			this.initDiscordEvents();
		});
	}

	private initDiscordEvents = () => {
		this.localEmitter.on("LiveStatsSceneChange", async (scene: LiveStatsScene) => {
			if ([LiveStatsScene.InGame].includes(scene)) {
				return;
			}
			await this.setMenuActivity('Menu');
		});

		this.localEmitter.on("GameSettings", async (settings: GameStartType | undefined) => {
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
				smallImageKey: `${currentPlayer?.rank?.current?.rank
					.toLowerCase()
					.replace(' ', '_')}`,
				state: `${player1?.connectCode ? player1.connectCode : 'Player1'} (${score?.at(
					0,
				)} - ${score.at(1)}) ${player2?.connectCode ? player2.connectCode : 'Player2'}`,
			};
			this.updateActivity();
		});

		this.localEmitter.on("GameFrame", debounce((frame: FrameEntryType | undefined | null) => {
			if (!frame) return;
			if (this.storeLiveStats.getStatsScene() !== LiveStatsScene.InGame) return;
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);

			const player1frame = frame.players?.[player1?.playerIndex ?? 0]?.post;
			const player2frame = frame.players?.[player2?.playerIndex ?? 0]?.post;

			const timer = futureTimerEpoch(
				8 * 60 * 1000 -
				(8 * 60 * 1000 * (frame.frame > 0 ? frame.frame : 0)) / (60 * 60 * 8),
			);

			this.activity = {
				...this.activity,
				buttons: [
					buttonBuilder(
						player1?.connectCode,
						player1?.characterId,
						player1frame?.stocksRemaining,
						player1frame?.percent,
					),
					buttonBuilder(
						player2?.connectCode,
						player2?.characterId,
						player2frame?.stocksRemaining,
						player2frame?.percent,
					),
				],
				endTimestamp: timer,
			};

			this.updateActivity();
		}, 1000, { trailing: true, maxWait: 1200 }));

		this.localEmitter.on("PostGameStats", async () => {
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const score = this.storeGames.getGameScore() ?? [0, 0];
			const mode = this.storeLiveStats.getGameSettings()?.matchInfo.mode ?? 'Local';

			const details = `${mode} - Menu`;
			const state = `${player1?.connectCode ? player1?.connectCode : 'Player1'} (${score?.at(
				0,
			)} - ${score.at(1)}) ${player2?.connectCode ? player2?.connectCode : 'Player2'}`;

			await this.setMenuActivity(details, state);
		});

		this.localEmitter.on("GameScore", (score: number[]) => {
			const players = this.storePlayers.getCurrentPlayers();
			const player1 = players?.at(0);
			const player2 = players?.at(1);
			const state = `${player1?.connectCode ?? 'Player1'} - ${player2?.connectCode ?? 'Player2'
				} (${score?.join(' - ')})`;

			this.activity = {
				...this.activity,
				state: state,
			};

			this.updateActivity();
		});
	};

	setMenuActivity = async (menuActivity: string, state: string | undefined = undefined) => {
		this.log.info('Discord menu activity:', menuActivity);
		const currentPlayer = await this.storeCurrentPlayer.getCurrentPlayer();
		this.activity = {
			...this.activity,
			buttons: [
				{
					label: `Get Froggi`,
					url: `https://github.com/SindreVatnaland/Froggi`,
				},
			],
			details: menuActivity,
			endTimestamp: undefined,
			largeImageKey: 'menu',
			largeImageText: menuActivity,
			smallImageKey: `${currentPlayer?.rank?.current?.rank.toLowerCase().replace(' ', '_')}`,
			state:
				state ??
				`${currentPlayer?.rank?.current?.rank || 'No rank'} - ${currentPlayer?.rank?.current?.rating.toFixed(1) || 'No rating'
				}`,
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

const futureTimerEpoch = (milliseconds: number) => {
	const oldDateObj = new Date();
	const newDateObj = new Date();
	newDateObj.setTime(oldDateObj.getTime() + milliseconds);
	return newDateObj.getTime();
};

const buttonBuilder = (
	connectCode: string | undefined,
	characterId: number | null | undefined,
	stocks: number | null | undefined = 4,
	percent: number | null | undefined = 0,
) => {
	let label = '';
	label += connectCode ? `${connectCode.split('#').at(0)}` : 'Player';
	label +=
		characterId !== null && characterId !== undefined
			? ` - ${CharacterConversion[characterId]}`
			: ' - None';
	label += stocks !== null ? ` - Stock: ${stocks}` : '- 0';
	label += percent !== null ? ` - ${percent.toFixed()}%` : '';

	const url = `https://slippi.gg${connectCode ? `/user/${connectCode.replace('#', '-')}` : '/leaderboards'
		}`;
	return {
		label: label,
		url: url,
	};
};

const CharacterConversion: Record<number, string> = {
	0: 'CF',
	1: 'DK',
	2: 'Fox',
	3: 'G&W',
	4: 'Kirby',
	5: 'Bowsr',
	6: 'Link',
	7: 'Luigi',
	8: 'Mario',
	9: 'Marth',
	10: 'Mew2',
	11: 'Ness',
	12: 'Peach',
	13: 'Pika',
	14: 'ICs',
	15: 'Puff',
	16: 'Samus',
	17: 'Yoshi',
	18: 'Zelda',
	19: 'Sheik',
	20: 'Falco',
	21: 'YLink',
	22: 'Dr.M',
	23: 'Roy',
	24: 'Pichu',
	25: 'Ganon',
};

const StageConversion: Record<number, string> = {
	2: 'Fountain of Dreams',
	3: 'Pokémon Stadium',
	4: "Princess Peach's Castle",
	5: 'Kongo Jungle',
	6: 'Brinstar',
	7: 'Corneria',
	8: "Yoshi's Story",
	9: 'Onett',
	10: 'MuteCity',
	11: 'Rainbow Cruise',
	12: 'Jungle Japes',
	13: 'Great Bay',
	14: 'Temple',
	15: 'Brinstar Depths',
	16: "Yoshi's Island",
	17: 'Green Greens',
	18: 'Fourside',
	19: 'Mushroom Kingdom',
	20: 'Mushroom Kingdom II',
	22: 'Venom',
	23: 'Poké Floats',
	24: 'Big Blue',
	25: 'Icicle Mountain',
	27: 'Flat Zone',
	28: 'Dream Land',
	29: "Yoshi's Island",
	30: 'Kongo Jungle',
	31: 'Battlefield',
	32: 'Final Destination',
};
