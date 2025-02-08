<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type {
		GameStartTypeExtended,
		GameStats,
		MatchInfoExtended,
	} from '$lib/models/types/slippiData';
	import { currentPlayers, electronEmitter, recentGames } from '$lib/utils/store.svelte';
	import { STAGE_DATA, Stage } from '$lib/models/constants/stageData';
	import { Character } from '$lib/models/enum';
	import { CHARACTERS_EXTERNAL_INTERNAL } from '$lib/models/constants/characterData';
	import {
		PlayerType,
		PostFrameUpdateType,
		PreFrameUpdateType,
	} from '@slippi/slippi-js/dist/types';
	import GameStage from './GameStage.svelte';
	import CharacterIcon from './CharacterIcon.svelte';
	import Select from '$lib/components/input/Select.svelte';
	import { cloneDeep } from 'lodash';

	export let open: boolean;
	export let selectedGameIndex: number;

	let game: GameStats = {
		gameEnd: {
			gameEndMethod: 2,
			lrasInitiatorIndex: -1,
			placements: [
				{ playerIndex: 0, position: 0 },
				{ playerIndex: 1, position: 1 },
				{ playerIndex: 2, position: 1 },
				{ playerIndex: 3, position: 1 },
			],
		},
		isMock: true,
		lastFrame: {
			frame: 0,
			followers: [],
			players: {
				[0]: {
					pre: {} as PreFrameUpdateType,
					post: {
						playerIndex: 0,
						internalCharacterId: CHARACTERS_EXTERNAL_INTERNAL[Character.Falcon],
						stocksRemaining: 1,
					} as PostFrameUpdateType,
				},
				[1]: {
					pre: {} as PreFrameUpdateType,
					post: {
						playerIndex: 1,
						internalCharacterId: CHARACTERS_EXTERNAL_INTERNAL[Character.Falcon],
						stocksRemaining: 1,
					} as PostFrameUpdateType,
				},
				[2]: null,
				[3]: null,
			},
		},
		postGameStats: null,
		score: [0, 0],
		settings:
			$recentGames.at(-1)?.settings ??
			({
				players: [
					{
						playerIndex: 0,
						port: 1,
						characterId: Character.Falcon,
						startStocks: 4,
						characterColor: 0,
						connectCode: '',
						displayName: 'Player 1',
						userId: '',
					},
					{
						playerIndex: 1,
						port: 2,
						characterId: Character.Falcon,
						startStocks: 4,
						characterColor: 0,
						connectCode: '',
						displayName: 'Player 2',
						userId: '',
					},
				] as PlayerType[],
				matchInfo: {} as MatchInfoExtended,
				timerType: 2,
				stageId: Stage.BATTLEFIELD,
				startingTimerSeconds: 480,
			} as GameStartTypeExtended),
		timestamp: null,
		isReplay: false,
	};

	const handleStockChange = (playerIndex: number, stockNumber: number) => {
		if (!game.lastFrame?.players?.[playerIndex]) return;
		game.lastFrame.players[playerIndex]!.post.stocksRemaining = stockNumber;
	};

	const handleCharacterChange = (playerIndex: number, event: CustomEvent<Character>) => {
		const characterId = Number(event.detail);
		if (!game.settings?.players?.[playerIndex] || !game.lastFrame?.players?.[playerIndex])
			return;
		game.settings.players[playerIndex].characterId = characterId;
		game.lastFrame.players[playerIndex]!.post.internalCharacterId =
			CHARACTERS_EXTERNAL_INTERNAL[characterId];
	};

	const handleStageChange = (event: CustomEvent<Stage>) => {
		const stageId = Number(event.detail);
		if (!game.settings) return;
		game.settings.stageId = stageId;
	};

	const handleWinnerChange = (playerIndex: number) => {
		if (!game.gameEnd) return;
		const placements = cloneDeep(game.gameEnd.placements);
		for (let placement of placements) {
			if (placement.playerIndex === playerIndex) {
				placement.position = 0;
			} else {
				placement.position = 1;
			}
		}
		game.gameEnd.placements = placements;
	};

	const getDisplayName = (playerIndex: number) => {
		const displayName = $currentPlayers.at(playerIndex)?.displayName;
		return displayName?.length ? displayName : `Player${playerIndex + 1}`;
	};

	const hasGameWinner = () => {
		return (
			game.gameEnd.placements[$currentPlayers.at(0)?.playerIndex ?? 0].position === 0 ||
			game.gameEnd.placements[$currentPlayers.at(1)?.playerIndex ?? 1].position === 0
		);
	};

	const addGame = () => {
		$electronEmitter.emit('RecentGamesMock', game, selectedGameIndex);
		open = false;
	};
</script>

<Modal
	bind:open
	on:close={() => (open = false)}
	class="w-[95vw] max-w-[600px] max-h-[80vh] min-w-72 flex justify-center"
>
	<div
		class="w-[600px] h-[80vh] min-w-lg flex flex-col gap-8 bg-cover bg-center border-secondary background-primary-color p-8"
	>
		<div>
			<div class="flex gap-4 justify-center items-center">
				<h1 class="color-secondary text-3xl font-semibold">Add Game</h1>
			</div>
			<div class="flex justify-between gap-4">
				<h1 class="color-secondary text-2xl font-semibold">
					{getDisplayName(0)}
				</h1>
				<h1 class="color-secondary text-2xl font-semibold">
					{getDisplayName(1)}
				</h1>
			</div>
		</div>
		<div
			class="flex flex-col flex-1 gap-8 overflow-y-auto sp-2 border-t border-b border-secondary-color py-2"
		>
			<div class="flex gap-4 justify-center items-center">
				<h1 class="color-secondary text-2xl font-semibold">Character</h1>
			</div>
			<div class="flex justify-between gap-4">
				<Select
					on:change={(e) =>
						handleCharacterChange($currentPlayers.at(0)?.playerIndex ?? 0, e)}
					label={`${$currentPlayers.at(0)?.displayName ?? 'Player1 Character'}`}
				>
					{#each Object.entries(Character).filter(([_, name]) => typeof name === 'string') as [id, name]}
						<option
							selected={id ===
								`${
									game.settings?.players.at(
										$currentPlayers.at(0)?.characterId ?? 0,
									)?.characterId
								}`}
							value={id}
						>
							{name}
						</option>
					{/each}
				</Select>
				<Select
					on:change={(e) =>
						handleCharacterChange($currentPlayers.at(1)?.playerIndex ?? 1, e)}
					label={`${$currentPlayers.at(1)?.displayName ?? 'Player2 Character'}`}
				>
					{#each Object.entries(Character).filter(([_, name]) => typeof name === 'string') as [id, name]}
						<option
							selected={id ===
								`${
									game.settings?.players.at(
										$currentPlayers.at(1)?.playerIndex ?? 1,
									)?.characterId
								}`}
							value={id}
						>
							{name}
						</option>
					{/each}
				</Select>
			</div>
			<div class="flex gap-4 justify-center items-center">
				<h1 class="color-secondary text-2xl font-semibold">Stocks</h1>
			</div>
			<div class="flex justify-between gap-18">
				<div class="flex gap-2">
					{#each [...Array(4).keys()].reverse() as stock}
						<button
							class={`${
								(game?.lastFrame?.players[$currentPlayers.at(0)?.playerIndex ?? 0]
									?.post.stocksRemaining ?? 0) > stock
									? 'opacity-100'
									: 'opacity-50'
							} h-10`}
							on:click={() => {
								handleStockChange(
									$currentPlayers.at(0)?.playerIndex ?? 0,
									stock + 1,
								);
							}}
						>
							<CharacterIcon
								characterId={game?.settings?.players[
									$currentPlayers.at(0)?.playerIndex ?? 0
								]?.characterId ?? 0}
							/>
						</button>
					{/each}
					<button
						class="transition duration-100 w-14 p-2 rounded-md justify-center background-color-primary border-secondary bg-opacity-40 hover:bg-opacity-60"
						on:click={() => {
							handleStockChange($currentPlayers.at(0)?.playerIndex ?? 0, 0);
						}}
					>
						<h1 class="text-secondary-color">None</h1>
					</button>
				</div>
				<div class="flex gap-2">
					<button
						class="transition duration-100 w-14 p-2 rounded-md justify-center background-color-primary border-secondary bg-opacity-40 hover:bg-opacity-60"
						on:click={() => {
							handleStockChange($currentPlayers.at(1)?.playerIndex ?? 1, 0);
						}}
					>
						<h1 class="text-secondary-color">None</h1>
					</button>
					{#each [...Array(4).keys()] as stock}
						<button
							class={`${
								(game?.lastFrame?.players[$currentPlayers.at(1)?.playerIndex ?? 1]
									?.post.stocksRemaining ?? 0) > stock
									? 'opacity-100'
									: 'opacity-50'
							} h-10`}
							on:click={() => {
								handleStockChange(
									$currentPlayers.at(1)?.playerIndex ?? 1,
									stock + 1,
								);
							}}
						>
							<CharacterIcon
								characterId={game?.settings?.players[
									$currentPlayers.at(1)?.playerIndex ?? 1
								]?.characterId ?? 0}
							/>
						</button>
					{/each}
				</div>
			</div>
			<div class="flex gap-4 justify-center items-center">
				<h1 class="color-secondary text-2xl font-semibold">Stage</h1>
			</div>
			<div class="flex gap-4 items-center">
				<Select on:change={handleStageChange}>
					{#each Object.entries(STAGE_DATA) as [id, stage_data]}
						<option selected={id === `${game?.settings?.stageId}`} value={id}>
							{stage_data.name}
						</option>
					{/each}
				</Select>
				<div class="relative aspect-video w-full border-secondary">
					<GameStage
						stageId={game?.settings?.stageId}
						class="aspect-video rounded-md"
						objectFit="cover"
					/>
				</div>
			</div>
			<div class="flex gap-4 justify-center items-center">
				<h1 class="color-secondary text-2xl font-semibold">Winner</h1>
			</div>
			<div class="flex justify-around gap-4">
				<button
					class={`border background-color-primary bg-opacity-25 rounded-sm p-4 ${
						game.gameEnd.placements[$currentPlayers.at(0)?.playerIndex ?? 0]
							.position === 0
							? 'border-secondary bg-opacity-50'
							: 'border white'
					}`}
					on:click={() => handleWinnerChange(0)}
				>
					<h1 class="text-secondary-color text-2xl font-semibold">
						{getDisplayName(0)}
					</h1>
				</button>
				<button
					class={`border background-color-primary bg-opacity-25 rounded-sm p-4 ${
						game.gameEnd.placements[$currentPlayers.at(1)?.playerIndex ?? 1]
							.position === 0
							? 'border-secondary bg-opacity-50'
							: 'border white'
					}`}
					on:click={() => handleWinnerChange(1)}
				>
					<h1 class="text-secondary-color text-2xl font-semibold">
						{getDisplayName(1)}
					</h1>
				</button>
			</div>
		</div>
		<button
			disabled={!hasGameWinner()}
			class={`border-secondary background-color-primary bg-opacity-25 p-4 disabled:opacity-50`}
			on:click={addGame}
		>
			<h1 class="text-secondary-color text-2xl font-semibold">Add Game</h1>
		</button>
	</div>
</Modal>
