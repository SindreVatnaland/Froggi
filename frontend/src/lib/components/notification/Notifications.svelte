<script lang="ts" context="module">
	import { getIsIframe } from '$lib/utils/fetchSubscriptions.svelte';
	import { writable } from 'svelte/store';

	function createNotificationStore() {
		const _notifications = writable<{ id: string; type: NotificationType; message: string; timeout: number }[]>([]);

		// Auto-dismiss timers by id — paused while the pointer is over a toast (hold/release).
		const timers = new Map<string, ReturnType<typeof setTimeout>>();
		const remove = (id: string) => {
			timers.delete(id);
			_notifications.update((state) => state.filter((n) => n.id !== id));
		};
		const schedule = (id: string, ms: number) => {
			clearTimeout(timers.get(id));
			timers.set(id, setTimeout(async () => {
				if (await getIsIframe()) return;
				remove(id);
			}, ms));
		};

		async function send(message: string, type: NotificationType = 'default', timeout = 5000) {
			if (await getIsIframe()) return;

			const newNotification = { id: id(), type, message, timeout };

			_notifications.update((state) => [newNotification, ...state.slice(0, 2)]);

			if (timeout > 0) schedule(newNotification.id, timeout);
		}

		/** Pointer entered a toast: keep it until release(). */
		const hold = (id: string) => {
			clearTimeout(timers.get(id));
			timers.delete(id);
		};
		/** Pointer left: dismiss shortly after (only toasts that auto-dismiss). */
		const release = (id: string, timeout: number) => {
			if (timeout > 0) schedule(id, 2000);
		};

		const { subscribe, set, update } = _notifications;

		return {
			subscribe,
			send,
			hold,
			release,
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
