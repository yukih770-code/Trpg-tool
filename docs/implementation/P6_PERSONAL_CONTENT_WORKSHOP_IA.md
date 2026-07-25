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

## Deferred

- Public publishing, sharing, rating, and moderation.
- Pack collaboration and granular edit permissions.
- Class legality, spell execution, or arbitrary rule effects.
- Server adoption of a personal pack.
