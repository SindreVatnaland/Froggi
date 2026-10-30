<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { REPLAY_FORMATS, type FlowNode } from '$lib/models/types/flow';
	import { obsConnection, froggiSettings } from '$lib/utils/store.svelte';
	import { ACTIONS, BUTTONS, COMPARE_OPS, CONDITIONS, POST_BODIES, SCENES, SCENE_LABEL, STRIKE_EVENTS, STRIKE_PHASES, TRIGGERS, describe, grouped } from './flowOptions';
	import { hasNoBody, prettifyTemplate, SAMPLE_TOKENS, templateKeys } from '$lib/utils/flowEngine';
	import { formulaProblem } from '$lib/utils/formula';
	import { LIST_OPS, type ListField } from '$lib/utils/flowList';
	import { actionSchema, FIRES_WHEN, keyInfo, strikeStateSchema, triggerSchema } from '$lib/utils/flowKeys';
	import FlowOutputModal from './FlowOutputModal.svelte';
	import { flattenState, SAMPLE_GAME_STATE } from '$lib/utils/flowState';
	import { tooltip } from 'svooltip';
	import type { FlowTrigger } from '$lib/models/types/flow';
	import KeyField, { activeKeyField } from './KeyField.svelte';
	import StateKeysModal from './StateKeysModal.svelte';

	// Edit one node's settings. The node object is edited in place, then `change` re-renders the canvas.
	export let node: FlowNode;
	/** The flow's When cards — their {{keys}} can be used. */
	export let triggerTypes: FlowTrigger['type'][] = [];
	/** List cards: the fields of their list's items (for the Output schema popup). */
	export let listItemFields: string[] = [];
	/** Keys from the cards before this one (keysBefore) — the chips. */
	export let available: string[] = [];
	/** Which card before this one makes each key and what it means (keyOrigins) — chip tooltips. */
	export let origins: Record<string, import('$lib/utils/flowEngine').KeyOrigin> = {};
	/** Whether a key can be filled in this flow (trigger keys + {{state.…}}) — for highlighting. */
	export let isKnown: (key: string) => boolean = () => true;
	/** A flow keeps at least one When card. */
	export let canRemove = true;
	// Chips: the trigger's simple keys; nested ones (players.1.name …) are in the picker tree.
	// Chips: what this card receives from the cards before it (nested players.1.name … are in the picker tree).
	$: keys = available.filter((k) => !k.includes('.') || k.endsWith('.count') || k.startsWith('item.'));
	let stateOpen = false;
	const insertKey = (key: string) => $activeKeyField?.(key);
	// Node types with {{key}} fields show the key chips.
	$: hasKeys = ['httpPost', 'notify', 'log', 'compare', 'setHighlightVideo', 'markHighlight', 'calculate', 'obsReplayBufferSettings', 'obsSaveReplay', 'timer'].includes(d.type) || (d.type === 'list' && ['add', 'sort', 'filter', 'map', 'limit', 'limitPer'].includes(d.op));
	$: listFormulaError = d.type === 'list' && d.formula?.trim() ? formulaProblem(d.formula, templateKeys(d.formula)) : null;
	$: formulaError = d.type === 'calculate' ? formulaProblem(d.formula ?? '', templateKeys(d.formula)) : d.type === 'markHighlight' ? formulaProblem(d.score || '0', templateKeys(d.score)) : null;
	$: pretty = d.type === 'httpPost' && d.body === 'custom' ? prettifyTemplate(d.template ?? '') : null;
	// Output schema popup: the card's keys (When cards: their trigger keys; Mark / Calculate / List: what they hand on).
	let outputOpen = false;
	$: output = node.kind === 'trigger' ? triggerSchema(node.data.type, SAMPLE_TOKENS) : node.kind === 'action' ? actionSchema(node.data as { type: string; key?: string }, listItemFields) : [];
	$: outputSections = [
		{ title: node.kind === 'trigger' ? 'Keys it hands on' : 'Keys for the cards after it', rows: output },
		...(node.kind === 'trigger' && node.data.type === 'strikeAction' ? [{ title: 'The whole striking state — {{state.strike…}}', rows: strikeStateSchema(flattenState(SAMPLE_GAME_STATE, 'state')), strip: 'state.strike.' }] : []),
	];

	/** Chip tooltip: what the key means (+ an example value). */
	const chipTip = (key: string) => {
		const o = origins[key];
		const meaning = o?.meaning ?? keyInfo(key, o?.kind === 'trigger' ? [o.type as FlowTrigger['type']] : triggerTypes) ?? 'A value from a card before this one.';
		const card = o ? [...TRIGGERS, ...ACTIONS].find((c) => c.type === o.type && (o.kind === 'trigger') === TRIGGERS.includes(c as (typeof TRIGGERS)[number]))?.label ?? o.type : null;
		const from = card ? `From ${o!.kind === 'trigger' ? 'When' : 'Then'} "${card}"${o!.detail ? ` (${o!.detail})` : ''}` : '';
		const example = SAMPLE_TOKENS[key];
		return [from, meaning, example === undefined || example === null || key.startsWith('item.') ? '' : `Example: ${example}`].filter(Boolean).join('\n');
	};

	// List card "Add an item": its fields.
	const addField = () => {
		d.fields = [...((d.fields ?? []) as ListField[]), { name: '', value: '' }];
		changed();
	};
	const removeField = (index: number) => {
		d.fields = ((d.fields ?? []) as ListField[]).filter((_: ListField, k: number) => k !== index);
		changed();
	};
	const addHeader = (name = '', value = '') => {
		d.headers = [...(d.headers ?? []), { name, value }];
		changed();
	};
	// What Froggi sends on its own (flowService.request) — shown so they can be edited (= overridden).
	$: overridden = new Set(((d.headers ?? []) as { name: string }[]).map((h) => h.name.trim().toLowerCase()));
	$: defaultHeaders = d.type !== 'httpPost' ? [] : [
		...(!hasNoBody(d.method) ? [{ name: 'Content-Type', value: d.body !== 'custom' || pretty !== null ? 'application/json' : 'text/plain; charset=utf-8' }] : []),
		...(d.oauth ? [{ name: 'Authorization', value: 'Bearer {OAuth access token}' }] : d.bearerToken ? [{ name: 'Authorization', value: 'Bearer {token}' }] : []),
	].filter((h) => !overridden.has(h.name.toLowerCase()));
	// Method: POST / GET, or any other typed in (PUT, PATCH, DELETE…).
	$: methodChoice = !d.method || /^(POST|GET)$/i.test(d.method) ? (d.method || 'POST').toUpperCase() : 'custom';
	const setMethod = (choice: string) => {
		d.method = choice === 'custom' ? 'PUT' : choice;
		changed();
	};
	// Auth: none / bearer token / OAuth client credentials (stored as bearerToken or oauth).
	$: auth = d.oauth ? 'oauth' : d.bearerToken !== undefined ? 'bearer' : 'none';
	const setAuth = (mode: string) => {
		d.oauth = mode === 'oauth' ? { tokenUrl: 'https://', clientId: '', clientSecret: '', scope: '', credentials: 'body' } : undefined;
		d.bearerToken = mode === 'bearer' ? '' : undefined;
		changed();
	};
	const editDefault = (h: { name: string; value: string }) => addHeader(h.name, h.name === 'Authorization' ? `Bearer ${d.bearerToken}` : h.value);
	const removeHeader = (i: number) => {
		d.headers = d.headers.filter((_: unknown, j: number) => j !== i);
		changed();
	};
	const dispatch = createEventDispatcher<{ change: void; delete: void }>();
	const changed = () => {
		node = node;
		dispatch('change');
	};

	// Loose view of the config so one form covers every type (fields only render for matching types).
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$: d = node.data as any;
	// Seconds / counts may be formulas now — the text fields need text.
	$: if (d.type === 'timer' && typeof d.seconds === 'number') d.seconds = String(d.seconds);
	$: if (d.type === 'list' && typeof d.count === 'number') d.count = String(d.count);
	let choices: { type: string; group: string; label: string; make: () => unknown }[] = [];
	$: choices = node.kind === 'trigger' ? TRIGGERS : node.kind === 'condition' ? CONDITIONS : node.kind === 'action' ? ACTIONS : [];
	// Controller combos need Windows (Froggi reads the controller from Dolphin's memory) — the HOST's OS.
	$: controllerSupported = ($froggiSettings?.platform ?? (/windows/i.test(navigator.userAgent) ? 'win32' : '')) === 'win32';
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
	const modes: { value: string; label: string; tip: string }[] = [
		{ value: 'local', label: 'Local', tip: 'Offline — consoles, LAN, tournament setups.' },
		{ value: 'direct', label: 'Direct', tip: 'Slippi online, direct connect code.' },
		{ value: 'teams', label: 'Teams (online)', tip: "Slippi's online Teams mode. For any doubles game (offline too) use Game format is Doubles." },
		{ value: 'unranked', label: 'Unranked', tip: 'Slippi online unranked.' },
		{ value: 'ranked', label: 'Ranked', tip: 'Slippi online ranked.' },
	];
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
	<p class="dash-label">{node.kind === 'trigger' ? 'When' : node.kind === 'condition' ? 'And' : node.kind === 'note' ? 'Note' : 'Then'}</p>
	{#if node.kind === 'note'}
		<textarea class="field area" rows="6" bind:value={d.text} on:input={changed} placeholder="Write a note for this flow…" />
		<p class="hint">Notes are not connected and never run.</p>
	{:else}
	<select class="field" value={d.type} on:change={(e) => setType(e.currentTarget.value)}>
		{#each grouped(choices) as g (g.group)}
			<optgroup label={g.group}>
				{#each g.items as choice (choice.type)}
					<option value={choice.type} disabled={choice.type === 'controllerCombo' && !controllerSupported}>
						{choice.label}{choice.type === 'controllerCombo' && !controllerSupported ? ' (Windows only)' : ''}
					</option>
				{/each}
			</optgroup>
		{/each}
	</select>
	{/if}

	{#if node.kind === 'trigger'}
		<p class="hint fires">{FIRES_WHEN[node.data.type] ?? ''}</p>
	{/if}
	{#if output.length || node.kind === 'trigger'}
		<button class="link-btn" on:click={() => (outputOpen = true)}>Output schema</button>
	{/if}

	{#if d.type === 'sceneChange' || d.type === 'scene'}
		<label>Scene
			<select class="field" bind:value={d.scene} on:change={changed}>
				{#if d.type === 'sceneChange'}<option value={undefined}>Any scene</option>{/if}
				{#each SCENES as scene}<option value={scene}>{SCENE_LABEL[scene]}</option>{/each}
			</select>
		</label>
	{/if}

	{#if d.type === 'dolphinConnection'}
		<select class="field" value={d.connected === undefined ? 'any' : String(d.connected)} on:change={(e) => { const v = e.currentTarget.value; d.connected = v === 'any' ? undefined : v === 'true'; changed(); }}>
			<option value="true">connects</option>
			<option value="false">disconnects</option>
			<option value="any">connects or disconnects</option>
		</select>
	{/if}
	{#if d.type === 'setScene'}
		<label>Switch to
			<select class="field" bind:value={d.scene} on:change={changed}>
				{#each SCENES as scene}<option value={scene}>{SCENE_LABEL[scene]}</option>{/each}
			</select>
		</label>
		<p class="hint">Switches the scene overlays show — Froggi changes scenes only through flows.</p>
	{/if}
	{#if d.type === 'timer'}
		<label>Wait (seconds — a number or a formula)</label>
		<KeyField bind:value={d.seconds} {isKnown} placeholder={'10 or {{clipSeconds}}'} on:change={changed} />
		<label>Key<input class="field" bind:value={d.key} on:change={changed} placeholder="e.g. scene" /></label>
		<p class="hint">The cards after this one run when the time is up — their And conditions are checked then. Starting a timer with a key that is already running restarts it. Keys are shared by all flows.</p>
	{/if}
	{#if d.type === 'cancelTimer'}
		<label>Key of the timer to cancel<input class="field" bind:value={d.key} on:change={changed} placeholder="e.g. scene" /></label>
	{/if}

	{#if d.type === 'controllerCombo'}
		<p class="hint">Hold these buttons together:</p>
		<div class="chips">
			{#each BUTTONS as b (b.key)}
				<button class="chip" class:chip--on={d.buttons?.[b.key]} on:click={() => toggleButton(b.key)}>{b.label}</button>
			{/each}
		</div>
	{/if}

	{#if d.type === 'sequence'}
		<label>Kind
			<select class="field" bind:value={d.kind} on:change={changed}>
				<option value="punish">Punish — every hit until the opponent escapes (incl. edgeguards, kills)</option>
				<option value="combo">Combo — hits while the opponent is in hitstun</option>
			</select>
		</label>
		<p class="hint">Punish = every hit until the opponent escapes (incl. edgeguards and kills); combo = hits while the opponent is in hitstun — Slippi's own definitions.</p>
	{/if}
	{#if d.type === 'damageTaken' || d.type === 'stockLost' || d.type === 'sequence' || d.type === 'playerStocks' || d.type === 'playerPercent'}
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

	{#if d.type === 'strikeAction'}
		<select class="field" bind:value={d.event} on:change={changed}>
			{#each STRIKE_EVENTS as e (e.value)}<option value={e.value}>{e.label}</option>{/each}
		</select>
		<p class="hint">"Any player choice" = a choice on a phone (or by the host for a player); "Any change" = also a game reported, a set starting…</p>
	{/if}
	{#if d.type === 'strikePhase'}
		<label>Phase
			<select class="field" bind:value={d.phase} on:change={changed}>
				{#each STRIKE_PHASES as p}<option value={p}>{p}</option>{/each}
			</select>
		</label>
	{/if}
	{#if d.type === 'gameFormat'}
		<select class="field" bind:value={d.format} on:change={changed}>
			<option value="singles">Singles (1v1)</option>
			<option value="doubles">Doubles (teams)</option>
		</select>
	{/if}
	{#if d.type === 'gameMode'}
		<div class="chips">
			{#each modes as m (m.value)}
				<button class="chip" class:chip--on={d.modes.includes(m.value)} title={m.tip} on:click={() => toggleMode(m.value)}>{m.label}</button>
			{/each}
		</div>
	{/if}

	{#if d.type === 'compare'}
		<KeyField bind:value={d.left} {isKnown} placeholder={'{{state.players.1.percent}}'} on:change={changed} />
		<select class="field" bind:value={d.op} on:change={changed}>
			{#each COMPARE_OPS as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
		</select>
		<KeyField bind:value={d.right} {isKnown} placeholder="100" on:change={changed} />
		<p class="hint">Numbers compare as numbers, anything else as text (case doesn't matter).</p>
	{/if}

	{#if d.type === 'setHighlightVideo'}
		<label>Media key<input class="field" bind:value={d.key} on:change={changed} placeholder="game" /></label>
		<label>Show (file path, web link or highlight)</label>
		<KeyField bind:value={d.path} {isKnown} placeholder={'{{clipPath}} or {{list.first.id}}'} on:change={changed} />
		<div class="row">
			<label>From (s)</label>
			<KeyField bind:value={d.start} {isKnown} placeholder="start" on:change={changed} />
			<label>To (s)</label>
			<KeyField bind:value={d.end} {isKnown} placeholder="end" on:change={changed} />
		</div>
		<p class="hint">Every Media element with this key shows this one thing: a video or image file, a web link, or a highlight id ({'{{highlight}}'} — its replay-buffer clip). From / To are seconds into the video (empty = the whole video). An empty source clears the key. To play a list one by one: Set media → Timer ({'{{list.first.seconds}}'}) → List "next" → back to Set media. Error runs when the file can't be used.</p>
	{/if}
	{#if d.type === 'calculate'}
		<label>Key<input class="field" bind:value={d.key} on:change={changed} placeholder="total" /></label>
		<label>Description<input class="field" bind:value={d.description} on:change={changed} placeholder="What the value means (shown on hover)" /></label>
		<label>Formula</label>
		<KeyField bind:value={d.formula} {isKnown} placeholder={'didKill * 50 + Math.min(damage, 60)'} on:change={changed} />
		{#if formulaError}<p class="hint hint--error">{formulaError}</p>{/if}
	{/if}
	{#if d.type === 'markHighlight'}
		<div class="row">
			<label>Seconds before<input class="field" type="number" min="0" step="0.5" bind:value={d.before} on:change={changed} /></label>
			<label>Seconds after<input class="field" type="number" min="0" step="0.5" bind:value={d.after} on:change={changed} /></label>
			<label>Max length<input class="field" type="number" min="0" step="1" bind:value={d.maxSeconds} on:change={changed} placeholder="none" /></label>
		</div>
		<label use:tooltip={{ content: 'The value of your formula (e.g. the Calculate card total) — it ranks the highlights. Not the in-game score.', placement: 'top', delay: [300, 0] }}>Highlight score</label>
		<KeyField bind:value={d.score} {isKnown} placeholder={'total'} on:change={changed} />
		{#if formulaError}<p class="hint hint--error">{formulaError}</p>{/if}
	{/if}
	{#if d.type === 'setVideoVolume'}
		<div class="row">
			<label>Video key<input class="field" bind:value={d.key} on:change={changed} placeholder="game" /></label>
			<label>Volume (0–100)<input class="field" type="number" min="0" max="100" step="5" bind:value={d.volume} on:change={changed} /></label>
		</div>
		<p class="hint">Every Video element with this key plays at this volume (instead of its own) until a flow sets it again. 0 = muted.</p>
	{/if}
	{#if d.type === 'setReplayList'}
		<div class="row">
			<label>Replay key<input class="field" bind:value={d.key} on:change={changed} placeholder="replay" /></label>
			<label>From list<input class="field" bind:value={d.list} on:change={changed} placeholder="gameList" /></label>
		</div>
		<label>Highlight field<input class="field" bind:value={d.field} on:change={changed} placeholder="id" /></label>
		<p class="hint">Every Highlight Replay element with this key plays these highlights from their game replays (animated, no video), one after another, in list order.</p>
	{/if}
	{#if d.type === 'obsSaveReplay'}
		<label>Highlight (optional)</label>
		<KeyField bind:value={d.highlight} {isKnown} placeholder={'{{highlight}}'} on:change={changed} />
		<p class="hint">With a highlight: waits for OBS's file and gives the cards after it {'{{clipPath}}'}, {'{{clipStart}}'}, {'{{clipEnd}}'} and {'{{clipSeconds}}'} — where the highlight is in the file. Put a Timer before this card that waits until the moment is over (its "seconds after").</p>
	{/if}
	{#if d.type === 'buildHighlightReel'}
		<div class="row">
			<label>Video key<input class="field" bind:value={d.key} on:change={changed} placeholder="game" /></label>
			<label>From list<input class="field" bind:value={d.list} on:change={changed} placeholder="gameList" /></label>
		</div>
		<div class="row">
			<label>Highlight field<input class="field" bind:value={d.field} on:change={changed} placeholder="id" /></label>
			<label>Stream delay (s)<input class="field" type="number" min="0" step="0.05" bind:value={d.delay} on:change={changed} placeholder="0" /></label>
		</div>
	{/if}
	{#if d.type === 'list'}
		<label>List<input class="field" bind:value={d.key} on:change={changed} placeholder="gameList" /></label>
		<label>Description<input class="field" bind:value={d.description} on:change={changed} placeholder="What the list holds (shown on hover)" /></label>
		<label>Do
			<select class="field" bind:value={d.op} on:change={changed}>
				{#each LIST_OPS as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
			</select>
		</label>
		{#if d.op === 'add'}
			{#each d.fields ?? [] as f, i (i)}
				<div class="row">
					<input class="field field-name" bind:value={f.name} on:change={changed} placeholder="score" />
					<KeyField bind:value={f.value} {isKnown} placeholder={'{{total}}'} on:change={changed} />
					<button class="x" title="Remove field" on:click={() => removeField(i)}>✕</button>
				</div>
			{/each}
			<button class="link-btn" on:click={addField}>+ Field</button>
		{:else if d.op === 'addList'}
			<label>From list<input class="field" bind:value={d.from} on:change={changed} placeholder="gameList" /></label>
		{:else if d.op === 'sort' || d.op === 'filter' || d.op === 'map'}
			{#if d.op === 'map'}
				<label>Field to set<input class="field" bind:value={d.field} on:change={changed} placeholder="rank" /></label>
			{/if}
			<label>{d.op === 'sort' ? 'Sort by (formula per item)' : d.op === 'filter' ? 'Keep items where (formula per item)' : 'Value (formula per item)'}</label>
			<KeyField bind:value={d.formula} {isKnown} placeholder={d.op === 'filter' ? 'item => item.score >= 40' : d.op === 'map' ? 'item => item.score * 2' : 'item => item.score'} on:change={changed} />
			{#if d.op === 'sort'}
				<label>Order
					<select class="field" bind:value={d.order} on:change={changed}>
						<option value="high">high → low</option>
						<option value="low">low → high</option>
					</select>
				</label>
			{/if}
			{#if listFormulaError}<p class="hint hint--error">{listFormulaError}</p>{/if}
		{:else if d.op === 'limit' || d.op === 'limitPer'}
			{#if d.op === 'limitPer'}
				<label>Per field<input class="field" bind:value={d.field} on:change={changed} placeholder="game" /></label>
			{/if}
			<label>How many (a number or a formula)</label>
			<KeyField bind:value={d.count} {isKnown} placeholder={'5 or max(10, min(30, gameList.count * 0.05))'} on:change={changed} />
		{:else if d.op === 'next'}
			<p class="hint">Moves the first item to the end — {'{{' + (d.key || 'list') + '.first}}'} is then the next one. Loops a list.</p>
		{/if}
	{/if}
	{#if d.type === 'clearValues'}
		<label>Values to clear<input class="field" bind:value={d.keys} on:change={changed} placeholder="gameList, total" /></label>
	{/if}
	{#if d.type === 'obsReplayBufferSettings'}
		<div class="row">
			<label>Length (seconds)<input class="field" type="number" min="5" step="5" bind:value={d.seconds} on:change={changed} /></label>
			<label>Format
				<select class="field" bind:value={d.format} on:change={changed}>
					<option value={undefined}>keep</option>
					{#each Object.entries(REPLAY_FORMATS) as [value, label] (value)}<option {value}>{label}</option>{/each}
				</select>
			</label>
		</div>
		<label>File name (prefix)</label>
		<KeyField bind:value={d.fileName} {isKnown} placeholder={'Froggi {{state.match.id}} game {{state.match.gameNumber}}'} on:change={changed} />
		<p class="hint">Sets OBS's replay buffer in the active output mode. File name: the start of each replay file's name ({'{{keys}}'} filled when the card runs; folders come from OBS's own Filename Formatting). Nothing happens when it already matches; otherwise the buffer restarts to apply it (what it held so far is lost). Up to 8 minutes covers a whole game — OBS keeps it in memory (about 45 MB per minute at 6 Mbit/s).</p>
	{/if}
	{#if d.type === 'notify' || d.type === 'log'}
		<label>Message</label>
		<KeyField bind:value={d.message} {isKnown} on:change={changed} />
		<p class="hint">{d.type === 'notify' ? 'Pops up in Froggi.' : "Written to Froggi's log file (main.log)."}</p>
	{/if}

	{#if d.type === 'httpPost'}
		<div class="row">
			<select class="field method" value={methodChoice} on:change={(e) => setMethod(e.currentTarget.value)}>
				<option value="POST">POST</option>
				<option value="GET">GET</option>
				<option value="custom">Custom…</option>
			</select>
			{#if methodChoice === 'custom'}
				<input class="field method-custom" list="flow-methods" placeholder="PUT" bind:value={d.method} on:change={() => { d.method = (d.method ?? '').trim().toUpperCase(); changed(); }} />
				<datalist id="flow-methods"><option value="PUT" /><option value="PATCH" /><option value="DELETE" /><option value="HEAD" /><option value="OPTIONS" /></datalist>
			{/if}
		</div>
		<label>URL</label>
		<KeyField bind:value={d.url} {isKnown} placeholder="https://…" on:change={changed} />
		<label>Authentication
			<select class="field" value={auth} on:change={(e) => setAuth(e.currentTarget.value)}>
				<option value="none">None</option>
				<option value="bearer">Bearer token</option>
				<option value="oauth">OAuth 2 (client credentials)</option>
			</select>
		</label>
		{#if auth === 'bearer'}
			<label>Token<input class="field" type="password" bind:value={d.bearerToken} on:change={changed} /></label>
		{:else if auth === 'oauth'}
			<label>Token URL<input class="field" bind:value={d.oauth.tokenUrl} on:change={changed} placeholder="https://…/oauth2/token" /></label>
			<label>Client ID<input class="field" bind:value={d.oauth.clientId} on:change={changed} /></label>
			<label>Client secret<input class="field" type="password" bind:value={d.oauth.clientSecret} on:change={changed} /></label>
			<label>Scope (optional)<input class="field" bind:value={d.oauth.scope} on:change={changed} /></label>
			<label>Send client ID + secret
				<select class="field" bind:value={d.oauth.credentials} on:change={changed}>
					<option value="body">In the request body</option>
					<option value="basic">As Basic auth</option>
				</select>
			</label>
			<p class="hint">Froggi gets an access token, reuses it until it expires and sends it as a Bearer token. Check your provider's docs for how it wants the client ID and secret.</p>
		{/if}
		<details class="headers" open={!!d.headers?.length}>
			<summary>Headers ({defaultHeaders.length + (d.headers?.length ?? 0)})</summary>
			{#each defaultHeaders as h (h.name)}
				<div class="header-row header-row--auto">
					<span class="h-name">{h.name}</span>
					<span class="h-value">{h.value}</span>
					{#if !(h.name === 'Authorization' && d.oauth)}<button class="link" title="Override this header" on:click={() => editDefault(h)}>Edit</button>{:else}<span />{/if}
				</div>
			{/each}
			{#each d.headers ?? [] as h, i}
				<div class="header-row">
					<input class="field" placeholder="Name" bind:value={h.name} on:change={changed} />
					<KeyField bind:value={h.value} {isKnown} placeholder="Value" on:change={changed} />
					<button class="x" title="Remove header" on:click={() => removeHeader(i)}>✕</button>
				</div>
			{/each}
			<button class="link add" on:click={() => addHeader()}>+ Add header</button>
		</details>
		{#if !hasNoBody(d.method)}
			<label>Body
				<select class="field" bind:value={d.body} on:change={changed}>
					{#each POST_BODIES as b (b.value)}<option value={b.value}>{b.label}</option>{/each}
				</select>
			</label>
			{#if d.body === 'custom'}
				<label>Body template</label>
				<KeyField bind:value={d.template} {isKnown} multiline rows={7} placeholder={'{ "who": "{{playerName}}", "percent": {{percent}} }'} on:change={changed} />
				<p class="hint">
					{#if pretty !== null}
						JSON — sent as application/json · <button class="link" disabled={pretty === d.template} on:click={() => { d.template = pretty; changed(); }}>Prettify</button>
					{:else}
						Not JSON — sent as plain text. Put text keys in quotes in JSON: "{'{{playerName}}'}".
					{/if}
				</p>
			{:else}
				<p class="hint">Sent as {'{ flow, trigger, timestamp, tokens, payload }'} — tokens are the trigger's keys{keys.length ? ` (${keys.join(', ')})` : ''}; payload shapes match the webhooks.</p>
			{/if}
		{:else}
			<p class="hint">{(d.method || 'GET').toUpperCase()} sends no body — put {'{{keys}}'} in the URL (they are URL-encoded).</p>
		{/if}
	{/if}

	{#if hasKeys}
		<p class="hint">Click a key to insert it where your cursor was:</p>
		<div class="chips">
			{#each keys as key}
				<button
					class="chip chip--on"
					use:tooltip={{ content: chipTip(key), placement: 'top', delay: [300, 0] }}
					on:click={() => insertKey(key)}>{key}</button
				>
			{/each}
			<button class="chip" on:click={() => (stateOpen = true)}>All keys & game state…</button>
		</div>
	{/if}
	{#if d.type === 'obsReplayBuffer'}
		<label>Replay buffer
			<select class="field" bind:value={d.active} on:change={changed}>
				<option value={true}>is on</option>
				<option value={false}>is off</option>
			</select>
		</label>
	{/if}
	{#if d.type === 'obsScene'}
		<label>{node.kind === 'condition' ? 'Current OBS scene is' : 'Switch OBS to'}
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

	{#if canRemove}
		<button class="delete" on:click={() => dispatch('delete')}>Remove node</button>
	{/if}
</div>

<StateKeysModal bind:open={stateOpen} {triggerTypes} on:pick={(e) => insertKey(e.detail)} />
<FlowOutputModal bind:open={outputOpen} title={describe(node)} firesWhen={node.kind === 'trigger' ? FIRES_WHEN[node.data.type] : undefined} sections={outputSections} />

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
	.row > label { flex: 1; min-width: 0; }
	.row > label > .field { min-width: 0; width: 100%; }
	label.check { flex-direction: row; align-items: center; gap: 0.4rem; }
	.area { height: auto; padding: 0.4rem 0.5rem; font-family: monospace; font-size: 0.72rem; resize: vertical; }
	.chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
	.chip { font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 1rem; border: 1px solid var(--secondary-color); opacity: 0.4; color: var(--secondary-color); background: transparent; }
	.chip--on { opacity: 1; background: color-mix(in srgb, var(--secondary-color) 15%, transparent); }
	.hint { font-size: 0.68rem; opacity: 0.5; }
	.hint--error { color: #f87171; opacity: 1; }
	.field-name { width: 6.5rem; flex: none; }
	.link-btn { align-self: flex-start; background: none; color: inherit; font-size: 0.72rem; text-decoration: underline; opacity: 0.75; }
	.method { width: 7rem; }
	.method-custom { width: 6rem; text-transform: uppercase; }
	.link { background: none; text-decoration: underline; color: inherit; padding: 0; font-size: inherit; }
	.link:disabled { opacity: 0.4; text-decoration: none; }
	.header-row { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr) auto; gap: 0.3rem; align-items: start; }
	.x { background: none; color: inherit; opacity: 0.5; font-size: 0.7rem; padding: 0.4rem 0.2rem; }
	.x:hover { opacity: 1; }
	.add { align-self: flex-start; font-size: 0.7rem; }
	.headers { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.7rem; }
	.headers[open] { display: flex; }
	.headers summary { cursor: pointer; opacity: 0.85; margin-bottom: 0.3rem; }
	.header-row--auto { align-items: center; opacity: 0.6; font-family: monospace; font-size: 0.68rem; }
	.h-name, .h-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.headers .header-row { margin-bottom: 0.3rem; }
	.delete { margin-top: 0.4rem; font-size: 0.72rem; color: #ef4444; text-align: left; background: none; }
</style>
