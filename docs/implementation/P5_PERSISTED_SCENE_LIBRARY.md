# P5 Persisted Scene Library

## Purpose

The persisted scene library saves a reusable, sanitized scene runtime snapshot
for one World Server, Campaign, and Room. A saved scene can contain the current
combat table and map-board projection, then be explicitly loaded into the
current page later.

## Data and API

`scene_state_documents` is a focused server table. It stores scope identifiers,
title/description, a versioned JSON snapshot, archive metadata, and an optional
source scene id for copied encounter templates. Archived documents are hidden by
default. The room API provides list, create, read, metadata update, duplicate,
and archive operations behind the existing room permission guards.

The document is not a Runtime Event. Scene documents are mutable metadata with
an archive lifecycle; Runtime Events remain append-only activity records.
Optional `scene.state_*` events are audit summaries only. A failure to append an
audit event does not roll back a successful scene operation.

## Client behavior

The room workspace reuses `SceneRuntimeSnapshot` validation and sanitization.
Loading a saved document first validates the payload and warns about room,
campaign, or runtime-session mismatch. Applying remains explicit and only
replaces the local combat/map projection for the current page.

## Boundaries

- Not live sync or multiplayer authority.
- Not a full campaign backup/export system.
- Not asset storage; map backgrounds remain URL references.
- Not a VTT map engine, token permission system, or conflict-resolution layer.
- No credentials, headers, secrets, database settings, or binary data belong in
  saved state JSON.

## Follow-up candidates

- WebSocket live scene synchronization.
- Persisted token permission rules.
- Asset/object storage integration.
- Folders, tags, and richer encounter-template discovery.
- Campaign-level backup and export workflows.
