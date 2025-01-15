<script lang="ts" context="module">
	import { page } from '$app/stores';
	import type { InGameState } from '$lib/models/enum';
	import type { Overlay, Url } from '$lib/models/types/overlay';
	import type {
		CurrentPlayer,
		GameStats,
		Player,
		SessionStats,
	} from '$lib/models/types/slippiData';
	import {
		currentPlayer,
		currentPlayers,
		electronEmitter,
		localEmitter,
		gameFrame,
		gameSettings,
		gameState,
		obs,
		postGame,
		recentGames,
		sessionStats,
		gameScore,
		overlays,
		authorizationKey,
		isIframe,
		urls,
		isElectron,
	} from '$lib/utils/store.svelte';
	import type { FrameEntryType, GameStartType } from '@slippi/slippi-js';
	import type { Page } from '@sveltejs/kit';
	import type { TypedEmitter } from './customEventEmitter';
	import type { Obs } from '$lib/models/types/obsTypes';

	let cachedAuthorizationKey: string | undefined;
	export async function getAuthorizationKey(): Promise<string | undefined> {
		if (cachedAuthorizationKey !== undefined) {
			return cachedAuthorizationKey;
		}
		return await new Promise<string | undefined>((resolve) => {
			const unsubscribe = authorizationKey.subscribe((key) => {
				cachedAuthorizationKey = key;
				resolve(key);
			});
			unsubscribe();
		});
	}

	let cachedCurrentPlayer: CurrentPlayer | undefined;
	export async function getCurrentPlayer(): Promise<CurrentPlayer | undefined> {
		if (cachedCurrentPlayer !== undefined) {
			return cachedCurrentPlayer;
		}
		return await new Promise<CurrentPlayer | undefined>((resolve) => {
			const unsubscribe = currentPlayer.subscribe((player) => {
				cachedCurrentPlayer = player;
				resolve(player);
			});
			unsubscribe();
		});
	}

	let cachedLocalEmitter: TypedEmitter | undefined;
	export async function getLocalEmitter(): Promise<TypedEmitter> {
		if (cachedLocalEmitter) {
			return cachedLocalEmitter;
		}
		return await new Promise<TypedEmitter>((resolve) => {
			const unsubscribe = localEmitter.subscribe((emitter) => {
				cachedLocalEmitter = emitter;
				resolve(emitter);
			});
			unsubscribe();
		});
	}

	let cachedElectronEmitter: TypedEmitter | undefined;
	export async function getElectronEmitter(): Promise<TypedEmitter> {
		if (cachedElectronEmitter) {
			return cachedElectronEmitter;
		}
		return await new Promise<TypedEmitter>((resolve) => {
			const unsubscribe = electronEmitter.subscribe((emitter) => {
				cachedElectronEmitter = emitter;
				resolve(emitter);
			});
			unsubscribe();
		});
	}

	let cachedObs: Obs | undefined;
	export async function getObs(): Promise<Obs> {
		if (cachedObs) {
			return cachedObs;
		}
		return await new Promise<Obs>((resolve) => {
			const unsubscribe = obs.subscribe((obsVal) => {
				cachedObs = obsVal;
				resolve(obsVal);
			});
			unsubscribe();
		});
	}

	let cachedOverlays: Overlay[] | undefined;
	export async function getOverlays(): Promise<Overlay[]> {
		if (cachedOverlays) {
			return cachedOverlays;
		}
		return await new Promise<Overlay[]>((resolve) => {
			const unsubscribe = overlays.subscribe((overlayObj) => {
				const list = Object.values(overlayObj);
				cachedOverlays = list;
				resolve(list);
			});
			unsubscribe();
		});
	}

	export async function getOverlayById(overlayId: string): Promise<Overlay | undefined> {
		return await new Promise<Overlay | undefined>((resolve) => {
			const unsubscribe = overlays.subscribe((overlayObj) => {
				resolve(overlayObj[overlayId]);
			});
			unsubscribe();
		});
	}

	let cachedPage: Page | undefined;
	export async function getPage(): Promise<Page> {
		if (cachedPage) {
			return cachedPage;
		}
		return await new Promise<Page>((resolve) => {
			const unsubscribe = page.subscribe((p) => {
				cachedPage = p;
				resolve(p);
			});
			unsubscribe();
		});
	}

	let cachedPlayers: Player[] | undefined;
	export async function getPlayers(): Promise<Player[] | undefined> {
		if (cachedPlayers !== undefined) {
			return cachedPlayers;
		}
		return await new Promise<Player[] | undefined>((resolve) => {
			const unsubscribe = currentPlayers.subscribe((playersVal) => {
				cachedPlayers = playersVal;
				resolve(playersVal);
			});
			unsubscribe();
		});
	}

	let cachedGameFrame: FrameEntryType | null | undefined;
	export async function getGameFrame(): Promise<FrameEntryType | null | undefined> {
		if (cachedGameFrame !== undefined) {
			return cachedGameFrame;
		}
		return new Promise<FrameEntryType | null | undefined>((resolve) => {
			const unsubscribe = gameFrame.subscribe((frame) => {
				cachedGameFrame = frame;
				resolve(frame);
			});
			unsubscribe();
		});
	}

	let cachedGameState: InGameState | undefined;
	export async function getGameState(): Promise<InGameState> {
		if (cachedGameState) {
			return cachedGameState;
		}
		return new Promise<InGameState>((resolve) => {
			const unsubscribe = gameState.subscribe((gs) => {
				cachedGameState = gs;
				resolve(gs);
			});
			unsubscribe();
		});
	}

	let cachedGameStats: GameStats | undefined;
	export async function getGameStats(): Promise<GameStats> {
		if (cachedGameStats) {
			return cachedGameStats;
		}
		return new Promise<GameStats>((resolve) => {
			const unsubscribe = postGame.subscribe((stats) => {
				cachedGameStats = stats;
				resolve(stats);
			});
			unsubscribe();
		});
	}

	let cachedGameSettings: GameStartType | undefined;
	export async function getGameSettings(): Promise<GameStartType> {
		if (cachedGameSettings) {
			return cachedGameSettings;
		}
		return new Promise<GameStartType>((resolve) => {
			const unsubscribe = gameSettings.subscribe((gs) => {
				cachedGameSettings = gs;
				resolve(gs);
			});
			unsubscribe();
		});
	}

	let cachedRecentGames: GameStats[][] | undefined;
	export async function getRecentGames(): Promise<GameStats[][]> {
		if (cachedRecentGames) {
			return cachedRecentGames;
		}
		return new Promise<GameStats[][]>((resolve) => {
			const unsubscribe = recentGames.subscribe((rg) => {
				cachedRecentGames = rg;
				resolve(rg);
			});
			unsubscribe();
		});
	}

	let cachedMatchScore: number[] | undefined;
	export async function getMatchScore(): Promise<number[]> {
		if (cachedMatchScore) {
			return cachedMatchScore;
		}
		return await new Promise<number[]>((resolve) => {
			const unsubscribe = gameScore.subscribe((score) => {
				cachedMatchScore = score;
				resolve(score);
			});
			unsubscribe();
		});
	}

	let cachedSession: SessionStats | undefined;
	export async function getSession(): Promise<SessionStats | undefined> {
		if (cachedSession !== undefined) {
			return cachedSession;
		}
		return await new Promise<SessionStats | undefined>((resolve) => {
			const unsubscribe = sessionStats.subscribe((stats) => {
				cachedSession = stats;
				resolve(stats);
			});
			unsubscribe();
		});
	}

	let cachedIsIframe: boolean | undefined;
	export async function getIsIframe(): Promise<boolean> {
		if (cachedIsIframe !== undefined) {
			return cachedIsIframe;
		}
		return await new Promise<boolean>((resolve) => {
			const unsubscribe = isIframe.subscribe((val) => {
				cachedIsIframe = val;
				resolve(val);
			});
			unsubscribe();
		});
	}

	let cachedUrls: Url | undefined;
	export async function getUrls(): Promise<Url> {
		if (cachedUrls) {
			return cachedUrls;
		}
		return await new Promise<Url>((resolve) => {
			const unsubscribe = urls.subscribe((urlVal) => {
				cachedUrls = urlVal;
				resolve(urlVal);
			});
			unsubscribe();
		});
	}

	let cachedIsElectron: boolean | undefined;
	export async function getIsElectron(): Promise<boolean> {
		if (cachedIsElectron !== undefined) {
			return cachedIsElectron;
		}
		return await new Promise<boolean>((resolve) => {
			const unsubscribe = isElectron.subscribe((val) => {
				cachedIsElectron = val;
				resolve(val);
			});
			unsubscribe();
		});
	}
</script>
