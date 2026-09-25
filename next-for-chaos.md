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
