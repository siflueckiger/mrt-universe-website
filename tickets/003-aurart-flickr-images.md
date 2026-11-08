# 003 — Curate AurART Flickr images in the reader

Status: doing
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
4. ~~Add `.preview-markdown img` styling in `css/style.css`~~ — done, together
   with `![]()` support in the offline `fallbackMarkdown()` parser.
5. Keep the existing "Open in new tab" footer button pointing at the full album.

## Acceptance criteria

- [x] Curated images added under `assets/installations/aurart/`
      (`aurart-01.jpg` … `aurart-03.jpg`, 1200×675, ~45 KB each).
- [x] `installations/aurart.md` embeds only the curated set (no full-album
      dump).
- [x] Images render in the reader (paths 200 via `python3 -m http.server`;
      visual check in the browser still open).
- [x] `css/style.css` styles reader images; layout holds on desktop + mobile
      (mobile check still open).
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
- **Chosen (Simon): 3 images.** Source photos from page 1 of the album,
  `_h` size, downscaled to 1200px:
  | file | flickr photo |
  |------|--------------|
  | `aurart-01.jpg` | 53320924533 (single sitter, full rainbow halo) |
  | `aurart-02.jpg` | 53321154550 (single sitter, magenta/green) |
  | `aurart-03.jpg` | 53320926419 (two sitters, shared field) |

## Blockers

- Image selection (which/how many).

## Links

- `installations/aurart.md`
- `assets/`
- `css/style.css`
- `js/ui.js` (`renderMarkdown()`, `inlineMarkdown()`)
