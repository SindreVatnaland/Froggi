<script lang="ts">
	/**
	 * HUD for the live view: Melee's layout (players along the bottom by port, timer + set score on top).
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
	/** Off for a lighter HUD (highlight replays): no set score, no names — players, percent, stocks, timer. */
	export let showScore = true;
	export let showNames = true;

	// Melee's layout, centred (like the centred-HUD gecko code): players along the bottom in PORT order,
	// grouped around the middle; stock icons over a big percent; port colours (team colours in doubles).
	const PORT_COLOR = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'];
	const TEAM_COLOR = ['#ef4444', '#3b82f6', '#22c55e'];
	$: players = (settings?.players ?? [])
		.filter((p): p is { playerIndex: number; characterId?: number | null; teamId?: number | null } => p?.playerIndex != null)
		.map((p) => ({
			...p,
			port: p.playerIndex + 1,
			name: p.playerIndex === p1Index ? p1Name : p.playerIndex === p2Index ? p2Name : `P${p.playerIndex + 1}`,
			color: settings?.isTeams && p.teamId != null ? TEAM_COLOR[p.teamId] ?? '#fff' : PORT_COLOR[p.playerIndex] ?? '#fff',
			post: frame?.players?.[p.playerIndex]?.post,
		}))
		.sort((a, b) => a.playerIndex - b.playerIndex);

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
	/** The last 5 seconds of a timed game: 5 … 1, big in the middle. */
	$: countdown = settings?.startingTimerSeconds && clock > 0 && clock <= 5 ? Math.ceil(clock) : null;
</script>

<div class="live-hud-container">
	<div class="hud-top">
		<div class="hud-timer">{clockText}</div>
		{#if showScore}<div class="hud-score">{score?.[0] ?? 0} – {score?.[1] ?? 0}</div>{/if}
	</div>
	{#if countdown}
		{#key countdown}<div class="hud-countdown">{countdown}</div>{/key}
	{/if}
	<div class="hud-bottom">
		{#each players as p, i (p.playerIndex)}
			<div class="hud-player" style="left: {50 + (i - (players.length - 1) / 2) * 22}%; --c: {p.color}">
				<span class="hud-stocks">
					{#each Array(4) as _, i}
						{#if p.characterId != null}
							<img class="stock-icon" class:stock-icon--lost={i >= stocks(p.post)} src="/image/characters/{p.characterId}/0/stock.png" alt="" />
						{:else}
							<span class="stock-dot" class:stock-dot--on={i < stocks(p.post)} />
						{/if}
					{/each}
				</span>
				{#key pct(p.post)}<span class="hud-percent">{pct(p.post)}<span class="hud-pct-sign">%</span></span>{/key}
				{#if showNames}<span class="hud-name">{p.name}</span>{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	/* Container-query box so the HUD scales to the live window it's placed in
	   (full /live page or the small preview), not the viewport. */
	.live-hud-container {
		position: absolute; inset: 0; container-type: size; pointer-events: none;
		/* An overlay element's text outline (-webkit-text-stroke) is inherited — on fonts whose glyphs overlap
		   inside (6, 9 …) it draws lines through the numbers. The HUD has its own shadows instead. */
		-webkit-text-stroke: 0;
	}
	.hud-top {
		position: absolute; top: 2cqmin; left: 0; right: 0;
		display: flex; flex-direction: column; align-items: center; gap: 0.3cqmin;
		font-family: 'Rajdhani', system-ui, sans-serif;
	}
	/* Players stay within a 73:60 (the game's) width in the middle — a wide box doesn't scatter them. */
	.hud-bottom {
		position: absolute; left: 50%; transform: translateX(-50%); width: min(100cqw, calc(100cqh * 73 / 60));
		bottom: 2.5cqmin; height: 15cqmin; font-family: 'Rajdhani', system-ui, sans-serif;
	}
	.hud-player {
		position: absolute; bottom: 0; transform: translateX(-50%);
		display: flex; flex-direction: column; align-items: center; gap: 0.4cqmin;
	}
	.hud-name {
		font-size: 2cqmin; font-weight: 800; color: var(--c); letter-spacing: 0.02em;
		text-shadow: 0 0 0.9cqmin rgba(0,0,0,0.6), 0 0.3cqmin 0.6cqmin rgba(0,0,0,0.45);
		max-width: 22cqmin; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.hud-percent {
		font-size: 6cqmin; font-weight: 800; color: #fff; line-height: 1;
		text-shadow: 0 0 0.6cqmin var(--c), 0 0.3cqmin 0.8cqmin rgba(0,0,0,0.6);
		display: inline-block; transform-origin: center; animation: pct-pop 0.32s ease-out;
	}
	.hud-pct-sign { font-size: 3cqmin; opacity: 0.75; }
	.hud-stocks { display: flex; gap: 0.5cqmin; }
	.stock-icon { width: 2.6cqmin; height: 2.6cqmin; object-fit: contain; }
	.stock-icon--lost { opacity: 0.2; filter: grayscale(1); }
	.stock-dot { width: 1.4cqmin; height: 1.4cqmin; border-radius: 50%; background: rgba(255,255,255,0.15); }
	.stock-dot--on { background: var(--c); box-shadow: 0 0 1.2cqmin var(--c); }
	.hud-timer {
		font-size: 4cqmin; font-weight: 800; color: #fff; line-height: 1; font-variant-numeric: tabular-nums;
		text-shadow: 0 0 0.9cqmin rgba(0,0,0,0.6), 0 0.3cqmin 0.6cqmin rgba(0,0,0,0.45);
	}
	.hud-score {
		font-size: 2.6cqmin; font-weight: 700; opacity: 0.95; color: #fff;
		font-variant-numeric: tabular-nums; letter-spacing: 0.08em;
		text-shadow: 0 0 0.8cqmin rgba(0,0,0,0.6);
	}

	.hud-countdown {
		position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%);
		font-family: 'Rajdhani', system-ui, sans-serif; font-size: 18cqmin; font-weight: 800; color: #fff; line-height: 1;
		text-shadow: 0 0 2cqmin rgba(0,0,0,0.6), 0 0.6cqmin 1.2cqmin rgba(0,0,0,0.5);
		animation: countdown-pop 1s ease-out forwards;
	}
	@keyframes countdown-pop {
		0% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
		15% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
		80% { opacity: 1; }
		100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
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
