<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<h1 class="text-2xl font-semibold">Final Preview</h1>

<h2>
	The simple <b>Custom Hud</b>
	overlay is complete and is ready to embed to OBS.
</h2>

<h2>
	You can find the embed url by clicking on the <b>Embed</b>
	button either in the editor or in the
	<b>Overlay Preview</b>
</h2>

<img
	class="rounded-sm border"
	src="/image/tutorial/new-overlay/preview-embed-editor.png"
	alt="Preview embed editor"
/>

<img
	class="rounded-sm border"
	src="/image/tutorial/new-overlay/preview-embed-overlay.png"
	alt="Preview embed overlay"
/>

<h2>This button should provide two different URL's to embed the overlay.</h2>

<h2>
	One of these are the <b>Local</b>
	URL. This can and should only be used by the device running
	<b>Froggi</b>
	.
</h2>

<h2>
	The other URL is the <b>External</b>
	URL. This is for external devices such as other PC's or mobile devices that is available in the same
	local network.
</h2>

<h2>Lets copy the local URL and embed it to OBS.</h2>

<h2>This should look something like this:</h2>

<video
	src="/image/tutorial/new-overlay/preview-embed-custom-overlay.mp4"
	class="border-secondary"
	autoplay
	loop
	muted={true}
>
	<track kind="captions" />
</video>

<h2>
	Or you can take this even further you can do something like the
	<b>Hud</b>
	demo overlay, which is included with the app.
</h2>

<video
	src="/image/tutorial/new-overlay/preview-embed-demo-overlay.mp4"
	class="border-secondary"
	autoplay
	loop
	muted={true}
>
	<track kind="captions" />
</video>

<h2>
	Is this clip we have made a copy of the stocks and moved them in the center. We then added two
	black boxes with a slight opacity as a little background and finished off with adding the
	remaining stock number.
</h2>

<h2>
	Finally we add a condition that requires all the elements to only be visible when either player
	are <b>Not</b>
	alive.
</h2>

<h2>
	Lets move over to the next tutorial where we will deep diver into how to integrate <b>Froggi</b>
	with OBS.
</h2>

<button
	class="transition background-color-primary bg-opacity-25 hover:bg-opacity-40 font-semibold text-secondary-color text-xl py-2 px-4 border border-white rounded w-40 h-20 my-4"
	on:click={() => goto('/obs/tutorial/integrate-obs')}
>
	Integrate with OBS
</button>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
