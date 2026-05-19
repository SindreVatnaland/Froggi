<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { GameStats, Player } from '$lib/models/types/slippiData';
	import { currentPlayers, electronEmitter, recentGames } from '$lib/utils/store.svelte';
	import AddGameModal from './AddGameModal.svelte';
	import GameStage from './GameStage.svelte';
	import { STAGE_DATA } from '$lib/models/constants/stageData';
	import { flip } from 'svelte/animate';

	export let open: boolean;
	let addGameModalOpen = false;
	let deleteGameModalOpen = false;
	let selectedGameIndex = 0;

	let games: GameStats[] = $recentGames;
	const updateGames = (g: GameStats[]) => { games = g; };
	$: updateGames($recentGames);

	$: p1Idx = $currentPlayers?.at(0)?.playerIndex ?? 0;
	$: p2Idx = $currentPlayers?.at(1)?.playerIndex ?? 1;

	const getName = (idx: number) => {
		const name = $currentPlayers?.at(idx === p1Idx ? 0 : 1)?.displayName;
		return name?.length ? name : `Player ${idx + 1}`;
	};

	const addGame = (i: number) => { selectedGameIndex = i; addGameModalOpen = true; };
	const deleteGame = (i: number) => { selectedGameIndex = i; deleteGameModalOpen = true; };
	const handleDelete = () => $electronEmitter.emit('RecentGamesDelete', selectedGameIndex);
	const moveUp = (i: number) => $electronEmitter.emit('RecentGamesReorder', i, i - 1);
	const moveDown = (i: number) => $electronEmitter.emit('RecentGamesReorder', i, i + 1);
</script>

<Modal bind:open on:close={() => (open = false)} class="w-[95vw] max-w-[480px] max-h-[80vh]">
	<div class="modal-box background-primary-color border-secondary">
		<div class="modal-header">
			<p class="modal-title text-secondary-color">Games</p>
			<div class="header-names text-secondary-color">
				<span>{getName(p1Idx)}</span>
				<span class="vs-sep">vs</span>
				<span>{getName(p2Idx)}</span>
			</div>
		</div>

		<div class="game-list">
			{#each games as game, i (game.timestamp?.toString() ?? i)}
				{@const p1c = game.settings?.players?.[p1Idx]?.characterId ?? 0}
				{@const p1col = game.settings?.players?.[p1Idx]?.characterColor ?? 0}
				{@const p2c = game.settings?.players?.[p2Idx]?.characterId ?? 0}
				{@const p2col = game.settings?.players?.[p2Idx]?.characterColor ?? 0}
				{@const p1stocks = game.lastFrame?.players?.[p1Idx]?.post.stocksRemaining ?? 0}
				{@const p2stocks = game.lastFrame?.players?.[p2Idx]?.post.stocksRemaining ?? 0}
				{@const stageName = STAGE_DATA[game.settings?.stageId ?? -1]?.name ?? '—'}
				<div class="game-row border-secondary" class:game-mock={game.isMock} animate:flip={{ duration: 220 }}>
					<span class="game-num text-secondary-color">G{i + 1}{game.isMock ? '*' : ''}</span>

					<div class="char-stocks">
						{#each [3, 2, 1, 0] as s}
							<img
								class="stock-icon" class:stock-dead={p1stocks <= s}
								src="/image/characters/{p1c}/{p1col}/stock.png" alt=""
							/>
						{/each}
					</div>

					<div class="stage-thumb">
						<GameStage stageId={game.settings?.stageId} class="stage-img" objectFit="cover" />
						<span class="stage-name">{stageName}</span>
					</div>

					<div class="char-stocks char-stocks--right">
						{#each [0, 1, 2, 3] as s}
							<img
								class="stock-icon" class:stock-dead={p2stocks <= s}
								src="/image/characters/{p2c}/{p2col}/stock.png" alt=""
							/>
						{/each}
					</div>

					<div class="row-actions">
						<button class="action-btn" disabled={i === 0} on:click={() => moveUp(i)} title="Move up">↑</button>
						<button class="action-btn" disabled={i === games.length - 1} on:click={() => moveDown(i)} title="Move down">↓</button>
						<button class="action-btn action-btn--del" on:click={() => deleteGame(i)} title="Delete">✕</button>
					</div>
				</div>
			{:else}
				<p class="empty-hint text-secondary-color">No games yet.</p>
			{/each}
		</div>

		<div class="modal-footer">
			<button class="btn text-xs h-8 px-4 border-secondary rounded" on:click={() => addGame(games.length)}>
				+ Add game
			</button>
		</div>
	</div>

	<ConfirmModal bind:open={deleteGameModalOpen} on:confirm={handleDelete}>Delete game?</ConfirmModal>
	<AddGameModal bind:open={addGameModalOpen} bind:selectedGameIndex />
</Modal>

<style>
	.modal-box {
		padding: 1.25rem;
		border-radius: 0.35rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 78vh;
	}

	.modal-header {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.modal-title {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.4;
	}

	.header-names {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		justify-content: space-between;
	}

	.vs-sep {
		font-size: 0.65rem;
		opacity: 0.3;
	}

	.game-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		overflow-y: auto;
	}

	.game-row {
		display: grid;
		grid-template-columns: 2rem 1fr auto 1fr 5rem;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.6rem;
		border-radius: 0.25rem;
	}

	.game-mock { opacity: 0.65; }

	.game-num {
		font-size: 0.65rem;
		font-weight: 700;
		opacity: 0.4;
		white-space: nowrap;
	}

	.char-stocks {
		display: flex;
		gap: 2px;
		align-items: center;
	}

	.char-stocks--right {
		justify-content: flex-end;
	}

	.stock-icon {
		width: 1rem;
		height: 1rem;
		object-fit: contain;
	}

	.stock-dead { opacity: 0.12; }

	.stage-thumb {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}

	.stage-thumb :global(.stage-img) {
		width: 56px;
		height: auto;
		border-radius: 0.2rem;
	}

	.stage-name {
		font-size: 0.55rem;
		opacity: 0.35;
		color: var(--secondary-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 64px;
	}

	.row-actions {
		display: flex;
		gap: 0.2rem;
		justify-content: flex-end;
	}

	.action-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 0.75rem;
		padding: 0.2rem 0.35rem;
		border-radius: 0.2rem;
		opacity: 0.5;
		color: var(--secondary-color);
		transition: opacity 0.1s;
	}

	.action-btn:hover:not(:disabled) { opacity: 1; }
	.action-btn:disabled { opacity: 0.15; cursor: default; }

	.action-btn--del:hover:not(:disabled) {
		opacity: 1;
		color: rgb(239, 68, 68);
	}

	.empty-hint {
		font-size: 0.75rem;
		opacity: 0.3;
		text-align: center;
		padding: 1rem 0;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
