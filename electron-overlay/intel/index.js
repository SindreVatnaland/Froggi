const os = require('os');

const cpuInfo = (os.cpus()[0]?.model || '').toLowerCase();

const isIntel = cpuInfo.includes('intel');

let Overlay = null;

if (os.platform() === 'win32' && isIntel) {
	try {
		Overlay = require('./electron-overlay.node');
	} catch (error) {
		console.error('Failed to load electron-overlay on Windows:', error);
	}
	console.warn('electron-overlay is only supported on Windows. Skipping module load.');
}

module.exports = Overlay;
