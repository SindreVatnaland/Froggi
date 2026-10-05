<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FlowNode } from '$lib/models/types/flow';
	import { obsConnection } from '$lib/utils/store.svelte';
	import { ACTIONS, BUTTONS, CONDITIONS, POST_BODIES, SCENES, STRIKE_ACTIONS, STRIKE_PHASES, TRIGGERS } from './flowOptions';

	// Edit one node's settings. The node object is edited in place, then `change` re-renders the canvas.
	export let node: FlowNode;
	const dispatch = createEventDispatcher<{ change: void; delete: void }>();
	const changed = () => {
		node = node;
		dispatch('change');
	};

	// Loose view of the config so one form covers every type (fields only render for matching types).
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$: d = node.data as any;
	$: choices = node.kind === 'trigger' ? TRIGGERS : node.kind === 'condition' ? CONDITIONS : ACTIONS;
	const setType = (type: string) => {
		const choice = choices.find((c) => c.type === type);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (choice) (node as any).data = choice.make();
		changed();
	};

	const players: { value: string; label: string }[] = [
		{ value: 'any', label: 'Any player' },
		{ value: 'current', label: 'You (current player)' },
		{ value: 'p1', label: 'Player 1' },
		{ value: 'p2', label: 'Player 2' },
	];
	const modes: string[] = ['local', 'direct', 'unranked', 'ranked'];
	const compares: string[] = ['<=', '>=', '=='];
	$: obsScenes = ($obsConnection?.scenes?.scenes ?? []).map((s) => s.sceneName);

	const toggleMode = (mode: string) => {
		d.modes = d.modes.includes(mode) ? d.modes.filter((m: string) => m !== mode) : [...d.modes, mode];
		changed();
	};
	const toggleButton = (key: string) => {
		d.buttons = { ...d.buttons, [key]: !d.buttons?.[key] };
		changed();
	};
</script>

<div class="config">
	<p class="dash-label">{node.kind === 'trigger' ? 'When' : node.kind === 'condition' ? 'And' : 'Then'}</p>
	<select class="field" value={d.type} on:change={(e) => setType(e.currentTarget.value)}>
		{#each choices as choice (choice.type)}
			<option value={choice.type}>{choice.label}</option>
		{/each}
	</select>

	{#if d.type === 'sceneChange' || d.type === 'scene'}
		<label>Scene
			<select class="field" bind:value={d.scene} on:change={changed}>
				{#if d.type === 'sceneChange'}<option value={undefined}>Any scene</option>{/if}
				{#each SCENES as scene}<option value={scene}>{scene}</option>{/each}
			</select>
		</label>
	{/if}

	{#if d.type === 'controllerCombo'}
		<p class="hint">Hold these buttons together:</p>
		<div class="chips">
			{#each BUTTONS as b (b.key)}
				<button class="chip" class:chip--on={d.buttons?.[b.key]} on:click={() => toggleButton(b.key)}>{b.label}</button>
			{/each}
		</div>
	{/if}

	{#if d.type === 'damageTaken' || d.type === 'stockLost' || d.type === 'playerStocks' || d.type === 'playerPercent'}
		<label>Player
			<select class="field" bind:value={d.player} on:change={changed}>
				{#each players as p (p.value)}
					{#if !(p.value === 'any' && (d.type === 'playerStocks' || d.type === 'playerPercent'))}<option value={p.value}>{p.label}</option>{/if}
				{/each}
			</select>
		</label>
	{/if}
	{#if d.type === 'damageTaken'}
		<label>At least (%)<input class="field" type="number" min="0" bind:value={d.minDamage} on:change={changed} /></label>
	{/if}
	{#if d.type === 'playerStocks' || d.type === 'playerPercent'}
		<div class="row">
			<select class="field" bind:value={d.compare} on:change={changed}>
				{#each compares as c}<option value={c}>{c}</option>{/each}
			</select>
			<input class="field" type="number" min="0" bind:value={d.value} on:change={changed} />
		</div>
	{/if}

	{#if d.type === 'strikeChange'}
		<label>When it is time to
			<select class="field" bind:value={d.action} on:change={changed}>
				{#each STRIKE_ACTIONS as a}<option value={a}>{a}</option>{/each}
			</select>
		</label>
	{/if}
	{#if d.type === 'strikePhase'}
		<label>Phase
			<select class="field" bind:value={d.phase} on:change={changed}>
				{#each STRIKE_PHASES as p}<option value={p}>{p}</option>{/each}
			</select>
		</label>
	{/if}
	{#if d.type === 'gameMode'}
		<div class="chips">
			{#each modes as m}
				<button class="chip" class:chip--on={d.modes.includes(m)} on:click={() => toggleMode(m)}>{m}</button>
			{/each}
		</div>
	{/if}

	{#if d.type === 'httpPost'}
		<label>URL<input class="field" bind:value={d.url} on:change={changed} placeholder="https://…" /></label>
		<label>Bearer token (optional)<input class="field" type="password" bind:value={d.bearerToken} on:change={changed} /></label>
		<label>Body
			<select class="field" bind:value={d.body} on:change={changed}>
				{#each POST_BODIES as b (b.value)}<option value={b.value}>{b.label}</option>{/each}
			</select>
		</label>
		<p class="hint">Sent as {'{ flow, trigger, timestamp, payload }'} — payload shapes are the same as the webhooks.</p>
	{/if}
	{#if d.type === 'obsScene'}
		<label>OBS scene
			<input class="field" list="flow-obs-scenes" bind:value={d.sceneName} on:change={changed} />
			<datalist id="flow-obs-scenes">{#each obsScenes as s}<option value={s} />{/each}</datalist>
		</label>
	{/if}
	{#if d.type === 'obsToggleSource'}
		<label>Source name<input class="field" bind:value={d.sourceName} on:change={changed} /></label>
	{/if}
	{#if d.type === 'obsVolume'}
		<label>Input name<input class="field" bind:value={d.inputName} on:change={changed} /></label>
		<label>Volume ({Math.round(d.volume * 100)}%)<input type="range" min="0" max="1" step="0.05" bind:value={d.volume} on:change={changed} /></label>
	{/if}

	{#if node.kind !== 'trigger'}
		<button class="delete" on:click={() => dispatch('delete')}>Remove node</button>
	{/if}
</div>

<style>
	.config { display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.8rem; }
	label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.7rem; opacity: 0.85; }
	.field {
		height: 2rem; padding: 0 0.5rem; font-size: 0.8rem; border-radius: 0.3rem;
		background: transparent; color: var(--secondary-color);
		border: 1px solid color-mix(in srgb, var(--secondary-color) 30%, transparent);
	}
	select.field option { color: #000; }
	.row { display: flex; gap: 0.4rem; }
	.chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
	.chip { font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 1rem; border: 1px solid var(--secondary-color); opacity: 0.4; color: var(--secondary-color); background: transparent; }
	.chip--on { opacity: 1; background: color-mix(in srgb, var(--secondary-color) 15%, transparent); }
	.hint { font-size: 0.68rem; opacity: 0.5; }
	.delete { margin-top: 0.4rem; font-size: 0.72rem; color: #ef4444; text-align: left; background: none; }
</style>
