<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';
</script>

<h1 class="text-2xl font-semibold">Automatic Scene Switching Commands</h1>

<h2>
	The scene switch commands is a feature that can be used when you want to trigger an <b>OBS</b>
	command when the game state of melee changes.
</h2>

<h2>
	This can be used to automatically change a scene in <b>OBS</b>
	when a new game starts and we want to change to a
	<b>In-Game</b>
	scene in
	<b>OBS</b>
	, or when the game ends and a
	<b>Rank Change</b>
	is happening, we can automatically change to a different scene that is suited for that purpose.
</h2>

<h2>
	Lets start with going to <b>OBS Icon</b>
	&gt;
	<b>OBS Settings</b>
	&gt;
	<b>Scene Commands</b>
	and enable
	<b>Scene Switch Commands</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-scene-switch-commands.png"
	alt="Scene switch command page"
/>

<h2>
	This will enable the triggers when a scene changes in <b>Froggi</b>
	, or in other terms, when the game state changes.
</h2>

<h2>
	Now we can add a new command by clicking on the
	<b>Add New Command</b>
	button
</h2>

<h2>
	Lets add a scene switch command that will trigger when <b>Froggi</b>
	changes scene to
	<b>{startCase(LiveStatsScene.InGame)}</b>
	, or the game starts, that will change the
	<b>OBS</b>
	scene to the preferred
	<b>In Game</b>
	scene.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-add-scene-switch-command.png"
	alt="Add scene switch command"
/>

<h2>
	Click <b>Add</b>
	and the command will be added to the list of commands that will be triggered when the scene changes.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-scene-switch-commands-preview
	.png"
	alt="Add scene switch command"
/>

<h2>
	We can test this out by either manually change the scene in <b>Froggi</b>
	or by changing the game state in
	<b>Dolphin</b>
	by starting a game.
</h2>
