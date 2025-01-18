<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { notifications } from './Notifications.svelte';
	import { isElectron, isMobile, isOverlayPage } from '$lib/utils/store.svelte';

	export let themes = {
		danger: '#E26D69',
		success: '#84C991',
		warning: '#f0ad4e',
		info: '#5bc0de',
		default: '#aaaaaa',
	};

	const deleteNotification = (id: string) => {
		console.log('deleteNotification', id);
		notifications.update((n) => n.filter((n) => n.id !== id));
		console.log('deleteNotification', $notifications);
	};
</script>

{#if $isElectron || !$isOverlayPage}
	<div class={`notifications ${$isMobile ? 'bottom-20' : 'bottom-2'}`}>
		{#each $notifications as notification (notification.id)}
			<button
				on:click={() => deleteNotification(notification.id)}
				animate:flip
				class="toast rounded-md"
				style="background: {themes[notification.type]};"
				in:fly={{ y: 30 }}
				out:fly={{ y: -30 }}
			>
				<div class="content">{notification.message}</div>
			</button>
		{/each}
	</div>
{/if}

<style>
	.notifications {
		position: fixed;
		left: 0;
		right: 0;
		margin: 0 auto;
		padding: 0;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
	}

	.toast {
		flex: 0 0 auto;
		margin-bottom: 10px;
	}

	.content {
		padding: 10px;
		color: white;
		font-weight: 500;
	}
</style>
