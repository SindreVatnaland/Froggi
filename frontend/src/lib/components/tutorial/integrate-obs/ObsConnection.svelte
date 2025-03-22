<script lang="ts">
</script>

<h1 class="text-2xl font-semibold">Set up an OBS Connection</h1>

<h2>To make the most out of Froggi, we can start off by setting up a connection to OBS.</h2>
<h2>
	This connection will allow us to send and receive commands from OBS, such as changing scenes or
	adjusting audio levels.
</h2>
<h2>
	*Note that connecting to <b>OBS</b>
	isn't required to embed overlays*
</h2>
<h2>Lets start by opening OBS</h2>
<h2>
	Then hover over <b>Tools</b>
	and click on
	<b>WebSocket Server Settings</b>
</h2>

<img class="border-secondary" src="/image/tutorial/integrate-obs/obs-tools.png" alt="Obs tools" />

<h2>
	Then we can <b>Enable</b>
	the
	<b>WebSocket Server</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/enable-websocket-server.png"
	alt="Enable websocket server"
/>

<h2>
	<b>Froggi</b>
	should be able to connect to
	<b>OBS</b>
	automatically. This can take up to 2 minutes or you can restart
	<b>Froggi</b>
	.
</h2>

<h2>
	If OBS still wont connect, you can manually enter the IP address and port number of OBS by going
	to <b>OBS Icon</b>
	&gt;
	<b>OBS Settings</b>
	&gt;
	<b>Websocket Settings</b>
	. And
	<b>Connect</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/websocket-settings.png"
	alt="Froggi websocket settings"
/>

<h2>
	Once this is done, OBS should be connected to Froggi and the border of th OBS icon on the right
	navbar should turn green.
</h2>
