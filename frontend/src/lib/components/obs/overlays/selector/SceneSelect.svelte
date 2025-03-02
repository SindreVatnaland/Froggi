<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { electronEmitter, statsScene } from '$lib/utils/store.svelte';
	import { tooltip } from 'svooltip';

	function updateLiveScene(scene: LiveStatsScene) {
		$electronEmitter.emit('LiveStatsSceneChange', scene);
	}

	let buttons = [
		{
			text: 'Waiting',
			description: 'Dolphin is not running',
			liveScene: LiveStatsScene.WaitingForDolphin,
		},
		{
			text: 'Menu',
			description: 'Default Scene. </b> Being idle in the menu',
			liveScene: LiveStatsScene.Menu,
		},
		{
			text: 'In Game',
			description: 'While game is being played. <br/> Triggered on game start',
			liveScene: LiveStatsScene.InGame,
		},
		{
			text: 'Post Game',
			description: 'When game end and neither player has reached a winning score',
			liveScene: LiveStatsScene.PostGame,
		},
		{
			text: 'Post Set',
			description: 'When game end and a player has reached a winning score',
			liveScene: LiveStatsScene.PostSet,
		},
		{
			text: 'Rank Change',
			description: 'When a ranked game ends and rank changes',
			liveScene: LiveStatsScene.RankChange,
		},
	];
</script>

<div class="flex flex-wrap gap-2 w-full">
	{#each buttons ?? [] as button}
		<div
			class="flex gap-2 justify-start items-center"
			use:tooltip={{
				content: `${button.description}`,
				html: true,
				placement: 'top',
				delay: [1000, 0],
				offset: 25,
			}}
		>
			<button
				class={`transition background-color-primary font-semibold text-secondary-color text-md whitespace-nowrap h-10 p-2 xl:text-xl rounded-sm border ${
					$statsScene === button.liveScene
						? 'border-secondary-color'
						: 'border-accent-color'
				}`}
				on:click={() => {
					updateLiveScene(button.liveScene);
				}}
			>
				{button.text}
			</button>
		</div>
	{/each}
</div>
