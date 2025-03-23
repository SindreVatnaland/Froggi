const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const skipUpdate = document.getElementById('skip-update');
const downloadButton = document.getElementById('download-updates');

window.electron.autoUpdater.checkForUpdates();

downloadButton.addEventListener('click', () => {
	downloadButton.disabled = true;
	window.electron.autoUpdater.downloadUpdate();
});

skipUpdate.addEventListener('click', () => {
	window.electron.autoUpdater.skipUpdate();
});

window.electron.autoUpdater.onStatus((status) => {
	if (status === 'Update Available') {
		downloadButton.disabled = false;
	}
	statusMessage.textContent = `${status}`;
});

window.electron.autoUpdater.onProgress((progress) => {
	statusMessage.textContent = `${'Downloading Update'}`;
	progressBar.value = progress;
	progressText.textContent = `${progress}%`;
});
