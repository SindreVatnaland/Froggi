<script lang="ts">
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import {
		authorizationKey,
		electronEmitter,
		isAuthorized,
		isElectron,
	} from '$lib/utils/store.svelte';
	import { tooltip } from 'svooltip';

	const authenticate = async () => {
		localStorage.setItem('AuthorizationKey', authKey);
		authorizationKey.set(authKey);
		$electronEmitter.emit('Ping');
	};

	const updateKey = async () => {
		$electronEmitter.emit('AuthorizationKeyUpdate', authKey);
		notifications.success('Authorization Key Updated', 1500);
	};

	let authKey: string = $authorizationKey;
</script>

<div
	class="flex flex-col gap-4 w-full items-center justify-start overflow-auto py-4 border-secondary rounded-md p-4"
>
	<div>
		<h1 class="text-4xl font-bold text-secondary-color">Authorization</h1>
	</div>
	<h1 class="text-xl font-bold color-secondary">
		<span class={`${$isAuthorized ? 'text-success-color' : 'text-secondary'}`}>
			{!$isAuthorized ? 'Unauthorized' : 'Authorized'}
		</span>
	</h1>
	<div class="flex flex-col gap-2">
		<h1
			class="font-md text-center color-secondary"
			use:tooltip={{
				content: 'Pass key for authorizing external devices',
				html: true,
				placement: 'top',
				delay: [200, 0],
				offset: 15,
			}}
		>
			Authorization Key
		</h1>
		<input
			class="w-full background-primary-color text-secondary-color rounded-md p-2 disabled:grayscale border-secondary"
			type="text"
			placeholder="key"
			bind:value={authKey}
			disabled={!$isElectron && $isAuthorized}
		/>
		{#if $isElectron}
			<button
				class="w-full rounded-md p-2 background-success-color text-secondary-color hover:cursor-pointer border-secondary"
				on:click={updateKey}
			>
				Update
			</button>
		{/if}
		{#if !$isElectron}
			<button
				class="w-full rounded-md p-2 background-success-color text-secondary-color hover:cursor-pointer disabled:opacity-50 disabled:hover:scale-0 border-secondary"
				on:click={authenticate}
				disabled={$isAuthorized}
			>
				Authenticate
			</button>
		{/if}
	</div>
</div>
