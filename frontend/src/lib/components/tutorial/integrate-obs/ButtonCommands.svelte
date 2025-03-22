<script lang="ts">
	import { LiveStatsScene } from '$lib/models/enum';
	import { startCase } from 'lodash';
</script>

<h1 class="text-2xl font-semibold">Controller Commands</h1>

<h2>
	Much like the scene switch commands, we can also add controller commands that will trigger when
	a combination of buttons are being pressed.
</h2>

<h2>
	*Note that this feature is only available for <b>Windows</b>
	users*
</h2>

<h2>
	Lets start with going to <b>OBS Icon</b>
	&gt;
	<b>OBS Settings</b>
	&gt;
	<b>Scene Commands</b>
	and enable
	<b>Controller Commands</b>
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-controller-commands.png"
	alt="OBS controller commands"
/>

<h2>
	Now we can add a new command by clicking on the
	<b>Add New Command</b>
	button
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-controller-command-modal.png"
	alt="OBS controller command modal"
/>

<h2>
	You will get a list of buttons that you can choose from. Select a button combination that you
	want to use as a trigger.
</h2>

<h2>
	Then we can select the command we want triggered, and click <b>Add Command</b>
	.
</h2>

<img
	class="border-secondary"
	src="/image/tutorial/integrate-obs/obs-controller-commands-preview.png"
	alt="OBS controller commands preview"
/>

<h2>The command should look something like this when added.</h2>

<h2>
	<b>Dolphin</b>
	needs to be opened for
	<b>Froggi</b>
	 to read the button inputs. The buttons previewed on each command should be highlighted when a button
	is being pressed to verify that the controller is registered.
</h2>
