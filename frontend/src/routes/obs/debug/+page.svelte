<script lang="ts">
	import { actionStateHistories, techniqueEvents } from '$lib/utils/store.svelte';
	import { TECHNIQUE_LABELS } from '$lib/models/constants/techniqueLabels';

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
</script>

<main class="flex justify-center">
	<div class="w-full max-w-3xl p-4 flex flex-col gap-4">
		<p class="text-secondary-color" style="font-size: 0.7rem; opacity: 0.4; text-transform: uppercase; letter-spacing: 0.05em;">Action State Debug</p>

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
	</div>
</main>
