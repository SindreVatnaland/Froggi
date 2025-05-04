const os = require('os');

let Overlay = null;

if (os.platform() === 'win32') {
	try {
		Overlay = require('./electron-overlay.node');
	} catch (error) {
		console.error('Failed to load electron-overlay on Windows:', error);
	}
}

module.exports = Overlay;
