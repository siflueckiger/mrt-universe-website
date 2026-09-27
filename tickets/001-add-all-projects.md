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
| TG53 aka Gähn Zzzz Bäng aka puzzle palooza | **no** | — |

## Missing entries to add

1. **mfk — super fotos** — needs `url`.
2. **Brumm Brumm AAHHH** — needs `url`.
3. **TG53 aka Gähn Zzzz Bäng aka puzzle palooza** — candidate URLs:
   `https://puzzle-palooza.netlify.app/dokumentation/` and
   `https://tg53.netlify.app/` (pick one, or record both in the markdown body).

## Acceptance criteria

- [ ] Add the three missing entries to `js/links-data.js` with category
      `"Installation"` (confirm category with Simon if any are videos).
- [ ] Add `markdownFile` for each — create `installations/<slug>.md`
      from the generated template (real copy is ticket 002).
- [ ] `for f in js/*.js; do node --check "$f"; done` passes.
- [ ] Entries appear in the in-game link list and are flyable/readable.
- [ ] Update the coverage table above to "yes".

## Notes / decisions

- Existing installations use `markdownFile` (see ticket for standalone `.md`
  loading); omit it only if the title-derived slug is the filename you want.
- Keep the external URL on the link (used by ENTER/`Open in new tab`), even
  when a markdown body exists.

## Blockers

- URL for **mfk — super fotos**.
- URL for **Brumm Brumm AAHHH**.
- Confirm which TG53 URL is canonical.

## Links

- `all-projects.md`
- `js/links-data.js`
- `installations/`
- `AGENTS.md` (link-data conventions)
