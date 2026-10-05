<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { SvelteFlow, Background, Controls, type Node, type Edge } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import { electronEmitter, flows } from '$lib/utils/store.svelte';
	import type { Flow, FlowFormat, FlowNode } from '$lib/models/types/flow';
	import { validateFlow } from '$lib/utils/flowEngine';
	import { ACTIONS, CONDITIONS } from '$lib/components/flows/flowOptions';
	import FlowNodeView from '$lib/components/flows/FlowNodeView.svelte';
	import FlowNodeConfig from '$lib/components/flows/FlowNodeConfig.svelte';
	import FitOnLoad from '$lib/components/flows/FitOnLoad.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { tooltip } from 'svooltip';

	onMount(() => $electronEmitter.emit('FlowsRequest'));

	$: flowId = $page.params.id;
	let flow: Flow | undefined;
	let loadedId = '';
	// Svelte Flow works on its own node/edge stores; the Froggi node lives in data.node.
	const nodes = writable<Node[]>([]);
	const edges = writable<Edge[]>([]);
	const nodeTypes = { flow: FlowNodeView };

	$: if ($flows.length && flowId !== loadedId) load($flows.find((f) => f.id === flowId));
	function load(f: Flow | undefined) {
		if (!f) return;
		loadedId = f.id;
		flow = structuredClone(f);
		nodes.set(f.nodes.map((n) => ({ id: n.id, type: 'flow', position: n.position, data: { node: structuredClone(n) } })));
		edges.set(f.edges.map((e) => ({ ...e })));
	}

	let selectedId: string | null = null;
	$: selected = $nodes.find((n) => n.id === selectedId)?.data.node as FlowNode | undefined;
	$: triggerType = ($nodes.find((n) => (n.data.node as FlowNode).kind === 'trigger')?.data.node as Extract<FlowNode, { kind: 'trigger' }> | undefined)?.data.type;

	const refreshSelected = () => nodes.update((list) => list.map((n) => (n.id === selectedId ? { ...n, data: { node: n.data.node } } : n)));

	const addNode = (kind: 'condition' | 'action') => {
		const id = `${kind}-${Date.now().toString(36)}`;
		const data = kind === 'condition' ? CONDITIONS[0].make() : ACTIONS[0].make();
		const x = 260 + Math.max(0, ...$nodes.map((n) => n.position.x));
		const node = { id, kind, position: { x, y: 120 }, data } as FlowNode;
		nodes.update((list) => [...list, { id, type: 'flow', position: node.position, data: { node } }]);
		selectedId = id;
	};

	const removeSelected = () => {
		const id = selectedId;
		nodes.update((list) => list.filter((n) => n.id !== id));
		edges.update((list) => list.filter((e) => e.source !== id && e.target !== id));
		selectedId = null;
	};

	/** Canvas → Froggi flow. */
	const current = (): Flow | undefined =>
		flow && {
			...flow,
			nodes: $nodes.map((n) => ({ ...(n.data.node as FlowNode), position: { x: Math.round(n.position.x), y: Math.round(n.position.y) } })),
			edges: $edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
		};

	$: problems = flow ? validateFlow(current() ?? flow) : [];
	const save = () => {
		const f = current();
		if (!f) return;
		const issues = validateFlow(f);
		if (issues.length) return notifications.warning(issues.join(' · '), 4000);
		$electronEmitter.emit('FlowSave', f);
		notifications.success('Flow saved', 1500);
	};
	const test = () => {
		save();
		if (flow) setTimeout(() => $electronEmitter.emit('FlowTest', flow?.id ?? ''), 200);
		notifications.info('Ran the actions once (trigger and conditions skipped)', 2500);
	};
	const formats: { value: FlowFormat; label: string; tip: string }[] = [
		{ value: 'any', label: 'Singles + Doubles', tip: 'Runs in every game, 1v1 and teams.' },
		{ value: 'singles', label: 'Singles', tip: 'Only runs in 1v1 games — skipped in teams (doubles) games.' },
		{ value: 'doubles', label: 'Doubles', tip: 'Only runs in teams games (Slippi teams mode) — skipped in 1v1.' },
	];
</script>

<main class="flex justify-center">
	<div class="w-full flex flex-col gap-3 flow-page">
		<div class="flex items-center gap-2 flex-wrap">
			<a class="btn text-sm h-8 px-3 border-secondary rounded flex items-center" href="/obs/flows">← Flows</a>
			{#if flow}
				<input class="name-input border-secondary" bind:value={flow.name} />
				<div class="pill-group">
					{#each formats as f (f.value)}
						<button class="pill" class:pill--active={flow.format === f.value} use:tooltip={{ content: f.tip, placement: 'bottom', delay: [250, 0] }} on:click={() => flow && (flow.format = f.value)}>{f.label}</button>
					{/each}
				</div>
				<label class="flex items-center gap-1.5 text-xs"><input type="checkbox" bind:checked={flow.enabled} /> Enabled</label>
				<div class="ml-auto flex gap-2">
					<button class="btn text-xs h-8 px-3 border-secondary rounded" on:click={test}>Test</button>
					<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={save}>Save</button>
				</div>
			{/if}
		</div>

		{#if !flow}
			<p class="text-sm opacity-50">Loading flow…</p>
		{:else}
			<div class="editor">
				<div class="canvas border-secondary">
					<SvelteFlow
						{nodes}
						{edges}
						{nodeTypes}
						fitView
						minZoom={0.2}
						colorMode="dark"
						on:nodeclick={(e) => (selectedId = e.detail.node.id)}
						on:paneclick={() => (selectedId = null)}
					>
						<Background />
						<Controls />
						<FitOnLoad />
					</SvelteFlow>
				</div>
				<aside class="side border-secondary">
					<div class="flex gap-2 mb-3">
						<button class="btn text-xs h-7 px-2 border-secondary rounded flex-1" on:click={() => addNode('condition')}>+ And</button>
						<button class="btn text-xs h-7 px-2 border-secondary rounded flex-1" on:click={() => addNode('action')}>+ Then</button>
					</div>
					{#if selected}
						{#key selectedId}
							<FlowNodeConfig node={selected} {triggerType} on:change={refreshSelected} on:delete={removeSelected} />
						{/key}
					{:else}
						<p class="text-xs opacity-50">Click a node to edit it. Drag from a node's right dot to another node's left dot to connect them: When → And → Then. An action runs when every And on its path holds.</p>
					{/if}
					{#if problems.length}
						<p class="problems">{problems.join(' · ')}</p>
					{/if}
				</aside>
			</div>
		{/if}
	</div>
</main>

<style>
	.name-input { height: 2rem; padding: 0 0.6rem; font-size: 0.95rem; font-weight: 600; background: transparent; color: var(--secondary-color); border-radius: 0.3rem; min-width: 12rem; }
	.pill-group { display: flex; gap: 0.3rem; }
	.pill { font-size: 0.72rem; padding: 0.15rem 0.6rem; border: 1px solid var(--secondary-color); border-radius: 1rem; opacity: 0.4; color: var(--secondary-color); background: transparent; }
	.pill--active, .pill:hover { opacity: 1; background: color-mix(in srgb, var(--secondary-color) 12%, transparent); }
	/* Use the whole window: the canvas takes all space next to the settings panel. */
	.flow-page { max-width: min(100%, 1800px); }
	.editor { display: grid; grid-template-columns: minmax(0, 1fr) 19rem; gap: 0.75rem; height: calc(100vh - 11rem); min-height: 22rem; }
	@media (max-width: 900px) {
		.editor { grid-template-columns: 1fr; grid-template-rows: 60vh auto; height: auto; }
	}
	.canvas { border-radius: 0.5rem; overflow: hidden; }
	.side { border-radius: 0.5rem; padding: 0.8rem; overflow-y: auto; }
	.problems { margin-top: 0.8rem; font-size: 0.7rem; color: #f59e0b; }
</style>
