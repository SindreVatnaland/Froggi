<h1 class="text-2xl font-semibold">Webhooks</h1>

<h2>
	Webhooks let Froggi send real-time game events to any HTTP endpoint you own — a local server, a
	cloud function, a Discord bot, or a stream deck integration.
</h2>

<h2>
	Every time something happens in-game, Froggi fires a <b>POST request</b> to your URL with a JSON
	body describing what changed.
</h2>

<h2>In this tutorial you will learn how to:</h2>

<ul>
	<li>Create a webhook profile with a URL and authentication</li>
	<li>Subscribe to the events you care about</li>
	<li>Understand the payload structure</li>
	<li>Test your integration with dummy data</li>
	<li>Write a simple server to receive events</li>
</ul>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-left: 1.25rem;
		margin-top: 0.5rem;
	}

	li {
		color: var(--secondary-color);
		font-size: 0.9rem;
		opacity: 0.8;
		list-style: disc;
	}
</style>
