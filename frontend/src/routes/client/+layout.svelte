<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		let lock: WakeLockSentinel | null = null;

		const request = async () => {
			try {
				if ('wakeLock' in navigator) {
					lock = await (navigator as any).wakeLock.request('screen');
				}
			} catch {}
		};

		const handleVisibility = () => {
			if (document.visibilityState === 'visible') request();
		};

		request();
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibility);
			lock?.release();
		};
	});
</script>

<slot />
