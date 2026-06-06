// Build-time injected crash-report webhook.
//
// This file is committed with an EMPTY value. During a release build,
// scripts/inject-crash-webhook.js rewrites the line below from the
// DISCORD_USER_CRASH_REPORT_WEBHOOK environment variable, baking the URL into the app.
//
// Do NOT commit a real webhook here. Local/dev clones keep it empty, which
// leaves crash reporting inert unless DISCORD_USER_CRASH_REPORT_WEBHOOK is set in the shell.
export const BUILD_CRASH_WEBHOOK = '';
