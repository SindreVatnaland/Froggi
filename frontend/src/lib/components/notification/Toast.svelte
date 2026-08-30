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
		notifications.update((n) => n.filter((n) => n.id !== id));
	};
</script>

{#if $isElectron || !$isOverlayPage}
	<div class="notifications" style="bottom: {$isMobile ? '5rem' : '1rem'};">
		{#each $notifications as notification (notification.id)}
			<button
				on:click={() => deleteNotification(notification.id)}
				animate:flip
				class="toast"
				style="--accent: {themes[notification.type]};"
				in:fly={{ x: 40, duration: 200 }}
				out:fly={{ x: 40, duration: 200 }}
			>
				<div class="content">{notification.message}</div>
			</button>
		{/each}
	</div>
{/if}

<style>
	/* Anchored bottom-right, not full width. pointer-events:none so the container never
	   blocks clicks on the app behind it — only the toasts themselves are interactive. */
	.notifications {
		position: fixed;
		right: 1rem;
		left: auto;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		padding: 0;
		margin: 0;
		max-width: min(90vw, 360px);
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		background: rgba(15, 15, 15, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-left: 3px solid var(--accent);
		border-radius: 6px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(6px);
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.toast:hover {
		opacity: 0.85;
	}

	.content {
		padding: 0.6rem 0.85rem;
		color: #f5f5f5;
		font-size: 0.8rem;
		font-weight: 500;
		text-align: left;
	}
</style>
