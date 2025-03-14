const os = require('os');
let isArm64 = os.arch() === 'x64';

let Overlay = null;

if (os.platform() === 'win32') {
	try {
		const moduleName = isArm64
			? './electron-overlay-arm64.node'
			: './electron-overlay-intel64.node';
		Overlay = require(moduleName);
	} catch (error) {
		console.error('Failed to load electron-overlay on Windows:', error);
	}
} else {
	console.warn('electron-overlay is only supported on Windows. Skipping module load.');
}

module.exports = Overlay;
