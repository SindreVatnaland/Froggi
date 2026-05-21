<h1 class="text-2xl font-semibold">Creating a profile</h1>

<h2>
	Navigate to <b>OBS → Settings → Webhooks</b>. At the top you will find a master toggle to enable
	or disable all outbound webhook calls globally.
</h2>

<h2>
	Click <b>New Profile</b> to open the creation modal. Each profile is an independent destination —
	you can have multiple profiles pointing to different endpoints.
</h2>

<h2>Fill in the following fields:</h2>

<div class="field-list">
	<div class="field-row">
		<span class="field-name">Name</span>
		<span class="field-desc">A label to identify this profile, e.g. <em>My Stream Bot</em>.</span>
	</div>
	<div class="field-row">
		<span class="field-name">URL</span>
		<span class="field-desc"
			>The full HTTP/HTTPS endpoint that will receive POST requests, e.g.
			<code>https://myserver.com/froggi</code>.</span
		>
	</div>
	<div class="field-row">
		<span class="field-name">Auth Type</span>
		<span class="field-desc">How the request is authenticated — covered on the next page.</span>
	</div>
	<div class="field-row">
		<span class="field-name">Events</span>
		<span class="field-desc"
			>The game events this profile subscribes to. Only checked events fire to this URL.</span
		>
	</div>
</div>

<h2>
	Hit <b>Save</b> when done. The profile appears in the list and can be toggled, edited, or deleted
	at any time. Disabling a profile suppresses its requests without deleting it.
</h2>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}

	.field-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0.5rem 0;
		padding: 1rem;
		border: 1px solid rgba(128, 128, 128, 0.25);
		border-radius: 0.375rem;
	}

	.field-row {
		display: grid;
		grid-template-columns: 6rem 1fr;
		gap: 0.75rem;
		align-items: baseline;
	}

	.field-name {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.5;
		color: var(--secondary-color);
		white-space: nowrap;
	}

	.field-desc {
		font-size: 0.875rem;
		color: var(--secondary-color);
		opacity: 0.8;
		line-height: 1.5;
	}

	code {
		font-family: monospace;
		font-size: 0.8rem;
		opacity: 0.75;
	}
</style>
