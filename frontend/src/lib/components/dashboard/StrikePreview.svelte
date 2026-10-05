<script lang="ts">
	import { goto } from '$app/navigation';
	import { electronEmitter, strikeState } from '$lib/utils/store.svelte';
	import { STRIKE_STAGES, stageStatus, strikeTurn } from '$lib/utils/strikeStageStatus';
	import type { StageStatus } from '$lib/models/types/stageStriking';

	// Live view of stage striking for the host, with overrides: click a stage to act for whoever's
	// turn it is, undo the last action, restart the current step, or pause the phones.
	$: s = $strikeState;
	$: active = !!s && s.phase !== 'lobby';
	$: turn = strikeTurn(s);
	$: nameOf = (p: 1 | 2 | null | undefined) => (p === 1 ? s?.p1Name : p === 2 ? s?.p2Name : '') || '';

	const PHASE_TEXT: Record<string, string> = {
		charSelect: 'Picking characters (double blind)',
		rps: 'Rock · paper · scissors',
		rpsResult: 'RPS winner chooses strike order',
		striking: 'Striking stages 1 · 2 · 1',
		stageBan: 'Winner bans a stage',
		stagePick: 'Loser picks the stage',
		charLock: 'Winner picks a character',
		charPick: 'Loser picks a character',
		playing: 'Game in progress',
		setComplete: 'Set complete',
	};
	const ACTION_TEXT: Record<string, string> = {
		pickCharacter: 'pick a character',
		chooseStrikeOrder: 'choose to strike first or second',
		strike: 'strike a stage',
		ban: 'ban a stage',
		pick: 'pick the stage',
		answerAgreement: 'answer the stage request',
	};
	$: turnText = turn.player ? `${nameOf(turn.player)} to ${ACTION_TEXT[turn.action] ?? turn.action}` : '';

	const RPS: Record<string, string> = { rock: '✊', paper: '✋', scissors: '✌️' };
	$: rpsShown = (c: string | null | undefined) => (!c ? '…' : s?.rps?.p1 && s?.rps?.p2 ? RPS[c] : '✓');

	$: canClick = s?.phase === 'striking' || s?.phase === 'stageBan' || s?.phase === 'stagePick';
	const clickStage = (id: number, status: StageStatus) => {
		if (!canClick || status !== 'available') return;
		$electronEmitter.emit(s?.phase === 'stagePick' ? 'PickStage' : 'StrikeStage', id);
	};
</script>

{#if active && s}
	<div class="dash-card border-secondary strike-card">
		<div class="head">
			<span class="dash-label">Stage striking · Game {s.gameNum}</span>
			{#if s.paused}<span class="paused">Paused</span>{/if}
			<span class="score">{s.p1Name} {s.score.p1} – {s.score.p2} {s.p2Name}</span>
		</div>
		<p class="phase">{PHASE_TEXT[s.phase] ?? s.phase}</p>
		{#if turnText}<p class="turn">{turnText}</p>{/if}

		<div class="stages">
			{#each STRIKE_STAGES as stage (stage.stageId)}
				{@const status = stageStatus(s, stage.stageId)}
				<button
					class="stage stage--{status}"
					class:stage--clickable={canClick && status === 'available'}
					title={canClick && status === 'available' ? `${s.phase === 'stagePick' ? 'Pick' : 'Strike'} for ${nameOf(s.currentStriker)}` : stage.name}
					on:click={() => clickStage(stage.stageId, status)}
				>
					<img src="/image/stages/{stage.stageId}.png" alt={stage.name} />
					<span>{stage.name}</span>
				</button>
			{/each}
		</div>

		<div class="players">
			<span>{s.p1Name}: {s.characters.p1 !== null ? '✓ character' : '…'} {s.phase === 'rps' || s.phase === 'rpsResult' ? rpsShown(s.rps.p1) : ''}</span>
			<span>{s.p2Name}: {s.characters.p2 !== null ? '✓ character' : '…'} {s.phase === 'rps' || s.phase === 'rpsResult' ? rpsShown(s.rps.p2) : ''}</span>
		</div>

		<div class="controls">
			<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => $electronEmitter.emit('StrikeUndoAction')} title="Step back one action (strike, ban, pick, character, RPS)">↩ Undo</button>
			<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => $electronEmitter.emit('StrikeRestartStep')} title="Start this step over">↻ Restart step</button>
			<button class="btn text-xs h-7 px-3 border-secondary rounded" on:click={() => $electronEmitter.emit('StrikePause', !s?.paused)} title="Phones can't act while paused — you still can">{s.paused ? '▶ Resume phones' : '⏸ Pause phones'}</button>
			<button class="btn text-xs h-7 px-3 border-secondary rounded ml-auto" on:click={() => goto('/set')}>Set page →</button>
		</div>
		{#if canClick}<p class="hint">Click a stage to act for {nameOf(s.currentStriker)}.</p>{/if}
	</div>
{/if}

<style>
	.strike-card { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem 1.25rem; border-radius: 0.25rem; }
	.dash-label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.4; }
	.head { display: flex; align-items: center; gap: 0.6rem; }
	.score { margin-left: auto; font-size: 0.8rem; font-weight: 600; }
	.paused { font-size: 0.65rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
	.phase { font-size: 0.95rem; font-weight: 700; }
	.turn { font-size: 0.8rem; color: #facc15; }
	.stages { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.4rem; }
	.stage { position: relative; display: flex; flex-direction: column; gap: 0.15rem; background: none; color: var(--secondary-color); text-align: center; font-size: 0.6rem; border-radius: 0.3rem; padding: 0; }
	.stage img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 0.3rem; border: 2px solid transparent; }
	.stage--locked img { filter: grayscale(1) brightness(0.45); }
	.stage--struck img { filter: sepia(1) saturate(4) hue-rotate(5deg) brightness(0.8); opacity: 0.7; }
	.stage--dsr img { filter: sepia(1) saturate(5) hue-rotate(-40deg) brightness(0.7); }
	.stage--picked img { border-color: #22c55e; }
	.stage--clickable img { cursor: pointer; }
	.stage--clickable:hover img { border-color: var(--secondary-color); }
	.players { display: flex; justify-content: space-between; font-size: 0.72rem; opacity: 0.7; }
	.controls { display: flex; flex-wrap: wrap; gap: 0.4rem; }
	.hint { font-size: 0.68rem; opacity: 0.45; }
	@media (max-width: 640px) { .stages { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
</style>
