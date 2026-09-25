# AGENTS.md

Single-page p5.js web game ("Magic Ramba Trash"). No framework, no build step, no package.json, no tests or lint. Classic `<script>` tags in global scope (early-www style) — works from `file://` or any static server; do not convert to ES modules without asking.

## Structure

- `index.html` — markup only, plus p5 + p5.sound CDN tags (with SRI hashes) in `<head>` and script tags in load order at end of `<body>`.
- `css/style.css` — all styling, incl. the CRT/scanline overlay (`#crt-overlay`).
- `js/config.js` — `GAME_CONFIG`: all tunables (world bounds, `activationDistance`, movement speed/acceleration, `warp`, joystick, entity counts incl. nebulae/asteroids, star/link/planet/nebula/asteroid/particles ranges, link min spacing, minimap, sound, distance unit/scale, CRT overlay). `mobileBreakpoint` must stay in sync with the `@media (max-width: 768px)` rule in `css/style.css`.
- `js/links-data.js` — `linkData` array + `validateLinkData()` (warns and drops malformed entries at load; normalizes missing `description`). Adding a link = editing this array only.
- `js/classes.js` — `Star`, `Ship`, `Link`, `Navigator`, `Planet`, `Nebula` (drifting gas clouds, `blendMode(SCREEN)`), `Asteroid` (tumbling rocks), `ThrusterParticle` (retro exhaust).
- `js/ui.js` — info/how-to-play overlay (`infoMenuOpen`, `toggleInfoMenu()`, I key / HUD button, ESC/backdrop closes, pauses the game) + HUD DOM code (incl. `formatDistance()` for the lightyear display, HTML escaping, change-only DOM writes and the cached `mobileQuery`) + the link list overlay (`linksListOpen`, `toggleLinksList()`, L key / HUD button, arrow keys or W/S move the cursor, ENTER picks, I jumps to info, picks pin any link as navigation target) + the Warp HUD button (`initWarpButton()`, `updateWarpButton()`, mirrors the J key for touch) + the in-game video preview modal (`previewOpen`, `openPreview(link)`, `closePreview()`, `initPreviewModal()`, `getYouTubeId()`; V key near a link, `youtube-nocookie` iframe, non-embeddable links get an "open in new tab" fallback, closing clears the iframe `src` so audio stops).
- `js/controls.js` — `joystick` input state + action button; exposes `window.updateActionButton` for the draw loop.
- `js/sound.js` — chiptune blips via p5.sound oscillators (`playSound(name)`, no audio files) incl. `warp`/`warpEnd` sweeps + looping UFO hum while moving (`setFlying(on)`, driven by `handleInput`); audio unlocks on first key/tap, `M` / the HUD Music button toggles mute (`initSoundButton()`), `GAME_CONFIG.sound.enabled` disables audio entirely.
- `js/game.js` — `gameState` (single source of truth: `appReady`, `nearestLink`, `selectedLinkIndex`, `accelerationFactor`, `warpActive`), p5 hooks (`setup`, `draw`, `keyPressed`, `windowResized`), input/game logic, warp/autopilot (`startWarp()`, `endWarp(silent)`, `updateWarp()`, screen-space `warpStreaks`), visited links (session-only Set), mini-map, and the boot guard.

## Script load order (critical)

p5 CDN → p5.sound CDN → `config` → `links-data` → `classes` → `ui` → `controls` → `sound` → `game`. Earlier files define globals used by later ones; `game.js` calls `initInfoMenu()`/`initLinksList()`/`initWarpButton()`/`initPreviewModal()`/`initSoundButton()` and defines p5 hooks last.

## Running & verification

- Any static server works, e.g. `python3 -m http.server`; opening `index.html` directly also works. p5.js 1.4.0 + p5.sound load from cdnjs, so previews need network; if p5 fails, `game.js` shows a fallback error in the HUD instead of a blank screen.
- Syntax check all JS: `for f in js/*.js; do node --check "$f"; done`
- No automated tests; testing is manual in the browser. Checklist: arrow/WASD/joystick movement, ESC deselects, ENTER/action button opens link within `activationDistance`, V previews a YouTube link in the CRT modal (ESC/V/X closes and stops audio; Flickr links show the new-tab fallback), J (or Warp button) engages autopilot to the pinned/nearest link and any key cancels it, mobile controls below 768px, resize re-centers ship, UFO hum while moving (stops when stopped), M toggles sound, mini-map top-right shows links/ship (unvisited links pulse yellow, visited are faint gray, legend below the box), select/open/reach blips play after first key/tap, visited links show ✓ and reset on reload, L opens the link list (game pauses, arrow keys or W/S move the cursor, ENTER pins a row), I opens/closes the info overlay, nebula drift + asteroid tumble + thruster particles visible, CRT overlay visible.

## Conventions & gotchas

- UI copy is English (`lang="en"`); new text should follow surrounding language per element.
- The scripts are non-module global code — don't wrap in modules or strict scoping; p5 global mode finds `setup`/`draw`/`keyPressed`/`windowResized` on `window`.
- `gameState.appReady` gates all input and starts `true`: the game is playable immediately and the info/how-to-play overlay is opt-in via `I`.
- Links spawn via rejection sampling (`GAME_CONFIG.link.minDistance` between links, `minShipDistance` from the ship) so they never overlap; falls back to the most spaced candidate.
- Distances are displayed in the configured unit (`GAME_CONFIG.distance`: `unit` + `pixelsPerUnit`) via `formatDistance()`; the game still works in pixels internally.
- The link list pauses the game: `handleInput` returns early while `linksListOpen`, `infoMenuOpen` or `previewOpen`, and ESC inside the list is consumed by `ui.js` (stopImmediatePropagation) so it closes the list without deselecting.
- Mobile controls (`#mobile-controls`) are CSS-hidden above 768px, but joystick mouse handlers exist for desktop testing; keep both input paths in sync when changing controls.
- Movement is relative: the ship stays centered and the world (`stars`, `links`, `planets`, `nebulae`, `asteroids`) moves via `moveObjects()`; `nebula.update()` adds slow independent drift.
- Visited links are tracked by `title` in a session-only `Set` (resets on every page load).
- The pixel-identical trashy early-www look is deliberate; refactors must not change visuals or HUD copy (the CRT overlay is a config-gated addition, `GAME_CONFIG.visual.crtOverlay`).
