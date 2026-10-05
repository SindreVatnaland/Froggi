<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SelectOption from './SelectVisibilityOption.svelte';
	import {
		VisibilityOption,
		type SelectedVisibilityCondition,
	} from '$lib/models/types/animationOption';
	import type { StageStatus } from '$lib/models/types/stageStriking';
	import { STRIKE_STAGES } from '$lib/utils/strikeStageStatus';

	export let selectedVisibilityOption: SelectedVisibilityCondition;
	const dispatch = createEventDispatcher();

	const extraPhases: { value: VisibilityOption; label: string; tip: string }[] = [
		{ value: VisibilityOption.StrikeIsFirstGame, label: 'Game 1', tip: 'Before/while game 1 is decided (characters, RPS, striking)' },
		{ value: VisibilityOption.StrikePhaseRpsResult, label: 'Phase: RPS Result', tip: 'RPS winner is choosing to strike first or second' },
		{ value: VisibilityOption.StrikePhaseStageBan, label: 'Phase: Stage Ban', tip: 'Game 2+: the previous winner bans a stage' },
		{ value: VisibilityOption.StrikePhaseStagePick, label: 'Phase: Stage Pick', tip: 'Game 2+: the previous loser picks the stage' },
		{ value: VisibilityOption.StrikePhaseCharacterPick, label: 'Phase: Character Pick', tip: 'Game 2+: winner picks a character, then the loser' },
		{ value: VisibilityOption.StrikeAgreementPending, label: 'Stage Agreement Pending', tip: 'A player asked to play a DSR-blocked stage and is waiting for the other to agree' },
	];
	const statusLabels: { key: StageStatus; label: string; tip: string }[] = [
		{ key: 'available', label: 'Available', tip: 'Can be struck / picked (full colour)' },
		{ key: 'locked', label: 'Locked', tip: 'Counterpick during game 1, or not in this ruleset (grey)' },
		{ key: 'struck', label: 'Struck / Banned', tip: 'Struck in game 1 or banned by the previous winner this game (yellow)' },
		{ key: 'dsr', label: 'DSR Blocked', tip: 'The player picking already won here (red) — players may agree to play it' },
		{ key: 'picked', label: 'Picked', tip: 'The stage this game is played on (green outline)' },
	];

	function select(event: CustomEvent<VisibilityOption>) {
		dispatch('select', event.detail);
	}
</script>

<div class="flex flex-col gap-2">
	<p class="section-label">Phase</p>
	<SelectOption
		description="During Rock Paper Scissors"
		value={VisibilityOption.StrikePhaseRps}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseRps]}
		on:select={select}
	>
		Phase: RPS
	</SelectOption>
	<SelectOption
		description="During stage striking"
		value={VisibilityOption.StrikePhaseStriking}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseStriking]}
		on:select={select}
	>
		Phase: Striking
	</SelectOption>
	<SelectOption
		description="During character select"
		value={VisibilityOption.StrikePhaseCharSelect}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseCharSelect]}
		on:select={select}
	>
		Phase: Char Select
	</SelectOption>
	<SelectOption
		description="While a game is in progress"
		value={VisibilityOption.StrikePhasePlaying}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhasePlaying]}
		on:select={select}
	>
		Phase: Playing
	</SelectOption>
	<SelectOption
		description="When the set is complete"
		value={VisibilityOption.StrikePhaseComplete}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePhaseComplete]}
		on:select={select}
	>
		Phase: Complete
	</SelectOption>

	{#each extraPhases as option (option.value)}
		<SelectOption
			description={option.tip}
			value={option.value}
			bind:selected={selectedVisibilityOption[option.value]}
			on:select={select}
		>
			{option.label}
		</SelectOption>
	{/each}

	<p class="section-label">Stage state</p>
	<p class="text-xs opacity-50">One state is on per stage — stack coloured layers over the stage images and show each on its state.</p>
	{#each STRIKE_STAGES as stage (stage.stageId)}
		<p class="text-xs font-semibold mt-1">{stage.name}</p>
		{#each statusLabels as status (status.key)}
			<SelectOption
				description={status.tip}
				value={stage.conditions[status.key]}
				bind:selected={selectedVisibilityOption[stage.conditions[status.key]]}
				on:select={select}
			>
				{stage.name}: {status.label}
			</SelectOption>
		{/each}
	{/each}

	<p class="section-label">Turn</p>
	<SelectOption
		description="When it is Player 1's turn to strike"
		value={VisibilityOption.StrikeIsPlayer1Turn}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikeIsPlayer1Turn]}
		on:select={select}
	>
		Player 1 Turn
	</SelectOption>
	<SelectOption
		description="When it is Player 2's turn to strike"
		value={VisibilityOption.StrikeIsPlayer2Turn}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikeIsPlayer2Turn]}
		on:select={select}
	>
		Player 2 Turn
	</SelectOption>

	<p class="section-label">Stage</p>
	<SelectOption
		description="When a final stage has been selected"
		value={VisibilityOption.StrikeIsStageFinal}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikeIsStageFinal]}
		on:select={select}
	>
		Stage Final
	</SelectOption>

	<p class="section-label">Stage Struck</p>
	{#each [
		{ opt: VisibilityOption.StrikeIsFoDStruck, label: 'Fountain of Dreams Struck' },
		{ opt: VisibilityOption.StrikeIsBFStruck,  label: 'Battlefield Struck' },
		{ opt: VisibilityOption.StrikeIsFDStruck,  label: 'Final Destination Struck' },
		{ opt: VisibilityOption.StrikeIsDLStruck,  label: 'Dream Land Struck' },
		{ opt: VisibilityOption.StrikeIsYSStruck,  label: "Yoshi's Story Struck" },
		{ opt: VisibilityOption.StrikeIsPSStruck,  label: 'Pokemon Stadium Struck' },
	] as entry}
		<SelectOption
			description="When this stage has been struck or banned"
			value={entry.opt}
			bind:selected={selectedVisibilityOption[entry.opt]}
			on:select={select}
		>
			{entry.label}
		</SelectOption>
	{/each}

	<p class="section-label">Stage Disabled</p>
	{#each [
		{ opt: VisibilityOption.StrikeIsFoDDisabled, label: 'Fountain of Dreams Disabled', desc: 'Stage cannot be picked (DSR or not yet in pool)' },
		{ opt: VisibilityOption.StrikeIsBFDisabled,  label: 'Battlefield Disabled',        desc: 'Stage cannot be picked (DSR or not yet in pool)' },
		{ opt: VisibilityOption.StrikeIsFDDisabled,  label: 'Final Destination Disabled',  desc: 'Stage cannot be picked (DSR or not yet in pool)' },
		{ opt: VisibilityOption.StrikeIsDLDisabled,  label: 'Dream Land Disabled',         desc: 'Stage cannot be picked (DSR or not yet in pool)' },
		{ opt: VisibilityOption.StrikeIsYSDisabled,  label: "Yoshi's Story Disabled",      desc: 'Stage cannot be picked (DSR or not yet in pool)' },
		{ opt: VisibilityOption.StrikeIsPSDisabled,  label: 'Pokemon Stadium Disabled',    desc: 'Stage cannot be picked — disabled until after game 1' },
	] as entry}
		<SelectOption
			description={entry.desc}
			value={entry.opt}
			bind:selected={selectedVisibilityOption[entry.opt]}
			on:select={select}
		>
			{entry.label}
		</SelectOption>
	{/each}

	<p class="section-label">Selections</p>
	<SelectOption
		description="When Player 1 has made their RPS choice"
		value={VisibilityOption.StrikePlayer1RpsSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer1RpsSelected]}
		on:select={select}
	>
		P1 RPS Selected
	</SelectOption>
	<SelectOption
		description="When Player 2 has made their RPS choice"
		value={VisibilityOption.StrikePlayer2RpsSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer2RpsSelected]}
		on:select={select}
	>
		P2 RPS Selected
	</SelectOption>
	<SelectOption
		description="When Player 1 has selected their character"
		value={VisibilityOption.StrikePlayer1CharacterSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer1CharacterSelected]}
		on:select={select}
	>
		P1 Character Selected
	</SelectOption>
	<SelectOption
		description="When Player 2 has selected their character"
		value={VisibilityOption.StrikePlayer2CharacterSelected}
		bind:selected={selectedVisibilityOption[VisibilityOption.StrikePlayer2CharacterSelected]}
		on:select={select}
	>
		P2 Character Selected
	</SelectOption>
</div>

<style>
	.section-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.4;
		margin-top: 0.25rem;
	}
</style>
