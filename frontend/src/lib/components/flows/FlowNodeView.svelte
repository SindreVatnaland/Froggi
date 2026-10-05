<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { FlowNode } from '$lib/models/types/flow';
	import { describe } from './flowOptions';

	// Svelte Flow custom node: data = the Froggi flow node (kind + config).
	export let data: { node: FlowNode };
	export let selected = false;

	const HEAD: Record<FlowNode['kind'], string> = { trigger: 'WHEN', condition: 'AND', action: 'THEN' };
</script>

<div class="flow-node flow-node--{data.node.kind}" class:flow-node--selected={selected}>
	{#if data.node.kind !== 'trigger'}
		<Handle type="target" position={Position.Left} />
	{/if}
	<span class="head">{HEAD[data.node.kind]}</span>
	<span class="text">{describe(data.node)}</span>
	<Handle type="source" position={Position.Right} />
</div>

<style>
	.flow-node {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 11rem;
		max-width: 16rem;
		padding: 0.5rem 0.7rem;
		border-radius: 0.5rem;
		background: #16181d;
		color: #e5e7eb;
		border: 1px solid #2f343d;
		font-size: 0.75rem;
	}
	.flow-node--selected {
		box-shadow: 0 0 0 2px #e5e7eb;
	}
	.head {
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.08em;
	}
	.flow-node--trigger .head { color: #60a5fa; }
	.flow-node--condition .head { color: #facc15; }
	.flow-node--action .head { color: #4ade80; }
	.flow-node--trigger { border-left: 3px solid #60a5fa; }
	.flow-node--condition { border-left: 3px solid #facc15; }
	.flow-node--action { border-left: 3px solid #4ade80; }
</style>
