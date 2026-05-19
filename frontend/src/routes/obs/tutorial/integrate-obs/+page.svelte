<script lang="ts">
	import WhatToLearn from '$lib/components/tutorial/integrate-obs/WhatToLearn.svelte';
	import OpenInSeparateWindow from '$lib/components/tutorial/OpenInSeparateWindow.svelte';
	import ObsConnection from '$lib/components/tutorial/integrate-obs/ObsConnection.svelte';
	import EmbedOverlay from '$lib/components/tutorial/integrate-obs/EmbedOverlay.svelte';
	import AutomaticSceneSwitch from '$lib/components/tutorial/integrate-obs/AutomaticSceneSwitch.svelte';
	import ButtonCommands from '$lib/components/tutorial/integrate-obs/ButtonCommands.svelte';
	import TutorialPages from '$lib/components/tutorial/TutorialPages.svelte';

	let scenes = [
		{
			title: 'What to learn in this tutorial',
			component: WhatToLearn,
		},
		{
			title: 'Follow in separate window',
			component: OpenInSeparateWindow,
		},
		{
			title: 'Set up an OBS connection',
			component: ObsConnection,
		},
		{
			title: 'Embed overlay in OBS',
			component: EmbedOverlay,
		},
		{
			title: 'Automatic scene switching',
			component: AutomaticSceneSwitch,
		},
		{
			title: 'Controller commands',
			component: ButtonCommands,
		},
	];
</script>

<TutorialPages {scenes} />
