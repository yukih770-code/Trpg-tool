# P6 DND Personal Content Portability & Historical Draft Restore

## Outcome

An authenticated DND content author can inspect all immutable versions of one
owner-private compendium pack, export a selected version, and use any selected
version as the starting point for a new unsaved version draft.

## Transfer format

- Format: `trpg-personal-compendium-pack`
- Format version: `1`
- Maximum transfer text: 2,500,000 characters
- Entries: 1-50
- Per-entry content and metadata: bounded object payloads
- Included: display name, version label, pack metadata, declarative entries,
  export timestamp
- Excluded: owner/user IDs, World Server and Room IDs, pack/version/entry IDs,
  visibility authority, source rights, media binaries

The existing compact personal-pack JSON shape remains import-compatible. A
versioned envelope with an unsupported format/version or invalid export time is
rejected before preview.

## Version history boundary

`GET /api/me/private-compendium-packs/:packId/versions` first resolves the pack
inside the authenticated owner's private-pack list. It returns at most 100
compact summaries and never returns version manifest, source, rights, or entry
payloads. Another user receives not-found rather than a discoverable private
identifier.

Selected version content continues to use the existing owner-only detail route.
No schema, migration, or repository storage behavior changed.

## Historical draft restore

`基于此版本创建草稿` copies the selected version's entries into Flow State and
suggests the next unused label. It does not append a version, alter the selected
version, or update a Room reference. The author must separately use the existing
`发布新版本` action to persist a new immutable version.

This is not Package Library rollback. It does not implement Workshop join,
install, enable, disable, update, dependency resolution, or publication.

## Verification

- Personal pack handler smoke: owner history projection and non-owner denial
- API client smoke: owner version-history route
- Transfer smoke: export identity stripping, export/import round trip, legacy
  compatibility, unsupported-version rejection, conflict-free label suggestion
- Existing DND personal definitions/adapter, Room version-reference, and AI
  drafting regressions
- TypeScript, server build, frontend build, navigation/action audit, diff check

Landmark: `DND_PERSONAL_CONTENT_PORTABILITY_RESTORE_V1`.
