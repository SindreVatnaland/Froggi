<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';
</script>

<h1 class="text-2xl font-semibold">Add simple text element</h1>

<h2>
	Now that we have set up the overlay configurations, we can start adding elements to the overlay.
</h2>
<h2>
	To start off we can select the <b>{startCase(LiveStatsScene.WaitingForDolphin)}</b>
	scene.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/select-scene.png"
	alt="Select scene"
/>

<h2>
	From here we can click the <b>Add new element</b>
	button. A window will pop up where you can select a category and elements related to that category.
	As
	<b>{startCase(LiveStatsScene.WaitingForDolphin)}</b>
	is a scene that is being displayed when dolphin is disconnected, there is not many categories to
	choose from. Proceed by selecting the
	<b>Custom</b>
	category followed by
	<b>Custom Text</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/select-custom-text.png"
	alt="Select custom text"
/>

<h2>
	As we are working within the <b>Waiting for Dolphin</b>
	scene, the only available category is
	<b>Custom</b>
</h2>

<br />

<h1 class="text-lg font-bold">Styling</h1>

<h2>
	When the element is selected you will get the options to style it. This will look something like
	this.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/style-custom-text.png"
	alt="Style custom text"
/>

<h2>Depending on the selected component different options will show up.</h2>

<h2>
	To the right you will see two boxes with different colors. These are to preview the component to
	ensure they are visible in both light and dark environments.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/element-preview.png"
	alt="Element preview"
/>

<h2>
	By default there is applied a small stroke to make the component easily visible, but is entirely
	optional.
</h2>

<br />

<h1 class="text-lg font-bold">Reuse Styling</h1>

<h2>
	In the bottom of the styling options you will be able to save styling and animations applied to
	the element
</h2>
<h2>
	This can then be reused to elements that falls into the same element category of type <b>
		Text
	</b>
	or
	<b>Image</b>
</h2>

<img class="border-secondary" src="/image/tutorial/new-overlay/add-element.png" alt="Add element" />

<h2>
	A button on top of the <b>Style</b>
	window will the be visible. Clicking it will overwrite the existing styles with the saved one.
</h2>

<h2>This will help a lot when multiple elements needs to be styled the same way.</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/load-styling.png"
	alt="Add element"
/>

<h2>
	Play around with any options you like and hit <b>Add</b>
	in the bottom when you are ready to continue.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-edit-window.png"
	alt="Add element"
/>

<h2>
	The element should be added to the <b>Edit</b>
	window where you can resize it by dragging the bottom right corner, and movie it around.
</h2>

<h2>
	When a element is highlighted you will be able to fine tune the position and size using the
	inputs appearing on top.
</h2>

<h2>
	Optionally when an element is highlighted you can use the arrow key to move it around, and by
	holding <b>Shift</b>
	also resize.
</h2>

<h2>
	To remove the highlight, press <b>esc</b>
	or if you want a quick delete press
	<b>del</b>
</h2>

<br />

<h1 class="text-lg font-bold">Overlay preview</h1>

<h2>
	In the top left you will see a preview. This preview will always use <b>Mock</b>
	data and will always be visible, regardless of the visibility condition.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-overlay.png"
	alt="Preview overlay"
/>

<br />

<h1 class="text-lg font-bold">Layers</h1>

<h2>Below the overlay preview you can see the layers used to build a scene.</h2>

<h2>Here you can rearrange layers and create new ones.</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-layers.png"
	alt="Preview layers"
/>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
