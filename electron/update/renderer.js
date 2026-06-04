const statusEl = document.getElementById('status-message');
const progressTrack = document.getElementById('progress-track');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const skipBtn = document.getElementById('skip-update');
const downloadBtn = document.getElementById('download-updates');
const closeBtn = document.getElementById('close-btn');

function setStatus(text) {
	statusEl.textContent = text;
}

function showProgress(percent) {
	progressTrack.classList.add('visible');
	progressFill.style.width = `${percent}%`;
	progressLabel.textContent = `${percent}%`;
}

skipBtn.addEventListener('click', () => window.electron.autoUpdater.skipUpdate());
closeBtn.addEventListener('click', () => window.electron.autoUpdater.skipUpdate());

downloadBtn.addEventListener('click', () => {
	downloadBtn.disabled = true;
	skipBtn.disabled = true;
	window.electron.autoUpdater.downloadUpdate();
});

window.electron.autoUpdater.onStatus((status) => {
	if (status.startsWith('available:')) {
		const version = status.slice('available:'.length);
		setStatus(`v${version} is available`);
		downloadBtn.textContent = 'Download';
		downloadBtn.disabled = false;
		closeBtn.disabled = false;
		skipBtn.disabled = false;
		return;
	}

	switch (status) {
		case 'checking':
			setStatus('Checking for updates…');
			break;
		case 'downloading':
			setStatus('Downloading update…');
			skipBtn.disabled = true;
			downloadBtn.disabled = true;
			closeBtn.disabled = true;
			break;
		case 'up-to-date':
			setStatus('Froggi is up to date ✓');
			skipBtn.disabled = true;
			downloadBtn.disabled = true;
			closeBtn.disabled = false;
			break;
		case 'installing':
			setStatus('Installing update…');
			skipBtn.disabled = true;
			downloadBtn.disabled = true;
			closeBtn.disabled = true;
			showProgress(100);
			break;
		case 'download-error':
			setStatus('Download failed — try again?');
			downloadBtn.textContent = 'Retry';
			downloadBtn.disabled = false;
			closeBtn.disabled = false;
			skipBtn.disabled = false;
			showProgress(0);
			break;
		case 'error':
			setStatus('Update check failed');
			closeBtn.disabled = false;
			break;
	}
});

window.electron.autoUpdater.onProgress((percent) => {
	showProgress(percent);
});
