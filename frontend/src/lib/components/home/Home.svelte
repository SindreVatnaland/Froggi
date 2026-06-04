<script lang="ts">
	import { currentPlayer, recentGames, sessionStats, dolphinState, obsConnection, electronEmitter } from '$lib/utils/store.svelte';
	import { ConnectionState } from '$lib/models/enum';
	import { goto } from '$app/navigation';
	import { characterNameByExternalId, stageNameByExternalId } from '$lib/models/constants/ids';
	import { Settings, Gamepad2, BookOpen, Monitor, Webhook } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';

	// ── Player / rank ─────────────────────────────────────────────────────────
	$: player = $currentPlayer?.rank?.current;
	$: connected = $dolphinState === ConnectionState.Connected;
	// Rank icon files have spaces: "SILVER 1.svg"
	$: rankIcon = player?.rank?.toUpperCase() ?? 'UNRANKED';

	// ── Session delta ─────────────────────────────────────────────────────────
	$: sessionStart = $sessionStats?.startRankStats;
	$: sessionCurrent = $sessionStats?.currentRankStats;
	$: ratingDelta = sessionCurrent && sessionStart
		? +(sessionCurrent.rating - sessionStart.rating).toFixed(1) : null;
	$: sessionWins   = sessionCurrent && sessionStart ? sessionCurrent.wins   - sessionStart.wins   : null;
	$: sessionLosses = sessionCurrent && sessionStart ? sessionCurrent.losses - sessionStart.losses : null;

	// ── Rank history sparkline ────────────────────────────────────────────────
	$: sparkPoints = (() => {
		const seasons = player?.seasons ?? [];
		const pts = seasons.map(s => s.ratingOrdinal).filter(r => r > 0);
		// Only include current season rating if the player has actually played games —
		// a brand-new season starts at placement (e.g. 1100) regardless of skill and
		// would make the graph look like a downtrend when it's just a reset.
		const hasCurrentGames = (player?.wins ?? 0) + (player?.losses ?? 0) > 0;
		if (hasCurrentGames && player?.rating) pts.push(player.rating);
		return pts;
	})();

	function buildSparkPath(pts: number[]): string {
		if (pts.length < 2) return '';
		const W = 80, H = 28, pad = 2;
		const min = Math.min(...pts), max = Math.max(...pts);
		const range = max - min || 1;
		const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
		const y = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
		return pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
	}
	$: sparkPath = buildSparkPath(sparkPoints);
	$: sparkTrend = sparkPoints.length >= 2
		? sparkPoints[sparkPoints.length - 1] - sparkPoints[sparkPoints.length - 2]
		: 0;

	// ── Recent games ──────────────────────────────────────────────────────────
	$: games = ($recentGames ?? []).slice(0, 15);

	function gameResult(game: typeof games[0]): 'win' | 'loss' | 'unknown' {
		const myIdx = $currentPlayer?.playerIndex ?? null;
		if (myIdx == null || !game.score?.length) return 'unknown';
		return game.score[myIdx] > game.score[1 - myIdx] ? 'win' : 'loss';
	}
	function opponentOf(game: typeof games[0]) {
		const myIdx = $currentPlayer?.playerIndex ?? null;
		const players = game.settings?.players ?? [];
		return (myIdx != null ? players.find(p => p.playerIndex !== myIdx) : players[1]) ?? null;
	}
	function myCharOf(game: typeof games[0]) {
		const myIdx = $currentPlayer?.playerIndex ?? null;
		const players = game.settings?.players ?? [];
		return (myIdx != null ? players.find(p => p.playerIndex === myIdx) : players[0])?.characterId ?? null;
	}
	function oppCharOf(game: typeof games[0]) {
		const myIdx = $currentPlayer?.playerIndex ?? null;
		const players = game.settings?.players ?? [];
		return (myIdx != null ? players.find(p => p.playerIndex !== myIdx) : players[1])?.characterId ?? null;
	}
	const MODE_LABEL: Record<string, string> = {
		ranked: 'Ranked', unranked: 'Unranked', direct: 'Direct', local: 'Local',
	};
	const MODE_CLASS: Record<string, string> = {
		ranked: 'mode-ranked', unranked: 'mode-unranked', direct: 'mode-direct', local: 'mode-local',
	};
	function stageName(id: number | null | undefined): string {
		if (id == null) return '—';
		return stageNameByExternalId[id] ?? `Stage ${id}`;
	}
	function charName(id: number | null | undefined): string {
		if (id == null) return '?';
		return characterNameByExternalId[id] ?? `Char ${id}`;
	}
	function timeAgo(ts: Date | null): string {
		if (!ts) return '';
		const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h`;
		return `${Math.floor(h / 24)}d`;
	}

	// ── Quick nav ─────────────────────────────────────────────────────────────
	const nav = [
		{ label: 'Minigames',  icon: Gamepad2, path: '/minigames',     desc: 'Bingo & Iron Man' },
		{ label: 'OBS',        icon: Monitor,  path: '/obs/dashboard', desc: 'Overlays & scenes' },
		{ label: 'Tutorials',  icon: BookOpen, path: '/obs/tutorial',  desc: 'Guides & setup'   },
		{ label: 'Webhooks',   icon: Webhook,  path: '/obs/webhook',   desc: 'HTTP events'      },
		{ label: 'Settings',   icon: Settings, path: '/settings',      desc: 'Configure Froggi' },
	];
</script>

<div class="home text-secondary-color">

	<!-- ── Player header ── -->
	{#if connected && player}
		<header class="player-header" in:fly={{ y: -24, duration: 350, delay: 50 }}>
			<img class="rank-icon" src="/image/rank-icons/{rankIcon}.svg" alt={rankIcon} />

			<div class="player-info">
				<span class="player-name">{player.displayName ?? '—'}</span>
				<span class="player-code">{player.connectCode ?? ''}</span>
			</div>

			<div class="player-chips">
				<div class="chip">
					<span class="chip-val">{player.rating?.toFixed(0) ?? '—'}</span>
					<span class="chip-lbl">ELO</span>
				</div>
				<div class="chip">
					<span class="chip-val">{player.rank ?? '—'}</span>
					<span class="chip-lbl">Rank</span>
				</div>
				<div class="chip">
					<span class="chip-val">{player.wins ?? 0}W {player.losses ?? 0}L</span>
					<span class="chip-lbl">All time</span>
				</div>
				{#if ratingDelta !== null}
					<div class="chip" class:chip-green={ratingDelta > 0} class:chip-red={ratingDelta < 0}>
						<span class="chip-val">{ratingDelta > 0 ? '+' : ''}{ratingDelta}</span>
						<span class="chip-lbl">Session ±</span>
					</div>
				{/if}
				{#if sessionWins !== null}
					<div class="chip">
						<span class="chip-val">{sessionWins}W {sessionLosses}L</span>
						<span class="chip-lbl">Session</span>
					</div>
				{/if}

				{#if sparkPath}
					<div class="spark-wrap" title="Rating history across seasons">
						<svg class="sparkline" viewBox="0 0 80 28" preserveAspectRatio="none">
							<path d={sparkPath} class="spark-line" class:spark-up={sparkTrend >= 0} class:spark-down={sparkTrend < 0} />
						</svg>
						<span class="chip-lbl">History</span>
					</div>
				{/if}
			</div>
		</header>
	{:else if connected}
		<header class="player-header" in:fade={{ duration: 300 }}>
			<span class="waiting-dot dot-connected"></span>
			<span class="text-sm opacity-40">Loading player data…</span>
		</header>
	{:else}
		<header class="player-header" in:fade={{ duration: 300 }}>
			<span class="waiting-dot"></span>
			<span class="text-sm opacity-40">Waiting for Dolphin…</span>
		</header>
	{/if}

	<!-- ── Body ── -->
	<div class="body">

		<!-- Activity feed -->
		<section class="feed-section" in:fly={{ x: -20, duration: 300, delay: 120 }}>
			<p class="section-label">Recent games</p>

			{#if games.length === 0}
				<div class="empty-feed">
					<span class="empty-icon">🎮</span>
					<span class="empty-text">Games this session appear here</span>
				</div>
			{:else}
				<div class="feed">
					{#each games as game, i}
						{@const result  = gameResult(game)}
						{@const opp     = opponentOf(game)}
						{@const myChar  = myCharOf(game)}
						{@const oppChar = oppCharOf(game)}
						{@const mode    = game.settings?.matchInfo?.mode ?? null}
						<div class="feed-row"
							class:feed-win={result === 'win'}
							class:feed-loss={result === 'loss'}
							in:fly={{ x: -12, duration: 220, delay: 140 + i * 25 }}
						>
							<span class="result-badge badge-{result}">
								{result === 'win' ? 'W' : result === 'loss' ? 'L' : '?'}
							</span>

							<!-- Matchup icons -->
							<div class="matchup">
								{#if myChar != null}
									<img class="char-icon" src="/image/characters/css/{myChar}.png"
										alt={charName(myChar)} title={charName(myChar)} />
								{/if}
								{#if oppChar != null}
									<span class="vs-sep">vs</span>
									<img class="char-icon char-icon--opp" src="/image/characters/css/{oppChar}.png"
										alt={charName(oppChar)} title={charName(oppChar)} />
								{/if}
							</div>

							<!-- Opponent + stage -->
							<div class="feed-main">
								<span class="feed-opp">{opp?.displayName ?? opp?.connectCode ?? 'Unknown'}</span>
								<span class="feed-sub">{stageName(game.settings?.stageId)}</span>
							</div>

							<!-- Mode badge -->
							{#if mode}
								<span class="mode-badge {MODE_CLASS[mode] ?? ''}">{MODE_LABEL[mode] ?? mode}</span>
							{/if}

							<!-- Score + time -->
							<div class="feed-right">
								{#if game.score?.length}
									<span class="feed-score">{game.score[0]}–{game.score[1]}</span>
								{/if}
								<span class="feed-time">{timeAgo(game.timestamp)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Quick nav -->
		<aside class="nav-aside" in:fly={{ x: 20, duration: 300, delay: 150 }}>
			<p class="section-label">Navigate</p>
			<div class="nav-grid">
				{#each nav as item, i}
					<button class="nav-card border-secondary"
						on:click={() => goto(item.path)}
						in:fly={{ y: 10, duration: 200, delay: 160 + i * 30 }}
					>
						<svelte:component this={item.icon} size={18} strokeWidth={1.5} />
						<div>
							<div class="nav-label">{item.label}</div>
							<div class="nav-desc">{item.desc}</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- OBS status -->
			<button class="obs-status border-secondary mt-3" on:click={() => goto('/obs')}
				in:fade={{ duration: 200, delay: 350 }}>
				<span class="obs-dot"
					class:obs-ok={$obsConnection?.state === ConnectionState.Connected}
				></span>
				<span class="obs-lbl">OBS</span>
				<span class="obs-state">
					{$obsConnection?.state === ConnectionState.Connected ? 'Connected' : 'Not set up'}
				</span>
				<span class="obs-arrow">→</span>
			</button>
		</aside>
	</div>
</div>

<style>
	.home {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	/* ── Header ── */
	.player-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 1.25rem;
		border-bottom: 1px solid var(--secondary-color);
		opacity: 0.9;
		flex-shrink: 0;
		flex-wrap: wrap;
	}
	.rank-icon { width: 2rem; height: 2rem; object-fit: contain; flex-shrink: 0; }
	.player-info { display: flex; flex-direction: column; gap: 0.05rem; }
	.player-name { font-size: 0.9rem; font-weight: 700; }
	.player-code { font-size: 0.68rem; opacity: 0.4; }
	.player-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; margin-left: auto; }

	.chip {
		display: flex; flex-direction: column; align-items: center;
		padding: 0.15rem 0.5rem;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 0.3rem; gap: 0.02rem;
	}
	.chip-val { font-size: 0.8rem; font-weight: 600; font-variant-numeric: tabular-nums; }
	.chip-lbl { font-size: 0.58rem; opacity: 0.35; text-transform: uppercase; letter-spacing: 0.04em; }
	.chip-green .chip-val { color: #4ade80; }
	.chip-red   .chip-val { color: #f87171; }

	.spark-wrap {
		display: flex; flex-direction: column; align-items: center; gap: 0.05rem;
		padding: 0.15rem 0.3rem;
	}
	.sparkline { width: 80px; height: 28px; overflow: visible; }
	.spark-line {
		fill: none; stroke-width: 1.8px; stroke-linecap: round; stroke-linejoin: round;
		stroke-dasharray: 200; stroke-dashoffset: 200;
		animation: spark-draw 0.6s ease-out 0.4s forwards;
	}
	.spark-up   { stroke: #4ade80; }
	.spark-down { stroke: #f87171; }
	@keyframes spark-draw { to { stroke-dashoffset: 0; } }

	.waiting-dot {
		width: 7px; height: 7px; border-radius: 50%;
		background: rgba(255,255,255,0.2); flex-shrink: 0;
	}
	.dot-connected { background: #4ade80; box-shadow: 0 0 6px #4ade80; }

	/* ── Body ── */
	.body {
		display: grid;
		grid-template-columns: 1fr 220px;
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}
	.section-label {
		font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.08em;
		opacity: 0.3; font-weight: 600; margin-bottom: 0.5rem;
	}

	/* ── Feed ── */
	.feed-section {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		border-right: 1px solid var(--secondary-color);
	}
	.empty-feed {
		display: flex; flex-direction: column; align-items: center;
		justify-content: center; padding: 2.5rem 1rem; gap: 0.4rem; opacity: 0.35;
	}
	.empty-icon { font-size: 1.8rem; }
	.empty-text { font-size: 0.78rem; text-align: center; }

	.feed { display: flex; flex-direction: column; gap: 0.2rem; }
	.feed-row {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.35rem 0.55rem; border-radius: 0.3rem;
		background: rgba(255,255,255,0.02);
		transition: background 0.1s;
	}
	.feed-row:hover { background: rgba(255,255,255,0.05); }
	.feed-win  { border-left: 2px solid rgba(74, 222, 128, 0.4); }
	.feed-loss { border-left: 2px solid rgba(248, 113, 113, 0.3); }

	.result-badge {
		font-size: 0.62rem; font-weight: 800;
		width: 1.2rem; height: 1.2rem; border-radius: 0.2rem;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	}
	.badge-win   { color: #4ade80; background: rgba(74,222,128,0.12); }
	.badge-loss  { color: #f87171; background: rgba(248,113,113,0.12); }
	.badge-unknown { opacity: 0.3; background: rgba(255,255,255,0.06); }

	.matchup {
		display: flex; align-items: center; gap: 0.2rem; flex-shrink: 0;
	}
	.char-icon {
		width: 1.35rem; height: 1.35rem; object-fit: contain;
		image-rendering: pixelated; flex-shrink: 0; opacity: 0.85;
	}
	.char-icon--opp { opacity: 0.55; }
	.vs-sep { font-size: 0.55rem; opacity: 0.25; flex-shrink: 0; }

	.feed-main { display: flex; flex-direction: column; gap: 0; min-width: 0; flex: 1; }
	.feed-opp  { font-size: 0.78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.feed-sub  { font-size: 0.65rem; opacity: 0.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.mode-badge {
		font-size: 0.58rem; font-weight: 600; letter-spacing: 0.04em;
		padding: 0.1rem 0.4rem; border-radius: 0.25rem;
		text-transform: uppercase; flex-shrink: 0; opacity: 0.6;
		border: 1px solid currentColor;
	}
	.mode-ranked   { color: #facc15; }
	.mode-unranked { color: rgba(255,255,255,0.4); }
	.mode-direct   { color: #60a5fa; }
	.mode-local    { color: rgba(255,255,255,0.3); }

	.feed-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0; flex-shrink: 0; }
	.feed-score { font-size: 0.72rem; font-weight: 600; font-variant-numeric: tabular-nums; }
	.feed-time  { font-size: 0.62rem; opacity: 0.3; }

	/* ── Nav aside ── */
	.nav-aside {
		padding: 1rem 1rem;
		display: flex; flex-direction: column;
		overflow-y: auto;
	}
	.nav-grid { display: flex; flex-direction: column; gap: 0.35rem; }
	.nav-card {
		display: flex; align-items: center; gap: 0.65rem;
		padding: 0.6rem 0.75rem; border-radius: 0.4rem;
		cursor: pointer; background: rgba(255,255,255,0.02);
		color: var(--secondary-color); text-align: left;
		transition: background 0.1s, transform 0.1s;
	}
	.nav-card:hover { background: color-mix(in srgb, var(--secondary-color) 8%, transparent); transform: translateX(2px); }
	.nav-label { font-size: 0.8rem; font-weight: 600; }
	.nav-desc  { font-size: 0.65rem; opacity: 0.38; }

	.obs-status {
		display: flex; align-items: center; gap: 0.45rem;
		padding: 0.4rem 0.65rem; border-radius: 0.35rem;
	}
	.obs-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,0.2); }
	.obs-ok  { background: #4ade80; box-shadow: 0 0 5px #4ade80; }
	.obs-lbl   { font-size: 0.72rem; font-weight: 600; }
	.obs-state { font-size: 0.68rem; opacity: 0.4; flex: 1; }
	.obs-arrow { font-size: 0.72rem; opacity: 0.25; margin-left: auto; }
</style>
