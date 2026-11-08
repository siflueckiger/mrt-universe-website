# 002 — Write installation copy

Status: doing
Priority: medium
Area: content

## Summary

The installation `.md` files currently hold short starter prose. Replace it
with the real copy for each installation. **Simon writes the text**; this
ticket tracks wiring/verifying it, not authoring it.

## Scope

One file per installation in `installations/`:

- [x] `installations/weare.md` — draft v1
- [x] `installations/play-w-your-world.md` — draft v1
- [x] `installations/aurart.md` — draft v1 + curated photos (ticket 003)
- [x] `installations/tg53.md` — draft v1
- [ ] New installations from ticket 001 (`mfk — super fotos`,
      `Brumm Brumm AAHHH` — once the URLs land)

## Acceptance criteria

- [ ] Each installation's `.md` has final prose (no placeholder text).
- [ ] Every external link in the body is valid and opens in a new tab from the
      reader.
- [ ] Files render correctly in the in-game reader (run a local server:
      `python3 -m http.server`).
- [x] No remaining "TODO"/lorem text anywhere in `installations/`.

## Notes / decisions

- Decision (Simon): **English first**, Simon edits. German versions, if any,
  become a follow-up ticket.
- **Draft v1 is in place** for all four files. Written to be fact-light on
  purpose — the prose works without dates, teams or technical details, so
  nothing false is asserted. Worth a fact check where it gets specific:
  - `aurart.md`: "made in public" (the portrait appears while you sit) and the
    three image captions.
  - `weare.md`: the greeting/distance/hands examples.
  - `play-w-your-world.md`: "no instructions, no correct way".
  - `tg53.md`: the documentation is described as the record of how it was
    built — confirm that is what the site actually is.
- Text is supplied by Simon; language TBD (English is the current UI default,
  the Bern pieces may read better in German — decide per installation).
- Editing an `.md` file and reloading the page is enough; the reader caches
  per page load, so a hard refresh picks up changes.
- Keep `**bold**` / `*italic*` and `![]()` on a **single line**: the offline
  `fallbackMarkdown()` parser works line by line, so emphasis that wraps is
  rendered literally. `<>` autolinks are not supported there either — use
  `[label](url)`.
- Markdown is rendered with marked (CDN) or the built-in `fallbackMarkdown()`;
  supported basics: `#`/`##` headings, `**bold**`, `*italic*`, lists,
  `> quotes`, `---`, `[links](url)`.

## Blockers

- Content from Simon.

## Links

- `installations/`
- `js/ui.js` (`renderMarkdown()`, `fallbackMarkdown()`)
- `tickets/001-add-all-projects.md`
