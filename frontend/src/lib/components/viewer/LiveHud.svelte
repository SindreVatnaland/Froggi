<script lang="ts">
	/**
	 * SlippiLab-style HUD overlay (names, percents, stock dots, timer, score).
	 * Pure presentational — fed a frame + settings so it works for both the live
	 * page (live stores) and the demo preview.
	 */
	import type { ViewerFrame, ViewerSettings } from '$lib/utils/viewer/renderData';

	export let settings: ViewerSettings | null | undefined;
	export let frame: ViewerFrame | null | undefined;
	export let p1Name = 'Player 1';
	export let p2Name = 'Player 2';
	export let p1Index = 0;
	export let p2Index = 1;
	export let score: number[] = [0, 0];

	$: p1 = frame?.players?.[p1Index]?.post;
	$: p2 = frame?.players?.[p2Index]?.post;

	const pct = (post: { percent?: number | null } | null | undefined) =>
		post?.percent != null ? Math.floor(post.percent) : 0;
	const stocks = (post: { stocksRemaining?: number | null } | null | undefined) =>
		Math.max(0, post?.stocksRemaining ?? 0);

	function timeSeconds(startingTimer: number | null | undefined, f: number | null | undefined): number {
		if (!startingTimer) return 480;
		if (!f || f <= 0) return startingTimer;
		return Math.max(0, startingTimer - f / 60);
	}
	$: clock = timeSeconds(settings?.startingTimerSeconds, frame?.frame);
	$: clockText = `${Math.floor(clock / 60)}:${String(Math.floor(clock % 60)).padStart(2, '0')}`;

	const P1_COLOR = '#ef4444';
	const P2_COLOR = '#3b82f6';
</script>

<div class="live-hud-container">
<div class="live-hud">
	<div class="hud-side hud-side--left">
		<div class="hud-name" style="color:{P1_COLOR}">{p1Name}</div>
		<div class="hud-stat">
			<span class="hud-stocks">
				{#each Array(4) as _, i}
					<span class="stock-dot" class:stock-dot--on={i < stocks(p1)} style="--c:{P1_COLOR}"></span>
				{/each}
			</span>
			{#key pct(p1)}<span class="hud-percent">{pct(p1)}<span class="hud-pct-sign">%</span></span>{/key}
		</div>
	</div>

	<div class="hud-center">
		<div class="hud-timer">{clockText}</div>
		<div class="hud-score">{score?.[0] ?? 0} – {score?.[1] ?? 0}</div>
	</div>

	<div class="hud-side hud-side--right">
		<div class="hud-name" style="color:{P2_COLOR}">{p2Name}</div>
		<div class="hud-stat hud-stat--right">
			{#key pct(p2)}<span class="hud-percent">{pct(p2)}<span class="hud-pct-sign">%</span></span>{/key}
			<span class="hud-stocks">
				{#each Array(4) as _, i}
					<span class="stock-dot" class:stock-dot--on={i < stocks(p2)} style="--c:{P2_COLOR}"></span>
				{/each}
			</span>
		</div>
	</div>
</div>
</div>

<style>
	/* Container-query box so the HUD scales to the live window it's placed in
	   (full /live page or the small preview), not the viewport. */
	.live-hud-container {
		position: absolute; inset: 0; container-type: size; pointer-events: none;
	}
	.live-hud {
		position: absolute; top: 0; left: 0; right: 0;
		display: flex; align-items: flex-start; justify-content: space-between;
		padding: 2.2cqmin 3cqmin; gap: 2cqmin;
		font-family: 'Rajdhani', system-ui, sans-serif;
	}
	.hud-side { display: flex; flex-direction: column; gap: 0.6cqmin; min-width: 26cqmin; }
	.hud-side--right { align-items: flex-end; }
	.hud-name {
		font-size: 2.4cqmin; font-weight: 800; letter-spacing: 0.02em;
		text-shadow: 0 0 0.9cqmin rgba(0,0,0,0.6), 0 0.3cqmin 0.6cqmin rgba(0,0,0,0.45);
		max-width: 32cqmin; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.hud-stat { display: flex; align-items: center; gap: 1.2cqmin; }
	.hud-percent {
		font-size: 3.6cqmin; font-weight: 800; color: #fff; line-height: 1;
		text-shadow: 0 0 0.9cqmin rgba(0,0,0,0.6), 0 0.3cqmin 0.6cqmin rgba(0,0,0,0.45);
		display: inline-block; transform-origin: center; animation: pct-pop 0.32s ease-out;
	}
	.hud-pct-sign { font-size: 2cqmin; opacity: 0.7; }
	.hud-stocks { display: flex; gap: 0.6cqmin; }
	.stock-dot { width: 1.4cqmin; height: 1.4cqmin; border-radius: 50%; background: rgba(255,255,255,0.15); box-shadow: 0 0 0 0.2cqmin rgba(0,0,0,0.4) inset; }
	.stock-dot--on { background: var(--c); box-shadow: 0 0 1.2cqmin var(--c); }
	.hud-center { display: flex; flex-direction: column; align-items: center; gap: 0.3cqmin; }
	.hud-timer {
		font-size: 4cqmin; font-weight: 800; color: #fff; line-height: 1; font-variant-numeric: tabular-nums;
		text-shadow: 0 0 0.9cqmin rgba(0,0,0,0.6), 0 0.3cqmin 0.6cqmin rgba(0,0,0,0.45);
	}
	.hud-score {
		font-size: 2.6cqmin; font-weight: 700; opacity: 0.95; color: #fff;
		font-variant-numeric: tabular-nums; letter-spacing: 0.08em;
		text-shadow: 0 0 0.8cqmin rgba(0,0,0,0.6);
	}

	/* Quick pop + shake when the percent changes (re-mounted via {#key}). */
	@keyframes pct-pop {
		0% { transform: scale(1); }
		25% { transform: scale(1.28) translateX(-0.5cqmin); }
		50% { transform: scale(1.16) translateX(0.5cqmin); }
		75% { transform: scale(1.08) translateX(-0.3cqmin); }
		100% { transform: scale(1); }
	}
</style>
