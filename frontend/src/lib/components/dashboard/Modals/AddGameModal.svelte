<script lang="ts">
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
			placement.position = placement.playerIndex === playerIndex ? 0 : 1;
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

	$: p1Idx = $currentPlayers.at(0)?.playerIndex ?? 0;
	$: p2Idx = $currentPlayers.at(1)?.playerIndex ?? 1;
	$: p1Winner = game.gameEnd.placements[p1Idx]?.position === 0;
	$: p2Winner = game.gameEnd.placements[p2Idx]?.position === 0;
</script>

<Modal bind:open on:close={() => (open = false)} class="w-[95vw] max-w-lg min-w-72">
	<div class="modal-inner background-primary-color text-secondary-color">

		<div class="modal-header border-b border-secondary-color">
			<span class="modal-title">Add Game</span>
			<div class="player-names">
				<span class="pname">{getDisplayName(0)}</span>
				<span class="pname pname--right">{getDisplayName(1)}</span>
			</div>
		</div>

		<div class="modal-body">

			<!-- Characters -->
			<div class="section">
				<p class="section-label">Characters</p>
				<div class="two-col">
					<Select
						on:change={(e) => handleCharacterChange(p1Idx, e)}
						label={getDisplayName(0)}
					>
						{#each Object.entries(Character).filter(([_, name]) => typeof name === 'string') as [id, name]}
							<option
								selected={id === `${game.settings?.players.at(p1Idx)?.characterId}`}
								value={id}
							>{name}</option>
						{/each}
					</Select>
					<Select
						on:change={(e) => handleCharacterChange(p2Idx, e)}
						label={getDisplayName(1)}
					>
						{#each Object.entries(Character).filter(([_, name]) => typeof name === 'string') as [id, name]}
							<option
								selected={id === `${game.settings?.players.at(p2Idx)?.characterId}`}
								value={id}
							>{name}</option>
						{/each}
					</Select>
				</div>
			</div>

			<!-- Stocks -->
			<div class="section">
				<p class="section-label">Stocks remaining</p>
				<div class="stocks-row">
					<!-- P1 stocks (right-to-left) -->
					<div class="stocks-group stocks-group--left">
						<button
							class="none-btn btn border-secondary rounded text-xs px-2 h-7"
							on:click={() => handleStockChange(p1Idx, 0)}
						>0</button>
						{#each [...Array(4).keys()].reverse() as stock}
							<button
								class="stock-btn"
								class:stock-active={(game?.lastFrame?.players[p1Idx]?.post.stocksRemaining ?? 0) > stock}
								on:click={() => handleStockChange(p1Idx, stock + 1)}
							>
								<CharacterIcon characterId={game?.settings?.players[p1Idx]?.characterId ?? 0} />
							</button>
						{/each}
					</div>
					<!-- P2 stocks (left-to-right) -->
					<div class="stocks-group stocks-group--right">
						{#each [...Array(4).keys()] as stock}
							<button
								class="stock-btn"
								class:stock-active={(game?.lastFrame?.players[p2Idx]?.post.stocksRemaining ?? 0) > stock}
								on:click={() => handleStockChange(p2Idx, stock + 1)}
							>
								<CharacterIcon characterId={game?.settings?.players[p2Idx]?.characterId ?? 0} />
							</button>
						{/each}
						<button
							class="none-btn btn border-secondary rounded text-xs px-2 h-7"
							on:click={() => handleStockChange(p2Idx, 0)}
						>0</button>
					</div>
				</div>
			</div>

			<!-- Stage -->
			<div class="section">
				<p class="section-label">Stage</p>
				<div class="stage-row">
					<div class="stage-select">
						<Select on:change={handleStageChange}>
							{#each Object.entries(STAGE_DATA) as [id, stage_data]}
								<option selected={id === `${game?.settings?.stageId}`} value={id}>
									{stage_data.name}
								</option>
							{/each}
						</Select>
					</div>
					<div class="stage-preview border-secondary">
						<GameStage stageId={game?.settings?.stageId} class="w-full h-full" objectFit="cover" />
					</div>
				</div>
			</div>

			<!-- Winner -->
			<div class="section">
				<p class="section-label">Winner</p>
				<div class="winner-row">
					<button
						class="winner-btn border-secondary"
						class:winner-btn--active={p1Winner}
						on:click={() => handleWinnerChange(0)}
					>
						{getDisplayName(0)}
					</button>
					<button
						class="winner-btn border-secondary"
						class:winner-btn--active={p2Winner}
						on:click={() => handleWinnerChange(1)}
					>
						{getDisplayName(1)}
					</button>
				</div>
			</div>

		</div>

		<div class="modal-footer border-t border-secondary-color">
			<button
				class="btn text-sm h-9 px-6 border-secondary rounded w-full"
				disabled={!hasGameWinner()}
				on:click={addGame}
			>
				Add Game
			</button>
		</div>

	</div>
</Modal>

<style>
	.modal-inner {
		display: flex;
		flex-direction: column;
		max-height: 80vh;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.modal-header {
		padding: 1rem 1.25rem 0.75rem;
		flex-shrink: 0;
	}

	.modal-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--secondary-color);
		display: block;
		margin-bottom: 0.35rem;
	}

	.player-names {
		display: flex;
		justify-content: space-between;
	}

	.pname {
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.55;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-footer {
		padding: 0.75rem 1.25rem;
		flex-shrink: 0;
	}

	.section-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.35;
		margin-bottom: 0.5rem;
	}

	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	/* Stocks */
	.stocks-row {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.stocks-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stock-btn {
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		opacity: 0.2;
		transition: opacity 0.1s;
	}

	.stock-active {
		opacity: 1;
	}

	.none-btn {
		flex-shrink: 0;
	}

	/* Stage */
	.stage-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		align-items: center;
	}

	.stage-preview {
		aspect-ratio: 16/9;
		overflow: hidden;
		border-radius: 0.125rem;
	}

	/* Winner */
	.winner-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.winner-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--secondary-color);
		background: transparent;
		cursor: pointer;
		border-radius: 0.125rem;
		opacity: 0.4;
		transition: opacity 0.1s;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.winner-btn:hover {
		opacity: 0.7;
	}

	.winner-btn--active {
		opacity: 1;
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
