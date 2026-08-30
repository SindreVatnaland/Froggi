// Rebuilds better-sqlite3 against Electron's Node ABI for LOCAL dev. `npm install` builds it for the
// system Node (e.g. v26 = ABI 147), but Electron 32 bundles Node 20 (ABI 128), so `npm run dev` dies
// at startup with ERR_DLOPEN_FAILED otherwise. Done from source because @electron/rebuild and
// electron-builder's install-app-deps both misbehave under very new system Node.
//
// SKIPPED IN CI on purpose: CI's `npm run test` runs under Node (jest) and needs the Node ABI (the
// default `npm ci` is already correct), and `npm run build` (electron-builder, npmRebuild defaults
// true) rebuilds native deps for Electron itself using prebuilt binaries — no compiler required. If
// this script ran in CI it would (a) leave the wrong ABI for the tests and (b) force a from-source
// build that fails on runners without a C/C++ toolchain (e.g. Windows without Visual Studio).
//
// Also non-fatal: a failed rebuild must never break `npm install`. If it fails locally and `npm run
// dev` then crashes with ERR_DLOPEN_FAILED, rebuild manually:
//   cd node_modules/better-sqlite3 && HOME=~/.electron-gyp npx node-gyp rebuild \
//     --target=$(node -p "require('electron/package.json').version") --arch=$(node -p process.arch) \
//     --dist-url=https://electronjs.org/headers
const { execSync } = require('child_process');
const { homedir } = require('os');
const path = require('path');
const fs = require('fs');

if (process.env.CI) {
	console.log('CI detected — skipping local Electron rebuild (tests use Node ABI; electron-builder rebuilds for Electron at build time).');
	process.exit(0);
}

const modDir = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
if (!fs.existsSync(modDir)) process.exit(0); // deps not installed yet — nothing to rebuild

let target;
try {
	target = require('electron/package.json').version;
} catch {
	process.exit(0); // no electron in this tree (e.g. frontend-only install)
}

console.log(`Rebuilding better-sqlite3 for Electron ${target} (${process.arch})...`);
try {
	execSync(
		`npx node-gyp rebuild --target=${target} --arch=${process.arch} --dist-url=https://electronjs.org/headers`,
		{ cwd: modDir, stdio: 'inherit', env: { ...process.env, HOME: path.join(homedir(), '.electron-gyp') } },
	);
} catch (err) {
	// Never fail the install. Dev may still work (a matching prebuilt), or the user rebuilds manually.
	console.warn(`\nbetter-sqlite3 Electron rebuild failed (continuing). If "npm run dev" crashes with ERR_DLOPEN_FAILED, rebuild manually — see scripts/rebuild-native.js. Reason: ${err.message}`);
}
