<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';
</script>

<h1 class="text-2xl font-semibold">Add session stats</h1>

<h2>Now we have gathered the understanding on how to add new elements to a scene.</h2>

<h2>
	Now we can move over and click on the <b>{startCase(LiveStatsScene.Menu)}</b>
	scene.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/select-menu-scene.png"
	alt="Select menu scene"
/>

<h2>
	The <b>Menu</b>
	scene representing being idle in the Menu. Waiting for a new match or taking a break.
</h2>

<h2>
	For this scene we want to display some simple <b>Session</b>
	and
	<b>Match</b>
	stats.
</h2>

<h2>
	<b>Session</b>
	stats are temporary stats on how your
	<b>Ranked</b>
	matches has been performing for the current session.
</h2>

<h2>
	<b>Match</b>
	stats are data of the current match. Player score, Best of and Game mode (Local/Direct/Unranked/Ranked)
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-menu-element-categories.png"
	alt="Select menu scene"
/>

<h2>
	We can start by adding information about the players, then add <b>Match</b>
	stats with players score.
</h2>

<h2>
	The <b>Current Player Slippi Info</b>
	is always your data, regardless of the port you are placed on.
</h2>

<h2>
	In this tutorial we want to have the correct score and tag aligned with the port of the players.
</h2>

<h2>
	We can start by adding the <b>Player1</b>
	tag
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/add-player-tag.png"
	alt="Add player tag"
/>

<h2>
	To keep it simple, we will just use the default text styling, but change the alignment to <b>
		Right
	</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/style-player-tag.png"
	alt="Style player tag"
/>

<h2>
	For the <b>Player2</b>
	we will do the same, but add the alignment to the
	<b>Left</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-player-tags.png"
	alt="Preview player tag"
/>

<h2>
	Using the information from the inputs on the top, we can adjust the width and height on both
	component to be the exact same. Then move them in each corner.
</h2>

<br />

<h1 class="text-lg font-bold">Adding Score</h1>

<h2>Just like above, we want to add the player1 and player2 scores.</h2>

<h2>
	But have the alignment to be <b>Center</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/select-match-score.png"
	alt="Select match score"
/>

<h2>Center them and use the same width will look like this.</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-match-score.png"
	alt="Preview match score"
/>

<h2>
	Adding a new custom text using a <b>-</b>
	and adding it in between the scores will look like this
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-match-score-dash.png"
	alt="Preview match score"
/>

<br />

<h1 class="text-lg font-bold">Adding session stats</h1>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/add-session-stats.png"
	alt="Adding session stats"
/>

<h2>
	Adding the <b>Wins</b>
	,
	<b>Losses</b>
	and
	<b>Rating</b>
	with some custom text to represent the wins and losses with a
	<b>W:</b>
	and
	<b>L:</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-session-stats.png"
	alt="Adding session stats"
/>

<br />

<h1 class="text-lg font-bold">Preview animations</h1>

<h2>
	If animations are applied correctly from the <b>Overlay Configurations</b>
	step, the animations while switching scene should look something like this
</h2>

<video
	src="/image/tutorial/new-overlay/preview-animation.mp4"
	class="border-secondary"
	autoplay
	loop
	muted={true}
>
	<track kind="captions" />
</video>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
