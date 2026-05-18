<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import Select from '$lib/components/input/Select.svelte';
	import { electronEmitter, statsScene } from '$lib/utils/store.svelte';
	import { tooltip } from 'svooltip';
	import { Overlay } from '$lib/models/types/overlay';

	export let overlay: Overlay;

	function updateLiveScene(scene: LiveStatsScene) {
		$electronEmitter.emit('LiveStatsSceneChange', scene);
	}

	let options = [
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

{#if overlay}
	<div class="w-lg 3xl:w-full grid grid-flow-row gap-2">
		{#each options as button}
			<div class="grid grid-flow-col gap-2 justify-start items-start w-full">
				<div class="flex w-4 h-4 items-center justify-center">
					<input
						type="checkbox"
						value={button.liveScene}
						bind:checked={overlay[button.liveScene].active}
					/>
				</div>
				<button
					class={`w-32 btn text-md whitespace-nowrap h-10 px-2 xl:text-xl ${
						$statsScene === button.liveScene ? 'border-secondary' : 'border-accent'
					}`}
					on:click={() => {
						updateLiveScene(button.liveScene);
					}}
					use:tooltip={{
						content: `${button.description}`,
						html: true,
						placement: 'right',
						delay: [1000, 0],
						offset: 15,
					}}
				>
					{button.text}
				</button>
				{#if !overlay?.[button.liveScene].active}
					<div
						class="w-32"
						use:tooltip={{
							content: `When <b>${
								button.liveScene
							}</b> is supposed to be active, <b>${
								overlay[button.liveScene].fallback
							}</b> will be used instead`,
							html: true,
							placement: 'right',
							delay: [1000, 0],
							offset: 15,
						}}
					>
						<Select bind:selected={overlay[button.liveScene].fallback}>
							{#each options.filter((option) => overlay[option.liveScene].active) as option}
								<option value={option.liveScene}>{option.text}</option>
							{/each}
						</Select>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
