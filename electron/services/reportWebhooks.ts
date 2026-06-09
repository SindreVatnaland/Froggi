// Build-time injected report webhooks.
//
// Froggi sends a few kinds of reports to Discord, each to its own channel:
//   DISCORD_USER_CRASH_REPORT_WEBHOOK   -> crashes, unhandled errors, and bug reports
//   DISCORD_USER_FEATURE_REPORT_WEBHOOK -> user feature requests
//
// These constants are committed EMPTY. During a release build,
// scripts/inject-report-webhooks.js rewrites the lines below from the matching
// environment variables (GitHub Actions secrets), baking the URLs into the app.
//
// Do NOT commit real webhooks here. Local/dev clones keep them empty, which leaves
// reporting inert unless the matching env var is set in the shell.
export const BUILD_CRASH_WEBHOOK = '';
export const BUILD_FEATURE_WEBHOOK = '';
