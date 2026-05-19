<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';

	const states = [
		{ scene: LiveStatsScene.WaitingForDolphin, note: 'Dolphin not detected' },
		{ scene: LiveStatsScene.Menu, note: 'On the character select or CSS screen' },
		{ scene: LiveStatsScene.InGame, note: 'A game is in progress' },
		{ scene: LiveStatsScene.PostGame, note: 'Game just ended (stocks shown)' },
		{ scene: LiveStatsScene.PostSet, note: 'Set complete (score finalised)' },
		{ scene: LiveStatsScene.RankChange, note: 'Ranked rating update received' },
	];
</script>

<h1 class="text-2xl font-semibold">Automatic Scene Switching</h1>

<h2>
	Go to <b>OBS</b> → <b>OBS Settings</b> → <b>Scene Commands</b>.
</h2>

<h2>
	Enable <b>Scene Switching</b>, then click <b>+ Add</b> next to a Froggi state to attach an OBS
	command. Commands fire automatically whenever Froggi enters that state.
</h2>

<h2>Available Froggi states:</h2>

<table>
	<thead>
		<tr>
			<th>State</th>
			<th>When it triggers</th>
		</tr>
	</thead>
	<tbody>
		{#each states as { scene, note }}
			<tr>
				<td><b>{startCase(scene)}</b></td>
				<td>{note}</td>
			</tr>
		{/each}
	</tbody>
</table>

<h2>
	<b>Example:</b> Add a command on <b>In Game</b> → OBS command <b>Set Current Program Scene</b>
	→ scene name "Gameplay". Froggi will switch OBS to your gameplay scene the moment a game starts.
</h2>

<h2>
	You can add <b>multiple commands</b> to a single state and they will all fire in order.
</h2>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		margin: 0.75rem 0;
	}

	th {
		text-align: left;
		font-weight: 600;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.35rem 0.5rem 0.35rem 0;
		border-bottom: 1px solid rgba(128, 128, 128, 0.3);
		opacity: 0.5;
	}

	td {
		padding: 0.4rem 0.5rem 0.4rem 0;
		opacity: 0.75;
		vertical-align: top;
	}

	tr:not(:last-child) td {
		border-bottom: 1px solid rgba(128, 128, 128, 0.12);
	}
</style>
