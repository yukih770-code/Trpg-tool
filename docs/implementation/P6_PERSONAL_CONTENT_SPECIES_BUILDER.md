# P6 Personal Content Species Builder

## Purpose

Let a player use their own saved private species entries in the existing D&D
character builder without turning private content into shared rules or Runtime
authority.

## Owner-only version projection

`GET /api/me/private-compendium-packs/:packId/versions/:packVersionId` is
available only to the authenticated owner of the private pack. It returns a
compact pack/version projection and declared entries, but does not return the
pack owner id or author source reference.

## Supported builder mapping

The current adapter maps only the established `dnd-personal-species-v0` basic
shape:

- species name and summary
- size and speed
- listed traits as display text
- heritage option names

Ability bonuses, arbitrary JSON keys, executable effects, and advanced rule
automation are intentionally not evaluated. Imported entries that are not
species remain private pack data and do not appear in the species selector.

## Boundaries

- A selected version remains local character provenance until the player
  explicitly submits a Room binding.
- The Room still performs its owner/version checks and the host still reviews
  the submitted content reference.
- This endpoint is not a public Workshop read API and does not publish content
  to a World Server.
