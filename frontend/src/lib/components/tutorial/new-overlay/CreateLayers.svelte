<script lang="ts">
</script>

<h1 class="text-2xl font-semibold">Adding layers</h1>

<h2>
	Other components are not allowed to overlap with other components on the same layer. Thus it is
	necessary to add new layers.
</h2>

<h2>
	We want to replicate most of the HUD from melee as possible. We will start by implementing the <b
	>
		Ready
	</b>
	and
	<b>Go</b>
	text that pops up when game starts.
</h2>

<img class="border-secondary" src="/image/tutorial/new-overlay/add-layer.png" alt="Add layer" />

<h2>
	Create two new layers above the <b>Pause</b>
	layer.
</h2>

<h2>
	The topmost layers are rendered first. Therefore it is essential to get the <b>Ready</b>
	and
	<b>Go</b>
	elements on the top layers to display in time.
</h2>

<h2>
	Add a new custom text element with <b>READY</b>
	as the value.
</h2>

<h2>
	Create two visibility conditions where one have a <b>Game Paused</b>
	selected. And the other have the
	<b>Ready</b>
	selected
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-ready-conditions.png"
	alt="Preview ready conditions"
/>

<h2>
	This tells the program that the element is visible when the game is <b>not</b>
	paused and the game timer is in the entry window for displaying
	<b>Ready</b>
	(Based on timer from the vanilla game).
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/add-transition-ready.png"
	alt="Add ready transition"
/>

<h2>
	These transitions are inspired by the original game and have the text scale in on the correct
	time window.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-hud-text.png"
	alt="Preview intro and pause text"
/>

<h2>When both components are added, it should look something like this.</h2>

<h2>You will see that the preview is getting quite messy when multiple layers are overlapping.</h2>

<h2>You can toggle each scene to only preview layers you find necessary to preview.</h2>

<h2>
	You can also click on the <b>Preview</b>
	button which will allow you to open a preview window on an external screen or device.
</h2>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
