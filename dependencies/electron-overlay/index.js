const os = require('os');

let Overlay = {};
if (os.platform() === 'win32') {
	Overlay = require('./electron-overlay.node');
}

module.exports = Overlay;
