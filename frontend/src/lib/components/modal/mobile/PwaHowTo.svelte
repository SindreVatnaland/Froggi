<script lang="ts">
	import { onMount } from 'svelte';

	let deviceType: 'iOS' | 'Android' | 'other' = 'other';

	onMount(() => {
		// Check if window and navigator are available
		if (typeof window !== 'undefined' && navigator?.userAgent) {
			const userAgent = navigator.userAgent.toLowerCase();

			if (userAgent.includes('android')) {
				deviceType = 'Android';
			} else if (
				userAgent.includes('iphone') ||
				userAgent.includes('ipad') ||
				userAgent.includes('ipod')
			) {
				deviceType = 'iOS';
			} else {
				deviceType = 'other';
			}
		}
	});
</script>

<div
	class="w-[95vw] max-w-[624px] min-w-lg place-items-center bg-cover bg-center border-secondary background-primary-color p-4"
>
	<div class="w-full grid place-items-center">
		<h1 class="text-secondary-color text-xl font-medium">
			Add to <b>Home Screen</b>
			for the best experience.
		</h1>
	</div>
	{#if deviceType === 'iOS'}
		<div class="w-full flex flex-col gap-2">
			<img
				class="rounded-sm border-secondary"
				src="/image/tutorial/embed/add-to-homescreen-ios-1.png"
				alt="Add app to home screen"
			/>
			<img
				class="rounded-sm border-secondary"
				src="/image/tutorial/embed/add-to-homescreen-ios-2.png"
				alt="Add app to home screen"
			/>
		</div>
	{/if}
</div>
