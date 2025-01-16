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
	<div class="flex items-center font-bold">
		{startCase(LiveStatsScene.WaitingForDolphin)}
	</div>
	<div class="flex items-center">- While dolphin is disconnected</div>
	<div class="flex items-center font-bold">
		{startCase(LiveStatsScene.Menu)}
	</div>
	<div class="flex items-center">- While being idle outside of a game</div>
	<div class="flex items-center font-bold">
		{startCase(LiveStatsScene.InGame)}
	</div>
	<div class="flex items-center">- While in a game</div>
	<div class="flex items-center font-bold">
		{startCase(LiveStatsScene.PostGame)}
	</div>
	<div class="flex items-center">- 60 seconds after a game is finished</div>
	<div class="flex items-center font-bold">
		{startCase(LiveStatsScene.PostSet)}
	</div>
	<div class="flex items-center">
		- 60 seconds after a game is finished and its registered a set winner (eg. bo3). Or 50
		seconds after rank change.
	</div>
	<div class="flex items-center font-bold">
		{startCase(LiveStatsScene.RankChange)}
	</div>
	<div class="flex items-center">- 10 Seconds after a rank game while updating rank</div>
</div>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
