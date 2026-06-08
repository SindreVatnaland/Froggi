<script lang="ts" context="module">
	import { initElectronEvents, initWebSocket } from '$lib/utils/initEventListener.svelte';
	import { isBrowser, isElectron } from '$lib/utils/store.svelte';
	import { getElectronEmitter } from '$lib/utils/fetchSubscriptions.svelte';
	import { extendStringFormat } from './extendString';

	export const initClient = async () => {
		extendStringFormat();
		await initLogging();
		await initErrorReporting();
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

	// Forward uncaught frontend errors + unhandled rejections to the backend, which
	// logs them and (if they look like real issues) reports them. Works for both the
	// desktop renderer and external devices via the same event transport.
	const initErrorReporting = async () => {
		const _electronEmitter = await getElectronEmitter();
		const device: 'desktop' | 'browser' = window.electron ? 'desktop' : 'browser';
		const send = (
			kind: 'error' | 'unhandledrejection',
			message: unknown,
			stack?: string,
			source?: string,
		) => {
			try {
				_electronEmitter.emit('FrontendError', {
					message: String(message ?? 'Unknown error').slice(0, 1000),
					stack: stack?.slice(0, 4000),
					source,
					kind,
					device,
				});
			} catch { /* never let the reporter throw */ }
		};

		window.addEventListener('error', (e) => {
			send(
				'error',
				e.message || e.error?.message,
				e.error?.stack,
				e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined,
			);
		});
		window.addEventListener('unhandledrejection', (e) => {
			const reason = e.reason as { message?: string; stack?: string } | undefined;
			send('unhandledrejection', reason?.message ?? reason, reason?.stack);
		});
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
