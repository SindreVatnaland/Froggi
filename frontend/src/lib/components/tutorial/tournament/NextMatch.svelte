<h1 class="text-2xl font-semibold">Next match</h1>

<h2>
	After a set is complete, resetting the board and loading the next match takes just a few steps.
</h2>

<h2>Steps:</h2>
<ol>
	<li>
		Click <b>New Set</b> (or <b>Reset</b>) on the dashboard to return to the lobby
	</li>
	<li>
		In Slippi, <b>spectate the next player</b> and have them play a quick game in Direct Play
		mode — this loads their Slippi tags into Froggi automatically
	</li>
	<li>
		Share the <b>P1 and P2 links</b> with the new players (same links if using Tailscale, new
		links if using ngrok with a fresh tunnel)
	</li>
	<li>
		Players open their URL, wait on the lobby screen, and you click <b>Start Set</b> when ready
	</li>
</ol>

<h2>Tips:</h2>
<ul>
	<li>
		With <b>Tailscale</b>, the player URLs never change — you can pin them in your bracket
		Discord channel so players can always find them
	</li>
	<li>
		With <b>ngrok</b>, restart <code>ngrok http 3200</code> if the tunnel dropped and refresh the
		URL in Settings
	</li>
	<li>
		Game history is tracked per-set on the dashboard and on each player's phone, so you can
		verify results before resetting
	</li>
</ul>
