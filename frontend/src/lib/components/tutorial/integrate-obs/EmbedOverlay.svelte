<script lang="ts">
</script>

<h1 class="text-2xl font-semibold">Embed overlays in OBS</h1>

<h2>Lets navigate to the overlay page and select an overlay to embed in OBS.</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/overlay-preview.png"
	alt="Overlay preview"
/>

<h2>
	Click on <b>Embed</b>
	and a popup will show up.
</h2>

<img class="border-secondary" src="/image/tutorial/integrate-obs/embed-page.png" alt="Embed page" />

<h2>
	If you have enabled the <b>OBS WebSockets</b>
	connection and are connected, the
	<b>Add to OBS</b>
	button should be available. Pressing it will add the overlay into the current active scene in
	<b>OBS</b>
</h2>

<h2>
	If you did not enable the <b>WebSocket Server</b>
	you can still embed the overlay by pressing the
	<b>Copy local URL</b>
	and follow the steps in the popup
</h2>

<h2>
	The scene elements in <b>OBS</b>
	should look something like this:
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-scene-preview.png"
	alt="Embed page"
/>

<h2>
	You might notice that the embed overlay does not look the same as in the preview. This is
	because the preview is using dummy data and neglects visibility conditions.
</h2>

<h2>
	To see the overlay in action we can either test it out by playing a game, or we can run a
	simulation in <b>Froggi</b>
</h2>

<h2>TODO: Explain simulation button</h2>

<h2>When real data is presented, the embed in OBS should look something like this:</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-live-preview.png"
	alt="Embed page"
/>
