<script lang="ts">
	import TutorialPages from '$lib/components/tutorial/TutorialPages.svelte';
	import Overview from '$lib/components/tutorial/tournament/Overview.svelte';
	import LoadTags from '$lib/components/tutorial/tournament/LoadTags.svelte';
	import NgrokSetup from '$lib/components/tutorial/tournament/NgrokSetup.svelte';
	import TailscaleRemote from '$lib/components/tutorial/tournament/TailscaleRemote.svelte';
	import PlayersConnect from '$lib/components/tutorial/tournament/PlayersConnect.svelte';
	import StartingASet from '$lib/components/tutorial/tournament/StartingASet.svelte';
	import StageStriking from '$lib/components/tutorial/tournament/StageStriking.svelte';
	import BetweenGames from '$lib/components/tutorial/tournament/BetweenGames.svelte';
	import NextMatch from '$lib/components/tutorial/tournament/NextMatch.svelte';

	const scenes = [
		{ title: 'Overview', component: Overview },
		{ title: 'Local tournaments', component: LoadTags },
		{ title: 'Online tournaments', component: NgrokSetup },
		{ title: 'Remote dashboard control', component: TailscaleRemote },
		{ title: 'Players open their links', component: PlayersConnect },
		{ title: 'Starting a set', component: StartingASet },
		{ title: 'RPS and stage striking', component: StageStriking },
		{ title: 'Between games', component: BetweenGames },
		{ title: 'Next match', component: NextMatch },
	];
</script>

<TutorialPages {scenes} />
