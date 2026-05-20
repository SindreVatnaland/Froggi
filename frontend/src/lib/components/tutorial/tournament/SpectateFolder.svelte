<h1 class="text-2xl font-semibold">Slippi spectate folder</h1>

<h2>
	Froggi reads from a <b>spectate folder</b> to detect who is playing and automatically fill in
	player tags.
</h2>

<h2>
	Froggi creates and configures this folder automatically. It lives at the <b>root of your Slippi
	replay directory</b>, as a sibling to the monthly folders:
</h2>
<pre>Slippi/
  2025-01/
  2025-02/
  Spectate/      ← created automatically</pre>

<h2>
	No manual setup is needed. On startup, Froggi checks for the folder — if it doesn't exist, it
	creates it and writes the path into your Slippi Launcher settings so Slippi knows where to save
	spectated games.
</h2>

<h2>
	If you've moved your replay folder, restart Froggi and it will update the spectate path to match
	the new location.
</h2>
