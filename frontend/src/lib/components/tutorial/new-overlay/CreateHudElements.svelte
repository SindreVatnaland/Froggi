<script lang="ts">
</script>

<h1 class="text-2xl font-semibold">Adding Realtime HUD Elements</h1>

<h2>
	Now we have created elements that occur when a game starts and when pausing. Now we begin adding
	realtime HUD elements.
</h2>

<h2>To start with we can begin with adding percentages and stocks.</h2>

<h2>Create a new layer to layer 3</h2>

<h2>
	Then we can add the <b>Percentage</b>
	element
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/select-percent.png"
	alt="Select percent"
/>

<h2>
	Remember to set <b>Visibility condition</b>
	to only be visible when game is not paused, if you want to.
</h2>

<h2>
	The <b>Percent Decimal - Pre animated</b>
	components are special and includes some preset animations, triggers and style only available for
	this component.
</h2>

<h2>
	When the character assigned to the percentage takes damage, this component will animate
	similarly to the original game.
</h2>

<h2>If you want to customize the animations yourself, select the non pre animated component.</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-percent.png"
	alt="Select percent"
/>

<h2>After adding both player percentages, they should look something like this.</h2>

<h2>Now, try to add the character series icon behind the percentage.</h2>

<br />

<h1 class="text-lg font-semibold">Adding stock icons</h1>

<h2>Now we can try to add stocks.</h2>

<h2>Create a new layer and add a character stock</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/add-stock-icon.png"
	alt="Add stock icon"
/>

<h2>
	What we will do with stocks are to create 4 duplicates of this component. Each of the icons will
	have a different visibility condition which is bound to the amount of stocks a player have left.
	And if you want you can add a condition to only have it displayed while the game is <b>not</b>
	paused by creating an additional condition.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/apply-stock-visibility-condition.png"
	alt="Apply stock visibility condition"
/>

<h2>
	And then we can add a small transition for the stock to fade out/in when a stock is being taken
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/apply-stock-transition.png"
	alt="Apply stock visibility condition"
/>

<h2>
	Add this icon to the scene and place it where it would be in the game. Press the <b>Copy</b>
	button above the edit window to duplicate the element and change the visibility condition to reflex
	the number of stocks left.
</h2>

<h2>
	After adding all 4 stocks, the preview should look something like this. Continue by adding hud
	elements you would like to have in your overlay.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/new-overlay/preview-finalized-stock.png"
	alt="Apply stock visibility condition"
/>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}
</style>
