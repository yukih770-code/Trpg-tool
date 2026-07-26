# P6 Personal Content Workshop IA

## Purpose

Personal D&D content is authored in **创意工坊 → 我的创作**. The Character
Builder is a consumer of a selected immutable pack version, not a second
content editor.

## User flow

1. In Character Builder, choose a personal pack version under `个人资料来源`.
2. Use `管理或导入个人资料` to open Workshop's private `我的创作` workbench.
3. Create or import a private species, background, feat, or spell pack.
4. Return to the builder. Existing builder state remains in the local creator
   store; the user then selects the newly available version explicitly.

## Boundaries

- `我的创作` is owner-private. It is not a publishing action or a public
  workshop listing.
- Public discovery remains a distinct Workshop concern and may be empty.
- Server-private content remains scoped to Server Settings and its owner/admin
  model; it is not merged into personal content.
- Character provenance stores only selected pack/version references.
- Room submission and host review remain independent. Selecting or authoring
  content never grants Room approval or executes custom rules.

## Authoring clarity

The workbench labels every editable field with its player-facing purpose and
whether it is a builder projection or reference-only text. In particular,
spell range does not control map measurement; background features do not grant
permissions or resources; and trait text never installs executable effects.

## Pack draft and new-version flow

- Hand-authored entries first live in a browser-local pack draft. A draft may
  combine the supported species, background, feat, and spell entries before it
  is published once as an immutable version.
- Creating a new version reads the author's current version and copies its
  entries into that draft. The author can remove or replace entries explicitly;
  publishing never mutates the old version.
- The draft is an authoring convenience, not a shared workspace, Room payload,
  or local persistence contract. Leaving the workbench discards an unpublished
  draft.

## Deferred

- Public publishing, sharing, rating, and moderation.
- Pack collaboration and granular edit permissions.
- Rich multi-entry editing of arbitrary imported schemas. Imported entries can
  be previewed and published as a complete version, but this workbench only
  authors the bounded D&D entry types listed above.
- Class legality, spell execution, or arbitrary rule effects.
- Server adoption of a personal pack.
