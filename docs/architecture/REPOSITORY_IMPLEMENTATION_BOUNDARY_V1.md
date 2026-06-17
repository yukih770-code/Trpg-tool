# Repository Implementation Boundary v1

<!-- AI-LANDMARK: PLATFORM_REPOSITORY_COMPOSITION_ROOT_V1 -->
<!-- AI-LANDMARK: PLATFORM_DATA_SERVICE_V1 -->

Last updated: 2026-06-17
Task: `A7 Repository Implementation Boundary v1`
Builds on: A1–A6.

Hardens the data-access boundary. No UI redesign, no backend, no auth, no upload.
The three rule engines are untouched.

## Layers

```
UI components
   │  (read viewer-scoped data)
   ▼
PlatformDataService          ← ./repositoryServices  (projection enforcement, async funnel)
   │
   ▼
PlatformRepositories         ← ./repositoryComposition (single composition root + selection seam)
   │
   ▼
Mock* repositories           ← ./mockRepositories     (implementation; binds seeds)
   │
   ▼
seeds / mock data            ← entityGraphSeed, blockDocumentSeed, workshopPackageSeed,
                               mediaAsset seed, community/linkable/workshop mock
```

## Composition root (§4)

`./repositoryComposition` is the **single** default entry:

- `platformRepositories: PlatformRepositories` — the one instance.
- `platformRepo` — back-compat alias (used by current components).
- `selectPlatformRepositories()` — the **selection seam**: returns
  `createMockRepositories()` today; swap to Local/Api/GraphDb/Hybrid in one edit
  with no UI change.

`./mockRepositories` is the **implementation layer only** (Mock* classes +
`createMockRepositories()` factory) — it no longer exports a singleton, so there
is exactly one composition root and no duplicate entry. Pages/components never
`new` a repository and never import a concrete mock map.

## Implementation boundaries (§6 of A7 brief)

| Impl | Backing | Sync/async | Status |
|---|---|---|---|
| MockRepository | in-memory seeds | sync | current |
| LocalRepository | localStorage / IndexedDB | sync | future |
| ApiRepository | B0 backend / OpenAPI | **async** | future (A11) |
| GraphDbRepository | graph DB read-model | sync/async | only past A2 triggers |
| HybridRepository | Api/Local + GraphDb | async | future |

All implement the identical `./repositories` interfaces; swapping is one edit at
the composition root.

## Sync / async decision (§5)

**Decision: keep synchronous interfaces for the mock/local phase; introduce a
Service funnel now.** Rationale: converting the whole UI to async reads today
would be a large regression risk for zero current benefit (no backend). Instead,
`PlatformDataService` (`./repositoryServices`) is the single viewer-aware read
funnel. When `ApiRepository` lands (A11), **the Service becomes async** and the
bounded set of Service call sites migrate — the UI does not get rewritten. This
is option 3 (service adapter), chosen over (1) "stay sync forever" and (2) "go
async now".

Trigger to flip the Service async: the moment a non-mock (Api/Hybrid) repository
is selected at the composition root.

## Projection enforcement (§6)

Projection is enforced in the **Service / Repository layer, never in UI
components**. `PlatformDataService`:

- `getEntitySummary` / `getEntityDetail` → `PermissionProjectionRepository`
  (Summary and Detail DTOs are projected).
- `getRelatedEntities` → graph query **then projection-filtered** (drops neighbors
  the viewer cannot view) — the contract that EntityGraph queries are projected.
- `getMediaSummary` / `getMediaVariant` → `MediaAssetRepository` projection
  (original variant is projection-gated; `private`/`campaignOnly` media never leak).
- `getDocumentDetail` / `getPackageDetail` / `getFanWork` / `listFanWorks` →
  gated by the object's own visibility.

UI adoption of the Service is incremental (A9). Components are NOT forced onto it
this round to avoid regression; today's mock data is public so raw reads are
already projection-safe.

## EntityGraph query boundary (§7)

`getRelations` / `getRelatedEntities` / `getRelatedFanWorks` /
`getRelatedWorkshopPackages` / `getPackagesByEntity` / `getDocumentsByEntity` /
`getMediaByEntity` all run through repositories — pages never scan seeds/mock.
Reverse lookups go through the EntityGraph or a derived index; **derived indexes
are never the source of truth**. Future GraphDb/Hybrid repositories replace these
implementations without UI change.

## Integration points (§8)

- **BlockDocumentRepository**: resolves entity/media refs via
  `documentEntityRefs` / `documentMediaRefs`, but cross-object relation authority
  stays in the EntityGraph (`projectDocumentRelations`).
- **MediaAssetRepository**: never returns `original` from Summary/Detail; only via
  `getMediaVariant('original', viewer)`, projection-gated.
- **WorkshopPackageRepository**: the manifest is a structure declaration;
  `includedEntities` / `dependencies` project to EntityGraph edges
  (`projectPackageRelations`) and are **not** a second relation authority.

## Audit result (this round)

- Components importing concrete mock data: **none remaining**. `WorkshopShell`
  now reads subscriptions via `workshopPackages.listSubscriptions()`; the trivial
  `fanWorkCoverKind` helper was inlined (`work.coverKind ?? work.type`).
- Cross-object relation queries: all via `platformRepo.entityGraph` (no
  hand-written relation filtering in components).
- Projection: enforced in `PermissionProjectionRepository` / `MediaAssetRepository`
  / `PlatformDataService`; not in UI.
- Block/Media/Package repositories: real mock implementations (not bare stubs).
- Composition: one root (`repositoryComposition`); `mockRepositories` is impl-only.

## Hard rules (restated)

1. Pages never import mock data; they read `platformRepo` / `platformDataService`.
2. No hand-written cross-object relation filtering in components.
3. UI never decides public/owner/gm/player — the Service/Repository does.
4. UI never reads `original` media directly — only via `getMediaVariant`.
5. EntityGraph stays the relation authority; payload arrays and manifests are not.
