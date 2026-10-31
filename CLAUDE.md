# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working style

Concise AI Pair Programmer Rules

Be short and direct. Never explain more than asked.
Never start implementing when requirements are vague. Block progress until the following is defined:

Directory structure
Tech stack
Architecture approach


When I propose a solution, analyze it silently first. Only raise concerns if you spot a genuine flaw or significant optimization — explain it briefly, then wait for my decision.
Never suggest how to do something unless I ask. Ask what I want, not how you think it should be done.
If I ask for a change, require me to explain the approach before writing any code.
I own all design decisions. Your job is to execute them precisely.

## Logs

When debugging recent issues (crashes, wrong behavior, event ordering), read `~/Library/Logs/Froggi/main.log` directly — it contains the full Electron runtime log including game start/end JSON, bingo events, and service errors. Check it before guessing at root causes.

## Commands

```bash
# Install all deps (root + frontend)
npm run install:all

# Dev (nodemon watches electron/, restarts dev:all on change)
npm run dev

# Dev parallel (Svelte + Electron separately)
npm run dev:all

# Compile Electron only (fast, no Svelte build)
npm run compile:electron

# Full compile (Svelte + Electron)
npm run compile

# Build for current OS
npm run build

# Run tests (compiles electron first, copies sample games, runs jest)
npm run test
```

Tests live in `test/unit/` but run from `build_electron/test/` after compilation. Jest matches `build_electron/test/**/*.test.js`.

## Architecture

Froggi is an Electron + SvelteKit desktop app that reads Slippi (Super Smash Bros. Melee replay) data and drives OBS overlays.

### Process boundaries

- **Electron main** (`electron/main.ts`): bootstraps everything, registers tsyringe DI container, resolves all services after `dom-ready`
- **Preload** (`electron/preload.ts`): exposes `window.electron` to renderer via `contextBridge` — single `message` channel using JSON payloads
- **SvelteKit renderer** (`frontend/`): UI, runs in Electron renderer or standalone browser/PWA
- **WebSocket worker** (`electron/services/workers/websocketWorker.ts`): separate thread, port 3100 — handles external clients (OBS browser sources, mobile)
- **Express server** (`electron/services/messageHandler.ts`): port 3200, serves static frontend in production and `appDir/public/` for user assets

### Shared code

`frontend/src/lib/` is imported by **both** Electron and SvelteKit. Types, models, enums, and utilities live here and must remain runtime-agnostic. Electron imports these directly via relative paths (`../../frontend/src/lib/...`).

### Event system

All inter-process communication uses a single `MessageEvents` interface (`frontend/src/lib/utils/customEventEmitter.ts`). Adding a new event means:
1. Add the signature to `MessageEvents`
2. Emit from Electron via `messageHandler.sendMessage(topic, ...payload)`
3. Handle in SvelteKit in the `messageDataHandler` switch in `initEventListener.svelte`

Two emitters exist in Electron:
- `localEmitter` — internal Electron-only events
- `clientEmitter` — events from the renderer (IPC) or external WebSocket clients

`MessageHandler.sendMessage()` fans out to all three destinations: IPC renderer, WebSocket worker, and `localEmitter`.

### State management

| Layer | Storage | Contents |
|---|---|---|
| Runtime (Electron) | `electron-store` (JSON) | Settings, live stats, OBS config, session data |
| Persistent | SQLite + TypeORM | Overlays, game history, player data |
| Runtime (Frontend) | Svelte `writable` stores (`store.svelte`) | Mirror of all Electron state pushed via events |

Store classes in `electron/services/store/` follow naming `Electron<Domain>Store` and are all `@singleton()` tsyringe services.

### Dependency injection

All Electron services use tsyringe `@singleton()` + `@inject()`. Services are registered in `main.ts` after `dom-ready` and resolved in order. Circular deps use `delay(() => ServiceClass)`.

### Ports

| Port | Purpose |
|---|---|
| 5173 | Vite dev server |
| 3100 | WebSocket (external clients — OBS browser sources, mobile) |
| 3200 | Express HTTP + WS upgrade (production static serve, Tailscale/remote clients) |

### Remote access (Tailscale / ngrok)

Remote clients connect via WS upgrade on port 3200 (not port 3100). Tailscale Funnel always exposes `BACKEND_PORT` (3200).

- **Tailscale** (recommended): `electron/services/messageHandler.ts` detects status via `tailscale status --json` (`BackendState` field) and `tailscale serve status --json` (`AllowFunnel` field). Toggle in Settings → Remote Access. After enabling funnel, the URL appears in "Detected tunnel".
- **ngrok**: run `ngrok http 3200`, Froggi auto-detects the public URL from the ngrok local API at `localhost:4040`. Hit ↻ in Settings to refresh.
- Dev mode: Express at 3200 proxies page requests to Vite at 5173, so the same port serves both UI and WS — funnel always points to 3200.

### Landing page

`docs/index.html` (GitHub Pages, https://sindrevatnaland.github.io/Froggi/): download button for the visitor's OS (newest stable — non-beta — release with a file for it, via the GitHub API; betas under All releases), short feature cards, Buy Me a Coffee + GitHub + Discord. Keep the cards to one short line each. `docs/join.html` = the invite bounce page.

### Frontend styling conventions

Custom CSS classes are defined in `frontend/src/app.css`. Use them — do not inline equivalent Tailwind chains.

| Class | Purpose |
|---|---|
| `.btn` | Base button style (background, color, font-weight, transition). Add sizing/border on top. |
| `.background-primary-color` | Primary background (`--primary-color`) |
| `.background-secondary-color` | Secondary background |
| `.text-secondary-color` | Text in secondary color |
| `.border-secondary` | 1px border + secondary color + slight radius |
| `.border-secondary-color` | Border color only (no width/radius) |

`background-color-primary` and `color-secondary` are removed aliases — do not use them.

#### Dashboard / settings page conventions

Pages use `<main class="flex justify-center"><div class="w-full max-w-{N}">` for centered content. Max widths: `xl` for settings, `2xl` for nav/list pages, `3xl` for the dashboard.

Dashboard cards use `.dash-card border-secondary` with `.dash-label` (0.7rem, uppercase, 0.4 opacity) for section headers. Section labels in settings use `.section-label` (same style, defined per-page).

Compact toggle rows: `label.toggle-row.border-secondary` with `span.toggle-label` + `input[type=checkbox].toggle-check` (0.9rem). Used in both SceneCommands and the OBS dashboard.

Modals follow the ConfirmModal pattern: `.confirm-box.background-primary-color.border-secondary`, title paragraph, body, footer with Cancel + action button where action button uses `.confirm-ok` (inverted colors). Max-width ~400px.

Do not use `h1`/`h2` for section labels inside cards — use `.dash-label` or a small `<p>` with `font-size: 0.7rem; opacity: 0.4`.

#### Minigame pages (Bingo / Iron Man)

Minigame pages (`minigames/+page.svelte`, `obs/bingo/+page.svelte`, `obs/ironman/+page.svelte`) share a consistent visual language. Follow it exactly when modifying or extending them.

**Settings strip** — idle state, above the board/content:
```html
<div class="settings-row border-secondary">
  <div class="settings-group">
    <span class="settings-label">Label</span>
    <div class="pill-group">
      <button class="pill" class:pill--active={...} on:click={...}>Option</button>
    </div>
  </div>
</div>
```
- `.settings-row`: flex, flex-wrap, gap 1.5rem, padding 0.9rem 1.1rem, border-radius 0.375rem
- `.settings-group`: flex row, align-items center, gap 0.6rem
- `.settings-label`: 0.7rem, uppercase, opacity 0.45
- `.pill`: 0.78rem, border 1px secondary-color, opacity 0.4, border-radius 1rem
- `.pill--active` / `.pill:hover`: opacity 1, color-mix 12% secondary bg
- Order of groups: **Mode first**, then variant/size/other options

**Pill arrays must be typed** — never use TypeScript `as` casts inside Svelte template attribute expressions (causes parse errors). Declare typed arrays in `<script>` instead:
```typescript
const variants: { value: MyType; label: string; tip?: string }[] = [...];
```

**Win/progress display** — `ScoreProgressBar.svelte` (`frontend/src/lib/components/`):
```html
<ScoreProgressBar
  localScore={n} localName="Player"
  oppScore={n|null}  oppName="Opponent"
  target={n} unit="lines"
  localWinner={bool} oppWinner={bool}
/>
```
- Local bar: `rgba(96, 165, 250, 0.85)` (blue), opponent: `rgba(52, 211, 153, 0.85)` (green)
- Winner bar + count turns `#4ade80`
- Pass `oppScore={null}` for solo mode (renders single bar)
- Use this for the **minigames settings page** (has `border-secondary` which needs theme CSS vars)
- OBS overlays use their own inline progress bar CSS (vmin units, no theme vars) — see `.im-pb-*` in `obs/game-preview/+page.svelte`

**Character picker grid** (Iron Man setup):
- `.char-btn`: opacity 0.4, no border, border-radius 6px
- `.char-btn--selected`: `box-shadow: 0 0 0 2px var(--secondary-color)`, tinted bg via color-mix
- `.char-btn--full`: opacity 0.15, cursor not-allowed
- Images: 36×36px CSS sprite from `/image/characters/css/{id}.png`

**Win banner**:
```html
<div class="win-banner border-secondary">
  <span>Bingo!</span>
  <span class="win-score">...</span>
</div>
```
- `.win-banner`: 1.6rem bold, pulsing animation, flex-col centered
- `.win-score`: 0.85rem, opacity 0.75

**Tooltip on hover** — use `svooltip` for rule/hint text on pills:
```html
<button use:tooltip={{ content: 'Rule description', placement: 'top', delay: [400, 0] }}>
```

**Guest join flow** — separate section with `← Back` button (not mixed into the same settings card):
```html
{#if mode === 'guest'}
  <div class="settings-row border-secondary items-center gap-3">
    <button ... on:click={() => mode = 'solo'}>← Back</button>
  </div>
  <div class="dash-card border-secondary flex flex-col gap-4">
    <input class="url-input border-secondary" ... />
    <button class="btn ...">Join</button>
  </div>
{/if}
```

**Lobby waiting state** — inside `dash-card`, use `SlippiAd compact` while waiting, QR code row for share URL.

#### Third-party components

`svelte-qrcode`: renders as JPEG via qrious. Props: `value`, `size` (string px), `color` (hex), `background` (hex). No CSS variable support — use hex values. Import with `// @ts-ignore`.

#### Page transitions

No page-level transitions (`in:fade`, `out:fade`, `in:fly`, `out:fly` on `<main>`). Step-navigation animations within a page (e.g. TutorialPages.svelte) are acceptable.

### App shell notes

- **Right-click menu** (`electron-context-menu` in `main.ts`): the "Dev" (DevTools) entry and Inspect Element only in development (`dev = !app.isPackaged`).
- **External links:** `main.ts` `web-contents-created` → `setWindowOpenHandler`: localhost/file URLs (the `/live` pop-out) open in the app, any other http(s) URL (incl. from iframes such as the Buy Me a Coffee embed) goes to `shell.openExternal`.
- **Buy Me a Coffee:** one global modal (`components/bmc/BuyMeACoffeeModal.svelte`, store `bmcOpen`, mounted in the root layout) opened by the left-navbar button (`navbar/BuyMeACoffee.svelte`) and the Home nav card. Official assets: `static/image/icons/bmc-cup.svg` (white liquid, for yellow buttons) / `bmc-cup-yellow.svg` (official, for light backgrounds), Cookie font (`static/fonts/Cookie-Regular.woff2`, `.font-cookie`), `.bmc` class in app.css (#FFDD00 + shine that starts/ends off-button).
- **OBS process polling** (`obs.ts`): polling for the OBS process is "waiting" (Disconnected), only a real connect attempt is `Searching`; a failed connect goes back to polling after 5 s. `isObsRunning()` matches the executable name exactly. The saved connection state is reset to Disconnected at startup.
- **Updates:** `electron/update/updateFeed.ts` `configureUpdateFeed` runs before every check (startup window + `AutoUpdater`): if the newest release has no update file for this OS yet (CI uploads OS by OS), the feed is pinned to the newest release that has it (`releaseToOffer`, `test/unit/updateFeed.test.ts`).
- **Packaging:** `build.config.json` excludes `build_electron/test/**` (compiled tests + sample replays).

### Discord RPC

`electron/services/discord.ts` — active in all modes (dev included). `updateActivity()` is throttled to 1 call/2s via lodash `throttle`. While hosting a minigame lobby with a spot open, the presence carries a `joinSecret` (the encrypted **ngrok** connect code, built in `buildPartyJoin`) so Discord shows a native **Join** button; otherwise it shows a single **Get Froggi** button (`FROGGI_URL`). A friend clicking Join fires `ACTIVITY_JOIN` → `messageHandler.sendMessage('JoinWithCode', code)` (see Lobby & invites). Iron Man follows the same pattern.

### Lobby & public invites

Two distinct host paths exist — do not conflate them:
- **Per-minigame host** (`bingoService` / `ironmanService`, events `BingoStartLobby` / `IronManStartLobby`): what the minigames page actually uses. Host owns all state; guests join by connect code and report their own progress. Each owns its own peer WebSocket.
- **Generic lobby** (`lobbyService`, `StartLobby` + `/peer` transport): game-agnostic, reachable only from the unlinked `/lobby` route. Its `LobbyStartMinigame` handoff is **not** wired to the minigame services — today `lobbyService` matters as the **invite owner**, not an active hosting path.

**Connect code** = `encryptUrl(ngrokUrl, app.getVersion())` — ngrok only, kept consistent across the Share Code, the `froggi://join` link, and the RPC join secret. Use `messageHandler.getNgrokUrl()` for invites; do **not** use `getRemoteAccessUrl()` (prefers Tailscale).

**Public invite (Discord channel).** `lobbyService` owns the webhook (`BUILD_PUBLIC_GAME_WEBHOOK` / `DISCORD_PUBLIC_GAME_WEBHOOK`) and the `postInvite`/`updateInvite`/`deleteInvite`/`buildInviteEmbed` lifecycle. It drives the post off the **minigame host lobby** by listening to `BingoLobbyState`/`IronManLobbyState` (post + update spots) and `BingoState`/`IronManState` (delete on game start, which also clears `isPublic`). `SetLobbyPublic` toggles it; toggling before a game is picked records the intent and posts once the lobby opens. The embed drops the join link when the lobby is full.

**Join routing (unified).** A `froggi://join/<code>` deep link (`main.ts handleDeepLink`) and the Discord RPC Join (`ACTIVITY_JOIN`) both emit `JoinWithCode(code)` to the renderer → the minigames page runs the normal `joinGame(code)` (decrypts, fetches `/lobby-info`, connects to bingo **or** iron man). `joinGame` blocks self-joins (code resolving to one of our own URLs). Host-side invite surfaces (clickable URL + Public toggle) live in `HostInviteRow.svelte`, rendered beside the Share Code in the minigames host blocks; the toggle state is owned by the page (`invitePublic`) so it survives the host→game remount.

Discord **will not linkify `froggi://`**, so the channel-post embed's clickable link points at the static landing page `docs/join.html?code=<code>` (GitHub Pages), which bounces to `froggi://join/<code>` and offers a download fallback. `postInvite` is guarded by `invitePosting` against double-posting on rapid lobby events.

### Minigame standards

These conventions apply to **all** minigames (Bingo, Iron Man, and any future additions). Deviating from them creates inconsistency that is hard to fix later.

**All game modes use the same event pipeline.** Solo, Local VS, Host, and Guest all emit and receive the same events. Game events (game start/end, stats) are applied to the board/roster regardless of how the session was started. No special-casing per mode. Local VS simply sets `role: 'local'` and provides `opponentRoster` upfront; the service processes game results the same way as online.

**All game logic lives in Electron.** Services (`bingoService.ts`, `ironmanService.ts`) own every state transition, timer, win condition, and side-effect. The frontend is display-only — it never drives game state. When a new client connects, the service sends the full current state via `MessageHandler.initData()` so the overlay is always in sync regardless of when it connected.

**Twitch vote system (Bingo).** Both host and guest chats vote simultaneously on separate option sets (host gets options 0-1, guest gets 2-3 from a single shuffled pool). Guest vote starts with a 0–10s random offset. Resolved votes go into `pendingActions`; `processActionQueue()` drives the popup→action sequence: show result popup for 3s → execute action → 1s pause → clear popup → process next. The frontend reflects state directly from `bingoVoteStates` — no client-side queue.

**Ending a Bingo session.** `StopBingo` (full teardown, closes peer) vs `BingoEndToLobby` (soft stop — preserves peer WebSocket, reopens lobby with `opponentConnected: true`). Use `BingoEndToLobby` when the host wants to return to the mini-game selector while keeping the opponent connected for a future game.

**Overlay aspect ratio.** The OBS browser source is square (1:1). The overlay container uses `width: min(100vw, 100vh); height: min(100vw, 100vh)` to stay square across any viewport. All measurements inside use `vmin` units so they scale with the container. Do not use `px` for layout-critical sizes in the overlay.

**Layout structure.** Bingo: single centered board that fills the square. Iron Man: stacked P1 section (top) → P2 section (bottom) → next-char/status row → reserved chat area. Each player section = name pill + character grid + progress bar.

**Fixed icon grid.** Iron Man character icons are always `6vmin`, always `8` columns (`iconSizeOverride="6vmin" cols={8}`). Icons do not shrink when the roster is larger — additional rows are added instead. Pass `showActiveMarker={false}` when `charOrder === 'free'` so `currentIndex` does not render a spurious active ring.

**Progress bars.** Each player always has an inline progress bar. Iron Man: for `full_roster`/`challenge` tracks `completed / total`; for `standard` tracks `depleted / total`. Local = green `rgba(74, 222, 128, 0.85)`, opponent = red `rgba(248, 113, 113, 0.85)`. These are inline `.im-pb-*` CSS in the overlay page — do not use `ScoreProgressBar` (it has `border-secondary` which requires theme CSS vars).

**Player name chips.** Name is displayed in a dark pill: `background: rgba(0,0,0,0.55); padding: 0.6vmin 1.8vmin; border-radius: 4px`. No `text-shadow`. The progress count `X/Y` sits right-aligned in the same header row.

**Reserved chat area.** A `div.im-chat-reserved` with `height: 6vmin` is always present at the bottom of the iron man overlay. It is empty today but will be filled when chat integration is added. Do not remove or shrink it.

**Win screen.** Both games use the same `.win-screen` component with trophy/skull emoji, large bold title (`IRON MAN!` / `BINGO!`), and subtitle. This is already in `obs/game-preview/+page.svelte` — do not add a separate win screen to new game overlays; extend this one.

### slippi-js 9 — the null boundary

`@slippi/slippi-js` **9.x** (root + frontend). File/connection features come from `@slippi/slippi-js/node` (`SlippiGame` with a path, `DolphinConnection`, `SlpStream` — fed with `stream.process(bytes)`, not a Node stream); the main entry is browser-safe (enums, `SlpParser`, stats computers). slippi-js 9 reports missing values as `undefined`; Froggi keeps `null` everywhere (app types, SQLite entities, `=== null` checks, and JSON to overlays, which drops `undefined` fields). So: **import slippi DATA types (`FrameEntryType`, `GameStartType`, `PlayerType`, `StatsType`…) from `models/types/slippiTypes.ts`**, never from slippi-js, and wrap every slippi value where it enters Froggi in `nulled()` (parser events, `SlippiGame` getters, `ComboComputer`/`ConversionComputer` results). Going back into slippi (its `Stats` computers in `sequenceTracker`) uses `unnulled()`. The aliases keep slippi-js 7's shape where 9 differs (optional `start`/`items`/`stageEvents`, `nametag`/`controllerFix` as `string | null`, optional end fields; `tauntCount` optional) so stored games still fit. Enums/classes still come from slippi-js.

### Overlay injection

`@asdf-overlay/core` + `@asdf-overlay/electron` **2.1.x** (requires **Electron ≥ 43** for `offscreen.useSharedTexture` paint textures) handle injection into the Dolphin game window. Windows-only; on macOS/Linux npm skips them, so types come from the ambient stub `electron/types/asdf-overlay-core.d.ts` (keep it in sync when bumping asdf). `OverlayInjector.injectIntoGame()` shares one in-flight `attachPromise` so concurrent callers (Dolphin connect + auto-inject) wait instead of skipping. After `Overlay.attach(dllDir, pid)`, it follows the game's render **surface** (`surface_added` / `surface_resized` / `surface_destroyed`, bigint ids): a fullscreen toggle or backend switch recreates the swapchain, so it disconnects and reconnects on the next `surface_added`. `ElectronOverlaySurface.connect({ overlay, id, info }, webContents)` pipes the offscreen `BrowserWindow`; positioning is `setPosition(surfaceId, x, y)` in physical px from `fitOverlay()` (always fill the game height, centre horizontally — narrower games incl. 4:3/1:1/portrait crop the sides, wider get margins; never crops vertically; covered by `test/unit/fitOverlay.test.ts`). Texture-scale calibration trusts only the window's first paint (later paints can carry a stale size). Surface copy/IPC errors are logged. Native binaries must be in `app.asar.unpacked` (`asarUnpack` in `build.config.json`).

`better-sqlite3` is **13.x** (Node-API, bundled prebuilds): one binary works under Node (jest) and Electron — no per-ABI rebuild or postinstall needed. npm 10's `npm ci` still runs its binding.gyp (ignores `gypfile:false`), so CI installs the root with `npm ci --ignore-scripts` and `build.config.json` sets `npmRebuild: false` (all native deps ship Node-API prebuilds; `register-scheme` is unused under Electron).

### MCP server (local AI assistant)

`electron/services/mcp/mcpServerService.ts` embeds an MCP server in Electron main, bound to `127.0.0.1:3300` (plain HTTP, loopback only). The path is `/froggi/mcp` (namespaced so it can coexist with other local MCP servers on the port); legacy `/mcp` is still served as an alias. Both are defined by `MCP_SERVER_PATH` in `frontend/src/lib/models/const.ts`. Stateless StreamableHTTP: a fresh `McpServer` + tool set is built per request from live settings, so toggling `mcpReadEnabled` / `mcpWriteEnabled` (Settings → AI Assistant, beta build) takes effect on the next call. Read tools register when read is on; write tools additionally when write is on (`buildMcpServer()`). Optionally exposed over the user's own Tailscale as tailnet-only HTTPS (`mcpTailscaleEnabled`, off by default, `tailscale serve --set-path=/froggi/mcp` → the loopback port; never funnel/public).

Client configs (not in repo): Claude Code uses `~/.claude.json` `type: http`, `url: http://127.0.0.1:3300/froggi/mcp`; Claude Desktop: preferred path is the **local extension** (`mcp-extension/` → packed to `build_electron/electron/froggi.mcpb` by `scripts/build-mcpb.mjs` during `npm run copy`, version stamped from package.json). It's a dependency-free stdio bridge (`mcp-extension/server/index.js`) that forwards every JSON-RPC message unchanged to the loopback endpoint, so all tools/instructions work with no per-tool code; when Froggi is down it still completes the handshake, reports why, polls, and sends `tools/list_changed` once Froggi is back. Settings → AI Assistant → "Connect an AI app" picker: Claude Desktop (`InstallClaudeExtension`, below), Claude Code (copies `claude mcp add --transport http …`), Cursor (`cursor://anysphere.cursor-deeplink/mcp/install?name=froggi&config=<base64 {url}>`), VS Code (`vscode:mcp/install?<json {name,type:http,url}>`), Other (copies `{mcpServers:{froggi:{type:http,url}}}`); deep links go through `OpenUrl` → `shell.openExternal`. Claude Desktop path (`InstallClaudeExtension`) copies the .mcpb to temp and hands it to Claude explicitly (`openWithClaude`: macOS `open -a Claude`; Windows spawns the `WindowsApps\Claude.exe` alias, then legacy `AnthropicClaude\claude.exe`) because Desktop isn't the default .mcpb handler on either OS; on failure it reveals the file in Finder/Explorer. Fallback: `npx mcp-remote http://127.0.0.1:3300/froggi/mcp --transport http-only` in `claude_desktop_config.json`. Desktop's "Add custom connector" URL box goes through the minimal auto-approving OAuth in `mcp/mcpOAuth.ts`.

**OBS read bridge** (`mcp/tools/obsRead.ts`, read access): `get_obs_layout` (scenes → sources with visibility/position/size, program + preview scene, audio volume/mute, stream/record/replay-buffer status, canvas/output resolution + FPS) and `get_obs_screenshot` (PNG of the program output or any scene/source via `GetSourceScreenshot`). Read-only — OBS changes stay in the write tools; a single-colour capture gets a hint (sources not producing video / OS permissions). **OBS status wording** is shared (`utils/obsStatus.ts`): connected / connecting / openNotConnected / closed (Froggi connected before — `ObsConnection.lastConnectedAt`) / notSetUp — used by Home, the Dashboard, `get_app_status` and the OBS tools, so a closed OBS is never shown as "not set up". **Logs:** `read_recent_logs` filters by `search` (text or /regex/), `level` (error/warn), `sessions` (1–5 app runs back) and returns the last `lines` matches.

**Crash diagnosis** (`mcp/tools/crashDiagnosis.ts`): `diagnose_errors` (read) groups errors from the last N sessions (`errorReporter.readLogSessions`, incl. rotated `main.old.log`) and tags them via `KNOWN_ISSUES` as `local` / `benign` / `dev`; unmatched → `unclassified` for Claude to judge. `submit_crash_report` (write, `userConfirmed: true` required — Claude must ask in chat first) sends Claude's summary + scrubbed excerpts via `errorReporter.submitFeedback('bug', …, logOverride)`. When a support issue turns out to be a recurring known cause, add a `KNOWN_ISSUES` entry.

**Overlay authoring tools** (`overlayWrite.ts` / `overlayRead.ts`): layers (`add_overlay_layer` with `titles`, `rename_overlay_layer`, `move_overlay_layer`, `duplicate_overlay_layer` — layer index 0 is drawn on top; `Layer.title` is an optional name shown and edited under each row in the layer panel, and the demo HUD's inGame layers are named + walked through in overlaySchema.ts), `update_overlay_settings` (title/description/aspect ratio), `add_overlay_image` (url / local filePath / base64 / `picker` → Froggi file dialog; saved to `public/custom/<id>/image/`), `delete_overlay` (soft, `userConfirmed: true`) + `restore_overlay`. **The AI can never permanently delete** — permanent delete is UI-only (`OverlayDeletePermanent`, Deleted Overlays page `/obs/overlay/deleted`, only for already soft-deleted overlays). Soft delete = `deletedAt` (ISO) on `OverlayEntity`; the overlays list hides them. `show_overlay_preview` is an **MCP App** (`ui://froggi/overlay-preview`, `text/html;profile=mcp-app`, CSP `frameDomains` = loopback `:3200` only) that iframes `/obs/overlay/<id>/preview?scene=<statsScene>`; clients without MCP Apps get `editUrl` = `http://127.0.0.1:3200/obs/overlay/<id>?edit` (editor in a browser — the route only honours `?edit` on a loopback hostname).

**Overlay screenshots for the AI** (`mcp/tools/overlayScreenshot.ts`, `utils/previewStates.ts`): `capture_overlay_screenshot` renders `/obs/overlay/<id>/preview?scene=&bg=&state=<id>` in a hidden offscreen `BrowserWindow` and returns a PNG. `state` = a frozen replay moment (`previewStateFromReplay`: one of the 10 newest replays at `atSeconds`) served once by `GET /preview-state/:id` (random id, 60 s TTL). The page sets `previewFrozen`, which makes that page alone use real data + visibility conditions and ignore live game topics (`FROZEN_TOPICS` in initEventListener) — live overlays/OBS are untouched. Without a replay it shows editor placeholder data. Elements bound to a doubles slot that the game doesn't have (`playerSlot`, empty `playersForSlot`) render nothing.

**Game HUD references** (`frontend/src/lib/content/hudReferences.ts` + screenshots in `frontend/static/image/hud-references/`, tool `get_game_hud_reference`): 16:9 screenshots of the game's own HUD with regions on the overlay grid (512 columns × 288 rows for every aspect ratio — `COL`/`ROW` in const.ts), so Claude can add elements around the game HUD or replace it. 4:3 / 73:60 are center crops — the tool re-maps regions and crops the image (`nativeImage`). Add a reference = screenshot + entry. `GAME_HUD_GUIDES` (same file) describes each game's HUD behaviour — element, where, when, and the Froggi elements/conditions that recreate it — returned as `hudGuide` with every reference. The same screenshots are editor backdrops ("Game HUD background…" in `ExternalPreviewSettings`) and preview backdrops (`/obs/overlay/<id>/preview?bg=<id>`, centered `cover` = center crop). Preview page flags: `?scene=` pins a scene, `?controls` adds "▶ Test animations", which (like MCP `test_overlay_animation`) emits `PreviewTestAnimation(overlayId, itemId?)` — AnimationLayer replays its key, VisibilityAnimationLayer hides→shows (preview renders only). New overlays default to the `fly automatic` scene animation (`getNewOverlay`).

**Online play & error flags (MCP):** `onlinePlay.ts` — `get_online_play_status` (ngrok status + lobbies + nextStep + how to share/enter the code), `ngrok_setup` (emits `NgrokInstall`/`NgrokSetAuthtoken`/`NgrokStart`/`NgrokStop`). By design Claude does **not** hand out or enter connect codes — it explains where the Share Code is and how the friend joins; it explains simple tasks first and only acts when asked. Only the host needs ngrok. The minigame stream view is `/obs/game-preview` (both games, 800×1100) — `/obs/bingo` / `/obs/ironman` are host/settings pages; Minigames reach Dolphin via a custom overlay with the `BingoBoard` (9000) / `IronManRoster` (9010) elements + injection. Crash diagnosis keeps local flags (`mcp.errorFlags` in electron-store: reported/resolved); `submit_crash_report` flags as reported, `mark_errors` sets/clears, resolved are hidden; Claude runs `diagnose_errors` once early and offers to report `unreportedDeveloperErrors`.

**Character asset packs & .froggi files:** `assetPackService.ts` — packs are folders `appData/public/asset-packs/<id>/` (manifest.json + `<characterId>/<skinId>.<ext>`), no DB; built-ins (`BUILTIN_ASSET_PACKS` in `models/types/assetPack.ts`) point at the bundled `static/image/characters/<char>/<skin>/{stock,portrait,vs-left,vs-right}.png`. Lookup (`resolvePackImage`): skin → skin 0 → the pack's built-in `fallback`. Costume names per character: `MELEE_CHARACTER_SKINS` (generated from slippi-js; 4–6 skins). Element: `InGamePlayer1Character`/`InGamePlayer2Character`/`InGameCurrentPlayerCharacter` (6225/6235/6215, `payload.assetPack`), rendered by `elementRender/PackCharacter.svelte`; the old CharacterIcon/CharacterRender elements still render but are hidden from the picker. Images > 1024px are downsampled (`normalizeImage`; GIF/WebP kept as-is). Sharing uses **.froggi** = zip (fflate) with manifest.json + JSON + raw files (`utils/froggiFile.ts`); overlay export embeds every custom pack it uses; import reuses an identical local pack (same id + same file hash) or imports a copy and remaps `assetPack` refs. Legacy `.json` overlays (base64 customFiles) still import. MCP: `list_asset_packs`, `get_asset_pack`, `create_asset_pack`, `set_asset_pack_slot`.

**Overlay assets:** the live overlay page (`SecondaryOverlay`, not previews) mounts `AssetPreloader.svelte` — `utils/overlayAssets.ts` `preloadPlan` lists every scene background + CustomImage URL, the shown scene (active or its fallback) first with a 3px top bar, then the rest; it waits for `urls` so URLs point at the right host. CustomImage files ending .mp4/.webm render as `<video autoplay muted loop playsinline>` (uploads + `add_overlay_image` accept them, 50MB cap; scene backgrounds stay images).

**Animation triggers (`utils/elementTriggers.ts`, `test/unit/elementTriggers.test.ts`):** an element has animation 1 (`data.animationTrigger`) + optional `data.extraAnimationTriggers[]`, each `{in, out, selectedOptions, elementTriggers?}`; `AnimationStack.svelte` nests one `AnimationLayer` per animation (content innermost). A trigger (named label or `source|when`) belongs to one animation of an element (picker greys it out elsewhere). Element triggers `{source: "self" | itemId, when: change|increase|decrease}` watch what an element SHOWS: `elementValue` action (GridContent, `display: contents` wrapper) publishes `elementSnapshot` (text + img/video src + background-image, or a `data-trigger-value` the element sets — Video = reel id) into the `elementValues` store; the newest copy owns the id (fading copies don't count); appearing/disappearing never fires (`elementTriggerFires`). An animation with in + out "none" never replays. New elements get `[{source:"self", when:"change"}]` (`getNewElementPayload` — NOT in `getDefaultElementPayload`, which is merged into old elements; MCP only when the payload has no animationTrigger). Legacy "value changed" named triggers (`LEGACY_TRIGGER_ELEMENTS` / `LEGACY_TRIGGERS`) are hidden in the picker unless selected and still evaluated; `migrateOverlayTriggers` (startup migration, demo upload, import; idempotent) converts one to "self" only when the element itself shows that value, drops unknown labels, keeps the rest. Game-event triggers (percent increase, stock loss, countdown, technique, striking) stay named. Shipped demo JSONs are already modern (no legacy labels — `elementTriggers.test.ts` checks it); the pre-migration HUD lives in `test/fixtures/legacy-hud.json` as the legacy fixture. MCP `update_overlay_element` (`storeOverlay.updateItemInLayer`) merges objects but REPLACES arrays, so element triggers / extra animations / visibility lists can be edited and removed.

**Count animation (`utils/countUp.ts`, `element/animations/elementCount.ts`, `test/unit/countUp.test.ts`):** trigger In type `Animation.Count` (offered only in trigger In inputs — `AnimationInput allowCount`). A fire sets a 250 ms "count pending"; when the element's own published value changes, `startCount` counts the DOM text (30 ticks/s, svelte easing by name, new value's format) — only if old + new are `parsePureNumber` (minus, digits, 1,500, decimals, trailing %). The number may span text nodes ("57" + ".3%"); `writeNumber` rewrites digits only. While counting the published value is frozen via `data-trigger-value` on the wrapper's first child (watchers see real changes only); a real re-render mid-count retargets from the shown number. Raw percent elements 1013–1015 (`PlayerPercent raw`) show the number without %.

**Overlay warnings (`utils/overlayWarnings.ts`, `test/unit/overlayWarnings.test.ts`):** `sceneWarnings` flags elements pointing at things that don't exist — a Video (2100) key no ENABLED flow sets (Set video / Build highlight reel), an element trigger whose source item is gone. Editor: red outline (BoardEdit), "⚠ N problems" on the layer row (LayerToggle → LayerDisplayRow), a note atop the element settings (StylingSelect); the editor emits `FlowsRequest` on mount. MCP `get_overlay` returns them as `warnings`.

**KO effects (live viewer, `utils/viewer/koEffects.ts`, `test/unit/koEffects.test.ts`, preview page `/obs/debug/ko`):** `GameStateRender` detects a player ENTERING a dead action state (`detectKos`; not when first seen dead): 0–3 (down/left/right/top explosion) → Melee-style blast — a beam of the player's colour + white core + flash + sparks, at the player's last position (previous frame, kept inside the stage `blastZones`), aimed by the state back into the stage, world-sized; 4–5 (star KO) → the player (a still DamageFlyN pose) flies from where they were KO'd toward the stage's middle (≤ 30° from straight down) to a point in the top 30 % of the off-stage zone above its middle (`starEnd`), spinning like a wheel, slowing down and shrinking from 60 % to 20 % (three turns at one speed) over `STAR_FRAMES` (131 — Melee takes the stock / ends the game exactly 131 frames after a star KO starts; `starFlight`), then a star twinkles where they ended, on the frame the stock count drops (fallback: STAR_FRAMES, or the last frame there is — a highlight replay holds that frame until the twinkle is done) and they stay hidden until they respawn; 6–10 (flying into the screen) → nothing (user decision). Respawn platform drawn under players in Rebirth / RebirthWait (12 / 13). Live camera: follows living players (+ a star-KO flight) with a damped spring (`CAMERA_SPRING/DAMPING`: a fast move can swing ~10 % past its target and settle back), and frames a 73:60 view (the game's) that never leaves the off-stage zone (`getOffStageZone`, the radar's inner border); wider / taller boxes show more around it (`meet`). The blast zone + off-stage outlines are drawn (StageRender) — they only show in a box wider / taller than 73:60. Fountain of Dreams side platforms: replay windows carry both heights on every frame (`storeHighlights.replayFrames`). A player completely off screen (not KO'd) shows in a magnifying-glass bubble glued to the screen edge with a pointer toward them. Held charge shots (Samus, Mewtwo's Shadow Ball, state 0) are drawn in front of the owner (`ViewerItem` HELD_CHARGE — the game reports them at head height); camera = damped spring that never leaves the off-stage zone. Highlight Replay shows `LiveHud` (players, percent, stocks, timer, last-5-seconds countdown; no score/names) and switches instantly (no default fade). CSS keyframes on inner groups with `transform-box: fill-box` (SVG transform origins default to the view box).

**Overlay grid is fixed at 512 columns × 288 rows for every aspect ratio (incl. vertical)** — it stretches to the overlay. Deliberate: a finer grid costs editor/render performance. Design and docs work within it; don't raise it.

**Flows (`flowService.ts`, `models/types/flow.ts`, `utils/flowEngine.ts`, `/obs/flows`, MCP `list_flows`/`get_flow`/`save_flow`/`delete_flow`):** Homey-style WHEN→AND→THEN graphs stored in SQLite (`FlowEntity`, JSON nodes/edges) and edited with Svelte Flow **0.1.x** (the last line supporting Svelte 3 — don't bump to 1.x). Events: `LiveStatsSceneChange`, `MemoryControllerInput` (same controller index as Controller Commands), and `GameEvent` — emitted by `webhookService.dispatch` for every detected change, before the webhooks-enabled check. Conditions are a small backend set (not the overlay visibility conditions) incl. `gameFormat` (singles/doubles — replaced the old flow-level `format`; `migrateFlow` converts on load/save/import) and `compare` (`{{key}}` text vs value, numeric when both are numbers). Actions: HTTP request (`httpPost`, `method` POST (default) | GET | any (PUT, PATCH… — "Custom" in the editor; GET/HEAD send no body); default body `{flow, trigger, timestamp, tokens, payload}`; custom body = any text, sent as JSON when it parses), auth = `bearerToken` or `oauth` (client credentials: token cached per client until expiry, refetched on 401), custom `headers` (override defaults; secrets stripped on share), Debug `notify` (toast) / `log` (log line) and OBS via `storeCommands.executeCommand`. Every flow can use `{{state.<path>}}` into one nested game-state object (`utils/flowState.ts`: type, `SAMPLE_GAME_STATE`, `flattenState`, `isStateKey`; built by `flowService.gameStateObject()` — players in slot order, computed `teams` exist only here, strike = `utils/strikeFlowState.ts` (p1/p2 naming: score.p1, turn.player, p1/p2 {name, character…}, stage, history (from `StrikeState.stageLog`, recorded by setService `logStage` on strike/ban/pick, trimmed on restart step / rebuild), stages.<key> {status, isAvailable/isLocked/isStruck/isBanned/isDsr/isPicked, by, byName, order}; old `state.strike.*` keys renamed by `RENAMED_KEYS`), lastGame = webhook payload; key meanings + schemas: `utils/flowKeys.ts` (`KEY_INFO`, `FIRES_WHEN`, `triggerSchema` / `actionSchema` / `strikeStateSchema` → chip tooltips, the editor's "Output schema" popup `FlowOutputModal.svelte`, MCP `get_flow_schemas`; `test/unit/flowKeys.test.ts` requires every trigger key described); list positions `{{list.1.f}}` / first / last / `{{list[-1].f}}` (`listTokens`, `resolveIndexKey`)); it is also the "gameState" POST body and the editor's tree picker (`FlowStateRequest` → `FlowState`). Unknown keys fail validation. Test (`FlowTest`) runs every action with `SAMPLE_TOKENS` + live state and returns `FlowTestResult` (HTTP status + response). Scene/Controller commands carry `format` (`pickForFormat`: Singles/Doubles override Global per scene / per combo). Controller combos (commands and flows) fire after being held 0.5s, then 1s cooldown (`utils/comboHold.ts`). Trigger keys (`TRIGGER_TOKENS`) feed `{{key}}` custom POST bodies. **Scenes & timers:** scenes are switched ONLY by flows (no built-in scene rules; manual picks use `setStatsScene`). The default flow `content/sceneFlow.ts` (`SCENE_FLOW_ID` "scene-switching", enabled, with a Note card) is installed once (`migrations.sceneFlowInstalled`); deleting/editing it is respected — the Flows page warns when no enabled flow has a `setScene` card and offers Restore default (`FlowRestoreSceneDefault`), and DEMO_FLOWS has a copyable "demo-scene-switching". Events it uses: `dolphinConnection`, `gameStart` (once per `gameStartId`, so repeated offline games/simulations fire), `gameEnd` (also `GameEndWithoutReplay`), `rankChange`, `setStart`, `strikeAction` (the ONE striking trigger — `setService.announce`: accepted player choices with stage/character/rps, plus event `change` for every other state change, once per microtask; trigger event `any` = player choices only (the scene flow), `all` = everything; the old `strikeChange` trigger is migrated by `migrateStrikeTrigger`). Cards: `setScene`, Timer `timer {key, seconds}` (walk stops; `stepsAfter` runs the rest when it fires, conditions re-checked; same key restarts; keys global), `cancelTimer`, `note` nodes (kind "note", never run). State `set.isActive/isComplete` (`isSetComplete` in gamePredicates). Flow cooldown is per flow + trigger type. **Outputs (Homey style, `FlowEdge.sourceHandle`):** condition (And card) → none = Yes, "false" = No; actions → none = Continue — actions never answer yes/no (decisions go in And cards, user rule); `FLOW_ERROR_ACTIONS` also "error" (`{{error}}` = reason). The walk (`walkFrom`) stops at every action that `waitsForResult` (timer, can fail, `FLOW_TOKEN_ACTIONS` = calculate); `flowService.runSteps` runs it and continues with `stepsAfter(…, outcome)` using the keys as they are then. Each flow gets its own copy of the event tokens. `migrateFlow` → `migrateOutputs` converts old ✓/✕ action edges (idempotent). Run key `FLOW_RUN_KEYS` = error. **Problems:** `utils/flowProblems.ts` (scenes no enabled `setScene` reaches, invalid enabled flows, `flowService.getFailures()` ring buffer) → page `/obs/flows/problems` + MCP `get_flow_problems`. **Highlights (replay buffer):** trigger `sequence` {kind punish|combo, player} — `electron/utils/sequenceTracker.ts` runs slippi-js `ConversionComputer` (punish, `CONVERSION`) / `ComboComputer` (`COMBO_END`) live on `GameFrame` (only while an enabled flow has the trigger; started on GameStart, stopped on GameEnd; never throttled), keeps per-frame snapshots (stocks/percent/position) + wall time per frame; `flowService.sequenceTokens` → `SEQUENCE_KEYS` (attacker side win chance before/after/swing via winProbability, gameEnding, teamKills within 5 s, offstage via `isOffStage`). Formulas: `utils/formula.ts` `evaluateFormula` (safe recursive-descent parser, never eval — user decision: JavaScript-STYLE input is welcome but never executed: bare names / paths read own-property tokens only, `===`, strings, `Math.*` aliases of the listed functions, lambdas `item => item.score`; `formulaKeys` lists the names a formula reads for validation; injection attempts are in `test/unit/formula.test.ts`), used by the generic Math card `calculate` {key, formula} (`{{key}}` = result for the cards after it, this run only; `calcKeys` makes them known keys/editor chips), Timer seconds, List counts and Set media From / To. (Lists: `utils/flowList.ts` — items are objects (`ListItem` = fields + `added`); `applyListOp` add (fields from {{keys}}, `fieldValue`) / addList / sort | filter | map with a formula per item over `{{item.<field>}}` (`itemTokens`) / limit / shuffle; `listTokens` → {{list.count}}; formula list functions count / sum / avg / lowest / highest / find (`utils/formula.ts`, `evaluateFormula(…, lists)`; user decision: safe formulas, never JS); `listFields` = item-field chips; `test/unit/flowList.test.ts`, List card `list {key, op, …}` and Calculate values stored in `flowService.values` per flow; they STAY until a `clearValues {keys}` card clears them (user rule: no hidden lifetimes/resets — clears are cards after events; game start has `{{newSet}}` from `GameStartTypeExtended.isNewSet`). Editor chips = `keysBefore(flow, nodeId)` (only keys from ancestor cards); hovering a chip shows `keyOrigins` — the card it comes from + what it means (Calculate / List `description` the user types, else a built-in meaning; When keys from KEY_INFO). Media files: OBS `ReplayBufferSaved` → `storeHighlights.saved` (file END = Froggi's save request time from `obs.executeCommand('SaveReplayBuffer')`, measured ~25 ms early on OBS 32); lengths `utils/videoDuration.ts`; no ffmpeg (user decision); Froggi never deletes replay files (user decision). Sync: first client showing a media key emits `HighlightReelShown` (allowed unauthenticated) → `startedAt`; `HighlightReels(reels, serverNow, volumes)` → clients play `(server now − startedAt) mod total`. Rule (user): no hidden background logic — every value a flow uses is made by a visible card. Element 2100 = **Media** (category "Media & Highlights", every scene; `elementRender/HighlightVideo.svelte`; payload `video {key, volume 0–100, source 'key'|'file', file, fit}`, legacy `highlight {key, sound}` read too): file mode shows an upload (≤ 50 MB video / 15 MB image — `fileUpload.ts` caps every UI upload; in the overlay's image folder, so it's in exports) on loop; key mode shows what "Set media" put on the key — ONE thing (`HighlightReel` with 1 clip {url, start, end}, `kind` video | image; the browser reads lengths it doesn't know) with 3 `<video>`s (clip on screen + next ones loaded ahead, freeze on not-ready, muted fallback); blank — also in the editor — while the key is empty. Element 2101 = **Highlight Replay** (`elementRender/HighlightReplay.svelte`, payload `replay.list`): plays a flow LIST by name (`ReplayListRequest` → `ReplayList {name, items, changedAt}` — only `replayItems()` fields {replay, startFrame, endFrame} leave Froggi; the flow that changed a list name last wins; re-sent on change), frames per window via `HighlightFramesRequest(id, from, to)` → `HighlightFrames("id:from:to", frames|null)` (both allowed unauthenticated; ≤ 3600 frames), drawn by `GameStateRender` on the shared clock (from the list's change time); transparent. New Media / Highlight Replay elements fade on change (`getNewElementPayload(elementId)`). **Files by id** (`storeHighlights.ts`, SQLite `MediaFileEntity`): every file a flow uses (OBS clips, .slp, Set media files) gets id = first 12 hex of SHA-1 of its path; overlays only ask by id — `/media/<id>` (Range requests, never .slp) and replay windows. `{{state.replay.file}}` = the running game's .slp (statsDisplay finds it at game start → `setLiveReplay`). `setHighlightVideo` = "Set media" {key, path (file id / path / http(s) link), start, end (formulas)}; empty path clears; `setVideoVolume` {key, volume} overrides the element. "OBS: save replay" waits for its own file (`savedFile(since)`) → `{{file}} {{path}} {{fileSeconds}} {{savedAt}}` (`SAVE_KEYS`). Timer / Cancel timer keys may hold `{{keys}}` (save-{{startFrame}}). List positions may come from a key: `{{list[i].field}}` (`resolveIndexKey`, 0-based, also in formulas). List op `limitPer` {field, count}; list count + timer seconds may be formulas (timers ≥ 0.1 s). A run keeps its own Calculate results across timers (`valueTokens(flow, own)`); lists are always current. Flow state `time {now, today}`, `replay {file}`. No highlight-specific cards: Mark highlight / Build highlight reel / Set replay list / list "next" were removed (user decision — generic cards only). `obsReplayBufferSettings` card (no-op when equal, else buffer stop/start). OBS connect only STARTS the buffer; Enable sets 30 s only when it was off. Reference flow `content/highlightsFlow.ts` (id "highlights", off, `migrations.highlightsFlowInstalledV5` — replaces an older copy only while it is off): punish → Calculate rules → total ≥ 40 → fromFrame/toFrame (2.5 s before, 1 s after, ≤ 10 s) → add {replay, startFrame, endFrame, score, game} to slippiReplayGame/Set/Today → timer save-{{startFrame}} 1.5 s → OBS: save replay → clipEnd/clipStart/clipSeconds → add {file, start, end, seconds, score, game} to replayBufferGame/Set/Today; game end (5 s) → per prefix: Game best 5 / Set best 15 (time order), Today filter, Daily = top 20 % (20–100, limitPer game 5, best first); scores × a depth card (gameStocksLeft / gameStocksTotal, game number) → index loops for Media keys game / set / daily (daily shuffles at the end); game start cancels loop timers, empties keys, clears Game lists (+ Set lists on {{newSet}} / setStart). Demo "demo-highlights"; demo overlay Highlights.json (`scripts/gen-highlights-demo.py`) shows Media + Highlight Replay per scene. Nothing clears highlights or keys on its own — only cards. slippi-js only pairs players in singles; `SequenceTracker.everyPair` feeds doubles pairs into its internals (initialised like slippi-js 9 does, `undefined` fields) and keeps only hits Slippi's `lastHitBy` credits to the attacker (recheck on every slippi-js upgrade); offstage = victim position at the last hit. Demo overlays: `scripts/gen-highlights-demo.py` → Highlights.json (Media game / set / daily beside Highlight Replay slippiReplayGame / Set / Daily in Post Game / Post Set / Menu); GameStats has Media "game"/"set" below its centred stats (`highlights()` in gen-game-stats-demo.py). Every stored game keeps `GameStats.replayPath` (its .slp, relative to the Slippi replay folder, else absolute — `statsDisplay.replayReference`); `GameStats.highlights` is no longer written. Values are injected by `valueTokens` (unset = empty). Formula `nth(k, …)`. `obsReplayBufferSettings.fileName` → OBS `SimpleOutput.RecRBPrefix` (used by OBS 32 in both output modes; slashes stripped — folders come from OBS's shared Filename Formatting). **Win chance:** `utils/winProbability.ts` (life = stocks − percent / the player's own KO percent — `playerKoPercent`: their average death % over the set's games from the live fight stats (match), pulled toward 120 by two virtual deaths; the clock uses the set's seconds per stock; game = Lₐ²/(Lₐ²+L_b²); set via best-of, later games 50/50) → elements 1976–1979, flow state `odds`. Flows share as `.froggi` kind `flow` (bearer tokens / OAuth secrets / secret-looking header values stripped, imported disabled); demo flows in `content/demoFlows.ts`.

**Automation storage:** webhook profiles, controller commands and scene commands live in SQLite (`entities/automation/automationEntities.ts`), cached in memory in `storeWebhook`/`storeCommands`; their on/off switches stay in electron-store. A one-time migration copies the old electron-store lists (`migrations.*` flags; old keys kept as backup).

**Doubles (`utils/teams.ts`, `test/unit/teams.test.ts`):** Team 1 = the team with the lowest port in the set's first game (not colour), then locked to their players (`teamReference`); live `currentPlayers` in doubles = slot order [T1P1, T2P1, T1P2, T2P2] (built in `statsDisplay.getCurrentPlayersWithRankStats`, no rating lookups), so existing Player 1/2 elements show each team's first player. `payload.playerSlot` + `playersForSlot` (applied in `GridElements`) lets any Player 1/2 element show another slot. Sides: `setReference(first)` (teams.ts) = the set's first game (by port) with the host's swaps `GameStats.sides {swapped, teamOrder}` (persisted on the first game; Fix set… → `SwapSides` → `storeGames.swapSides` flips hand-set results + re-scores, `storePlayers.swapPlayers`, setService `swapSides` + `sidesSwapped` so phone links map token → other side; a swap before the first game is stored is kept as `pendingSides`; `LoadSetGames(…, swapSides)` lets the host pick Team 1 when loading replays) — used by getGameScore, setSlotResult and the live slot order (`applyTeamOrder`). Team names: typed, else "Tag & Tag" when every player has a tag, else Team N (`teamDisplayName`, never ports); Start Set (doubles) sends team names + player tags (`storePlayers.withSetTags`: by slot in game 1, then by playerKey; `newSet()` keeps them for a Dashboard-started set). Team winner: LRAS → quitter's team loses; time → team stocks then team percent; else placement 0's team (`getTeamWinnerIndex`), used by `getGameScore`. Online teams games report mode `teams`.

**Set identity & sessions (`utils/playerIdentity.ts`, `test/unit/playerIdentity.test.ts`, gameStore integration tests):** every game's players carry `froggiKey` (persisted column on `PlayerTypeEntity`; `playerKey` prefers it): online = connect code; offline doubles = game-1 colour + order ("Red-1" = lower port) carried by colour, a team whose colour vanished takes the new colour (`assignKeys`); offline singles = none (port). Assigned in `statsDisplay.resolveReplaySettings`, copied onto the stored game at game end. A new Slippi matchId with the same online players continues the set when `game.continueSetAcrossSessions` (default on) — `continuesSet()`, stored under the set's id via `storeLiveStats.setSetMatchId`. Dashboard **Fix set…** (`SetGamesModal.svelte`): `SetPlayerKeys` (host fix: running game, else the last stored game + rescore) and `RecentReplaysRequest`/`LoadSetGames` (10 newest replays; paths must come from that list; rebuilds recent games, match + fight stats via `fightStatsFromFrames`, and `setService.loadGames` replays the results through `reportWinner`).

**Navigation:** the OBS hub is labelled **Stream** (URLs stay `/obs/...` — OBS browser sources depend on them). Stream → Overlays, Tournament Dashboard, OBS Connection (`/obs/setup`: status, one-click setup, WebSocket address — the old `/obs/settings/websocket` route is gone), Automation (`/obs/automation`: Scene/Controller Commands, Flows, Webhooks), Tutorial. Back buttons are `components/navigation/BackButton.svelte` (in-app trail from `utils/navHistory.ts`, else the page's parent — add new pages to `PAGES`). QR codes of links to this machine use `QrReveal.svelte` (hidden until clicked, black-on-white); Tailscale (`*.ts.net`) and ngrok URLs render through `SecretUrl.svelte` (hidden until clicked; Copy buttons still copy).

**Fight stats (`utils/fightStats.ts`, `test/unit/fightStats.test.ts`):** live damage dealt / KOs / avg KO % / avg death % per player, singles and doubles. `FightStatsTracker` lives in `ElectronLiveStatsStore` (`startFightStats` on game start — a new set resets the match totals; `trackFightStats` per frame) and pushes `LiveFightStats {game, match}` keyed by `playerKey` (survives port/colour swaps); damage = victim percent rise credited to `post.lastHitBy` (teammates excluded), KO = stock loss credited to the last hitter. Elements `Live…`/`LiveMatch…` (1940–1975, `FIGHT_STAT_ELEMENTS`, `elementRender/FightStats.svelte`). Post-game stat children look up `overall`/`actionCounts` by `playerIndex` (not array position) and `analyzeMatch` aggregates per `playerKey` for every player of the latest game — so Player 1/2 post-game/match stats honour `playerSlot`.

**Webhooks (MCP):** `tools/webhooks.ts` `get_webhook_reference` returns the envelope, `DUMMY_PAYLOADS` (the "Send test" bodies) + `THROTTLE_MS` from `webhookService.ts`, and profiles (host only, no secrets). Change a webhook payload → its dummy payload changes with it. Explainer topics: `webhooks-*`, `tournament-automation`, `obs-dashboard`, `overlay-embed-url`, `stage-striking`.

**Players, ports & score:** `settings.players` skips empty ports, so array position ≠ `playerIndex` — look players up with `findSettingsPlayer(players, playerIndex)`. Ties (`isTiedGame`, `test/unit/ties.test.ts`): a tied game scores for nobody — double KO, two first places (not on timeouts), and timeouts (`timeoutWinnerIndex`: stocks, then the SHOWN percent, decimals cut off; Melee's own timeout placements are ignored — offline it calls equal stocks a tie whatever the percent). `isSettledByTiebreaker`: a later game with the same Slippi `sessionId` + `gameNumber` and a higher `tiebreakerNumber` (replay spec) proves the game before it was a tie, so it scores nothing (getGameScore, the store's per-game scores — re-saved via `updateGameScores` — and setService's rebuild); ranked's 1-stock tiebreaker (same game number, `tiebreakerNumber` + 1) is a normal game whose winner takes the point; offline sudden death (bomb rain) is never stored (`storeGames.addMatchGame`). Winners match slippi-js 9 `getWinners()` on every sample replay (checked in the test). The set score is indexed by player SLOT (`getPlayerSlot`: Player 1/2 = set's first game ordered by port, later games matched by connect code), not by port (`gamePredicates.ts`, `test/unit/gameScore.test.ts`).

**Stage striking (`setService.ts`, `test/unit/setService.test.ts`):** Melee ruleset — G1: charSelect (double blind) → rps → rpsResult (winner picks strike order, `RpsWinnerOrder`) → 1-2-1 striking over starters → playing; G2+: winner bans 1 (none in Bo5) → loser picks minus DSR → winner then loser character. Winners auto-report from `PostGameStats` (set Player 1 = lower port) — only games with the set's players (`setPlayers`, from the first game), never ranked/unranked. Starters FoD/YS/DL/BF/FD, counterpick PS. Doubles ruleset: one phone per team; `SelectCharacter(player, charId, token, partnerCharId)` must carry both picks (`partnerCharacters`, `teamMembers` = tags or "Port N" via `teamMembersOf`, phone `components/set/CharPicker.svelte`); doubles games auto-report by team (`getTeamWinnerIndex`). Phone links carry a per-player token (`/set/p/N?t=…`, `strike.tokens`, sent host-only via `sendHostMessage`); unauthenticated clients may send only `STRIKE_PLAYER_TOPICS` with a token (`websocketAuthentication.ts`), validated per player/turn in setService. Results: ONE list — the set's recent games (Edit Games / `ScoreUpdateModal`): Slippi games, artificial games (`RecentGamesMock`), `AddSetGameFromReplay`, delete/reorder, and `RecentGamesSetResult` = `GameStats.resultOverride {winnerSlot|null, note}` (persisted column; `getGameScore` and `setSlotResult` honour it). `setService.syncFromGames` rebuilds score/DSR/next step from that list on every `RecentGames` (no-op when the results are unchanged); Report result… on the striking card opens the Add Game form prefilled. Host UI: the Dashboard's stage striking card (`components/dashboard/StrikePreview.svelte`) — the old `/set` page redirects there; `/set/p/N` are the player devices. Scene: StartSet → Strike Phase; game end → Post Game; first striking action → Strike Phase (never over InGame). Per-stage display state = `stageStatus()` (`strikeStageStatus.ts`) → conditions "Strike: <Stage> Available/Locked/Struck Or Banned/DSR Blocked/Picked"; demo `demo-overlays/StageStriking.json` is generated by `scripts/gen-stage-striking-demo.py`. Other generated demos: `gen-doubles-demo.py` → Doubles.json, `gen-game-stats-demo.py` → GameStats.json (shared helpers in `scripts/demo_overlay_lib.py`; elements use font family "default" so they inherit the scene font — all demos use Roboto Bold Italic).

**Custom fonts (gotcha):** `CustomFontHandler.addFont` registers a custom font file under the SCENE NAME (scene font) or the ELEMENT ID (element font), and text renders with `font-family: <font.family>` — so a custom `src` only shows when `family` is that scene name / item id (the editor's "Custom" option does exactly this). Built-ins: default, sans-serif, Melee, Ultimate, A-OTF Folk Pro M, Roboto, Roboto Bold Italic, Wix. MCP tools set the family automatically (`withCustomFontFamily` in overlayWrite.ts; element ids are pre-generated so `add_overlay_element(s)` can do it too). `add_overlay_font` takes a Google Fonts name/specimen link (`resolveGoogleFont` → TTF via the css2 API), a direct file URL, a local path, or a Froggi file picker.

**Overlay list removal gotcha (Svelte 3):** changing data a Modal shows while it closes leaves its invisible full-screen layer blocking all clicks — close first, change data after `MODAL_CLOSE_MS`. Removing an overlay preview card waits on nested element in/out transitions and never completed when the card's own data changed in the same update — deleted/filtered cards stayed on screen. So previews (`preview` prop) skip GridContent scene in/out animations, and the overlays list / Deleted page keep cards mounted and hide them with `style:display` on `deletedAt` instead of unmounting.

**Iron Man overlay elements (`utils/ironmanElements.ts`, `elementRender/IronMan.svelte`, `test/unit/ironmanElements.test.ts`):** per player (Player 1 = this Froggi's player, Player 2 = the opponent, empty in solo): Roster 9011/9012 (characters + which are out only; `fitRosterGrid` picks the column count with the biggest icons for the box, capped at 96 px at 1080p via `getRelativePixelSize`, ties → the layout shaped like the box with the fewest empty cells; sized from the box only, so resizing can't feed back), Progress Bar 9013/9014 (box kind), Character Total 9015/9016 and Characters Remaining 9017/9018 (text kind, via TextElement). Kinds live in `utils/elementKind.ts` (`IRONMAN_TEXT_ELEMENTS` / `IRONMAN_BOX_ELEMENTS`, used by StylingSelect and the MCP). The old combined `IronManRoster` (9010) still renders but is not in the picker. Names reuse `MatchPlayer1Tag`/`MatchPlayer2Tag` (4420/4421), also listed in the Iron Man picker — no duplicate elements. Conditions (category "Iron Man", `IronManVisibilityOptions.svelte`): Active, Mode Standard / Full Roster / Challenge, Player 1 / Player 2 Won, Carry-over Pending. Carry-over is a rule: `IronManSettings.carryOver` (optional, off by default; Standard only). After a win the WINNER (either player) SDs down to the stocks they kept: `pendingCarryStocks` is set at the result and cleared by `GameFrame` once that player is down to them in the next game (armed on the next `GameSettings`) — that is the "Carry-over Pending" condition.

**Controller graphics (`element/ControllerGraphic.svelte`, preview page `/obs/debug/controller`):** controller elements 3100–3169 draw as SVG (A/B/X/Y/Z, digital L/R, D-pad, main stick = ridged cap, C-stick = plain cap). `payload.controller` = {outline, outlinePressed, fill, fillPressed, width} (`utils/controllerStyle.ts`, `CONTROLLER_STYLE_DEFAULTS` = the old look: white lines, hollow released, white pressed). Sticks are pressed past `STICK_THRESHOLD` (whole cap fills); the D-pad fills the pressed arm. The Analog L/R bar is the original plain bar (border/rounding = Border section, track = Background, pressed part = fillPressed) — an SVG bar collapsed in small boxes (layer thumbnails). Editor: Styling → Controller (+ "Show pressed": a context store from ElementModal, `CONTROLLER_PREVIEW`, so only the style window's preview shows pressed). Drop shadow = the element's own Shadow. Digital L/R stay hidden from the picker/MCP.

**Player elements & the Player dropdown (`utils/playerVariants.ts`, `test/unit/playerVariants.test.ts`):** element names carry CurrentPlayer / Player1 / Player2 (206 triples, 63 Player 1/2 pairs); `playerVariants(id)` finds the siblings by name. The picker (`ElementCategorySelect`: one `CATEGORIES` list with scenes + a one-line description each) has ONE category per kind (Player HUD, Controller Inputs, Action State, Slippi Rank, Rank Prediction, Game/Set stats…) listing the Player 1 variant (+ current-only extras: Game Frame, your tag / rating graph); Styling → Player (`playerOptions`, no "Default") switches the element id (and `playerSlot` for a team's second player — legacy t1p1/t2p1 read as Player 1/2) without re-keying the panel. MCP `list_element_types` lists each player element once as `…<Player>…` with `players` {current, p1, p2}.

**Controller conditions (`utils/controllerConditions.ts`, `ControllerVisibilityOptions.svelte`, `test/unit/controllerConditions.test.ts`):** category "Controller", labels "<Current Player|Player 1|Player 2> Controller <check>" (72; the evaluator splits the label, `CONTROLLER_CHECKS` holds the 24 checks). Buttons, L/R Analog Pressed (> 0.3) / Fully Pressed (≥ 0.99) / Clicked (digital), Stick + C-Stick directions past `STICK_THRESHOLD` 0.3 (Melee dead zone 0.2875; diagonals = both). Input = game frame `pre`, else `memoryReadController`; only elements with a controller condition subscribe to the memory read (`VisibilityAnimationLayer`).

**MCP conditions are two-step:** `list_overlay_conditions` without `group`/`search` returns the encodings + group counts (`conditionGroup` in overlaySchema.ts, by label prefix); with `group` or `search` it returns only those labels. Legacy trigger labels aren't listed.

**Editor saves on release only (`BoardEdit.svelte`):** svelte-grid fires `change` every 100 ms while dragging and once on release (right after its `pointerup`); the editor saves only that one, synchronously. The reactive block that rebuilds `items` from the overlay must not depend on `items` (it reset the dragged item every step — the "fighting" resize). svelte-grid also refuses a move/resize that would overlap another (`fixed`) item on the same layer — the box snaps back; put it on another layer.

**Remount gotcha:** `Board` rebuilds every item object on each scene/overlay update, so never `{#key dataItem}` (object identity) inside an element — a remount during a visibility/scene out-animation leaves the old copy fading beside the new one (the doubled "GAME"). Key on content instead (`TextElement`: `JSON.stringify(dataItem)`).

**Tutorials are data** (`frontend/src/lib/content/tutorials/*.ts`, one file per tutorial, `TUTORIALS` in index.ts): the app renders them with `components/tutorial/TutorialBlocks.svelte` inside `TutorialPages.svelte` (route `/obs/tutorial/[tutorial]`, tournament at `/set/tutorial`) and the MCP serves the same content (`list_tutorials` / `get_tutorial` → `tutorialAsMarkdown`, screenshots as caption + path). Blocks: heading/text/list/image/video/note/copyInstructions; text supports **bold**, *italic*, `code`. Screenshots live in `static/image/tutorial/{overlay,obs,tournament}/` (`test/unit/tutorials.test.ts` fails on a missing file). Exception: "Play minigames online" is an interactive page (`routes/obs/tutorial/minigames-online`) — its data file is the AI's text version.

**Remote host data:** `sendHostMessage` is IPC-only; host data an AUTHORIZED remote client (host password) asks for is answered to that socket alone by `messageHandler.replyToHost` (today: `StrikePlayerTokensRequest` → the remote dashboard's phone links). Set names: `StrikeSetName(player, name, token?)` — a phone renames its own side (✎ on the phone), the host either side (dashboard shows the set's names during a set).

**Two surfaces, keep both truthful:**
1. **Explainer topics** (knowledge) — `frontend/src/lib/content/topics/*.ts` as `ContentTopic[]` (categories `app | obs | overlays | remote-access | minigames | automation`). Shared with the in-app help UI; surfaced to Claude via `list_explainer_topics` / `explain_topic`. Adding knowledge = a new topic/block, no new code path.
2. **Tools** (actions/reads) — `electron/services/mcp/tools/*.ts`, each registered in `buildMcpServer()`. Reads pull from stores/services; writes call the same services the UI does (e.g. feedback reuses `errorReporter.submitFeedback('feature'|'bug', …)`).

**Sync contract — the MCP must never describe or drive the app in a way that no longer matches reality. When you change app behavior, update the matching MCP surface in the SAME change:**

| Change to… | Update… |
|---|---|
| A user-facing feature / workflow / use case | the matching explainer topic in `content/topics/`, and any tool that reads/writes it |
| The **settings page** (a toggle, field, or its meaning) | `content/topics/app.ts` (settings explainer) + the read tool that reports settings |
| OBS setup / overlay building steps | `content/topics/obsIntegration.ts` + `obsSetup.ts` / `obsAddSource.ts` / `overlay*.ts` |
| Remote access (Tailscale / ngrok) behavior | `content/topics/remoteAccess.ts` + `diagnostics.ts` status snapshot |
| Automation (controller / scene commands) | `content/topics/automation.ts` + `automation*.ts` |
| Minigames rules / modes | `content/topics/minigames.ts` |
| Overlay element schema (kinds/conditions/animations/box-fit) | `overlaySchema.ts` |
| Webhooks / bug + feature reporting / support + contact channels | the relevant explainer topic + the tool wrapping `errorReporter` |
| Mobile use cases (remote stream control, custom-overlay viewer) | the mobile explainer topic |
| A tutorial's steps or screenshots (the UI changed) | the tutorial's data file in `content/tutorials/` (same content reaches the AI) |

Rule of thumb: if a code change would make an existing `explain_topic` answer or tool description wrong, the doc/tool fix ships in the same commit. When adding a new app capability, add its explainer topic (and tool, if actionable) so Claude can discover and use it — an undocumented capability is invisible to the MCP.
