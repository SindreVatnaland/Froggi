<script lang="ts">
</script>

<h1 class="text-2xl font-semibold">Adding a Timer</h1>

<h2>The overlay is getting close to completion. But what is a HUD without a timer.</h2>

<h2>For good measures we will create a new layer where we can place the timer.</h2>

<img
	class="rounded-sm border border-secondary-color"
	src="/image/tutorial/new-overlay/add-timer.png"
	alt="Add timer"
/>

<h2>The timer is split up in separate components due to flexibility.</h2>

<h2>
	To add a traditional timer, we need to stitch together the minute/seconds/milliseconds between
	multiple components.
</h2>

<h2>
	If you want it to act like in the vanilla game you have to apply these conditions:
	<br />
	Game is
	<b>not</b>
	paused
	<br />
	Game is active
	<br />
	Game is not having a Countdown (Last 5 seconds of a match)
</h2>

<img
	class="rounded-sm border border-secondary-color"
	src="/image/tutorial/new-overlay/preview-timer.png"
	alt="Add timer"
/>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
