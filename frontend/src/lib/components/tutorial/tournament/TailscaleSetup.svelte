<h1 class="text-2xl font-semibold">Online sharing — Tailscale (persistent URL)</h1>

<h2>
	<b>Tailscale</b> gives you a <b>stable, permanent URL</b> that doesn't change between sessions.
	It's the recommended option for regular tournament use — set it up once and reuse the same link
	forever.
</h2>

<h2>Why Tailscale over ngrok:</h2>
<ul>
	<li>URL never changes — you can pin it in your Discord server</li>
	<li>No terminal to keep open, no restarts</li>
	<li>Works across different networks without both devices being on the same router</li>
	<li>Free for personal use</li>
</ul>

<h2>Install Tailscale:</h2>
<ol>
	<li>
		Go to <b>tailscale.com</b>, create a free account, and install the app on your PC
	</li>
	<li>Sign in and let it connect to your Tailnet</li>
</ol>

<h2>Enable Funnel in Froggi:</h2>
<ol>
	<li>
		Open Froggi and go to <b>Settings → Remote Access</b>
	</li>
	<li>
		Toggle on <b>Tailscale Funnel</b>
	</li>
	<li>
		Your permanent URL will appear under <b>Detected tunnel</b>
	</li>
</ol>

<h2>
	Share the P1 and P2 player URLs (append <code>/set/p/1</code> and <code>/set/p/2</code> to the
	base URL) with players. Since the URL is permanent, you can prepare these links in advance.
</h2>
