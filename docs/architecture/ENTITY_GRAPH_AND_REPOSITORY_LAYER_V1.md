# EntityGraph + Repository Layer v1

<!-- AI-LANDMARK: GRAPH_FIRST_ENTITY_GRAPH_DOMAIN_MODEL_V1 -->

Last updated: 2026-06-16
Task: `A1 Graph-first Domain Model + EntityGraph + Repository Interfaces v1`

## Purpose

Make the **EntityGraph** the single authoritative model for every cross-object
relationship on the platform, and put a **Repository boundary** between UI and
data so the current mock can later become Local / Api / GraphDb implementations
without rewriting pages. This is types + interfaces + a mock/seed binding only —
no database, no backend, no routing.

## Layout

```
src/lib/architecture/
  entityGraph.ts        domain model (nodes, edges, enums, query options, helpers)
  repositories.ts       7 repository interfaces + PlatformRepositories aggregate
  entityGraphSeed.ts    normalizes legacy mock data → one node + edge set
  mockRepositories.ts   Mock implementations + `platformRepo` composition root
```

## Domain model (`entityGraph.ts`)

- `EntityType` (V1-locked): actor · campaign · sessionLog · map · workshopPackage ·
  fanWork · blockDocument · mediaAsset · world · npc · (handout = extension).
- `RelationType`: features · belongsTo · recaps · mentions · uses · adaptedFrom ·
  inspiredBy · relatedTo · authoredBy · containedIn · dependsOn · publishedFrom ·
  clonedFrom.
- `EntityStatus`: draft · published · archived · hidden · underReview · deleted.
- `EntityVisibility` (canonical, write-side): private · campaignOnly · unlisted · public.
- `EntityProjection` (read-side): public · unlisted · owner · gm · player.
- `EntityNode` = identity + light metadata + `payloadRef` (heavy content lives in a
  payload store, A3/A6). `EntityRelation` = directed edge, no inlined titles/bodies.
- `EntitySummary` / `EntityDetailRef` projections; `EntityGraphSeed` = nodes + relations.

## Repository boundary (`repositories.ts`)

Interfaces: `EntityGraphRepository`, `EntityRepository`, `BlockDocumentRepository`,
`WorkshopPackageRepository`, `FanWorkRepository`, `MediaAssetRepository`,
`PermissionProjectionRepository`, aggregated by `PlatformRepositories`.

Swap path (same interfaces): **Mock → Local → Api → GraphDb / Hybrid**.

V1 note: mock reads are **synchronous** to keep the current render path unchanged.
Introducing an async `ApiRepository` (A11) is a bounded change at the few repository
call sites — not a rewrite. The architectural win (single authoritative graph +
boundary) is independent of sync/async.

## Hard rules (enforced going forward)

1. Business modules MUST NOT keep private cross-object relation arrays.
2. Pages/components MUST NOT hand-write relation filtering over mock maps.
3. All relation reads/writes go through `EntityGraphRepository` (via `platformRepo`).
4. Pages query `platformRepo` (the abstraction), never raw `*MockData` relation maps.

## What converged this round

- `linkableEntityMockData` (`LINKABLE_ENTITIES`, `ENTITY_RELATIONS`),
  `communityMockData` (`FAN_WORKS`, `RELATED_FAN_WORKS_BY_WORKSHOP`) and
  `WORKSHOP_BROWSE_SAMPLES` are now **seed sources only**, read exclusively by
  `entityGraphSeed`.
- `FanWork.relationIds` / `relatedWorkshopItemIds` are `@deprecated` (seed-only).
- UI relation queries (FanPlaza, Workshop, LinkableEntity) route through the graph:
  `fanWorkRelatedTypes`, `EntityRelationList`, `WorkshopItemDetail`,
  `FanWorkDetail`, `FanPlazaShell`, `WorkshopShell`.

## Deferred (not this round)

Async repository, LocalRepository / ApiRepository, BlockDocument protocol (A3),
Workshop Package Manifest (A4), Projection enforcement (A5), MediaAsset model (A6),
deletion of deprecated legacy helpers, B0 backend.
