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
		currentOverlayEditor,
		isAuthorized,
		authorizationKey,
		sceneSwitch,
		controller,
		isElectron,
	} from '$lib/utils/store.svelte';
	import {
		getAuthorizationKey,
		getElectronEmitter,
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
	import { debounce, isNil } from 'lodash';
	import { AutoUpdater } from '$lib/models/types/autoUpdaterTypes';
	import { goto } from '$app/navigation';

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
				(() => {
					const value = payload[0] as Parameters<MessageEvents['Authorize']>[0];
					if (isNil(value)) return;
					isAuthorized.update(() => {
						if (isElectron) return true;
						if (value) {
							notifications.success('Authorized', 1500);
						} else {
							notifications.danger('Unauthorized', 1500);
						}
						return value;
					});
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
		}
	}

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

		const socket = new WebSocket(`ws://${_page.url.hostname}:${WEBSOCKET_PORT}`);

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
			socket.send(
				JSON.stringify({
					[event as string]: data,
					['AuthorizationKey']: _authorizationKey,
				}),
			);
		};

		socket.onopen = async () => {
			console.log('Websocket connected');
			_electronEmitter.offAny(emitElectronMessage);
			_electronEmitter.onAny(emitElectronMessage);
			_electronEmitter.emit('Ping');
		};

		socket.onclose = () => {
			socket.removeEventListener('message', handleWebSocketMessage);
			_electronEmitter.offAny(emitElectronMessage);
			socket.close();
			setTimeout(handleClose, 1000);
		};

		return () => {
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
		}, 1000);
	};
</script>
