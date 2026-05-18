<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { electronEmitter, sceneSwitch } from '$lib/utils/store.svelte';

	const toggleSceneCommandState = () => {
		$electronEmitter.emit('SceneSwitchCommandStateToggle');
		notifications.success(
			`Controller Command ${isSceneCommandEnabled ? 'Disabled' : 'Enabled'}`,
			1500,
		);
	};

	$: isSceneCommandEnabled = $sceneSwitch?.enabled;
</script>

<div class="flex justify-left items-center gap-2">
	<input
		type="checkbox"
		class="w-12 h-12"
		checked={isSceneCommandEnabled}
		on:change={toggleSceneCommandState}
	/>
	<h1 class="text-xl font-semibold text-secondary-color">Enable Scene Switch Commands</h1>
</div>
