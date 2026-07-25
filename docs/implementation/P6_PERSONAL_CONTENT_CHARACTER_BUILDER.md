# P6 Personal Content Character Builder

## Purpose

The D&D character builder can record the immutable version of a player's
private content pack that was used while creating a character. This is source
provenance, not a rule-engine extension.

## Current behavior

- The **资料来源** step lists the authenticated user's private packs and their
  latest immutable versions.
- A character stores only `packId`, `packVersionId`, display name, and version
  label. It does not store pack entries, an owner id, or executable content.
- Existing characters migrate safely to an empty reference list.
- The review step makes the selected reference visible before the character is
  completed.
- When entering a Room, the player still selects the version to submit in the
  Lobby. The existing server-side ownership check and host review remain the
  authority for Room admission.

## Explicitly deferred

- Loading custom entries into the D&D species, background, class, feat, spell,
  or item selectors.
- Dynamic rule calculations or executable effects from personal content.
- Automatic propagation from a local character reference into a Room binding.
- Publishing a personal pack to a World Server or public Workshop.

Those follow-up steps need an owner-only version-read projection and a bounded
per-entry adapter. They must not make a private pack or a character reference a
permission grant.
