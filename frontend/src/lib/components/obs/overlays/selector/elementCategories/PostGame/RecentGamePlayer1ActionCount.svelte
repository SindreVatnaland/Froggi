<script lang="ts">
	import { CustomElement } from '$lib/models/constants/customElement';
	import { createEventDispatcher } from 'svelte';
	import SelectOption from '../../visibilityCategories/SelectVisibilityOption.svelte';

	const dispatch = createEventDispatcher();

	function select(customElement: CustomEvent<CustomElement>) {
		dispatch('select', customElement.detail);
	}
</script>

<div class="flex flex-col gap-2">
	<SelectOption
		description="Number Of Air Dodges Executed"
		value={CustomElement.PostGamePlayer1ActionCountAirDodge}
		on:select={select}
	>
		Air Dodge Count
	</SelectOption>
	<SelectOption
		description="Number Of Dash Dances Executed"
		value={CustomElement.PostGamePlayer1ActionCountDashDance}
		on:select={select}
	>
		Dash Dance Count
	</SelectOption>
	<SelectOption
		description="Number Of Ledge Grabs"
		value={CustomElement.PostGamePlayer1ActionCountLedgeGrab}
		on:select={select}
	>
		Ledge Grab Count
	</SelectOption>
	<SelectOption
		description="Number Of Rolls Executed"
		value={CustomElement.PostGamePlayer1ActionCountRoll}
		on:select={select}
	>
		Roll Count
	</SelectOption>
	<SelectOption
		description="Number Of Spot Dodges Executed"
		value={CustomElement.PostGamePlayer1ActionCountSpotDodge}
		on:select={select}
	>
		Spot Dodge Count
	</SelectOption>
	<SelectOption
		description="Number Of Wave Dashes Executed"
		value={CustomElement.PostGamePlayer1ActionCountWaveDash}
		on:select={select}
	>
		Wave Dash Count
	</SelectOption>
	<SelectOption
		description="Number Of Wave Lands Executed"
		value={CustomElement.PostGamePlayer1ActionCountWaveLand}
		on:select={select}
	>
		Wave Land Count
	</SelectOption>
	<SelectOption
		description="Total Number Of Grabs Executed"
		value={CustomElement.PostGamePlayer1ActionCountGrabTotal}
		on:select={select}
	>
		Grab Count
	</SelectOption>
	<SelectOption
		description="Number Of Successful Grabs Executed"
		value={CustomElement.PostGamePlayer1ActionCountGrabSuccess}
		on:select={select}
	>
		Grab Success Count
	</SelectOption>
	<SelectOption
		description="Percentage Of Successful Grabs Executed"
		value={CustomElement.PostGamePlayer1ActionCountGrabSuccessPercent}
		on:select={select}
	>
		Grab Success Percent
	</SelectOption>
	<SelectOption
		description="Number Of Failed Grabs Executed"
		value={CustomElement.PostGamePlayer1ActionCountGrabFail}
		on:select={select}
	>
		Grab Fail Count
	</SelectOption>
	<SelectOption
		description="Percentage Of Failed Grabs Executed"
		value={CustomElement.PostGamePlayer1ActionCountGrabFailPercent}
		on:select={select}
	>
		Grab Fail Percent
	</SelectOption>
	<SelectOption
		description="Total Number Of Ground Tech Situations"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechTotal}
		on:select={select}
	>
		Ground Tech Attempt Count
	</SelectOption>
	<SelectOption
		description="Number Of Ground Techs In"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechIn}
		on:select={select}
	>
		Ground Tech In Count
	</SelectOption>
	<SelectOption
		description="Number Of Ground Techs Out"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechAway}
		on:select={select}
	>
		Ground Tech Out Count
	</SelectOption>
	<SelectOption
		description="Number Of Ground Techs Neutral"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechNeutral}
		on:select={select}
	>
		Ground Tech Neutral Count
	</SelectOption>
	<SelectOption
		description="Number Of Successful Ground Techs"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechSuccess}
		on:select={select}
	>
		Ground Tech Success Count
	</SelectOption>
	<SelectOption
		description="Percent Of Ground Techs Success"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechSuccessPercent}
		on:select={select}
	>
		Ground Tech Success Percent
	</SelectOption>
	<SelectOption
		description="Number Of Failed Ground Techs"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechFail}
		on:select={select}
	>
		Ground Tech Fail Count
	</SelectOption>
	<SelectOption
		description="Percent Of Failed Ground Techs"
		value={CustomElement.PostGamePlayer1ActionCountGroundTechFailPercent}
		on:select={select}
	>
		Ground Tech Fail Percent
	</SelectOption>
	<SelectOption
		description="Total Number Of Potential Wall Techs"
		value={CustomElement.PostGamePlayer1ActionCountWallTechTotal}
		on:select={select}
	>
		Wall Tech Attempt Count
	</SelectOption>
	<SelectOption
		description="Number Of Successful Wall Techs"
		value={CustomElement.PostGamePlayer1ActionCountWallTechSuccess}
		on:select={select}
	>
		Successful Wall Tech Count
	</SelectOption>
	<SelectOption
		description="Number Of Successful Wall Techs"
		value={CustomElement.PostGamePlayer1ActionCountWallTechSuccessPercent}
		on:select={select}
	>
		Successful Wall Tech Percent
	</SelectOption>
	<SelectOption
		description="Number Of Failed Wall Techs"
		value={CustomElement.PostGamePlayer1ActionCountWallTechFail}
		on:select={select}
	>
		Failed Wall Tech Count
	</SelectOption>
	<SelectOption
		description="Number Of Failed Wall Techs"
		value={CustomElement.PostGamePlayer1ActionCountWallTechFailPercent}
		on:select={select}
	>
		Failed Wall Tech Percent
	</SelectOption>
	<SelectOption
		description="Number Of Failed Wall Techs"
		value={CustomElement.PostGamePlayer1ActionCountWallTechFailPercent}
		on:select={select}
	>
		Failed Wall Tech Percent
	</SelectOption>
	<SelectOption
		description="Total Number Of Potential L-Cancels"
		value={CustomElement.PostGamePlayer1ActionCountLCancelTotal}
		on:select={select}
	>
		L-Cancel Attempt Count
	</SelectOption>
	<SelectOption
		description="Number Of Successful L-Cancels"
		value={CustomElement.PostGamePlayer1ActionCountLCancelSuccess}
		on:select={select}
	>
		Successful L-Cancel Count
	</SelectOption>
	<SelectOption
		description="Number Of Successful L-Cancels"
		value={CustomElement.PostGamePlayer1ActionCountLCancelSuccessPercent}
		on:select={select}
	>
		Successful L-Cancel Percent
	</SelectOption>
	<SelectOption
		description="Number Of Failed L-Cancels"
		value={CustomElement.PostGamePlayer1ActionCountLCancelFail}
		on:select={select}
	>
		Failed L-Cancel Count
	</SelectOption>
	<SelectOption
		description="Number Of Failed L-Cancels"
		value={CustomElement.PostGamePlayer1ActionCountLCancelFailPercent}
		on:select={select}
	>
		Failed L-Cancel Percent
	</SelectOption>
	<SelectOption
		description="Number Of Failed L-Cancels"
		value={CustomElement.PostGamePlayer1ActionCountLCancelFailPercent}
		on:select={select}
	>
		Failed L-Cancel Percent
	</SelectOption>
	<SelectOption
		description="Total Number Of Throws"
		value={CustomElement.PostGamePlayer1ActionCountThrowTotal}
		on:select={select}
	>
		Throw Count
	</SelectOption>
	<SelectOption
		description="Total Number Of Up-Throws"
		value={CustomElement.PostGamePlayer1ActionCountThrowUp}
		on:select={select}
	>
		Up-Throw Count
	</SelectOption>
	<SelectOption
		description="Total Number Of Forward-Throws"
		value={CustomElement.PostGamePlayer1ActionCountThrowForward}
		on:select={select}
	>
		Forward-Throw Count
	</SelectOption>
	<SelectOption
		description="Total Number Of Back-Throws"
		value={CustomElement.PostGamePlayer1ActionCountThrowBack}
		on:select={select}
	>
		Back-Throw Count
	</SelectOption>
	<SelectOption
		description="Total Number Of Down-Throws"
		value={CustomElement.PostGamePlayer1ActionCountThrowDown}
		on:select={select}
	>
		Down-Throw Count
	</SelectOption>
</div>
