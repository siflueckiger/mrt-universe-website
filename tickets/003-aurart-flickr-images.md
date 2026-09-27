# 003 — Curate AurART Flickr images in the reader

Status: blocked
Priority: low
Area: content

## Summary

The AurART reader should show a hand-picked **few** images rather than pointing
people at the full Flickr album. Embed a small curated set in
`installations/aurart.md` and keep a link to the full album.

## Plan

1. Pick a small set (suggested 3–5) from
   <https://flic.kr/s/aHBqjzEF1c>.
2. Download them into `assets/installations/aurart/` (keep filenames
   lowercase-kebab, no spaces).
3. Reference them in `installations/aurart.md` with captions, e.g.
   `![Aura portrait](assets/installations/aurart/aura-01.jpg)`.
4. Add `.preview-markdown img` styling in `css/style.css` so images fit the CRT
   reader (max-width 100%, border/glow consistent with the retro look, spacing).
5. Keep the existing "Open in new tab" footer button pointing at the full album.

## Acceptance criteria

- [ ] Curated images added under `assets/installations/aurart/`.
- [ ] `installations/aurart.md` embeds only the curated set (no full-album
      dump).
- [ ] Images render in the reader (verify with `python3 -m http.server`).
- [ ] `css/style.css` styles reader images; layout holds on desktop + mobile.
- [ ] Album link still works from the footer / body.

## Notes / decisions

- Decision (Simon): embed a few images in the reader — do **not** show all
  Flickr images.
- `renderMarkdown()` passes `<img>` through; marked (CDN) handles image syntax.
  The offline `fallbackMarkdown()` parser does **not** support `![]()` yet —
  add it if offline image support matters (same regex style as links).
- Downloaded assets avoid Flickr hotlink/CORS surprises; no external image
  requests at runtime.

## Blockers

- Image selection (which/how many).

## Links

- `installations/aurart.md`
- `assets/`
- `css/style.css`
- `js/ui.js` (`renderMarkdown()`, `inlineMarkdown()`)
