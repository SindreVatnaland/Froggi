<script lang="ts" context="module">
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import {
		AutoUpdaterStatus,
		ConnectionState,
		InGameState,
		LiveStatsScene,
	} from '$lib/models/enum';
	import Device from 'svelte-device-info';
	import { Overlay, OverlayEditor, Url } from '$lib/models/types/overlay';
	import type {
		CurrentPlayer,
		GameStartTypeExtended,
		GameStats,
		Match,
		MatchStats,
		Player,
		SessionStats,
	} from '$lib/models/types/slippiData';
	import type { FrameEntryType } from '@slippi/slippi-js';
	import type { PlayerController } from '$lib/models/types/controller';
	import { TypedEmitter } from './customEventEmitter';
	import type { Obs, ObsConnection } from '$lib/models/types/obsTypes';
	import { Controller, SceneSwitchCommands } from '$lib/models/types/commandTypes';
	import { AutoUpdater } from '$lib/models/types/autoUpdaterTypes';
	import { Froggi } from '$lib/models/types/froggiConfigTypes';

	export const localEmitter = writable<TypedEmitter>(new TypedEmitter());
	export const electronEmitter = writable<TypedEmitter>(new TypedEmitter());

	export const authorizationKey = writable<string>(
		localStorage.getItem('AuthorizationKey') ?? '',
	);
	export const isAuthorized = writable<boolean>(Boolean(window.electron));
	export const isBrowser = writable<boolean>(!window.electron && browser);
	export const isDesktop = writable<boolean>(
		!window.electron && browser && !Device.isMobile && !Device.isTablet,
	);
	export const isElectron = writable<boolean>(window.electron);
	export const isMobile = writable<boolean>(!window.electron && Device.isMobile);
	export const isTablet = writable<boolean>(!window.electron && Device.isTablet);
	export const isIframe = writable<boolean>(window.self !== window.top);
	export const isOverlayPage = writable<boolean>(true);

	export const isPwa = writable<boolean>(
		window.electron ||
			(!window.electron && browser && !Device.isMobile && !Device.isTablet) ||
			!!(
				(window.matchMedia?.('(display-mode: standalone)').matches ||
					(window.navigator as any).standalone) &&
				(Device.isMobile || Device.isTablet)
			),
	);

	export const autoUpdater = writable<AutoUpdater>({
		status: AutoUpdaterStatus.LookingForUpdate,
	} as AutoUpdater);
	export const currentPlayer = writable<CurrentPlayer>({} as CurrentPlayer);
	export const currentPlayers = writable<Player[]>([
		{ displayName: '' } as Player,
		{ displayName: '' } as Player,
	]);
	export const dolphinState = writable<ConnectionState | undefined>(ConnectionState.None);
	export const froggiSettings = writable<Froggi>({} as Froggi);
	export const gameFrame = writable<FrameEntryType | null | undefined>({} as FrameEntryType);
	export const gameScore = writable<number[]>([0, 0]);
	export const gameSettings = writable<GameStartTypeExtended>({} as GameStartTypeExtended);
	export const gameState = writable<InGameState>(InGameState.Inactive);
	export const memoryReadController = writable<PlayerController>({} as PlayerController);
	export const obsConnection = writable<ObsConnection>({
		state: ConnectionState.None,
	} as ObsConnection);
	export const controller = writable<Controller>({
		enabled: false,
		inputCommands: [],
	});
	export const sceneSwitch = writable<SceneSwitchCommands | undefined>();

	export const overlays = writable<Record<string, Overlay>>({});
	export const currentOverlayEditor = writable<OverlayEditor>({ layerIndex: 0 } as OverlayEditor);
	export const postGame = writable<GameStats>({} as GameStats);
	export const currentMatch = writable<MatchStats>({} as MatchStats);
	export const recentRankedSets = writable<GameStats[]>([]);
	export const recentGames = writable<GameStats[]>([]);
	export const sessionStats = writable<SessionStats | undefined>();
	export const statsScene = writable<LiveStatsScene>(LiveStatsScene.WaitingForDolphin);

	export const obs = writable<Obs>();
	export const urls = writable<Url>();
</script>
