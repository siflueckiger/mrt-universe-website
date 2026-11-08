# 002 — Write installation copy

Status: blocked
Priority: medium
Area: content

## Summary

The installation `.md` files currently hold short starter prose. Replace it
with the real copy for each installation. **Simon writes the text**; this
ticket tracks wiring/verifying it, not authoring it.

## Scope

One file per installation in `installations/`:

- [ ] `installations/weare.md`
- [ ] `installations/play-w-your-world.md`
- [ ] `installations/aurart.md`
- [ ] `installations/tg53.md` (added, currently starter prose)
- [ ] New installations from ticket 001 (`mfk — super fotos`,
      `Brumm Brumm AAHHH` — once the URLs land)

## Acceptance criteria

- [ ] Each installation's `.md` has final prose (no placeholder text).
- [ ] Every external link in the body is valid and opens in a new tab from the
      reader.
- [ ] Files render correctly in the in-game reader (run a local server:
      `python3 -m http.server`).
- [ ] No remaining "TODO"/lorem text anywhere in `installations/`.

## Notes / decisions

- Text is supplied by Simon; language TBD (English is the current UI default,
  the Bern pieces may read better in German — decide per installation).
- Editing an `.md` file and reloading the page is enough; the reader caches
  per page load, so a hard refresh picks up changes.
- Markdown is rendered with marked (CDN) or the built-in `fallbackMarkdown()`;
  supported basics: `#`/`##` headings, `**bold**`, `*italic*`, lists,
  `> quotes`, `---`, `[links](url)`.

## Blockers

- Content from Simon.

## Links

- `installations/`
- `js/ui.js` (`renderMarkdown()`, `fallbackMarkdown()`)
- `tickets/001-add-all-projects.md`
