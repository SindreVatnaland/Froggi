<script lang="ts">
	import { AutoUpdaterStatus } from '$lib/models/enum';
	import { AutoUpdater } from '$lib/models/types/autoUpdaterTypes';
	import { autoUpdater, electronEmitter, isElectron } from '$lib/utils/store.svelte';
	import TextFitMulti from '../TextFitMulti.svelte';
	import { tooltip } from 'svooltip';

	const getStyle = (autoUpdater: AutoUpdater) => {
		switch (autoUpdater.status) {
			case AutoUpdaterStatus.LookingForUpdate:
				return 'border: 1px solid black;';
			case AutoUpdaterStatus.UpdateAvailable:
				return 'border: 1px solid green; background-color: green;';
			case AutoUpdaterStatus.Downloading:
				return 'border: 1px solid yellow; background-color: yellow;';
			case AutoUpdaterStatus.DownloadComplete:
				return 'border: 1px solid green; background-color: green;';
			case AutoUpdaterStatus.Installing:
				return 'border: 1px solid yellow;';
			case AutoUpdaterStatus.UpToDate:
				return '';
			default:
				return '';
		}
	};

	const getAnimation = (autoUpdater: AutoUpdater) => {
		switch (autoUpdater.status) {
			case AutoUpdaterStatus.LookingForUpdate:
				return 'pulse';
			case AutoUpdaterStatus.UpdateAvailable:
				return 'pulse';
			default:
				return '';
		}
	};

	const getContent = (autoUpdater: AutoUpdater) => {
		switch (autoUpdater.status) {
			case AutoUpdaterStatus.LookingForUpdate:
				return 'Checking';
			case AutoUpdaterStatus.UpdateAvailable:
				return 'Update';
			case AutoUpdaterStatus.Downloading:
				return `${autoUpdater.progress}%`;
			case AutoUpdaterStatus.DownloadComplete:
				return 'Install';
			case AutoUpdaterStatus.Installing:
				return 'Installing';
			case AutoUpdaterStatus.UpToDate:
				return `v${autoUpdater.version}`;
			default:
				return `v${autoUpdater.version}`;
		}
	};

	const installUpdate = () => {
		switch ($autoUpdater.status) {
			case AutoUpdaterStatus.UpdateAvailable:
				$electronEmitter.emit('AutoUpdaterDownloadUpdate');
				break;
			case AutoUpdaterStatus.DownloadComplete:
				$electronEmitter.emit('AutoUpdaterInstall');
				break;
			default:
				$electronEmitter.emit('AutoUpdaterCheckForUpdate');
				break;
		}
	};
</script>

<div
	class="w-12 h-12 relative flex justify-center items-center"
	use:tooltip={{
		content: `<p>${$autoUpdater.status}</p>`,
		html: true,
		placement: 'left',
		delay: [1000, 0],
		offset: 25,
	}}
>
	{#if $isElectron}
		<button
			class="w-11 h-11 transition rounded-2xl z-50 cursor-pointer flex justify-center items-center bg-white"
			on:click={installUpdate}
		>
			<div class={`${getAnimation($autoUpdater)} w-full h-full`} />
			<button
				class={`w-full h-full bg-black bg-opacity-30 justify-center rounded-2xl col-auto p-2`}
				style={`${getStyle($autoUpdater)}`}
			>
				<div class="max-h-2 w-full text-center">
					{#key $autoUpdater}
						<TextFitMulti>{`${getContent($autoUpdater)}`}</TextFitMulti>
					{/key}
				</div>
			</button>
		</button>
	{/if}
</div>
