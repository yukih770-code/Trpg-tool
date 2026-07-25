# P6 Private Compendium Pack Publish v0

## Purpose

This slice adds the first durable authoring seam for server-private rules content.
It is the persistence/API foundation for later DND species, heritage, subclass,
feat, item, and monster editors. It never alters an owner-source pack.

## API

`GET /api/world-servers/:worldServerId/compendium-packs`

- Requires authenticated server `view` access.
- Lists non-archived packs scoped to that server.

`POST /api/world-servers/:worldServerId/compendium-packs`

- Requires `manageServerSettings` (owner/admin under the existing guard).
- Accepts a display name, optional version label, bounded metadata, and one to
  fifty bounded entries.
- The server generates all pack, version, binding, and entry IDs.
- The server writes each entry source reference as `private` with the verified
  publisher as author; caller-supplied claims cannot mark an entry as official.

## Publication boundary

One successful publish transaction creates:

1. a `compendium_packs` row scoped to the World Server;
2. one immutable `compendium_pack_versions` row;
3. its `compendium_entries` rows; and
4. one enabled `world_server_pack_bindings` row.

Failure rolls the entire transaction back. The implementation reuses the existing
`0009_remaining_platform_foundation.sql` schema; it introduces no migration.

Published content is private to the server. A future edit creates a later pack
revision/version rather than mutating the published entry or any content reference
already pinned by a character, campaign, room, or runtime snapshot.

## Explicitly deferred

- Creator/editor UI and schema-specific DND forms.
- Public Workshop discovery, sharing, moderation, or publication review.
- Updating, replacing, archiving, or resolving packs in a character creator.
- Executable rules/effects, automatic validation, AI generation, or runtime wiring.
- New database tables, WebSocket changes, and source-pack imports.

## Verification

Run `npm run api:verify:private-compendium -- --strict`. The smoke uses fake
repositories and verifies anonymous denial, server-member read access,
owner publication, normal-member publish denial, server-assigned private source
references, malformed entry rejection, and scope-conflict rejection.
