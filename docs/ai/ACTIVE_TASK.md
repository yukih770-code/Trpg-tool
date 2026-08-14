# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: DND Personal Content Portability & Historical Draft Restore v1
- Name: `DND_PERSONAL_CONTENT_PORTABILITY_RESTORE_V1`
- Goal: Let an authenticated owner inspect all immutable versions of a private DND compendium pack, export one selected version as a bounded versioned JSON transfer envelope, and copy any selected historical version into the existing unsaved new-version draft flow without overwriting history.
- Phase: Private ecosystem / portable authored content
- Status: Complete

## Layer Declaration

- IA: Existing Workshop private `我的创作` workbench only; no new page, modal, global navigation entry, public Workshop detail, or package-library surface.
- Object: Owner-private personal compendium pack/version and its CatalogObject entry projections. This is not a WorkshopPackageManifest, PackageLibraryEntry, CampaignObject, or RuntimeObject.
- State: UI State for selected/expanded version and transfer notices; Flow State for the copied unsaved entries; authenticated Server State for owner-scoped version summaries/details; existing Persistent Domain State only when the owner separately invokes the current immutable-version publish API.
- Import/export: Dedicated `trpg-personal-compendium-pack` transfer envelope v1. Legacy accepted personal-pack JSON remains import-compatible. Persistence, owner, Server, Room, version, and entry IDs are omitted; import always creates fresh server-assigned identities.
- Excluded: public publication, package installation/subscription/update/rollback, dependencies, Room admission, official compendium data, rule execution, schema/migration, media binaries, cloud storage, collaborative editing.

## Page Responsibility And Action Hierarchy

- The private content workbench remains responsible for authoring, previewing, version history, portable owner backup, import preview, and explicit immutable-version save.
- It remains not responsible for public discovery/publication, Package Library lifecycle, campaign entry, Room approval, Runtime execution, or official-source redistribution.
- Pack-card primary action remains `查看内容`; its existing current-version draft action remains secondary.
- Inside the inspected object detail, selecting a historical version, exporting it, and copying it to a new-version draft are secondary object-management actions.
- The existing `发布新版本` action remains the only persistence commit after a historical version is copied into Flow State.
- Hidden actions: overwrite version, preserve source IDs on import, automatic download on inspection, automatic save, public share, install/enable/rollback package, Room activation, and destructive history mutation.

## Allowed Files

- `src/lib/platform/personalCompendiumImport.ts` and focused smoke
- `src/lib/api/personalCompendiumPackApiClient.ts` and focused smoke
- `server/api/personalCompendiumPackApiHandlers.ts`, routes, and focused smoke/verification
- `src/components/platform/DndPersonalSpeciesPackPanel.tsx`
- `package.json`
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `ECOSYSTEM_AND_AI_ROADMAP.md`
- `docs/ai/ACTIVE_TASK.md`, `docs/architecture/ARCHITECTURE_INDEX_V1.md`, relevant implementation docs

## Forbidden Changes

- PostgreSQL schema/migrations, repository storage semantics, official/local rule data, character store, Campaign, Room, Runtime, permissions, Workshop public catalog, PackageLibraryEntry, WorkshopPackageManifest, media, AI/model behavior
- Any overwrite/delete of an immutable version or automatic persistence from inspection/export/draft restore
- `output/`, `tools/`, `work/`

## Completion Criteria

- Owner-only API lists bounded immutable version summaries only after pack ownership is resolved.
- Client exposes typed version history and continues to read one selected version through the owner-only endpoint.
- Export helper creates a bounded, human-readable, versioned personal-pack envelope with no owner/user/Room/server IDs and round-trips through import preview.
- Import accepts the new envelope and the existing legacy shape, rejects unsupported format versions, invalid entry kinds/payloads, and oversize transfer text before any write.
- Workbench can select and inspect every version, download only after an explicit action, and copy the selected version into the existing unsaved new-version draft.
- Copying a historical version performs no write and clearly states that publishing creates a new immutable version; old Room references remain unchanged.
- Focused API/client/transfer smokes, existing personal-content/import/Room-reference regressions, navigation/action audit, TypeScript, server/frontend builds, diff check, docs, cleanup, and one isolated commit pass.
