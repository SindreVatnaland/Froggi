// Build-time injected secrets (Discord webhooks + app ids).
//
// Froggi sends a few kinds of reports to Discord, each to its own channel:
//   DISCORD_USER_CRASH_REPORT_WEBHOOK   -> crashes, unhandled errors, and bug reports
//   DISCORD_USER_FEATURE_REPORT_WEBHOOK -> user feature requests
//   DISCORD_PUBLIC_GAME_WEBHOOK         -> public lobby invites (posted on open, deleted on start/stop)
//
// It also needs the Discord RPC application id for Rich Presence:
//   DISCORD_FROGGI_CLIENT_ID            -> Discord application/client id used by discord-rpc
//
// These constants are committed EMPTY. During a release build,
// scripts/inject-report-webhooks.js rewrites the lines below from the matching
// environment variables (GitHub Actions secrets), baking the values into the app.
//
// Do NOT commit real values here. Local/dev clones keep them empty; set the matching
// env var in your shell to enable the feature during development.
export const BUILD_CRASH_WEBHOOK = '';
export const BUILD_FEATURE_WEBHOOK = '';
export const BUILD_PUBLIC_GAME_WEBHOOK = '';
export const BUILD_DISCORD_CLIENT_ID = '';
