<script lang="ts" context="module">
	import { getIsIframe } from '$lib/utils/fetchSubscriptions.svelte';
	import { writable } from 'svelte/store';

	function createNotificationStore() {
		const _notifications = writable<{ id: string; message: string; timeout: number }[]>([]);

		async function send(message: string, type = 'default', timeout = 5000) {
			if (await getIsIframe()) return;

			const newNotification = { id: id(), type, message, timeout };

			_notifications.update((state) => [newNotification, ...state.slice(0, 2)]);

			if (timeout > 0) {
				setTimeout(async () => {
					if (await getIsIframe()) return;

					_notifications.update((state) =>
						state.filter((n) => n.id !== newNotification.id),
					);
				}, timeout);
			}
		}

		const { subscribe, set, update } = _notifications;

		return {
			subscribe,
			send,
			update,
			set,
			default: (msg: string, timeout = 5000) => send(msg, 'default', timeout),
			danger: (msg: string, timeout = 5000) => send(msg, 'danger', timeout),
			warning: (msg: string, timeout = 5000) => send(msg, 'warning', timeout),
			info: (msg: string, timeout = 5000) => send(msg, 'info', timeout),
			success: (msg: string, timeout = 5000) => send(msg, 'success', timeout),
		};
	}

	function id() {
		return '_' + Math.random().toString(36).substr(2, 9);
	}

	export const notifications = createNotificationStore();

	export type NotificationType = 'default' | 'danger' | 'warning' | 'info' | 'success';
</script>
