# P6 Room Personal Content References

## Purpose

A player may submit an owned personal DND content-pack version with a Room actor
binding. The host sees the pack name and immutable version label while reviewing
that character application.

## Boundary

- The server verifies the current user owns the pack, the pack is published and
  `user_private`, has no World Server binding, and the version belongs to it.
- The Room snapshot carries only pack/version identifiers and display metadata.
  It never carries entries, author IDs, editor payloads, or a live private link.
- Binding approval remains the existing Room approval decision. This slice adds
  no rules execution, automatic admission, Runtime authority, or pack sharing.
- A selected version is stable for the submitted binding. Later personal edits
  require a later versioning/editor slice and a new Room submission.

## Deferred

Full host inspection, per-campaign content policy, version editor/import, and
rules-aware character validation remain separate work.
