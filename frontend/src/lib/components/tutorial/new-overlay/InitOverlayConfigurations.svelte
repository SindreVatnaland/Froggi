<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';
</script>

<h1 class="text-2xl font-semibold">Init overlay configurations</h1>

<h2>
	Before we start adding elements into an overlay, we can start with configuring some default
	scene transitions, font and title.
</h2>

<h2>
	Start by clicking the <b>Settings</b>
	button top left of the page
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/open-settings.png"
	alt="Open settings"
/>

<h2>
	Here we can start by changing the name of the overlay to something that is more fitting. <br />
	As we want to create a custom HUD for the game, we can name it
	<b>Custom HUD</b>
</h2>

<img class="border-secondary" src="/image/tutorial/new-overlay/edit-title.png" alt="Edit title" />

<br />

<h1 class="text-lg font-bold">Default scenes</h1>

<h2>
	Next we can look at the active scenes. The selected and active scenes will display when the game
	is in that specific state.
</h2>
<h2>
	If a scene is not active, it will fall back to one of the other selected scenes, which will show
	up to the right of the inactive ones.
</h2>
<h2>
	This is useful if you want to create an overlay where you only want to display a single scene.
	For example, you want to create an overlay to display controller inputs when a game is active,
	but blank otherwise. Then you can select the <b>InGame</b>
	scene and leave the other scenes to fall back to an empty scene.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/edit-active-scenes.png"
	alt="Active scenes"
/>

<h2>
	For this tutorial we will only worry about <b>{startCase(LiveStatsScene.WaitingForDolphin)}</b>
	,
	<b>{startCase(LiveStatsScene.Menu)}</b>
	and
	<b>{startCase(LiveStatsScene.InGame)}</b>
	.
	<br />
	These scenes will teach you the basics of creating an overlay. How scene transitions work, create
	and style elements, apply transitions and set conditional visibility.
</h2>

<h2>
	The <b>{startCase(LiveStatsScene.PostGame)}</b>
	and
	<b>{startCase(LiveStatsScene.PostSet)}</b>
	scenes can be used to display stats after a game or set has finished, but is out of scope for this
	tutorial.
</h2>

<h2>
	The <b>{startCase(LiveStatsScene.RankChange)}</b>
	scene can be used to display rank changes after a ranked match, but is also out of scope for this
	tutorial.
</h2>

<h2>
	There are included pre-made demo overlays with these scenes already created. Create a copy of
	these and use them as inspiration.
</h2>

<br />

<h1 class="text-lg font-bold">Default font</h1>

<h2>
	Next we can look at the default font settings. Here you can change the default font for the
	entire overlay, per scene.
</h2>

<h2>Select a scene and update the following properties to your liking</h2>

<img class="border-secondary" src="/image/tutorial/new-overlay/edit-font.png" alt="Edit font" />

<h2>Any changes made below the scene selection only targets the selected scene</h2>

<h2>
	For this tutorial, we will choose <b>Roboto Bold Italic</b>
	. But you can change it to your liking.
</h2>

<br />

<h1 class="text-lg font-bold">Background</h1>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/edit-background.png"
	alt="Edit background"
/>

<h2>Next wen can add a background for the scene.</h2>

<h2>
	You can select between these options:
	<b>
		<br />
		No background
		<br />
		A color
		<br />
		An image
		<br />
		A custom image
		<br />
	</b>
</h2>
<h2>
	If you select
	<b>{startCase(LiveStatsScene.InGame)}</b>
	,
	<b>{startCase(LiveStatsScene.PostGame)}</b>
	or
	<b>{startCase(LiveStatsScene.PostSet)}</b>
	you will get the option to select a
	<b>Stage image</b>
</h2>

<h2>
	These background can also have transitions applied to them. This can be useful if you want to
	apply a fade or other transitions when changing scenes.
</h2>

<h2>For this tutorial, it is not necessary to apply any background and we will keep it empty.</h2>

<br />

<h1 class="text-lg font-bold">Transitions</h1>

<h2>
	Over to the fun part where we can apply transitions to the scenes. Here you can choose between a
	few preset transitions where you can change properties like <b>duration</b>
	,
	<b>delay</b>
	and
	<b>easing</b>
	.
</h2>

<h2>
	As many scenes may include multiple layers, we change the <b>Layers rendering delay</b>
	. This is used to delay rendering between the layers in the scene from the back to front. This can
	help creating some space in the transition.
</h2>

<h2>
	For this tutorial we will select the <b>Fly Automatic</b>
	transition for all scenes. This will make the elements fly from an angle relative to their placement
	on the scene.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/edit-scene-transitions.png"
	alt="Update scene transition"
/>

<h2>On the entry transition we add a duration of 250ms and no delay.</h2>

<h2>
	On the exit transition we add a duration of 250ms and a delay of 750ms. The total transition
	lasts a full second and this will give a nice and smooth transition between the scenes.
</h2>

<h2>
	Remember to update the transition and font for all the selected scenes, by changing the scene
	and applying the desired configurations
</h2>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
