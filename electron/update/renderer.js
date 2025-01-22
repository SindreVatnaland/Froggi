const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const skipUpdate = document.getElementById('skip-update');
const downloadButton = document.getElementById('download-updates');

window.electron.autoUpdater.checkForUpdates();

downloadButton.addEventListener('click', () => {
	window.electron.autoUpdater.downloadUpdate();
});

skipUpdate.addEventListener('click', () => {
	console.log('skipping update');
	window.electron.autoUpdater.skipUpdate();
});

window.electron.autoUpdater.onStatus((status) => {
	statusMessage.textContent = `Status: ${status}`;
	if (status === 'Update Available') {
		downloadButton.disabled = false;
	}
});

window.electron.autoUpdater.onProgress((progress) => {
	progressBar.style.display = 'block';
	progressBar.value = progress;
	progressText.textContent = `${progress}%`;
});
