<script lang="ts">
	import { actionStateHistories, techniqueEvents, gameFrame, gameSettings } from '$lib/utils/store.svelte';
	import { TECHNIQUE_LABELS } from '$lib/models/constants/techniqueLabels';
	import GameStateRender from '$lib/components/viewer/GameStateRender.svelte';
	import ReplayDemo from '$lib/components/viewer/ReplayDemo.svelte';
	import InGamePlayerRadar from '$lib/components/obs/overlays/element/inGame/InGamePlayerRadar.svelte';
	import { Stage } from '$lib/models/constants/stageData';
	import type { GridContentItemStyle } from '$lib/models/types/overlay';

	type Section = 'events' | 'viewer';
	let section: Section = 'events';
	const sections: { value: Section; label: string }[] = [
		{ value: 'events', label: 'Events' },
		{ value: 'viewer', label: 'Viewer' },
	];

	// ── Events (action state / techniques) ──────────────────────────────
	$: p1History = $actionStateHistories[0] ?? [];
	$: p2History = $actionStateHistories[1] ?? [];
	$: p1Technique = $techniqueEvents[0];
	$: p2Technique = $techniqueEvents[1];

	let p1Techniques: { frame: number; label: string }[] = [];
	let p2Techniques: { frame: number; label: string }[] = [];

	$: if (p1Technique) {
		p1Techniques = [{ frame: p1Technique.frame, label: TECHNIQUE_LABELS[p1Technique.techniqueId] ?? p1Technique.techniqueId }, ...p1Techniques].slice(0, 10);
	}
	$: if (p2Technique) {
		p2Techniques = [{ frame: p2Technique.frame, label: TECHNIQUE_LABELS[p2Technique.techniqueId] ?? p2Technique.techniqueId }, ...p2Techniques].slice(0, 10);
	}

	// ── Viewer (SlippiLab-style game-state render) ──────────────────────
	type ViewerSource = 'live' | 'demo';
	type ViewerRender = 'dots' | 'animated' | 'camera';
	let source: ViewerSource = 'demo';
	let render: ViewerRender = 'camera';
	const sources: { value: ViewerSource; label: string }[] = [
		{ value: 'live', label: 'Live' },
		{ value: 'demo', label: 'Demo' },
	];
	const renders: { value: ViewerRender; label: string }[] = [
		{ value: 'dots', label: 'Dots radar' },
		{ value: 'animated', label: 'Animated' },
		{ value: 'camera', label: 'Live camera' },
	];
	// InGamePlayerRadar (dots) is an overlay element; give it an empty style stub.
	const radarStyle = { classValue: '', cssValue: '' } as GridContentItemStyle;

	$: frame = $gameFrame;
	$: settings = $gameSettings;
	$: hasGame = settings?.stageId != null && !!frame?.players;
</script>

<main class="flex justify-center">
	<div class="w-full max-w-3xl p-4 flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<p class="section-label">Debug</p>
			<div class="pill-group">
				{#each sections as s}
					<button class="pill" class:pill--active={section === s.value} on:click={() => (section = s.value)}>{s.label}</button>
				{/each}
			</div>
		</div>

		{#if section === 'events'}
			<p class="section-label">Action State</p>
			<div class="flex gap-4">
				<!-- Player 1 -->
				<div class="flex-1 flex flex-col gap-3">
					<p class="dash-label">Player 1</p>

					<div class="dash-card border-secondary flex flex-col gap-1">
						<p class="dash-label">State History</p>
						{#if p1History.length === 0}
							<p style="font-size: 0.8rem; opacity: 0.4;">No data</p>
						{:else}
							{#each [...p1History].reverse() as entry}
								<div class="flex justify-between gap-2" style="font-size: 0.75rem;">
									<span style="opacity: 0.5;">F{entry.frame}</span>
									<span style="opacity: 0.6;">{entry.category}</span>
									<span>{entry.stateName}</span>
									<span style="opacity: 0.4;">{entry.stateId}</span>
								</div>
							{/each}
						{/if}
					</div>

					<div class="dash-card border-secondary flex flex-col gap-1">
						<p class="dash-label">Techniques</p>
						{#if p1Techniques.length === 0}
							<p style="font-size: 0.8rem; opacity: 0.4;">No data</p>
						{:else}
							{#each p1Techniques as entry}
								<div class="flex justify-between gap-2" style="font-size: 0.75rem;">
									<span style="opacity: 0.5;">F{entry.frame}</span>
									<span>{entry.label}</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Player 2 -->
				<div class="flex-1 flex flex-col gap-3">
					<p class="dash-label">Player 2</p>

					<div class="dash-card border-secondary flex flex-col gap-1">
						<p class="dash-label">State History</p>
						{#if p2History.length === 0}
							<p style="font-size: 0.8rem; opacity: 0.4;">No data</p>
						{:else}
							{#each [...p2History].reverse() as entry}
								<div class="flex justify-between gap-2" style="font-size: 0.75rem;">
									<span style="opacity: 0.5;">F{entry.frame}</span>
									<span style="opacity: 0.6;">{entry.category}</span>
									<span>{entry.stateName}</span>
									<span style="opacity: 0.4;">{entry.stateId}</span>
								</div>
							{/each}
						{/if}
					</div>

					<div class="dash-card border-secondary flex flex-col gap-1">
						<p class="dash-label">Techniques</p>
						{#if p2Techniques.length === 0}
							<p style="font-size: 0.8rem; opacity: 0.4;">No data</p>
						{:else}
							{#each p2Techniques as entry}
								<div class="flex justify-between gap-2" style="font-size: 0.75rem;">
									<span style="opacity: 0.5;">F{entry.frame}</span>
									<span>{entry.label}</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{:else if section === 'viewer'}
			<div class="flex items-center justify-between gap-4 flex-wrap">
				<p class="section-label">Game-state render (no HUD)</p>
				<div class="flex gap-3 flex-wrap">
					<div class="pill-group">
						{#each sources as s}
							<button class="pill" class:pill--active={source === s.value} on:click={() => (source = s.value)}>{s.label}</button>
						{/each}
					</div>
					<div class="pill-group">
						{#each renders as r}
							<button class="pill" class:pill--active={render === r.value} on:click={() => (render = r.value)}>{r.label}</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex justify-center">
				<div class="viewer-square border-secondary">
					{#if render === 'dots'}
						{#if hasGame}
							<InGamePlayerRadar
								style={radarStyle}
								defaultPreview={false}
								stageId={settings?.stageId}
								fallbackStageId={Stage.BATTLEFIELD}
							/>
						{:else}
							<div class="flex items-center justify-center w-full h-full opacity-50 text-sm">
								Dots radar needs a live game.
							</div>
						{/if}
					{:else if source === 'demo'}
						<ReplayDemo controls camera={render === 'camera' ? 'live' : 'static'} />
					{:else if hasGame}
						<GameStateRender {settings} {frame} camera={render === 'camera' ? 'live' : 'static'} />
					{:else}
						<div class="flex items-center justify-center w-full h-full opacity-50 text-sm">
							Waiting for a game frame… (or switch source to Demo)
						</div>
					{/if}
				</div>
			</div>

			{#if source === 'live' && hasGame}
				<p class="text-center text-xs opacity-50">frame {frame?.frame} · stage {settings?.stageId}</p>
			{/if}
		{/if}
	</div>
</main>

<style>
	.section-label {
		font-size: 0.7rem;
		opacity: 0.4;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.pill-group { display: flex; gap: 0.3rem; }
	.pill {
		padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem;
		border: 1px solid var(--secondary-color); background: transparent;
		color: var(--secondary-color); opacity: 0.4; cursor: pointer; transition: opacity 0.12s;
	}
	.pill--active, .pill:hover { opacity: 1; background: color-mix(in srgb, var(--secondary-color) 12%, transparent); }
	.viewer-square {
		width: min(80vw, 70vh);
		height: min(80vw, 70vh);
		border-radius: 0.5rem;
		overflow: hidden;
		padding: 0.5rem;
	}
</style>
