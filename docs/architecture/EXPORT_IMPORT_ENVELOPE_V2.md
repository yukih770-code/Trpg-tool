# Export / Import Envelope v2

<!-- AI-LANDMARK: PLATFORM_EXPORT_IMPORT_ENVELOPE_V2 -->

Last updated: 2026-06-17
Task: `A8 Export / Import Envelope v2`
Builds on: A1–A7, and the existing character envelope (`LOCAL_DATA_CONTRACT_CHARACTER_ENVELOPE`).

Types + pure helpers only. No UI, no import button, no backend, no real upload.
The three rule engines are untouched.

## Backward compatibility

`src/lib/data-contract/export-envelope.ts` is **unchanged**. The existing
character export/import (`TRPG_CHARACTER_EXPORT_KIND`, `TrpgCharacterExportEnvelope`,
`createCharacterExportEnvelope`, `parseCharacterImportJson`) keeps working exactly
as before. v2 lives in a new file `platform-envelope.ts` and **wraps** the legacy
character envelope (`createPlatformCharacterEnvelope` → `payload` is the legacy
envelope). No duplicate envelope system.

## Three independent versions (do not conflate)

- `envelopeVersion` (= `PLATFORM_ENVELOPE_VERSION = 2`) — the envelope FORMAT.
- `schemaVersion` — the payload OBJECT format (each included object carries its own).
- `manifestVersion` — the WorkshopPackageManifest format (on the manifest itself).

## Export kinds (§4)

`character` · `entity` · `entityGraph` · `blockDocument` · `workshopPackage` ·
`mediaAssetMetadata` · `fanWork` · `campaignSummary` · `sessionLogSummary` ·
`platformBackup` (`PLATFORM_EXPORT_KINDS`). A fan work is carried as
`kind: 'fanWork'` with its entity + `includedDocuments` (body) — not a special blob.

## Envelope shape (§5)

`PlatformExportEnvelope { kind, envelopeVersion, schemaVersion, exportedAt,
exportScope, exportedBy?, sourceApp?, sourceVersion?, payload?, includedEntities?,
includedRelations?, includedDocuments?, includedPackages?, includedMediaAssets?,
validation?, metadata? }`. Built by `createPlatformExportEnvelope(...)`.

## Import dry-run / validation / conflict (§6)

- `ImportValidationResult` / `ImportValidationIssue` (severity `valid|warning|error`,
  codes: `unsupportedVersion · unsupportedKind · missingDependency ·
  missingRelationTarget · corruptPayload · duplicateId · visibilityRisk ·
  mediaMissing · unknownBlockType`).
- `ImportConflict` / `ImportConflictResolution`
  (`skip|rename|remapId|preserveId|overwrite`).
- `ImportStrategy` (`skipInvalid|validOnly|renameDuplicates|preserveIds|remapIds|
  dryRunOnly`) + `ImportScope { strategy, dryRun, existingEntityIds?, existingDocumentIds? }`.
- `dryRunImport(envelope, scope) → ImportDryRunResult { ok, validation, conflicts,
  outcomes[], summary }` — validates every object and reports a `PerObjectImportOutcome`
  (`imported|skipped|warning|error|remapped`) **without applying anything**.
- `validatePlatformEnvelope(envelope)` validates the envelope shell.

## Corrupt-object isolation (§7)

`dryRunImport` validates each object independently and records a per-object
outcome. Therefore:

1. One corrupt Entity does not fail the whole package.
2. One corrupt BlockDocument does not fail the whole WorkshopPackage.
3. A MediaAsset with no file imports as **metadata + PreviewArt placeholder**
   (`mediaMissing` warning), not an error.
4. A relation with a missing source/target becomes a `missingRelationTarget`
   warning and is **skipped**, never force-written.
5. Every object's import result is traceable via `outcomes[]`.

## Relation to the EntityGraph (§8)

- An EntityGraph export carries `includedEntities` (nodes) + `includedRelations`
  (edges).
- On import, each relation's `sourceId`/`targetId` must exist in the import set or
  the target graph — else `missingRelationTarget` (skipped).
- The EntityGraph stays the **single relation authority**; payload arrays never
  become a relation truth source via import.
- After a WorkshopPackage import, its `includedEntities` / `dependencies` are
  projected to EntityGraph edges (`projectPackageRelations`, A4) — not stored as a
  second authority.

## Relation to BlockDocument (§9)

- A BlockDocument can be exported standalone (`kind: 'blockDocument'`).
- FanWork / WorkshopPackage reference a document by `documentId`.
- A document's entity/media refs are import-validated (missing → warning).
- Unknown block types degrade to an `unknown` block on import
  (`unknownBlockType` warning) — never a hard failure.
- HTML strings are never imported as content truth (the protocol forbids them).

## Relation to WorkshopPackageManifest (§10)

- A WorkshopPackage export includes the manifest (referencing
  `includedEntities` / `includedDocuments` / `includedMediaAssets`).
- Import dry-runs the manifest first; missing `entity`/`package` dependencies →
  `missingDependency` warning.
- `clonePolicy` / `readOnlyPolicy` / `visibility` survive import (they are manifest
  fields, never dropped). The manifest never copies prose as a second truth source.

## Relation to MediaAsset (§11)

- The envelope carries **MediaAsset metadata only**; thumbnail/preview/original
  binaries are handled later by package files / storage refs.
- Missing media file → fall back to PreviewArt placeholder (`mediaMissing` warning).
- Whether `original` may be exported/imported is bound by projection/permission
  (see §12).

## Relation to Projection (§12)

- `ExportScope`: `ownerBackup` · `friendShare` · `publicPackage` →
  `projectionForScope()` maps to `owner` / `unlisted` / `public` ceilings.
- `ownerBackup` may include private data; `publicPackage` may include only public
  projection.
- Exporting a `private` / `campaignOnly` object under `friendShare` /
  `publicPackage` raises a `visibilityRisk` warning (`assessVisibilityRisk`).
- The frontend's currently-visible data must never be mistaken for an owner-level
  full backup — scope makes the intended projection explicit.

## Hard rules (restated)

1. The existing character envelope is unchanged and fully compatible.
2. No untyped JSON blob — every object carries its own schemaVersion.
3. Imports are dry-runnable; corrupt objects are isolated.
4. Media originals are never embedded in the JSON envelope.
5. EntityRelation imports validate source/target existence.
6. Manifests never copy prose as a second relation/content authority.
