<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';
</script>

<h1 class="text-2xl font-semibold">What is a scene?</h1>
<h2 class="mt-2 text-lg">
	A scene is a part of a custom overlay, displayed while the game is in a specific state. The
	available states are:
</h2>

<div class="grid grid-cols-[2fr_5fr] gap-2 w-[600px] my-2">
	<h2 class="flex items-center font-bold">
		{startCase(LiveStatsScene.WaitingForDolphin)}
	</h2>
	<h2 class="flex items-center">- While dolphin is disconnected</h2>
	<h2 class="flex items-center font-bold">
		{startCase(LiveStatsScene.Menu)}
	</h2>
	<h2 class="flex items-center">- While being idle outside of a game</h2>
	<h2 class="flex items-center font-bold">
		{startCase(LiveStatsScene.InGame)}
	</h2>
	<h2 class="flex items-center">- While in a game</h2>
	<h2 class="flex items-center font-bold">
		{startCase(LiveStatsScene.PostGame)}
	</h2>
	<h2 class="flex items-center">- 150 seconds after a game is finished</h2>
	<h2 class="flex items-center font-bold">
		{startCase(LiveStatsScene.PostSet)}
	</h2>
	<h2 class="flex items-center">
		- 150 seconds after a game is finished and its registered a set winner (eg. bo3). Or 140
		seconds after rank change.
	</h2>
	<h2 class="flex items-center font-bold">
		{startCase(LiveStatsScene.RankChange)}
	</h2>
	<h2 class="flex items-center">- 10 Seconds after a rank game while updating rank</h2>
</div>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
