<h1 class="text-2xl font-semibold">Payload format</h1>

<h2>
	Every request body is a JSON object with the same top-level wrapper regardless of event type:
</h2>

<pre class="code-block">{`{
  "eventName": "GameStart",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "payload": { ... }
}`}</pre>

<h2>
	The <code>eventName</code> tells you which event fired. The <code>payload</code> is different for
	each event. Below is a summary of all available events:
</h2>

<div class="event-list">
	<div class="event-row">
		<span class="event-name">GameStart</span>
		<span class="event-desc">Fires when a new game begins. Contains stage, mode, match ID, best-of, and both players with character and connect code.</span>
	</div>
	<div class="event-row">
		<span class="event-name">GameEnd</span>
		<span class="event-desc">Fires when a game ends. Contains score, stage, mode, and timestamp.</span>
	</div>
	<div class="event-row">
		<span class="event-name">GameScore</span>
		<span class="event-desc">Fires when the set score updates. Payload is a <code>[p1, p2]</code> array of integers.</span>
	</div>
	<div class="event-row">
		<span class="event-name">StrikeState</span>
		<span class="event-desc">Fires on every stage striking state change. Contains the full strike state including picks, strikes, DSR, and RPS result.</span>
	</div>
	<div class="event-row">
		<span class="event-name">RankChange</span>
		<span class="event-desc">Fires after a ranked game when a player's rating changes. Contains the before/after rank profiles and a diff.</span>
	</div>
	<div class="event-row">
		<span class="event-name">PercentChange</span>
		<span class="event-desc">Fires when a player's damage percent changes in-game. Contains prev, current, and diff for p1, p2, and currentPlayer.</span>
	</div>
	<div class="event-row">
		<span class="event-name">StockChange</span>
		<span class="event-desc">Fires when a player loses a stock. Contains prev, current, and diff for p1, p2, and currentPlayer.</span>
	</div>
	<div class="event-row">
		<span class="event-name">PlayerInfo</span>
		<span class="event-desc">Fires when player data is available (game start or profile update). Contains in-game and Slippi rank data for both players.</span>
	</div>
</div>

<h2>
	The full example payload for each event is visible under <b>Event Schemas</b> on the Webhooks
	settings page.
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

	.code-block {
		font-family: monospace;
		font-size: 0.72rem;
		line-height: 1.6;
		opacity: 0.65;
		padding: 0.75rem 1rem;
		border: 1px solid rgba(128, 128, 128, 0.2);
		border-radius: 0.25rem;
		white-space: pre;
		overflow-x: auto;
		margin: 0.25rem 0;
		color: var(--secondary-color);
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid rgba(128, 128, 128, 0.25);
		border-radius: 0.375rem;
		overflow: hidden;
		margin: 0.5rem 0;
	}

	.event-row {
		display: grid;
		grid-template-columns: 8.5rem 1fr;
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid rgba(128, 128, 128, 0.12);
	}

	.event-row:last-child {
		border-bottom: none;
	}

	.event-name {
		font-family: monospace;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--secondary-color);
		opacity: 0.65;
		white-space: nowrap;
	}

	.event-desc {
		font-size: 0.8rem;
		color: var(--secondary-color);
		opacity: 0.7;
		line-height: 1.5;
	}
</style>
