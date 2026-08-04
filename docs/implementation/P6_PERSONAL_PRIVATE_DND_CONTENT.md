# P6 Personal Private DND Content

## Purpose

Give every authenticated user a personal DND authoring surface without making
World Server ownership a prerequisite for creativity. The workbench is
entry-first: authors create species, classes, subclasses, backgrounds, feats,
spells, items, or monsters without first naming a pack. See
`P6_DND_PERSONAL_CONTENT_STUDIO` for the current editor contract.

## Product Boundary

- Personal packs are owned by the authenticated user and use
  `visibility_scope = user_private`.
- They have no `world_server_id` and create no World Server pack binding.
- Official source data remains immutable and is not overridden.
- A personal pack does not automatically enter a Server, campaign, Room, or
  character builder catalog.
- A future room-submission slice may carry an explicit immutable pack-version
  reference for host review. Until then, Room approval remains unchanged.

## Surfaces

- `GET /api/me/private-compendium-packs` lists only the current viewer's packs.
- `POST /api/me/private-compendium-packs` creates an append-only private pack
  version and entries. The server derives owner, source author, and visibility;
  client-supplied scope fields are not trusted.
- DND Actor Vault has a **My Custom Content** card next to existing characters,
  character creation, and snapshot import. It is intentionally not in Server
  Settings.
- The underlying pack/version remains an immutable storage boundary. Normal
  authoring derives its display title from the entries; importing JSON and
  publishing a follow-up version are the only workflows that expose a library
  container intentionally.

## Non-goals

- No Workshop/public marketplace.
- No server-shared publishing from this personal surface.
- No executable effects, rules automation, official-data mutation, or automatic
  character migration.
- No Room admission, campaign binding, or Runtime authority change.

## Next Slice

Add a narrow Room submission reference: a character can nominate a personal
pack version, and the host can allow or reject that immutable version for that
Room. This must not expose unrelated private pack contents to other members.
