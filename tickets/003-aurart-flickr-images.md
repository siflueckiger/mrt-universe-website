# 003 — Curate AurART Flickr images in the reader

Status: done
Priority: low
Area: content

## Summary

The AurART reader should show a hand-picked **few** images rather than pointing
people at the full Flickr album. Embed a small curated set in
`installations/aurart.md` and keep a link to the full album.

**Outcome: reversed.** Three images were curated and committed, then Simon
asked for them to be removed again — the reader stays text-only and points at
the Flickr album. The reader-side image support was kept (it is generic and
tested), so this is easy to revive later.

## Plan

1. Pick a small set (suggested 3–5) from
   <https://flic.kr/s/aHBqjzEF1c>.
2. Download them into `assets/installations/aurart/` (keep filenames
   lowercase-kebab, no spaces).
3. Reference them in `installations/aurart.md` with captions, e.g.
   `![Aura portrait](assets/installations/aurart/aura-01.jpg)`.
4. ~~Add `.preview-markdown img` styling in `css/style.css`~~ — done, together
   with `![]()` support in the offline `fallbackMarkdown()` parser.
5. Keep the existing "Open in new tab" footer button pointing at the full album.

## Acceptance criteria

- [x] Album identified and a curated set picked (3 portrait shots).
- [x] Images embedded with captions, then **removed again on Simon's
      request** — `assets/installations/aurart/` deleted, `aurart.md` is
      text-only.
- [x] Reader image support kept: `.preview-markdown img` styling in
      `css/style.css` + `![]()` in the offline `fallbackMarkdown()` parser.
- [x] Album link still works from the footer / body.

## Notes / decisions

- Decision (Simon): embed a few images in the reader — do **not** show all
  Flickr images.
- Downloaded assets avoid Flickr hotlink/CORS surprises; no external image
  requests at runtime.
- **Album identified:** `flic.kr/s/aHBqjzEF1c` resolves to
  `flickr.com/photos/magicrambatrash/albums/72177720297140039`, titled
  “Vernissage – Nichts”, Museum für Kommunikation, 09.11.2023 — 117 photos,
  and the set does contain the AurART aura portraits (confirmed on 25
  thumbnails from page 1). All photos are 16:9 landscape, 1600px `_h` size.
- **Reader support done:** `fallbackMarkdown()`/`inlineMarkdown()` now render
  `![alt](url "title")`, and `.preview-markdown img` is styled in
  `css/style.css` (max-width 100%, CRT border/glow). Links/images with a
  `javascript:`/`data:` scheme are dropped instead of rendered.
- Only the `_h` Flickr size is served for this album (`_n`/`_z`/`_c` return
  410), so candidates must be pulled at `_h` and downscaled locally before
  committing.
- Privacy: the portraits show identifiable visitors — Simon confirms the
  chosen ones may be published before they are committed.
- The AurART code (`github.com/siflueckiger/aurART`) is **private**, so the
  reader does not link it. Revisit when/if the repo goes public — it would be
  a good "see the actual script" link under the new *How it actually works*
  section.
- **Chosen (Simon): 3 images.** Source photos from page 1 of the album,
  `_h` size, downscaled to 1200px:
  | file | flickr photo |
  |------|--------------|
  | `aurart-01.jpg` | 53320924533 (single sitter, full rainbow halo) |
  | `aurart-02.jpg` | 53321154550 (single sitter, magenta/green) |
  | `aurart-03.jpg` | 53320926419 (two sitters, shared field) |
- **Reversed (Simon, same day):** no images in the reader. The three files and
  the `## Portraits from the installation` block are gone; the copy now ends
  with the Flickr album link only. Kept: the generic image support in
  `js/ui.js` and `css/style.css`, and this ticket's research (album id, photo
  ids, `_h`-only quirk) in case the decision flips back.

## Blockers

- None — closed. The images were removed by decision, not by a blocker.

## Links

- `installations/aurart.md`
- `assets/`
- `css/style.css`
- `js/ui.js` (`renderMarkdown()`, `inlineMarkdown()`)
