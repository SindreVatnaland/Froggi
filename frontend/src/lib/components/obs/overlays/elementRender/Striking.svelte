<script lang="ts">
	import type { GridContentItem, GridContentItemStyle } from '$lib/models/types/overlay';
	import type { StrikeState } from '$lib/models/types/stageStriking';
	import { CustomElement } from '$lib/models/constants/customElement';
	import { STAGE_DATA } from '$lib/models/constants/stageData';

	export let dataItem: GridContentItem;
	export let defaultPreview: boolean;
	export let style: GridContentItemStyle;
	export let strikeState: StrikeState | undefined;

	const hideOnError = (e: Event) =>
		((e.currentTarget as HTMLImageElement).style.display = 'none');

	const RPS_LABELS: Record<string, string> = {
		rock: 'Rock',
		paper: 'Paper',
		scissors: 'Scissors',
	};

	$: id = dataItem.elementId;

	$: p1Rps = strikeState?.rps?.p1;
	$: p2Rps = strikeState?.rps?.p2;
	$: rpsWinner = strikeState?.rps?.winner;
	$: currentStriker = strikeState?.currentStriker;
	$: stages = strikeState?.stages ?? [];
	$: finalStageId = strikeState?.finalStageId ?? undefined;
	$: finalStageName = finalStageId != null ? (STAGE_DATA[finalStageId]?.name ?? '') : '';
	$: p1Char = strikeState?.characters?.p1;
	$: p2Char = strikeState?.characters?.p2;
	$: bansRemaining = null;  // not in StrikeState
	$: timerSeconds = null;   // not in StrikeState
	$: dsrP1 = strikeState?.dsrStages?.p1 ?? [];
	$: dsrP2 = strikeState?.dsrStages?.p2 ?? [];

	$: strikeOrderText = (() => {
		const order = strikeState?.strikeOrder ?? [];
		if (!order.length) return '';
		return order.map(([p, n]) => `P${p} bans ${n}`).join(' → ');
	})();

	// Slot-indexed helpers (StrikeStageSlot1–9)
	function getSlotIndex(elementId: CustomElement): number {
		return (elementId - CustomElement.StrikeStageSlot1) / 10;
	}

	function slotStageId(slotIdx: number): number | undefined {
		return stages[slotIdx];
	}

	function isStruck(stageId: number | undefined): boolean {
		return stageId != null && (strikeState?.strikes?.includes(stageId) ?? false);
	}

	function isFinalStage(stageId: number | undefined): boolean {
		return stageId != null && finalStageId === stageId;
	}

	function isDsrBannedByP1(stageId: number | undefined): boolean {
		return stageId != null && (dsrP1?.includes(stageId) ?? false);
	}

	function isDsrBannedByP2(stageId: number | undefined): boolean {
		return stageId != null && (dsrP2?.includes(stageId) ?? false);
	}

	// Fixed-stage helpers (StrikeStageFoD/BF/FD/DL/YS/PS)
	const FIXED_STAGE_ID: Partial<Record<CustomElement, number>> = {
		[CustomElement.StrikeStageFoD]: 2,
		[CustomElement.StrikeStageBF]:  31,
		[CustomElement.StrikeStageFD]:  32,
		[CustomElement.StrikeStageDL]:  28,
		[CustomElement.StrikeStageYS]:  8,
		[CustomElement.StrikeStagePS]:  3,
	};

	const FIXED_STAGE_IDS = new Set(Object.values(FIXED_STAGE_ID));

	function isFixedStage(elementId: CustomElement): boolean {
		return elementId in FIXED_STAGE_ID;
	}

	function formatTimer(secs: number | null): string {
		if (secs == null) return '';
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s);
	}
</script>

{#if id === CustomElement.StrikeRpsPlayer1Choice}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? 'Rock' : (p1Rps ? RPS_LABELS[p1Rps] : '')}
		</span>
	</div>

{:else if id === CustomElement.StrikeRpsPlayer2Choice}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? 'Paper' : (p2Rps ? RPS_LABELS[p2Rps] : '')}
		</span>
	</div>

{:else if id === CustomElement.StrikeRpsWinner}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? 'Player 1' : (rpsWinner ? `Player ${rpsWinner}` : '')}
		</span>
	</div>

{:else if id === CustomElement.StrikeCurrentStriker}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? 'Player 1' : (currentStriker ? `Player ${currentStriker}` : '')}
		</span>
	</div>

{:else if id === CustomElement.StrikeFinalStageName}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? 'Battlefield' : finalStageName}
		</span>
	</div>

{:else if id === CustomElement.StrikeFinalStageImage}
	{@const sid = defaultPreview ? 31 : finalStageId}
	{#if sid != null}
		<div class="strike-stage-img-wrap" style={style.cssValue}>
			<img
				class="strike-stage-img {style.classValue}"
				src="/image/stages/{sid}.png"
				alt={STAGE_DATA[sid]?.name ?? ''}
				on:error={hideOnError}
			/>
		</div>
	{/if}

{:else if id === CustomElement.StrikePlayer1Character}
	{@const charId = defaultPreview ? 9 : p1Char}
	{#if charId != null}
		<img
			class="strike-char-img {style.classValue}"
			src="/image/characters/{charId}/0/stock.png"
			alt="P1"
			style={style.cssValue}
			on:error={hideOnError}
		/>
	{/if}

{:else if id === CustomElement.StrikePlayer2Character}
	{@const charId = defaultPreview ? 2 : p2Char}
	{#if charId != null}
		<img
			class="strike-char-img {style.classValue}"
			src="/image/characters/{charId}/0/stock.png"
			alt="P2"
			style={style.cssValue}
			on:error={hideOnError}
		/>
	{/if}

{:else if id === CustomElement.StrikeOrderDisplay}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? 'P2 bans 1 → P1 bans 2 → P2 bans 1' : strikeOrderText}
		</span>
	</div>

{:else if id === CustomElement.StrikeBansRemaining}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? '2' : (bansRemaining != null ? String(bansRemaining) : '')}
		</span>
	</div>

{:else if id === CustomElement.StrikeTimerSeconds}
	<div class="strike-text" style={style.cssValue}>
		<span class={style.classValue}>
			{defaultPreview ? '30' : formatTimer(timerSeconds)}
		</span>
	</div>

{:else if isFixedStage(id)}
	{@const stageId = defaultPreview ? (FIXED_STAGE_ID[id] ?? 31) : (FIXED_STAGE_ID[id] ?? undefined)}
	{@const struck   = defaultPreview ? false : isStruck(stageId)}
	{@const isFinal  = defaultPreview ? false : isFinalStage(stageId)}
	{@const dsrP1Stage = defaultPreview ? false : isDsrBannedByP1(stageId)}
	{@const dsrP2Stage = defaultPreview ? false : isDsrBannedByP2(stageId)}
	{@const stageName  = stageId != null ? (STAGE_DATA[stageId]?.name ?? '') : ''}

	<div
		class="strike-slot {style.classValue}"
		class:strike-slot--struck={struck}
		class:strike-slot--final={isFinal}
		style={style.cssValue}
	>
		{#if stageId != null}
			<img class="strike-slot-img" src="/image/stages/{stageId}.png" alt={stageName} on:error={hideOnError} />
		{/if}
		{#if stageName}
			<span class="strike-slot-name">{stageName}</span>
		{/if}
		{#if struck}
			<div class="strike-x">✕</div>
		{/if}
		{#if isFinal}
			<div class="strike-final-badge">✓</div>
		{/if}
		{#if dsrP1Stage || dsrP2Stage}
			<div class="strike-dsr" class:strike-dsr--p1={dsrP1Stage} class:strike-dsr--p2={dsrP2Stage} title="DSR">DSR</div>
		{/if}
	</div>

{:else}
	{@const slotIdx = getSlotIndex(id)}
	{@const stageId = defaultPreview ? [31, 8, 28, 2, 18, 6][slotIdx] : slotStageId(slotIdx)}
	{@const struck   = defaultPreview ? false : isStruck(stageId)}
	{@const isFinal  = defaultPreview ? slotIdx === 0 : isFinalStage(stageId)}
	{@const dsrP1Stage = defaultPreview ? false : isDsrBannedByP1(stageId)}
	{@const dsrP2Stage = defaultPreview ? false : isDsrBannedByP2(stageId)}
	{@const stageName  = stageId != null ? (STAGE_DATA[stageId]?.name ?? '') : ''}

	<div
		class="strike-slot {style.classValue}"
		class:strike-slot--struck={struck}
		class:strike-slot--final={isFinal}
		style={style.cssValue}
	>
		{#if stageId != null}
			<img class="strike-slot-img" src="/image/stages/{stageId}.png" alt={stageName} on:error={hideOnError} />
		{/if}
		{#if stageName}
			<span class="strike-slot-name">{stageName}</span>
		{/if}
		{#if struck}
			<div class="strike-x">✕</div>
		{/if}
		{#if isFinal}
			<div class="strike-final-badge">✓</div>
		{/if}
		{#if dsrP1Stage || dsrP2Stage}
			<div class="strike-dsr" class:strike-dsr--p1={dsrP1Stage} class:strike-dsr--p2={dsrP2Stage} title="DSR">DSR</div>
		{/if}
	</div>
{/if}

<style>
	.strike-text {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.strike-stage-img-wrap {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.strike-stage-img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.strike-char-img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.strike-slot {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 4px;
		transition: opacity 0.2s;
	}

	.strike-slot--struck {
		opacity: 0.5;
	}

	.strike-slot--final {
		outline: 2px solid rgb(34, 197, 94);
	}

	.strike-slot-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.strike-slot-name {
		position: absolute;
		bottom: 2px;
		left: 0;
		right: 0;
		text-align: center;
		font-size: 0.55rem;
		font-weight: 600;
		background: rgba(0, 0, 0, 0.55);
		padding: 1px 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.strike-x {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: 900;
		line-height: 1;
		pointer-events: none;
		color: rgb(239, 68, 68);
		text-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
	}

.strike-final-badge {
		position: absolute;
		top: 2px;
		right: 4px;
		font-size: 1rem;
		font-weight: 900;
		color: rgb(34, 197, 94);
		text-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
	}

	.strike-dsr {
		position: absolute;
		top: 2px;
		left: 3px;
		font-size: 0.45rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		padding: 1px 3px;
		border-radius: 2px;
		line-height: 1.2;
	}

	.strike-dsr--p1 {
		background: rgba(239, 68, 68, 0.85);
		color: #fff;
	}

	.strike-dsr--p2 {
		background: rgba(96, 165, 250, 0.85);
		color: #fff;
	}
</style>
