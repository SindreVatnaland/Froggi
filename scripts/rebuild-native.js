// Rebuilds better-sqlite3 against Electron's Node ABI. `npm install` builds it for the
// system Node (e.g. v26 = ABI 147), but Electron 32 bundles Node 20 (ABI 128), so the
// app dies at startup with ERR_DLOPEN_FAILED / "NODE_MODULE_VERSION 147 ... requires 128".
// This is the standard Electron post-install step, done from source because @electron/rebuild
// and electron-builder's install-app-deps both misbehave under very new system Node.
const { execSync } = require('child_process');
const { homedir } = require('os');
const path = require('path');
const fs = require('fs');

const modDir = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
if (!fs.existsSync(modDir)) process.exit(0); // deps not installed yet — nothing to rebuild

let target;
try {
	target = require('electron/package.json').version;
} catch {
	process.exit(0); // no electron in this tree (e.g. frontend-only install)
}

console.log(`Rebuilding better-sqlite3 for Electron ${target} (${process.arch})...`);
execSync(
	`npx node-gyp rebuild --target=${target} --arch=${process.arch} --dist-url=https://electronjs.org/headers`,
	{ cwd: modDir, stdio: 'inherit', env: { ...process.env, HOME: path.join(homedir(), '.electron-gyp') } },
);
