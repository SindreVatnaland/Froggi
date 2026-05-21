<script lang="ts">
	import TutorialPages from '$lib/components/tutorial/TutorialPages.svelte';
	import WhatToLearn from '$lib/components/tutorial/webhook/WhatToLearn.svelte';
	import CreateProfile from '$lib/components/tutorial/webhook/CreateProfile.svelte';
	import AuthSetup from '$lib/components/tutorial/webhook/AuthSetup.svelte';
	import PayloadFormat from '$lib/components/tutorial/webhook/PayloadFormat.svelte';
	import TestingWebhook from '$lib/components/tutorial/webhook/TestingWebhook.svelte';
	import IntegrationExample from '$lib/components/tutorial/webhook/IntegrationExample.svelte';

	const scenes = [
		{ title: 'What you will learn', component: WhatToLearn },
		{ title: 'Creating a profile', component: CreateProfile },
		{ title: 'Authentication', component: AuthSetup },
		{ title: 'Events and payload format', component: PayloadFormat },
		{ title: 'Testing your integration', component: TestingWebhook },
		{ title: 'Receiving events', component: IntegrationExample },
	];
</script>

<TutorialPages {scenes} />
