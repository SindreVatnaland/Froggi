<script lang="ts">
	import { ConnectionState } from '$lib/models/enum';
	import { CommandType } from '$lib/models/types/commandTypes';
	import { electronEmitter, obsConnection } from '$lib/utils/store.svelte';
	import { notifications } from '../notification/Notifications.svelte';

	const saveReplayBuffer = () => {
		if ($obsConnection.state !== ConnectionState.Connected) {
			notifications.warning('OBS is not running', 3000);
			return;
		}
		if (!$obsConnection.replayBufferState?.outputActive) {
			notifications.warning('Replay Buffer is not active', 3000);
			return;
		}
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SaveReplayBuffer');
	};
</script>

<div class="flex flex-col gap-2">
	<button
		class={`btn text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary`}
		on:click={saveReplayBuffer}
	>
		Save Replay Buffer
	</button>
</div>
