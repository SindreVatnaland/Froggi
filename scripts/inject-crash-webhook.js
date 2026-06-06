#!/usr/bin/env node
/**
 * Bakes the crash-report webhook into the app at build time.
 *
 *   node scripts/inject-crash-webhook.js            # inject from DISCORD_USER_CRASH_REPORT_WEBHOOK
 *   node scripts/inject-crash-webhook.js --restore  # reset the file to empty
 *
 * The webhook URL is read from the DISCORD_USER_CRASH_REPORT_WEBHOOK env var (a GitHub Actions
 * secret in CI). If the var is unset, injection is a no-op so local builds stay inert.
 * Run with --restore after the build to keep the working tree clean.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'electron', 'services', 'crashWebhook.ts');
const restore = process.argv.includes('--restore');
const EMPTY_LINE = "export const BUILD_CRASH_WEBHOOK = '';";

function setValue(value) {
	const src = fs.readFileSync(target, 'utf8');
	const next = src.replace(
		/export const BUILD_CRASH_WEBHOOK = '.*';/,
		`export const BUILD_CRASH_WEBHOOK = '${value}';`,
	);
	fs.writeFileSync(target, next);
}

if (restore) {
	setValue('');
	console.log('[crash-webhook] restored to empty');
	process.exit(0);
}

const webhook = (process.env.DISCORD_USER_CRASH_REPORT_WEBHOOK || '').trim();
if (!webhook) {
	console.log('[crash-webhook] DISCORD_USER_CRASH_REPORT_WEBHOOK not set — leaving webhook empty');
	process.exit(0);
}

// Escape single quotes / backslashes so the value is a safe TS string literal.
const safe = webhook.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
setValue(safe);
console.log('[crash-webhook] injected webhook into build');
