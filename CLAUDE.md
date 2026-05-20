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

#### Third-party components

`svelte-qrcode`: renders as JPEG via qrious. Props: `value`, `size` (string px), `color` (hex), `background` (hex). No CSS variable support — use hex values. Import with `// @ts-ignore`.

#### Page transitions

No page-level transitions (`in:fade`, `out:fade`, `in:fly`, `out:fly` on `<main>`). Step-navigation animations within a page (e.g. TutorialPages.svelte) are acceptable.

### Overlay injection

`@asdf-overlay/core` and `@asdf-overlay/electron` handle overlay injection into the Dolphin game window. Windows-only. On Dolphin connect, `OverlayInjector.injectIntoGame()` calls `Overlay.attach(dllDir, pid)` which injects the DLL; once the game window is detected the `added` event fires and `ElectronOverlaySurface.connect()` pipes an offscreen `BrowserWindow` into the overlay via shared GPU texture. The package's native binaries must be in `app.asar.unpacked` — this is handled by the `asarUnpack` rule in `build.config.json`.
