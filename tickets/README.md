# Tickets

Lightweight, file-based backlog for the Magic Ramba Trash universe. One file
per task, numbered so they can be picked up in order.

## How to work a ticket

1. Look at the table below and pick the oldest **todo** ticket that isn't
   **blocked**.
2. Change its header to `Status: doing` and update the table.
3. Tick off the acceptance criteria as you go.
4. When everything is done, set `Status: done` and update the table.
5. Anything you learn or decide goes in the ticket's **Notes / decisions**
   section so the next person has context.

## Adding a ticket

Copy `TEMPLATE.md` to `NNN-short-slug.md` (next free number, zero-padded) and
fill it in. Add a row to the table. Keep one task per ticket.

## Status legend

- `todo` — ready to be picked up
- `doing` — being worked on right now
- `blocked` — waiting on an answer, asset or other work
- `done` — finished and verified

## Board

| ID | Title | Status | Priority | Area | Blocked by |
|----|-------|--------|----------|------|------------|
| [001](001-add-all-projects.md) | Add all projects from `all-projects.md` | blocked | high | data | missing URLs |
| [002](002-installation-copy.md) | Write installation copy | doing | medium | content | Simon's edits on draft v1 |
| [003](003-aurart-flickr-images.md) | Curate AurART Flickr images in the reader | done | low | content | — (images removed by decision) |
| [004](004-mobile-experience.md) | Rework the mobile experience | todo | high | ux / architecture | — |

## Conventions

- Tickets are planning docs only; they don't change game behaviour.
- Reference real paths (`js/links-data.js`, `installations/*.md`) rather than
  describing them vaguely.
- Keep the "magic" look-and-feel constraint in mind: refactors must not change
  the pixel-identical early-www visuals or HUD copy (see `AGENTS.md`).
