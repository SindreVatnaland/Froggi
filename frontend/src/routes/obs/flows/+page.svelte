<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { electronEmitter, flows } from '$lib/utils/store.svelte';
	import type { Flow } from '$lib/models/types/flow';
	import { describe } from '$lib/components/flows/flowOptions';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { MODAL_CLOSE_MS } from '$lib/models/const';

	// Automation flows: WHEN something happens AND conditions hold THEN do things (POST / OBS).
	onMount(() => $electronEmitter.emit('FlowsRequest'));

	const newFlow = () => {
		const id = `flow-${Date.now().toString(36)}`;
		const flow: Flow = {
			id,
			name: 'New flow',
			enabled: false,
			format: 'any',
			nodes: [
				{ id: 'trigger', kind: 'trigger', position: { x: 40, y: 120 }, data: { type: 'gameStart' } },
				{ id: 'action', kind: 'action', position: { x: 300, y: 120 }, data: { type: 'obsSaveReplay' } },
			],
			edges: [{ id: 'trigger-action', source: 'trigger', target: 'action' }],
		};
		$electronEmitter.emit('FlowSave', flow);
		setTimeout(() => goto(`/obs/flows/${id}`), 150);
	};

	const toggle = (flow: Flow) => $electronEmitter.emit('FlowSave', { ...flow, enabled: !flow.enabled });
	const summary = (flow: Flow) => {
		const t = flow.nodes.find((n) => n.kind === 'trigger');
		const actions = flow.nodes.filter((n) => n.kind === 'action').length;
		return `${t ? describe(t) : '—'} → ${actions} action${actions === 1 ? '' : 's'}`;
	};

	let deleting: Flow | null = null;
	let confirmOpen = false;
	const askDelete = (flow: Flow) => {
		deleting = flow;
		confirmOpen = true;
	};
	const doDelete = () => {
		const id = deleting?.id;
		confirmOpen = false;
		setTimeout(() => id && $electronEmitter.emit('FlowDelete', id), MODAL_CLOSE_MS);
	};
	$: sorted = [...$flows].sort((a, b) => a.name.localeCompare(b.name));
</script>

<main class="flex justify-center">
	<div class="w-full max-w-2xl">
		<div class="flex items-center gap-3 mb-2">
			<a class="btn text-sm h-8 px-3 border-secondary rounded flex items-center" href="/obs">← OBS</a>
			<h1 class="text-xl font-semibold text-secondary-color">Flows</h1>
			<button class="btn text-sm h-8 px-4 border-secondary rounded ml-auto" on:click={newFlow}>+ New flow</button>
		</div>
		<p class="text-xs opacity-50 mb-4">
			WHEN something happens in the game, AND your conditions hold, THEN Froggi sends a POST request or controls OBS.
			Each flow can run in singles, doubles or both.
		</p>
		<div class="flex flex-col gap-2">
			{#each sorted as flow (flow.id)}
				<div class="flow-row border-secondary">
					<input type="checkbox" class="toggle-check" checked={flow.enabled} on:change={() => toggle(flow)} title="Enabled" />
					<button class="flow-main" on:click={() => goto(`/obs/flows/${flow.id}`)}>
						<span class="flow-name">{flow.name}</span>
						<span class="flow-sum">{summary(flow)}</span>
					</button>
					<span class="pill-tag">{flow.format === 'any' ? 'Singles + Doubles' : flow.format}</span>
					<button class="text-xs opacity-50 hover:opacity-100" on:click={() => askDelete(flow)}>Delete</button>
				</div>
			{:else}
				<p class="text-sm opacity-50">No flows yet — create one, or ask the AI assistant to build it for you.</p>
			{/each}
		</div>
	</div>
</main>

<ConfirmModal bind:open={confirmOpen} on:confirm={doDelete}>Delete the flow "{deleting?.name}"?</ConfirmModal>

<style>
	.flow-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.8rem; border-radius: 0.375rem; }
	.flow-main { flex: 1; display: flex; flex-direction: column; text-align: left; background: none; color: var(--secondary-color); min-width: 0; }
	.flow-name { font-size: 0.9rem; font-weight: 600; }
	.flow-sum { font-size: 0.72rem; opacity: 0.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.pill-tag { font-size: 0.65rem; text-transform: uppercase; opacity: 0.6; }
	.toggle-check { width: 0.9rem; height: 0.9rem; }
</style>
