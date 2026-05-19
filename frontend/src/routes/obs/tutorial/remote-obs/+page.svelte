<script lang="ts">
	import WhatToLearn from '$lib/components/tutorial/remote-obs/WhatToLearn.svelte';
	import ControllerSetup from '$lib/components/tutorial/remote-obs/ControllerSetup.svelte';
	import SceneSwitchSetup from '$lib/components/tutorial/remote-obs/SceneSwitchSetup.svelte';
	import Testing from '$lib/components/tutorial/remote-obs/Testing.svelte';
	import TutorialPages from '$lib/components/tutorial/TutorialPages.svelte';
	import OpenInSeparateWindow from '$lib/components/tutorial/OpenInSeparateWindow.svelte';

	const scenes = [
		{ title: 'What to learn in this tutorial', component: WhatToLearn },
		{ title: 'Follow in a separate window', component: OpenInSeparateWindow },
		{ title: 'Controller commands setup', component: ControllerSetup },
		{ title: 'Automatic scene switching', component: SceneSwitchSetup },
		{ title: 'Testing your setup', component: Testing },
	];
</script>

<TutorialPages {scenes} />
