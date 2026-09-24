# AGENTS.md

Single-page p5.js web game ("Magic Ramba Trash"). No framework, no build step, no package.json, no tests or lint. Classic `<script>` tags in global scope (early-www style) — works from `file://` or any static server; do not convert to ES modules without asking.

## Structure

- `index.html` — markup only, plus p5 CDN tag in `<head>` and script tags in load order at end of `<body>`.
- `css/style.css` — all styling.
- `js/config.js` — `GAME_CONFIG`: all tunables (world bounds, `activationDistance`, movement speed/acceleration, joystick, entity counts, start-menu min load). `mobileBreakpoint` must stay in sync with the `@media (max-width: 768px)` rule in `css/style.css`.
- `js/links-data.js` — `linkData` array + `validateLinkData()` (warns and drops malformed entries at load). Adding a link = editing this array only.
- `js/classes.js` — `Star`, `Ship`, `Link`, `Navigator`, `Planet`.
- `js/ui.js` — start menu + HUD DOM code.
- `js/controls.js` — `joystick` input state + mobile buttons; exposes `window.updateActionButton` for the draw loop.
- `js/game.js` — `gameState` (single source of truth: `appReady`, `nearestLink`, `selectedLinkIndex`, `accelerationFactor`), p5 hooks (`setup`, `draw`, `keyPressed`, `windowResized`), input/game logic, and the boot guard.

## Script load order (critical)

p5 CDN → `config` → `links-data` → `classes` → `ui` → `controls` → `game`. Earlier files define globals used by later ones; `game.js` calls `initStartMenu()` and defines p5 hooks last.

## Running & verification

- Any static server works, e.g. `python3 -m http.server`; opening `index.html` directly also works. p5.js 1.4.0 loads from cdnjs, so previews need network; if it fails, `game.js` shows a fallback error in the HUD instead of a blank screen.
- Syntax check all JS: `for f in js/*.js; do node --check "$f"; done`
- No automated tests; testing is manual in the browser. Checklist: 5s start-menu gate, arrow/joystick movement, S selects off-screen link, ESC deselects, ENTER/action button opens link within `activationDistance`, mobile controls below 768px, resize re-centers ship.

## Conventions & gotchas

- UI copy is German (`lang="de"`), some headings are English; new text should follow surrounding language per element.
- The scripts are non-module global code — don't wrap in modules or strict scoping; p5 global mode finds `setup`/`draw`/`keyPressed`/`windowResized` on `window`.
- `gameState.appReady` gates all input: the start menu has a 5s min display time (`GAME_CONFIG.startMenu.minLoadMs`) before Start works.
- Mobile controls (`#mobile-controls`) are CSS-hidden above 768px, but joystick mouse handlers exist for desktop testing; keep both input paths in sync when changing controls.
- Movement is relative: the ship stays centered and the world (`stars`, `links`, `planets`) moves via `moveObjects()`.
- The pixel-identical trashy early-www look is deliberate; refactors must not change visuals or HUD copy.
