<h1 class="text-2xl font-semibold">Testing Your Setup</h1>

<h2>
	Use the <b>Dashboard</b> (OBS → Dashboard) to test without starting a real game:
</h2>

<ul>
	<li>Click <b>▶ Sim</b> to start a replay simulation — this plays back a recent .slp file and fires all game-state events in real time</li>
	<li>Click <b>⏹ End</b> to skip straight to the post-game state</li>
</ul>

<h2>
	While the simulation runs, check that:
</h2>

<ul>
	<li>The OBS scene changes at the right moments (In Game, Post Game, etc.)</li>
	<li>Holding your controller combo triggers the expected command</li>
	<li>The dashboard live view shows character icons, percent, and stocks updating</li>
</ul>

<h2>
	If commands are not triggering, verify:
</h2>

<ul>
	<li>OBS WebSocket is connected (green indicator in Dashboard → OBS Controls)</li>
	<li>Scene switching / Controller commands are toggled <b>on</b></li>
	<li>Dolphin is open (required for controller input reading)</li>
	<li>Your Slippi replay path is configured (required for Sim to load a replay)</li>
</ul>
