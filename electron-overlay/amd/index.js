const os = require('os');

let Overlay = null;
let initialized = false;

function initialize(logger = null) {
	if (initialized) return Overlay;

	if (os.platform() === 'win32') {
		try {
			Overlay = require('./electron-overlay.node');
		} catch (error) {
			logger.error('Failed to load electron-overlay on Windows:', error);
			Overlay = null;
		}
	}

	initialized = true;
	return Overlay;
}

module.exports = {
	initialize,
};
