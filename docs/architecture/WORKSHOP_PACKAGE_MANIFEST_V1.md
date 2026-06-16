# Workshop Package Manifest v1

<!-- AI-LANDMARK: WORKSHOP_PACKAGE_MANIFEST_V1 -->

Last updated: 2026-06-17
Task: `A4 Workshop Package Manifest v1`
Builds on: A1 (EntityGraph), A2 (persistence decision), A3 (BlockDocument)

Types + pure helpers + mock seed only. No real clone/export/import/subscribe/
publish, no UI, no backend, no upload. The three rule engines are untouched.

## Purpose

A unified package descriptor so rule summaries, scenario chapters, NPC sets,
monster/boss sets, map notes, character templates, campaign asset packs, system
expansion packs, and BlockDocument bundles can be packaged → cloned → exported →
imported → added to a local content list → and later published to the public
Workshop.

Private-first now: Workshop is a **content-package system**, not a public market.

## Layout

```
src/lib/architecture/
  workshopPackage.ts       protocol: manifest, refs, policies, helpers
  workshopPackageSeed.ts   3 example manifests for A10/A11
  repositories.ts          WorkshopPackageRepository (extended, not duplicated)
  mockRepositories.ts      MockWorkshopPackageRepository over the seed
```

## Model

`WorkshopPackageManifest` DECLARES structure; it never copies bodies. `status`/
`visibility` reuse the canonical `EntityStatus`/`EntityVisibility` (single source).

- Reference shapes hold ids only: `WorkshopPackageEntityRef { entityId, entityType, role? }`,
  `WorkshopPackageDocumentRef { documentId, title?, role? }`,
  `WorkshopPackageMediaRef { mediaAssetId, kind? }`.
- `WorkshopPackageDependency { kind: package|entity|ruleSystem, ref, entityType?, version?, optional?, note? }`.
- `WorkshopPackageEntryPoint { kind: blockDocument|entity, ref, entityType?, title?, primary? }`.

### V1 must-support fields

`packageId` · `manifestVersion` · `schemaVersion` · `title` · `summary` ·
`author` · `version` · `systemId` · `status` · `visibility` · `tags` ·
`includedEntities` · `includedDocuments` · `dependencies` · `entryPoints` ·
`clonePolicy` · `readOnlyPolicy` · `sourceTrust` · `createdAt` · `updatedAt`.
(`tags`/`previewKind` added for browse summaries; `clonedFromPackageId?` for provenance.)

### V1 contract-only (reserved, not consumed)

`includedMediaAssets` · `license` · `remoteSource` · `publishChannel` ·
`subscriptionPolicy` · `changelog` · `compatibility` · `installHints`.

## Relation to the EntityGraph (§6)

The manifest's `includedEntities` / `includedDocuments` / `dependencies` are
**structure declarations only**. `projectPackageRelations(manifest)` projects
them to EntityGraph edges (the future write path for A10/A11). **The EntityGraph
stays the single relation authority; the package is not a second relation source.**

Directions (using existing A1 RelationTypes only — **no new member added**):

| Declaration | Projected edge |
|---|---|
| includedEntities | `Entity --containedIn--> Package` |
| includedDocuments | `Document --containedIn--> Package` |
| dependencies (package/entity) | `Package --dependsOn--> target` |
| primary entryPoint | `Package --publishedFrom--> document/entity` |
| clonedFromPackageId | `Package --clonedFrom--> source Package` |

Notes:
- Direction uses **`Entity --containedIn--> Package`** (existing `containedIn`),
  not a new `contains` member — avoids enum churn and an inverse-duplicate.
- `ruleSystem` dependencies are declared but **not** projected (a system id is not
  a graph node).
- `authoredBy` is deferred until user/author nodes exist (no `user` EntityType yet).

## Relation to BlockDocument (§7)

- Scenario chapters and rule summaries can be BlockDocuments.
- NPC profiles and map notes can be **Entity + BlockDocument payload**.
- The manifest references `documentId` / `entityId` only — it **does not copy
  prose**. `entryPoints` may point at one or more BlockDocuments
  (`packageBlockDocumentEntryPoints` returns them).

## Policies (§8) + Source trust (§9)

`ClonePolicy`:
- `cloneAllowed` — copy into your library; future write emits a `clonedFrom` /
  derived relation.
- `referenceOnly` — add to local content list, keep the source reference.
- `forbidden` — view metadata / public summary only; no clone.

`ReadOnlyPolicy`: `editableClone` · `readOnlyReference` · `ownerOnlyEditable`.

`SourceTrust`: `official` · `community` · `personal` · `imported` · `unknown` —
future use: rule-data trust, import risk prompts, public Workshop ranking, and the
user's enable/disable decision. (All policy/clone/trust behavior is type + doc
only this round; no real clone logic.)

## WorkshopPackageRepository

Extended (not duplicated) from A1. Legacy `list()` / `getById()` (returning the
current `WorkshopBrowseItem`) are kept so the existing Workshop UI is unaffected;
manifest methods are added:

```
getPackageSummary(id)      getPackageDetail(id)      listPackages(options?)
getPackagesByEntity(id)    getPackagesByDocument(id)
getPackageManifest(id)     validateManifest(manifest)
```

Mock implementation reads `WORKSHOP_PACKAGE_SEED`. No Local/Api repository yet.

## Loading layers (§12)

- **Summary**: title, cover (`previewKind`), system, version, author, tags,
  `sourceTrust`, entity/document counts. List pages.
- **Detail**: full manifest + included entity/document summaries + dependency
  summaries + entryPoints (refs resolved lazily). Detail pages.
- **Payload**: full entities/documents/media — loaded only on real clone / export
  / enable (future).

## Relation to current Workshop mock / UI (§11 — future migration, not done now)

```
WORKSHOP_BROWSE_SAMPLES        →  future: derived from WorkshopPackageSummary
Workshop item detail page      →  future: WorkshopPackageDetail
                                  + EntityGraph relations + BlockDocument entryPoints
```

`WorkshopShell` / `FanWorkDetail` still use the legacy `list()` / `getById()`
this round — intentionally unchanged.

## Hard rules (restated)

1. Manifest describes structure; it never copies prose as a second truth source.
2. Manifest references Entity / BlockDocument / MediaAsset by id; it is not a
   relation authority.
3. `includedEntities` / `dependencies` project to EntityGraph edges via
   `projectPackageRelations`; the graph remains authoritative.
4. No real clone / export / import / subscribe / publish this round.
