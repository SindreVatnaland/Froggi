<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { electronEmitter, controller } from '$lib/utils/store.svelte';

	const toggleControllerCommandState = () => {
		$electronEmitter.emit('ControllerCommandStateToggle');
		notifications.success(
			`Controller Command ${isControllerCommandEnabled ? 'Disabled' : 'Enabled'}`,
			1500,
		);
	};

	$: isControllerCommandEnabled = $controller.enabled;
</script>

<div class="flex justify-left items-center gap-2">
	<input
		type="checkbox"
		class="w-12 h-12"
		checked={isControllerCommandEnabled}
		on:change={toggleControllerCommandState}
	/>
	<h1 class="text-xl font-semibold text-secondary-color">Enable Controller Commands</h1>
</div>
