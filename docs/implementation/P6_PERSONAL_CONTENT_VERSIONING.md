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

Open **我的自定义资料** and inspect an existing pack. The owner can switch
between all returned immutable versions, export the selected version, or copy
that exact version into the existing unsaved new-version draft. Copying proposes
a non-conflicting label and performs no write. The owner may then edit the
multi-entry draft and explicitly publish one new immutable version.

This is historical draft restore, not in-place rollback. Existing versions and
Room references are never rewritten.
