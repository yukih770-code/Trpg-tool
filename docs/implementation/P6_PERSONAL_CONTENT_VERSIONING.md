# P6 Personal Content Versioning

## Purpose

Personal DND content packs are immutable once a version is published. The
author can select a saved pack and create a later version without altering a
version that may already be referenced by a Room actor binding.

## Boundary

- Only the authenticated owner may append a version to their published,
  `user_private`, non-Server-bound pack.
- The editor creates a new version; it does not overwrite old entries or
  retroactively modify Room submissions.
- Personal content remains private by default. It is neither a Server pack nor
  official content, and it gains no Runtime or rule-execution authority.

## Current UX

Open **我的自定义资料**, click an existing pack, update the compact authoring
form, choose a version label such as `1.1.0`, and save. The current v0 editor
authors a compact species entry; richer multi-entry editing/import is deferred.
