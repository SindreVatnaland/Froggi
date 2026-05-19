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
			notifications.warning('Replay buffer is not active', 3000);
			return;
		}
		$electronEmitter.emit('ExecuteCommand', CommandType.Obs, 'SaveReplayBuffer');
	};

	$: buffActive = $obsConnection?.replayBufferState?.outputActive;
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<span class="status-dot" class:status-dot--on={buffActive} />
		<span class="text-xs opacity-50">{buffActive ? 'Active' : 'Inactive'}</span>
	</div>
	<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={saveReplayBuffer}>
		Save buffer
	</button>
</div>

<style>
	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.6);
		flex-shrink: 0;
	}
	.status-dot--on {
		background: rgb(34, 197, 94);
	}
</style>
