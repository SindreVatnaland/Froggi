<script lang="ts">
</script>

<h1 class="text-2xl font-semibold">Adding Game End</h1>

<h2>The most important elements for a realtime overlay is added</h2>

<h2>
	The only thing missing is the <b>Countdown</b>
	and
	<b>GAME</b>
	that popup as soon as a game ends.
</h2>

<h2>
	First we can start off with creating a layer in the bottom and add a countdown element on it.
</h2>

<img
	class="rounded-sm border-secondary"
	src="/image/tutorial/new-overlay/add-timer-countdown.png"
	alt="Add timer countdown"
/>

<h2>
	We want to only display the countdown the last 5 seconds of a game. To do this we want to apply
	the <b>Countdown</b>
	visibility condition
</h2>

<img
	class="rounded-sm border-secondary"
	src="/image/tutorial/new-overlay/apply-timer-countdown-visibility-conditions.png"
	alt="Add timer"
/>

<h2>
	We also want to apply a little animation as the timer counts down. For this we want to use the <b
	>
		Animation Trigger
	</b>
	and apply the
	<b>Game Countdown</b>
	.
</h2>

<img
	class="rounded-sm border-secondary"
	src="/image/tutorial/new-overlay/apply-timer-countdown-animation-triggers.png"
	alt="Add timer"
/>

<h2>
	Every condition applied in an animation trigger will run the transition applied when triggered.
	In this case it will trigger the animation once every second when the game is counting down from
	5.
</h2>

<img
	class="rounded-sm border-secondary"
	src="/image/tutorial/new-overlay/apply-timer-countdown-transition.png"
	alt="Add countdown transition"
/>

<h2>
	This animation will give the countdown a pulse which is similar to the vanilla game and should
	be added both to the visibility and animation trigger transitions.
</h2>

<br />

<h1 class="text-lg font-bold">Adding Game End Elements</h1>

<h2>
	There are 3 different ending that may appear when a game ends: <b>GAME</b>
	,
	<b>TIME</b>
	or
	<b>TIE</b>
</h2>

<h2>Let start by creating 3 layers in the bottom, one for each ending.</h2>

<h2>Add a custom text element for each and apply the correct visibility condition</h2>

<img
	class="rounded-sm border-secondary"
	src="/image/tutorial/new-overlay/apply-game-end-visibility-condition.png"
	alt="Add timer"
/>

<h2>The layers should look something like this:</h2>

<img
	class="rounded-sm border-secondary"
	src="/image/tutorial/new-overlay/preview-game-end-layers.png"
	alt="Preview game end"
/>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
