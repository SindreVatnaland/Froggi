<script lang="ts">
	import { page } from '$app/stores';
</script>

<main class="flex justify-center">
	<div class="w-full max-w-2xl">
		{#if $page.url.pathname.replace(/\/$/, '') !== '/obs/settings'}
			<a class="btn text-sm h-8 px-3 border-secondary rounded inline-flex items-center mb-4" href="/obs/settings">← OBS Settings</a>
		{/if}
		<slot />
	</div>
</main>
