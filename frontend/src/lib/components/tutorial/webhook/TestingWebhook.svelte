<h1 class="text-2xl font-semibold">Testing your integration</h1>

<h2>
	Every profile has a <b>Test</b> button. Clicking it sends one dummy request per subscribed event
	to your endpoint — no live game needed.
</h2>

<h2>The dummy payloads match the exact structure of real payloads, so your handler code works the same way in both cases.</h2>

<h2>A simple way to inspect incoming requests during development is to use a request inspection tool. Two free options:</h2>

<div class="tool-list">
	<div class="tool-row">
		<span class="tool-name">webhook.site</span>
		<span class="tool-desc"
			>Open <code>webhook.site</code> in your browser, copy the generated URL, paste it as the
			webhook URL in Froggi, and hit <b>Test</b>. Requests appear in real time.</span
		>
	</div>
	<div class="tool-row">
		<span class="tool-name">ngrok</span>
		<span class="tool-desc"
			>Run <code>ngrok http 3000</code> to expose a local server. Use the generated HTTPS URL as
			your webhook endpoint so Froggi can reach your local handler.</span
		>
	</div>
</div>

<h2>
	Once requests are arriving correctly, move the URL to your real endpoint and the same payloads
	will be delivered during live play.
</h2>

<h2>
	If a request fails (non-2xx response or network error), Froggi logs the error but does not retry.
	Check your server logs if events are not arriving.
</h2>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}

	code {
		font-family: monospace;
		font-size: 0.8rem;
		opacity: 0.75;
	}

	.tool-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid rgba(128, 128, 128, 0.25);
		border-radius: 0.375rem;
		overflow: hidden;
		margin: 0.5rem 0;
	}

	.tool-row {
		display: grid;
		grid-template-columns: 6.5rem 1fr;
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(128, 128, 128, 0.12);
	}

	.tool-row:last-child {
		border-bottom: none;
	}

	.tool-name {
		font-family: monospace;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--secondary-color);
		opacity: 0.55;
		white-space: nowrap;
	}

	.tool-desc {
		font-size: 0.8rem;
		color: var(--secondary-color);
		opacity: 0.75;
		line-height: 1.5;
	}
</style>
