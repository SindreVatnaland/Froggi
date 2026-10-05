<script lang="ts">
	// Minimal live game for the strike phone while a game is played: stocks, percent and timer for
	// both set players (Player 1 = Froggi's Player 1 = lower port). Shows nothing between games.
	import { currentPlayers, gameFrame, gameSettings, gameState } from '$lib/utils/store.svelte';
	import { InGameState } from '$lib/models/enum';
	import { findSettingsPlayer } from '$lib/utils/gamePredicates';

	export let p1Name: string;
	export let p2Name: string;

	$: live = $gameState === InGameState.Running || $gameState === InGameState.Paused;

	const side = (slot: number, frame: typeof $gameFrame, settings: typeof $gameSettings, players: typeof $currentPlayers) => {
		const port = players?.[slot]?.playerIndex ?? slot;
		const settingsPlayer = findSettingsPlayer(settings?.players, port);
		const post = frame?.players?.[port]?.post;
		return {
			stocks: post?.stocksRemaining ?? settingsPlayer?.startStocks ?? 0,
			percent: Math.floor(post?.percent ?? 0),
			icon: settingsPlayer ? `/image/characters/${settingsPlayer.characterId}/${settingsPlayer.characterColor ?? 0}/stock.png` : '',
		};
	};
	$: p1 = side(0, $gameFrame, $gameSettings, $currentPlayers);
	$: p2 = side(1, $gameFrame, $gameSettings, $currentPlayers);

	// Timer counts down from the match length; frames before 0 are the intro.
	$: seconds = Math.max(0, Math.ceil(($gameSettings?.startingTimerSeconds ?? 480) - Math.max(0, $gameFrame?.frame ?? 0) / 60));
	$: timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
</script>

{#if live}
	<div class="live">
		<span class="timer">{timer}{$gameState === InGameState.Paused ? ' · paused' : ''}</span>
		<div class="players">
			{#each [{ name: p1Name, ...p1 }, { name: p2Name, ...p2 }] as p}
				<div class="player">
					<span class="name">{p.name}</span>
					<span class="percent">{p.percent}%</span>
					<div class="stocks">
						{#each Array(Math.max(0, p.stocks)) as _}
							{#if p.icon}<img src={p.icon} alt="" />{:else}<span class="dot" />{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.live {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		margin-top: 1rem;
		padding: 0.8rem;
		border-radius: 0.6rem;
		background: rgba(255, 255, 255, 0.05);
	}
	.timer {
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		opacity: 0.7;
	}
	.players {
		display: flex;
		width: 100%;
		justify-content: space-around;
	}
	.player {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	.name {
		font-size: 0.75rem;
		opacity: 0.6;
	}
	.percent {
		font-size: 2rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.stocks {
		display: flex;
		gap: 0.2rem;
		min-height: 1.1rem;
	}
	.stocks img {
		width: 1.1rem;
		height: 1.1rem;
	}
	.dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: currentColor;
	}
</style>
