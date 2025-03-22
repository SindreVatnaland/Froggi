<script lang="ts">
	import WhatIsAScene from '$lib/components/tutorial/new-overlay/WhatIsAScene.svelte';
	import WhatToLearn from '$lib/components/tutorial/new-overlay/WhatToLearn.svelte';
	import CreateNewOverlay from '$lib/components/tutorial/new-overlay/CreateNewOverlay.svelte';
	import OpenInSeparateWindow from '$lib/components/tutorial/OpenInSeparateWindow.svelte';
	import InitOverlayConfigurations from '$lib/components/tutorial/new-overlay/InitOverlayConfigurations.svelte';
	import AddSimpleTextElement from '$lib/components/tutorial/new-overlay/AddSimpleTextElement.svelte';
	import SessionStatsMenuScene from '$lib/components/tutorial/new-overlay/SessionStatsMenuScene.svelte';
	import CreateCustomHud from '$lib/components/tutorial/new-overlay/CreateCustomHud.svelte';
	import CreateLayers from '$lib/components/tutorial/new-overlay/CreateLayers.svelte';
	import CreateHudElements from '$lib/components/tutorial/new-overlay/CreateHudElements.svelte';
	import CreateTimer from '$lib/components/tutorial/new-overlay/CreateTimer.svelte';
	import CreateUltimateUi from '$lib/components/tutorial/new-overlay/CreateUltimateUi.svelte';
	import CreateGameEnd from '$lib/components/tutorial/new-overlay/CreateGameEnd.svelte';
	import FinalCustomHudPreview from '$lib/components/tutorial/new-overlay/FinalCustomHudPreview.svelte';
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
			title: 'Create a new overlay',
			component: CreateNewOverlay,
		},
		{
			title: 'What is a scene?',
			component: WhatIsAScene,
		},
		{
			title: 'Init overlay configurations',
			component: InitOverlayConfigurations,
		},
		{
			title: 'Add simple text element',
			component: AddSimpleTextElement,
		},
		{
			title: 'Add session stats to Menu scene',
			component: SessionStatsMenuScene,
		},
		{
			title: 'Build modern hud',
			component: CreateCustomHud,
		},
		{
			title: 'Add layers',
			component: CreateLayers,
		},
		{
			title: 'Add HUD elements',
			component: CreateHudElements,
		},
		{
			title: 'Add timer',
			component: CreateTimer,
		},
		{
			title: 'Add Ultimate UI Component',
			component: CreateUltimateUi,
		},
		{
			title: 'Add Game End',
			component: CreateGameEnd,
		},
		{
			title: 'Final Preview',
			component: FinalCustomHudPreview,
		},
	];
</script>

<TutorialPages {scenes} />
