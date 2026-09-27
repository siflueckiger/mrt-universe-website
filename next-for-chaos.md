# Next for Chaos

Ideas to crank **Cat Chaos Mode** up to eleven. Roughly ordered by bang-for-buck.

## 1. Red glimmering overlay (the vibe)

- Full-screen **red tint** that pulses/glimmers once chaos is active.
  - `#chaos-overlay` div (like `#crt-overlay`, `pointer-events: none`, high z-index) with
    `background: radial-gradient(...rgba(255,0,0,.35)...)`, animated opacity/scale keyframes.
  - Or draw it on the canvas: `background(40,0,0)` + additive red rect with `sin(frameCount)`.
- **Escalation:** overlay intensity scales with destruction progress
  (`1 - chaosRemaining()/chaosTotal`).
- Bonuses: chromatic aberration, stronger scanline bleed, flicker, vignette, subtle
  full-screen shake that never stops.

## 2. Destroy everything, not just links/planets/asteroids

- Add to `getNearestOnScreenTarget()`:
  - `stars` -> shooting a star = supernova flash + big shard burst.
  - `nebulae` -> dissipate into a colored cloud (fade puffs out).
  - `trash` -> though usually already collected, POP any leftovers.
  - `particles` / `explosions` -> chain-reaction detonations.
- Give each type its own explosion flavor + color.
- Special: destroying a **link** could print its title as exploding letters ("...popped").

## 3. More destructive feel

- **Hold SPACE = rapid fire** (already fires on key repeat; make it explicit + tunable).
- **Auto-fire toggle** (`GAME_CONFIG.catMode.autoFire` exists; expose a HUD/debug key).
- **Cascade explosions:** each blast has a chance to ignite a nearby object.
- **Laser sweep:** cat head slowly rotates toward targets; beam whips across screen.
- **Full-screen shockwave** on big kills (planet/link) that nudges nearby objects.
- **Debris that persists:** scorch marks / floating wreckage fields after destruction.

## 4. Audio chaos

- Layered distortion + pitch-down rumble as more is destroyed.
- A droning "wrath" pad that rises in volume with the chaos meter.
- Cat roar stinger the moment Cat Chaos awakens.

## 5. End state

- When `chaosRemaining() === 0`: a giant cat face fades over the void, red overlay
  dims, "Nothing remains. Only the cat." + an `[R] Rebirth` prompt to respawn the cosmos.
- Optional: konami-ish secret — destroy everything without missing to unlock something.

## 6. Tuning / structure notes

- All new knobs in `GAME_CONFIG.catMode` (overlay intensity, escalation speed, fire rate,
  cascade chance, shake).
- Keep destruction screen-space effects in the `explosions` array (update/display/isDead).
- Keep the debug entry points working: `C` toggle, `?chaos=1` / `?cat=1`.
- Update `AGENTS.md` checklist when the above lands.

## 7. Minimap: show every destructible in chaos mode — SUPERSEDED

> This was implemented, then retired: staring at the corner map killed the arcade
> action. The minimap is now **hidden** in Cat Chaos (section 8) and directional
> guidance moves on-screen. Kept here for history.

- In Cat Chaos, the minimap should plot **all destroyable objects**, not just links —
  links, planets, asteroids, nebulae, trash and (optionally) stars, each with its own
  color so the player can hunt down the last stragglers.
- Only-remaining targets should read as "what's left"; destroyed ones disappear from
  the minimap as they are destroyed (it already just plots the live arrays).
- The minimap world bounds currently derive from `links` + ship only
  (`drawMinimap()` in `js/game.js`); in chaos mode expand the bounds to include the
  other destructible arrays so everything fits inside the box.
- Keep regular (non-chaos) mode exactly as it is (links/ship only) — this is a
  chaos-mode-only overlay so the normal exploration minimap visuals don't change.
- Add a chaos-mode legend (e.g. planet/asteroid/nebula/trash/star swatches) instead of
  the usual "new / visited" legend.
- New knobs in `GAME_CONFIG.minimap` (dot sizes / colors per kind), gated on
  `gameState.catMode`.

### Decisions (implemented)

- **No stars** on the minimap: they are screen-space dust, not world objects, so plotting
  them would only add noise.
- **No legend** in chaos mode — the minimap stays clean; only the normal `new / visited`
  legend remains outside chaos.
- Colors: link hot-pink (pulsing), planet amber, asteroid gray, nebula violet, trash cyan,
  ship white. Chaos frame is dark crimson with a red border.

## 8. Chaos HUD glitch + on-screen guidance

The minimap became a corner radar that pulled the player's eyes off the cat. Fix:
glitch the whole explorer HUD away and guide the player with on-screen cues.

### Phase 1 — HUD glitch + centered readout (implemented)

- When `body.chaos-active`:
  - `#hud` + `#controls` play `hud-glitch-out` (chromatic/skew/clip-path flicker) then
    stay hidden (`animation-fill-mode: forwards`, `pointer-events: none`).
  - The **minimap is not drawn** in cat mode; the link border navigators and the
    `[ENTER] Open` ship prompt are suppressed.
  - A new centered `#chaos-hud` fades in:
    - big pulsing **`🔥 CAT CHAOS MODE 🔥`** title (red glow, chromatic offset, twitch).
    - `[ TARGETS REMAINING: N ]` at the bottom (switches to
      `[ NOTHING REMAINS. ONLY THE CAT. ]` in the void).
    - key hints: `SPACE Fire · F Auto-Fire [ON/OFF] · C Exit`.
  - Live values come from `updateChaosHud()` in `js/ui.js` (change-only DOM writes).
- Normal-mode minimap and explorer HUD are unchanged (reverts the section 7 work).

### Phase 2 — On-screen target guidance (implemented)

- **Orbiting target arrow** around the cat head pointing at the nearest off-screen
  destructible (pulsing, tinted by target kind) — `drawOrbitArrow()`.
- **Screen-edge threat chevrons** along the viewport border for the nearest few
  off-screen targets, handing off to the real object as it scrolls into view —
  `drawEdgeChevron()` / `drawTargetGuidance()`.
- Targets: links, planets, asteroids, nebulae, trash (stars ignored — they wrap
  around the screen). All tunables in `GAME_CONFIG.catMode.markers`.
- Hidden while a pause overlay is open or once the void is reached.


