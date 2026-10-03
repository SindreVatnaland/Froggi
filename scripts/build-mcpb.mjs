// Packs mcp-extension/ into build_electron/electron/froggi.mcpb (the Claude Desktop extension),
// stamping the app version into the manifest. Runs as part of `npm run copy`.
import { packExtension } from '@anthropic-ai/mcpb';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;

// Stage a copy so the version stamp never dirties the source manifest.
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'froggi-mcpb-'));
fs.cpSync(path.join(root, 'mcp-extension'), stage, { recursive: true });
const manifestPath = path.join(stage, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const outDir = path.join(root, 'build_electron', 'electron');
fs.mkdirSync(outDir, { recursive: true });
const ok = await packExtension({ extensionPath: stage, outputPath: path.join(outDir, 'froggi.mcpb'), silent: true });
fs.rmSync(stage, { recursive: true, force: true });
if (!ok) {
	console.error('Failed to pack froggi.mcpb');
	process.exit(1);
}
console.log(`Packed froggi.mcpb (v${version})`);
