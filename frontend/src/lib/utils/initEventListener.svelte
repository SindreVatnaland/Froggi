<script lang="ts" context="module">
	import type { Overlay } from '$lib/models/types/overlay';

	import {
		currentPlayer,
		currentPlayers,
		gameScore,
		gameSettings,
		postGame,
		recentRankedSets,
		sessionStats,
		statsScene,
		urls,
		gameFrame,
		dolphinState,
		gameState,
		recentGames,
		autoUpdater,
		memoryReadController,
		currentMatch,
		overlays,
		obsConnection,
		obs,
		obsPreviewFrame,
		currentOverlayEditor,
		isAuthorized,
		authorizationKey,
		sceneSwitch,
		controller,
		froggiSettings,
		injectedOverlays,
		remoteAccess,
		tailscaleStatus,
		ngrokStatus,
		obsProcessStatus,
		strikeState,
		webhookProfiles,
		webhooksEnabled,
		techniqueEvents,
		actionStateHistories,
		bingoSession,
		bingoLobby,
		bingoRevertMessage,
		bingoShuffleDelays,
		bingoLeaderboard,
		bingoVoteStates,
		bingoVoteActionNotice,
		twitchUsername,
		ironManSession,
		ironManLobby,
		lobbyState,
		ironManLeaderboard,
		ironManCurrentChar,
	} from '$lib/utils/store.svelte';
	import {
		getAuthorizationKey,
		getElectronEmitter,
		getIsElectron,
		getIsIframe,
		getLocalEmitter,
		getPage,
	} from '$lib/utils/fetchSubscriptions.svelte';
	import { WEBSOCKET_PORT } from '$lib/models/const';
	import {
		notifications,
		NotificationType,
	} from '$lib/components/notification/Notifications.svelte';
	import type { MessageEvents } from './customEventEmitter';
	import { get } from 'svelte/store';
	import { debounce, isNil } from 'lodash';
	import { AutoUpdater } from '$lib/models/types/autoUpdaterTypes';

	let voteActionNoticeTimer: ReturnType<typeof setTimeout> | null = null;

	const debouncedSetGameFrame = debounce(
		(value: Parameters<MessageEvents['GameFrame']>[0]) => {
			gameFrame.set(value);
		},
		2,
		{ maxWait: 160 },
	);

	async function messageDataHandler<J extends keyof MessageEvents>(
		topic: J,
		...payload: Parameters<MessageEvents[J]>
	) {
		switch (topic) {
			case 'AuthorizationKey':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['AuthorizationKey']>[0];
					if (!value) return;
					authorizationKey.set(value);
				})();
				break;
			case 'MemoryControllerInput':
				(() => {
					const value = payload[0] as Parameters<
						MessageEvents['MemoryControllerInput']
					>[0];
					if (!value) return;
					memoryReadController.set(value);
				})();
				break;
			case 'Authorize':
				(async () => {
					const value = payload[0] as Parameters<MessageEvents['Authorize']>[0];
					const _isElectron = await getIsElectron();

					if (isNil(value)) return;
					isAuthorized.set(value || _isElectron);
				})();
				break;
			case 'AutoUpdaterStatus':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['AutoUpdaterStatus']>[0];
					if (!value) return;
					autoUpdater.update((autoUpdater: AutoUpdater) => {
						return { ...autoUpdater, status: value };
					});
				})();
				break;
			case 'AutoUpdaterVersion':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['AutoUpdaterVersion']>[0];
					if (!value) return;
					autoUpdater.update((autoUpdater: AutoUpdater) => {
						return { ...autoUpdater, version: value };
					});
				})();
				break;
			case 'AutoUpdaterProgress':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['AutoUpdaterProgress']>[0];
					if (!value) return;
					autoUpdater.update((autoUpdater: AutoUpdater) => {
						return { ...autoUpdater, progress: value };
					});
				})();
				break;
			case 'CurrentPlayer':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['CurrentPlayer']>[0];
					if (!value) return;
					currentPlayer.set(value);
				})();
				break;
			case 'CurrentPlayers':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['CurrentPlayers']>[0];
					if (!value) return;
					currentPlayers.set(value);
				})();
				break;
			case 'DolphinConnectionState':
				(() => {
					const value = payload[0] as Parameters<
						MessageEvents['DolphinConnectionState']
					>[0];
					if (!value) return;
					dolphinState.set(value);
				})();
				break;
			case 'FroggiSettings':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['FroggiSettings']>[0];
					console.log('FroggiSettings', value);
					if (!value) return;
					froggiSettings.set(value);
				})();
				break;
			case 'GameFrame':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['GameFrame']>[0];
					if (!value) return;
					debouncedSetGameFrame(value);
				})();
				break;
			case 'GameSettings':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['GameSettings']>[0];
					if (!value) return;
					gameSettings.set(value);
				})();
				break;
			case 'GameScore':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['GameScore']>[0];
					if (!value) return;
					gameScore.set(value);
				})();
				break;
			case 'GameState':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['GameState']>[0];
					if (!value) return;
					gameState.set(value);
				})();
				break;
			case 'InjectedOverlays':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['InjectedOverlays']>[0];
					if (!value) return;
					injectedOverlays.set(value);
				})();
				break;
			case 'Notification':
				if (await getIsIframe()) return;
				const message = payload[0] as Parameters<MessageEvents['Notification']>[0];
				const type = payload[1] as NotificationType;
				const timeout = Number(
					(payload[2] as Parameters<MessageEvents['Notification']>[0]) ?? 2000,
				);
				notifications[type](message, timeout);
				break;
			case 'Obs':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['Obs']>[0];
					if (!value) return;
					obs.set(value);
					obsConnection.set(value.connection);
				})();
				break;
			case 'OBSPreview':
				obsPreviewFrame.set(payload[0] as string);
				break;
			case 'ObsConnection':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['ObsConnection']>[0];
					if (!value) return;
					obsConnection.set(value);
				})();
				break;
			case 'ControllerCommand':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['ControllerCommand']>[0];
					if (!value) return;
					controller.set(value);
				})();
				break;
			case 'SceneUpdate':
				(() => {
					const [overlayId, liveStatsScene, scene] = payload as Parameters<
						MessageEvents['SceneUpdate']
					>;
					if (isNil(overlayId) || isNil(liveStatsScene) || isNil(scene)) return;
					overlays.update((prev: Record<string, Overlay>) => {
						prev[overlayId][liveStatsScene] = scene;
						return prev;
					});
				})();
				break;
			case 'SceneSwitchCommands':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['SceneSwitchCommands']>[0];
					if (!value) return;
					sceneSwitch.set(value);
				})();
				break;
			case 'Overlays':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['Overlays']>[0];
					if (!value) return;
					overlays.set(value);
				})();
				break;
			case 'CurrentOverlayEditor':
				(() => {
					const value = payload[0] as Parameters<
						MessageEvents['CurrentOverlayEditor']
					>[0];
					if (!value) return;

					currentOverlayEditor.set(value);
				})();
				break;
			case 'PostGameStats':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['PostGameStats']>[0];
					if (!value) return;
					postGame.set(value);
				})();
				break;
			case 'CurrentMatch':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['CurrentMatch']>[0];
					if (!value) return;
					currentMatch.set(value);
				})();
				break;
			case 'RecentGames':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['RecentGames']>[0];
					if (!value) return;
					recentGames.set(value);
				})();
				break;
			case 'RecentRankedSets':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['RecentRankedSets']>[0];
					if (!value) return;
					recentRankedSets.set(value);
				})();
				break;
			case 'SessionStats':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['SessionStats']>[0];
					if (!value) return;
					sessionStats.set(value);
				})();
				break;
			case 'LiveStatsSceneChange':
				(() => {
					const value = payload[0] as Parameters<
						MessageEvents['LiveStatsSceneChange']
					>[0];
					if (!value) return;
					statsScene.set(value);
				})();
				break;
			case 'Url':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['Url']>[0];
					if (!value) return;
					urls.set(payload[0] as Parameters<MessageEvents['Url']>[0]);
				})();
				break;
			case 'RemoteAccessStatus':
				(() => {
					const [url, provider] = payload as Parameters<MessageEvents['RemoteAccessStatus']>;
					remoteAccess.update(prev => {
						if (provider === 'tailscale') return { ...prev, tailscale: url ?? undefined };
						if (provider === 'ngrok') return { ...prev, ngrok: url ?? undefined };
						return prev;
					});
				})();
				break;
			case 'TailscaleStatus':
				tailscaleStatus.set(payload[0] as Parameters<MessageEvents['TailscaleStatus']>[0]);
				break;
			case 'NgrokStatus':
				ngrokStatus.set(payload[0] as Parameters<MessageEvents['NgrokStatus']>[0]);
				break;
			case 'ObsProcessStatus':
				obsProcessStatus.set(payload[0] as Parameters<MessageEvents['ObsProcessStatus']>[0]);
				break;
			case 'StrikeState':
				strikeState.set(payload[0] as Parameters<MessageEvents['StrikeState']>[0]);
				break;
			case 'WebhookProfiles':
				webhookProfiles.set(payload[0] as Parameters<MessageEvents['WebhookProfiles']>[0]);
				break;
			case 'WebhooksEnabled':
				webhooksEnabled.set(payload[0] as Parameters<MessageEvents['WebhooksEnabled']>[0]);
				break;
			case 'TechniqueDetected':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['TechniqueDetected']>[0];
					if (!value) return;
					techniqueEvents.update((prev) => ({ ...prev, [value.playerIndex]: value }));
					setTimeout(() => {
						techniqueEvents.update((prev) => ({ ...prev, [value.playerIndex]: null }));
					}, 3000);
				})();
				break;
			case 'ActionStateHistory':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['ActionStateHistory']>[0];
					if (!value) return;
					actionStateHistories.update((prev) => ({ ...prev, [value.playerIndex]: value.history }));
				})();
				break;
			case 'BingoLobbyState':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoLobbyState']>[0];
					bingoLobby.set(value ?? null);
				})();
				break;
			case 'BingoState':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoState']>[0];
					if (!value) return;
					bingoSession.set(value.session);
				})();
				break;
			case 'BingoChallengeUpdates':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoChallengeUpdates']>[0];
					if (!value?.updates) return;
					bingoSession.update((session) => {
						if (!session) return session;
						const map = new Map(value.updates.map(u => [u.instanceId, u]));
						const tiles = session.board.tiles.map(tile => {
							const u = map.get(tile.instanceId);
							if (!u) return tile;
							return { ...tile, progress: u.progress, completed: u.completed, completedBy: u.completedBy ?? tile.completedBy, frozen: u.frozen ?? tile.frozen, frozenUntil: u.frozenUntil !== undefined ? u.frozenUntil : tile.frozenUntil, frozenForOpponent: u.frozenForOpponent !== undefined ? u.frozenForOpponent : tile.frozenForOpponent };
						});
						return { ...session, board: { ...session.board, tiles } };
					});
				})();
				break;
			case 'BingoRevert':
				(() => {
					const msg = payload[0] as string;
					bingoRevertMessage.set(msg);
					setTimeout(() => bingoRevertMessage.set(null), 5000);
				})();
				break;
			case 'BingoLeaderboard':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoLeaderboard']>[0];
					if (value) bingoLeaderboard.set(value);
				})();
				break;
			case 'BingoVoteState':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoVoteState']>[0];
					bingoVoteStates.set(value ?? null);
				})();
				break;
			case 'BingoVoteActionExecuted':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoVoteActionExecuted']>[0];
					if (voteActionNoticeTimer) clearTimeout(voteActionNoticeTimer);
					bingoVoteActionNotice.set(value);
					voteActionNoticeTimer = setTimeout(() => { bingoVoteActionNotice.set(null); voteActionNoticeTimer = null; }, 4000);
				})();
				break;
			case 'BingoTileReplaced':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoTileReplaced']>[0];
					if (!value) return;
					bingoSession.update(session => {
						if (!session) return session;
						const tiles = session.board.tiles.map(b => b.instanceId === value.instanceId ? value.tile : b);
						return { ...session, board: { ...session.board, tiles } };
					});
				})();
				break;
			case 'BingoTilesRolling':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoTilesRolling']>[0];
					if (!value) return;
					for (const roll of value.rolls) {
						roll.frames.forEach((frame, idx) => {
							setTimeout(() => {
								bingoSession.update(session => {
									if (!session) return session;
									const tiles = session.board.tiles.map(b =>
										b.instanceId === frame.instanceId ? frame : b
									);
									return { ...session, board: { ...session.board, tiles } };
								});
							}, idx * value.delayMs);
						});
					}
				})();
				break;
			case 'BingoTilesSwapped':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoTilesSwapped']>[0];
					if (!value) return;
					bingoSession.update(session => {
						if (!session) return session;
						const tiles = [...session.board.tiles];
						const temp = tiles[value.indexA];
						tiles[value.indexA] = tiles[value.indexB];
						tiles[value.indexB] = temp;
						return { ...session, board: { ...session.board, tiles } };
					});
				})();
				break;
			case 'BingoTilesShuffled':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['BingoTilesShuffled']>[0];
					if (!value) return;
					const session = get(bingoSession);
					if (session) {
						// Decompose permutation into sequential swaps (selection-sort order)
						const original = session.board.tiles;
						const working = [...original];
						const target = value.newOrder.map(i => original[i]);
						const swaps: [number, number][] = [];
						for (let i = 0; i < target.length; i++) {
							if (working[i].instanceId === target[i].instanceId) continue;
							let j = i + 1;
							while (j < target.length && working[j].instanceId !== target[i].instanceId) j++;
							if (j < target.length) {
								swaps.push([i, j]);
								[working[i], working[j]] = [working[j], working[i]];
							}
						}
						const STEP_MS = 280;
						swaps.forEach(([a, b], idx) => {
							setTimeout(() => {
								bingoSession.update(s => {
									if (!s) return s;
									const tiles = [...s.board.tiles];
									[tiles[a], tiles[b]] = [tiles[b], tiles[a]];
									return { ...s, board: { ...s.board, tiles } };
								});
							}, idx * STEP_MS);
						});
					}
				})();
				break;
			case 'TwitchUsername':
				(() => {
					const value = payload[0] as string;
					twitchUsername.set(value ?? '');
				})();
				break;
			case 'IronManLobbyState':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['IronManLobbyState']>[0];
					ironManLobby.set(value ?? null);
				})();
				break;
			case 'LobbyState':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['LobbyState']>[0];
					lobbyState.set(value ?? null);
				})();
				break;
			case 'IronManState':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['IronManState']>[0];
					ironManSession.set(value.session);
				})();
				break;
			case 'IronManLeaderboard':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['IronManLeaderboard']>[0];
					if (value) ironManLeaderboard.set(value);
				})();
				break;
			case 'IronManCurrentChar':
				(() => {
					const value = payload[0] as Parameters<MessageEvents['IronManCurrentChar']>[0];
					ironManCurrentChar.set(value);
				})();
				break;
		}
	}

	// When WebSocket is active in this window, suppress IPC forwarding to avoid duplicate sends
	let wsActive = false;

	export const initElectronEvents = async () => {
		console.log('Initializing electron');

		const _localEmitter = await getLocalEmitter();
		_localEmitter.removeAllListeners();

		const electronMessageHandler = (data: any) => {
			const parse = JSON.parse(data);
			for (const [key, value] of Object.entries(parse)) {
				messageDataHandler(key as keyof MessageEvents, ...(value as any));
				_localEmitter.emit(key as keyof MessageEvents, ...(value as any));
			}
		};

		const electronOnAnyHandler = (event: any, ...data: any[]) => {
			if (wsActive) return; // WebSocket handles forwarding when connected
			window.electron.send('message', JSON.stringify({ [event as string]: data }));
		};

		window.electron.receive('message', electronMessageHandler);

		const _electronEmitter = await getElectronEmitter();
		_electronEmitter.removeAllListeners();

		_electronEmitter.onAny(electronOnAnyHandler);

		return () => {
			window.electron.removeListener('message', electronMessageHandler);
			_electronEmitter.offAny(electronOnAnyHandler);
		};
	};

	export const initWebSocket = async () => {
		const _page = await getPage();
		console.log('Initializing websocket');

		const _localEmitter = await getLocalEmitter();

		const isHttps = window.location.protocol === 'https:';
		const wsUrl = isHttps
			? `wss://${window.location.host}`
			: `ws://${_page.url.hostname}:${WEBSOCKET_PORT}`;
		const socket = new WebSocket(wsUrl);

		const handleWebSocketMessage = ({ data }: { data: any }) => {
			const parse = JSON.parse(data);
			for (const [key, value] of Object.entries(parse)) {
				messageDataHandler(key as keyof MessageEvents, ...(value as any));
				_localEmitter.emit(key as keyof MessageEvents, ...(value as any));
			}
		};

		socket.addEventListener('message', handleWebSocketMessage);

		const _electronEmitter = await getElectronEmitter();

		const emitElectronMessage = async (event: any, ...data: any) => {
			const _authorizationKey = await getAuthorizationKey();
			const matchId = new URLSearchParams(window.location.search).get('matchId') ?? '';
			socket.send(
				JSON.stringify({
					[event as string]: data,
					['AuthorizationKey']: _authorizationKey,
					['MatchId']: matchId,
				}),
			);
		};

		socket.onopen = async () => {
			console.log('Websocket connected');
			wsActive = true;
			_electronEmitter.offAny(emitElectronMessage);
			_electronEmitter.onAny(emitElectronMessage);
			_electronEmitter.emit('Ping');
		};

		socket.onclose = () => {
			wsActive = false;
			socket.removeEventListener('message', handleWebSocketMessage);
			_electronEmitter.offAny(emitElectronMessage);
			socket.close();
			setTimeout(handleClose, 1000);
		};

		return () => {
			wsActive = false;
			socket.removeEventListener('message', handleWebSocketMessage);
			_electronEmitter.offAny(emitElectronMessage);
			socket.close();
		};
	};

	const handleClose = () => {
		console.log('Websocket closed');
		notifications.danger('Lost connection to Froggi', 2000);
		setTimeout(() => {
			initWebSocket();
		}, 3000);
	};
</script>
