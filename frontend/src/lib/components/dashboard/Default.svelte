<script lang="ts">
	import { BestOf } from '$lib/models/enum';
	import { Player } from '$lib/models/types/slippiData';
	import {
		currentPlayers,
		electronEmitter,
		gameScore,
		gameSettings,
	} from '$lib/utils/store.svelte';
	import ConfirmModal from '../ConfirmModal.svelte';
	import BestOfUpdateModal from './Modals/BestOfUpdateModal.svelte';
	import ScoreUpdateModal from './Modals/ScoreUpdateModal.svelte';
	import TagUpdateModal from './Modals/TagUpdateModal.svelte';

	let isBestOfModalOpen = false;
	let isScoreModalOpen = false;
	let isTagModalOpen = false;
	let isResetRecentGamesModalOpen = false;

	$: console.log('currentPlayers', $currentPlayers);

	const getDisplayName = (player: Player | undefined) => {
		const displayName = player?.displayName;
		return displayName?.length ? displayName : `Player${player?.playerIndex ?? 0 + 1}`;
	};

	const resetScore = () => {
		isResetRecentGamesModalOpen = true;
	};

	const handleScoreReset = () => {
		$electronEmitter.emit('RecentGamesReset');
	};

	const updateBestOf = () => {
		isBestOfModalOpen = true;
	};

	const updateScore = () => {
		isScoreModalOpen = true;
	};

	const updateTag = () => {
		isTagModalOpen = true;
	};
</script>

<div class="flex flex-col gap-2 w-[30rem] max-w-[95vw]">
	<div class="flex gap-2 justify-center items-center">
		<h1 class="color-secondary text-3xl font-semibold">Tag</h1>
	</div>
	<div class="flex w-full justify-between">
		<h1 class="color-secondary text-2xl font-semibold">
			{getDisplayName($currentPlayers.at(0))}
		</h1>
		<h1 class="color-secondary text-2xl font-semibold">
			{getDisplayName($currentPlayers.at(1))}
		</h1>
	</div>
	<div class="flex flex-col gap-2">
		<button
			class={`transition background-color-primary bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary`}
			on:click={updateTag}
		>
			Change Tag
		</button>
	</div>
</div>
<div class="flex flex-col gap-2">
	<div class="flex gap-2 justify-center items-center">
		<h1 class="color-secondary text-3xl font-semibold">Score</h1>
	</div>
	<div class="flex gap-2 justify-center items-center">
		<h1 class="color-secondary text-3xl font-semibold">{$gameScore.at(0)}</h1>
		<h1 class="color-secondary text-3xl font-semibold">-</h1>
		<h1 class="color-secondary text-3xl font-semibold">{$gameScore.at(1)}</h1>
	</div>
	<button
		class={`transition background-color-primary bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary`}
		on:click={resetScore}
	>
		Reset Score
	</button>
	<button
		class={`transition background-color-primary bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary`}
		on:click={updateScore}
	>
		Update Score
	</button>
</div>
<div class="flex flex-col gap-2">
	<div class="flex gap-2 justify-center items-center">
		<h1 class="color-secondary text-3xl font-semibold">Best Of</h1>
	</div>
	<button
		class={`transition background-color-primary bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-lg whitespace-nowrap h-10 px-2 xl:text-xl border-secondary`}
		on:click={updateBestOf}
	>
		Update Best Of - ({$gameSettings?.matchInfo?.bestOf ?? BestOf.BestOf3})
	</button>
</div>

<ConfirmModal bind:open={isResetRecentGamesModalOpen} on:confirm={handleScoreReset}>
	Reset Games?
</ConfirmModal>
<ScoreUpdateModal bind:open={isScoreModalOpen} />
<BestOfUpdateModal bind:open={isBestOfModalOpen} />
<TagUpdateModal bind:open={isTagModalOpen} />
