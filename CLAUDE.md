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

### Pending work (TODO)

- **Landing page**: Static GitHub Pages site (`docs/` or `gh-pages` branch) — download link with OS auto-detection, link to repo, BuyMeACoffee link. Reference: project memory `project_stage_striking.md`.

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

### Discord RPC

`electron/services/discord.ts` — active in all modes (dev included). `updateActivity()` is throttled to 1 call/2s via lodash `throttle`. Bingo presence shows 2 buttons (one per player) with their progress percentage; both link to `FROGGI_URL`. Iron Man presence follows the same pattern.

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

### Overlay injection

`@asdf-overlay/core` and `@asdf-overlay/electron` handle overlay injection into the Dolphin game window. Windows-only. On Dolphin connect, `OverlayInjector.injectIntoGame()` calls `Overlay.attach(dllDir, pid)` which injects the DLL; once the game window is detected the `added` event fires and `ElectronOverlaySurface.connect()` pipes an offscreen `BrowserWindow` into the overlay via shared GPU texture. The package's native binaries must be in `app.asar.unpacked` — this is handled by the `asarUnpack` rule in `build.config.json`.
