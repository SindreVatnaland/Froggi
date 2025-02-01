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

	export async function getAuthorizationKey(): Promise<string | undefined> {
		return await new Promise<string | undefined>((resolve) => {
			const unsubscribe = authorizationKey.subscribe((key) => {
				resolve(key);
			});
			unsubscribe();
		});
	}

	export async function getCurrentPlayer(): Promise<CurrentPlayer | undefined> {
		return await new Promise<CurrentPlayer | undefined>((resolve) => {
			const unsubscribe = currentPlayer.subscribe((player) => {
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

	export async function getObs(): Promise<Obs> {
		return await new Promise<Obs>((resolve) => {
			const unsubscribe = obs.subscribe((obsVal) => {
				resolve(obsVal);
			});
			unsubscribe();
		});
	}

	export async function getOverlays(): Promise<Record<string, Overlay>> {
		return await new Promise<Record<string, Overlay>>((resolve) => {
			const unsubscribe = overlays.subscribe((overlays) => {
				resolve(overlays);
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

	export async function getPage(): Promise<Page> {
		return await new Promise<Page>((resolve) => {
			const unsubscribe = page.subscribe((p) => {
				resolve(p);
			});
			unsubscribe();
		});
	}

	export async function getPlayers(): Promise<Player[] | undefined> {
		return await new Promise<Player[] | undefined>((resolve) => {
			const unsubscribe = currentPlayers.subscribe((playersVal) => {
				resolve(playersVal);
			});
			unsubscribe();
		});
	}

	export async function getGameFrame(): Promise<FrameEntryType | null | undefined> {
		return new Promise<FrameEntryType | null | undefined>((resolve) => {
			const unsubscribe = gameFrame.subscribe((frame) => {
				resolve(frame);
			});
			unsubscribe();
		});
	}

	export async function getGameState(): Promise<InGameState> {
		return new Promise<InGameState>((resolve) => {
			const unsubscribe = gameState.subscribe((gs) => {
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

	export async function getGameSettings(): Promise<GameStartType> {
		return new Promise<GameStartType>((resolve) => {
			const unsubscribe = gameSettings.subscribe((gs) => {
				resolve(gs);
			});
			unsubscribe();
		});
	}

	export async function getRecentGames(): Promise<GameStats[]> {
		return new Promise<GameStats[]>((resolve) => {
			const unsubscribe = recentGames.subscribe((rg) => {
				resolve(rg);
			});
			unsubscribe();
		});
	}

	export async function getMatchScore(): Promise<number[]> {
		return await new Promise<number[]>((resolve) => {
			const unsubscribe = gameScore.subscribe((score) => {
				resolve(score);
			});
			unsubscribe();
		});
	}

	export async function getSession(): Promise<SessionStats | undefined> {
		return await new Promise<SessionStats | undefined>((resolve) => {
			const unsubscribe = sessionStats.subscribe((stats) => {
				resolve(stats);
			});
			unsubscribe();
		});
	}

	export async function getIsIframe(): Promise<boolean> {
		return await new Promise<boolean>((resolve) => {
			const unsubscribe = isIframe.subscribe((val) => {
				resolve(val);
			});
			unsubscribe();
		});
	}

	export async function getUrls(): Promise<Url> {
		return await new Promise<Url>((resolve) => {
			const unsubscribe = urls.subscribe((urlVal) => {
				resolve(urlVal);
			});
			unsubscribe();
		});
	}

	export async function getIsElectron(): Promise<boolean> {
		return await new Promise<boolean>((resolve) => {
			const unsubscribe = isElectron.subscribe((val) => {
				resolve(val);
			});
			unsubscribe();
		});
	}
</script>
