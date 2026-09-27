# 004 — Rework the mobile experience

Status: todo
Priority: high
Area: ux / architecture

## Summary

"Mobile sucks big times." Today the phone experience is the desktop canvas
shrunk down, with CSS-hidden `#mobile-controls` (joystick + action button) and
a `@media (max-width: 768px)` breakpoint. It needs a deliberate mobile design —
possibly a separate, touch-first experience.

This ticket starts with an audit + recommendation, then implements the chosen
direction.

## Current state (audit)

- Same p5 canvas / same world; the ship stays centered and the world moves.
- `#mobile-controls` shown below `GAME_CONFIG.mobileBreakpoint` (768px, kept in
  sync with the CSS media query); joystick drives `handleInput`.
- HUD, minimap, link list, info overlay and preview/markdown modal all render on
  a small screen but weren't designed for touch.
- Hover/`[ENTER]`-style prompts and keyboard hints dominate the UI.
- Action button opens links/installations or fires in Cat Chaos.

## Options to weigh

- **A. Polish the existing responsive layout** — bigger touch targets, a
  mobile-first HUD, hide keyboard hints, gesture-friendly overlays. Smallest
  change, keeps one codebase/one world.
- **B. Dedicated touch-first layout in this codebase** — same scripts, a
  distinct mobile UI/DOM branch (e.g. landscape lock, different control scheme,
  larger cards). Medium effort.
- **C. Separate mobile site/page** — e.g. a simple, fast `m.html` that lists the
  projects with the same markdown reader, no free-flight game. Biggest split,
  but potentially the best UX and bandwidth.

## Acceptance criteria

- [ ] Write the audit + a clear recommendation (which option, why) in
      **Notes / decisions**.
- [ ] Break the chosen option into phased, concrete sub-tasks (checklist).
- [ ] Implement the chosen direction.
- [ ] Verify on a real phone / device emulation in portrait and landscape:
      navigation, opening a link, the markdown reader, the link list, sound.
- [ ] `mobileBreakpoint` in `js/config.js` stays in sync with the CSS media
      query.
- [ ] Scripts remain non-module global code (see `AGENTS.md`).

## Notes / decisions

- Nothing decided yet — start with the audit.
- Constraint: don't change the desktop visuals/HUD copy; mobile work is
  additive or behind `mobileBreakpoint`.

## Blockers

- None (decision happens inside this ticket).

## Links

- `js/controls.js` (`#mobile-controls`, joystick, action button)
- `js/config.js` (`mobileBreakpoint`, joystick)
- `css/style.css` (`@media (max-width: 768px)`)
- `index.html` (`#mobile-controls`, HUD)
