#!/usr/bin/env node
/**
 * Bakes the report webhooks into the app at build time.
 *
 *   node scripts/inject-report-webhooks.js            # inject from env vars
 *   node scripts/inject-report-webhooks.js --restore  # reset the file to empty
 *
 * Each URL is read from its env var (GitHub Actions secrets in CI). Unset vars are
 * left empty so local builds stay inert. Run with --restore after the build to keep
 * the working tree clean.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'electron', 'services', 'reportWebhooks.ts');
const restore = process.argv.includes('--restore');

// Maps the exported constant -> the env var that supplies it.
const WEBHOOKS = {
	BUILD_CRASH_WEBHOOK: 'DISCORD_USER_CRASH_REPORT_WEBHOOK',
	BUILD_FEATURE_WEBHOOK: 'DISCORD_USER_FEATURE_REPORT_WEBHOOK',
};

function setValue(constName, value) {
	const src = fs.readFileSync(target, 'utf8');
	const next = src.replace(
		new RegExp(`export const ${constName} = '.*';`),
		`export const ${constName} = '${value}';`,
	);
	fs.writeFileSync(target, next);
}

for (const [constName, envVar] of Object.entries(WEBHOOKS)) {
	if (restore) {
		setValue(constName, '');
		continue;
	}
	const webhook = (process.env[envVar] || '').trim();
	if (!webhook) {
		console.log(`[webhook] ${envVar} not set — leaving ${constName} empty`);
		continue;
	}
	// Escape single quotes / backslashes so the value is a safe TS string literal.
	const safe = webhook.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
	setValue(constName, safe);
	console.log(`[webhook] injected ${constName}`);
}

if (restore) console.log('[webhook] restored to empty');
