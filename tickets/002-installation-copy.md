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
- **Draft v2 is in place**, corrected by Simon. The facts that drove the
  rewrite (sources were read for research only — **no repo/Drive links are
  added to the reader**, by Simon's request):
  - `aurart.md`: **not** a bio-feedback measurement. A script detects where
    people are in the camera frame and paints a colourful splash there. The
    poetic intro stays, but a "How it actually works" section tells the truth
    at the end.
  - `weare.md`: visitors wear VR goggles and see themselves **from above**
    (Raspberry Pi camera streams + Processing). A short paragraph covers the
    later `WeAre.U`, which tracks players with UWB tags and shows them as
    abstract points.
  - `play-w-your-world.md`: a big tracked ball of light is the earth; moving
    it damages the world — darker sound, the ball climbs, the projection
    deforms until the earth is out of reach and the end is unstoppable. There
    was a highscore for the fastest world destruction.
  - `tg53.md`: physical box inspired by *Keep Talking and Nobody Explodes*,
    started as a school-class project idea; several modules for two players.
    It is not a bomb but a **dream generator** that must be shut down before
    everyone is left with nightmares. Documented at Open Education Day, Bern,
    6 May 2023.
- The TG53 body stays text-only: the reader's footer button now opens the
  German **documentation** (the entry `url` was switched to
  `puzzle-palooza.netlify.app/dokumentation/`; the videos site is no longer
  linked from the game).
- The AurART repo exists but is **private** — no link in the reader until it
  is public.
- Text is supplied by Simon; language TBD (English is the current UI default,
  the Bern pieces may read better in German — decide per installation).
- Dates now in the files are **not invented** — they come from the Flickr
  album metadata behind each link: WeAre! (Sockel, 30.09.2018), Play w/ your
  World (Klimahalle, 16–18.01.2020), AurART (Museum für Kommunikation,
  09.11.2023).
- Follow-up idea: WeAre! and Play w/ your World also have 24–26 photo albums,
  so they could get the same curated-image treatment as AurART (reuse ticket
  003's pattern + the new `.preview-markdown img` styling).
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
