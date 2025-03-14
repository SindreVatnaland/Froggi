const os = require('os');

const isX64 = os.arch() === 'x64';
const cpuInfo = os.cpus()[0]?.model || '';

const isIntel = isX64 && cpuInfo.includes('Intel');
const isAMD = isX64 && cpuInfo.includes('AMD');

let Overlay = null;

if (os.platform() === 'win32') {
	try {
		switch (true) {
			case isIntel:
				Overlay = require('./electron-overlay-intel64.node');
				break;
			case isAMD:
				Overlay = require('./electron-overlay-amd64.node');
				break;
			default:
				console.warn('Unsupported CPU architecture:', cpuInfo);
		}
	} catch (error) {
		console.error('Failed to load electron-overlay on Windows:', error);
	}
} else {
	console.warn('electron-overlay is only supported on Windows. Skipping module load.');
}

module.exports = Overlay;
