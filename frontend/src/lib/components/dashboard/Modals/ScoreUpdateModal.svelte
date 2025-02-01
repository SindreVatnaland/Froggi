<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { GameStats, Player } from '$lib/models/types/slippiData';
	import { currentPlayers, electronEmitter, recentGames } from '$lib/utils/store.svelte';
	import AddGameModal from './AddGameModal.svelte';
	import CharacterIcon from './CharacterIcon.svelte';
	import GameStage from './GameStage.svelte';

	export let open: boolean;
	let addGameModalOpen = false;
	let deleteGameModalOpen = false;
	let selectedGameIndex = 0;

	let games: GameStats[] = $recentGames;
	const updateGames = (recentGames: GameStats[]) => {
		games = recentGames;
	};
	$: updateGames($recentGames);

	const getDisplayName = (players: Player[], playerIndex: number) => {
		const displayName = players.at(playerIndex)?.displayName;
		return displayName?.length ? displayName : `Player${playerIndex + 1}`;
	};

	const addGame = (gameIndex: number) => {
		selectedGameIndex = gameIndex;
		addGameModalOpen = true;
	};

	const deleteGame = (gameIndex: number) => {
		selectedGameIndex = gameIndex;
		deleteGameModalOpen = true;
	};

	const handleDelete = () => {
		$electronEmitter.emit('RecentGamesDelete', selectedGameIndex);
	};
</script>

<Modal
	bind:open
	on:close={() => (open = false)}
	class="w-[95vw] max-w-[600px] max-h-[80vh] min-w-72 flex justify-center"
>
	<div
		class="w-full max-h-[80vh] min-w-lg flex flex-col justify-between gap-8 bg-cover bg-center border-secondary background-primary-color p-8"
	>
		<div class="flex gap-4 justify-center items-center">
			<h1 class="color-secondary text-3xl font-semibold">Games</h1>
		</div>
		<div class="flex justify-between gap-4">
			<h1 class="color-secondary text-2xl font-semibold">
				{getDisplayName($currentPlayers, 0)}
			</h1>
			<h1 class="color-secondary text-2xl font-semibold">
				{getDisplayName($currentPlayers, 1)}
			</h1>
		</div>
		<div
			class="flex-l flex flex-col items-center overflow-y-auto gap-4 border border-gray-700 rounded-md p-2"
		>
			<button
				class="transition duration-100 rounded-md w-full justify-center background-color-primary border-secondary bg-opacity-40 hover:bg-opacity-60"
				on:click={async () => {
					addGame(0);
				}}
			>
				<h1 class="text-secondary-color text-shadow-md">+</h1>
			</button>
			{#each games.map((game) => game) as game, i}
				<h1 class="color-secondary text-center text-xl font-semibold">
					Game {i + 1}
					<span class={`${game?.isMock ? 'text-danger-color' : 'text-secondary-color'}`}>
						{game?.isMock ? '*' : ''}
					</span>
				</h1>

				<div class="flex justify-center items-center gap-2 w-full">
					<h1 class="color-secondary text-center text-2xl font-semibold">
						{game?.score.at(0) ?? 0} - {game?.score.at(1) ?? 0}
					</h1>
				</div>
				<div class="flex justify-center items-center gap-2">
					{#each [...Array(4).keys()].reverse() as stock}
						<div
							class={`${
								(game?.lastFrame?.players?.[$currentPlayers.at(0)?.playerIndex ?? 0]
									?.post.stocksRemaining ?? 0) > stock
									? 'opacity-100'
									: 'opacity-50'
							} h-8`}
						>
							<CharacterIcon
								characterId={game?.settings?.players?.[
									$currentPlayers.at(0)?.playerIndex ?? 0
								]?.characterId ?? 0}
							/>
						</div>
					{/each}

					<div class="relative aspect-video h-16">
						<img
							src="/image/button-icons/cross.png"
							alt="delete"
							class="cover absolute aspect-video"
						/>
						<button
							class="transition duration-300 hover:opacity-25 absolute"
							on:click={() => deleteGame(i)}
						>
							<GameStage
								stageId={game?.settings?.stageId}
								class="aspect-video rounded-md"
								objectFit="cover"
							/>
						</button>
					</div>
					{#each [...Array(4).keys()] as stock}
						<div
							class={`${
								(game?.lastFrame?.players?.[$currentPlayers.at(1)?.playerIndex ?? 0]
									?.post.stocksRemaining ?? 0) > stock
									? 'opacity-100'
									: 'opacity-50'
							} h-8`}
						>
							<CharacterIcon
								characterId={game?.settings?.players?.[
									$currentPlayers.at(1)?.playerIndex ?? 1
								]?.characterId ?? 0}
							/>
						</div>
					{/each}
				</div>

				<button
					class="transition duration-100 w-full rounded-md justify-center background-color-primary border-secondary bg-opacity-40 hover:bg-opacity-60"
					on:click={async () => {
						addGame(i + 1);
					}}
				>
					<h1 class="text-secondary-color text-shadow-md">+</h1>
				</button>
			{:else}
				<div class="flex gap-4 justify-center items-center">
					<h1 class="color-secondary text-3xl font-semibold">No Games</h1>
				</div>
			{/each}
		</div>
	</div>
	<ConfirmModal bind:open={deleteGameModalOpen} on:confirm={handleDelete}>
		Delete Game?
	</ConfirmModal>
	<AddGameModal bind:open={addGameModalOpen} bind:selectedGameIndex />
</Modal>
