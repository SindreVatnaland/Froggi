<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';
</script>

<h1 class="text-2xl font-semibold">Create Modern HUD</h1>

<h2>
	In this part of the tutorial we will introduce a couple of more features to be able to build a
	good looking modern overlay.
</h2>

<h2>
	We will go through how to add elements with realtime data, add visibility conditions to them and
	animations based on in-game events.
</h2>

<h2>
	Now we can move on an click the <b>{startCase(LiveStatsScene.InGame)}</b>
	button.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/select-in-game-scene.png"
	alt="Select in game scene"
/>

<h2>
	It is fully possible to also include the player tag and score introduced in the <b>Menu</b>
	scene.
</h2>

<h2>
	But for the tutorial we will only focus on creating a modern looking <b>HUD</b>
	for this scene.
</h2>

<br />

<h1 class="text-lg font-bold">Creating a Pause View</h1>

<h2>
	Lets start by making a layer that is responsible for displaying <b>Pause</b>
	when the game is paused.
</h2>

<h2>
	This will help us get an understanding on how visibility conditions work and how to apply
	animations to elements based on the events.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/add-custom-pause.png"
	alt="Add custom pause"
/>

<h2>
	We start off by creating a custom text element where we type <b>Paused</b>
</h2>

<h2>
	Next we can scroll down to the <b>Visibility conditions</b>
	section.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/select-visibility-condition.png"
	alt="Select visibility condition"
/>

<h2>
	Then click the <b>New condition</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/create-visibility-condition.png"
	alt="Create visibility options"
/>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/apply-game-paused-visibility-condition.png"
	alt="Apply visibility options"
/>

<h2>Here you will get a couple of options depending on the category.</h2>

<h2>
	How this works is that any option you click on will turn <b>Green</b>
	or
	<b>Red</b>
	signifying if you want the condition to be true or false, respectfully.
</h2>

<h2>
	In this case that we will click on the condition once. This will turn the condition to <b>
		Green
	</b>
	meaning the element will become visible if the game is paused
</h2>

<h2>You can apply multiple conditions between multiple categories.</h2>

<h2>
	Options applied to a single condition works as an <b>or</b>
	operation. This means that only one of the options needs to be true to make the element visible.
	This will be further explored.
</h2>

<h2>The applied conditions will be displayed below the options</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-applied-conditions.png"
	alt="Apply visibility options"
/>

<h2>
	If you want multiple options to be met before becoming visible, you will need to create a <b>
		New Condition
	</b>
	for each option you want satisfied.
</h2>

<h2>
	For the <b>Paused</b>
	element, only a single
	<b>Condition</b>
	with the
	<b>Game Paused</b>
	option is required.
</h2>

<h2>
	Then scroll down and press <b>Update</b>
</h2>

<h2>
	When you return to the <b>Style</b>
	page there will an option to apply transitions.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/apply-visibility-condition-animation.png"
	alt="Apply visibility transitions"
/>

<h2>
	The transition properties, shown in the image above, have the element enter from the left and
	exit to the right.
</h2>

<h2>
	Press <b>Test Animation</b>
	see how to transition looks and tweak it to you liking.
</h2>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
