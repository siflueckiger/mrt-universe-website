# 001 — Add all projects from `all-projects.md`

Status: blocked
Priority: high
Area: data

## Summary

Every project listed in `all-projects.md` should exist in the game as a
`linkData` entry (and, for installations, as an `installations/<slug>.md`
file). Three projects are currently missing.

## Coverage

| `all-projects.md` entry | In game? | `linkData` title |
|-------------------------|----------|------------------|
| artlu bubble and the dead animal gang - somewhere in a carrot field | yes | Somewhere in a Carrot Field |
| mike ständer band - adolf | yes | Adolf |
| shah blah - nothing | yes | Nothing |
| mike ständer band - infantiler bullshit | yes | Infantiler Bullshit |
| desserto parallax - puppet factory | yes | Puppet Factory |
| shah blah - holy shelter | yes | Holy Shelter |
| shah blah - who sells out | yes | Who Sells Out |
| mfk - super fotos | **no** | — |
| mfk - AurArt | yes | AurART |
| WeAre! | yes | WeAre! |
| Play w/ your World | yes | Play w/ your World |
| Brumm Brumm AAHHH | **no** | — |
| TG53 aka Gähn Zzzz Bäng aka puzzle palooza | yes | TG53 aka Gähn Zzzz Bäng |

## Missing entries to add

1. **mfk — super fotos** — needs `url`.
2. **Brumm Brumm AAHHH** — needs `url`.

**TG53 — done.** Added as `TG53 aka Gähn Zzzz Bäng` with
`markdownFile: installations/tg53.md`. **Link updated (Simon):** the entry now
points at the documentation, `https://puzzle-palooza.netlify.app/dokumentation/`,
instead of the videos at `https://tg53.netlify.app/`.

## Acceptance criteria

- [x] Add TG53 to `js/links-data.js` with category `"Installation"`.
- [ ] Add **mfk — super fotos** and **Brumm Brumm AAHHH** to
      `js/links-data.js` (blocked on URLs).
- [x] Add `markdownFile` + `installations/tg53.md` (real copy is ticket 002).
- [ ] Add `markdownFile` + `installations/<slug>.md` for the two missing ones.
- [x] `for f in js/*.js; do node --check "$f"; done` passes.
- [ ] Entries appear in the in-game link list and are flyable/readable.
- [x] Update the coverage table above to "yes" (TG53).

## Notes / decisions

- Existing installations use `markdownFile` (see ticket for standalone `.md`
  loading); omit it only if the title-derived slug is the filename you want.
- Decision (Simon, TG53): `tg53.netlify.app` holds the **videos** for the art
  installation, `puzzle-palooza.netlify.app/dokumentation/` is the
  **documentation**. The build material lives in a Google Drive folder. Final
  choice: the link `url` points at the **documentation**; the reader body
  stays text-only (no repo/Drive links).
- Title trimmed to "TG53 aka Gähn Zzzz Bäng" (the full "…aka puzzle palooza"
  would dominate the HUD/minimap); the description keeps the puzzle-palooza
  alias.
- Keep the external URL on the link (used by ENTER/`Open in new tab`), even
  when a markdown body exists.

## Blockers

- URL for **mfk — super fotos**.
- URL for **Brumm Brumm AAHHH**.

Checked (2026-11-08) and came up empty:

- Web search for "Brumm Brumm AAHHH" and "mfk super fotos" only returns
  unrelated results.
- The `magicrambatrash` Flickr account has exactly three albums:
  `WeAre` (2018), `Klimahalle 2020` (Play w/ your World) and
  `Vernissage – Nichts` (AurART). No album for either missing piece.
- Neither works is on the site under another name, so there is nothing to
  reuse.
- `github.com/siflueckiger/mfk-super` looked like a match ("MfK-Super-Ki-Foto"
  photostation) but Simon confirmed it is a **different project**.

Options once Simon digs the links out: a different Flickr account / Vimeo /
YouTube channel, an old Netlify deploy, or — if no online version exists —
skip the entry and note the piece as offline-only in `all-projects.md`.

## Links

- `all-projects.md`
- `js/links-data.js`
- `installations/`
- `AGENTS.md` (link-data conventions)
