<script lang="ts" context="module">
	import { initElectronEvents, initWebSocket } from '$lib/utils/initEventListener.svelte';
	import { isBrowser, isElectron } from '$lib/utils/store.svelte';
	import { getElectronEmitter } from '$lib/utils/fetchSubscriptions.svelte';
	import { extendStringFormat } from './extendString';

	export const initClient = async () => {
		extendStringFormat();
		await initLogging();
		await initDevices();
	};

	const initLogging = async () => {
		const _electronEmitter = await getElectronEmitter();
		console.info = (...message: [string]) => {
			_electronEmitter.emit('Log', message.join(' '), 'info');
		};
		console.error = (...message: [string]) => {
			_electronEmitter.emit('Log', message.join(' '), 'error');
		};
	};

	const initDevices = async () => {
		const _electronEmitter = await getElectronEmitter();
		const isBrowserWindow = await new Promise<boolean>((resolve) =>
			isBrowser.subscribe((x: boolean) => resolve(x)),
		);
		const isElectronWindow = await new Promise<boolean>((resolve) =>
			isElectron.subscribe((x: boolean) => resolve(x)),
		);
		if (isBrowserWindow) {
			await initWebSocket();
			initServiceWorker();
		}

		if (isElectronWindow) {
			await initElectronEvents();
			_electronEmitter.emit('InitElectron');
		}
	};

	const initServiceWorker = () => {
		if ('serviceWorker' in navigator) {
			addEventListener('load', function () {
				navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
			});
		}
	};
</script>
