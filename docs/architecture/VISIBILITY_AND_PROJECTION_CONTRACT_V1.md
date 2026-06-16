# Visibility + Projection Contract v1

<!-- AI-LANDMARK: VISIBILITY_AND_PROJECTION_CONTRACT_V1 -->

Last updated: 2026-06-17
Task: `A5 Visibility + Projection Contract v1`
Builds on: A1 (EntityGraph), A2 (persistence), A3 (BlockDocument), A4 (WorkshopPackage)

Types + pure helpers + mock repository + doc only. No auth, no backend, no UI, no
public-page implementation. The three rule engines are untouched.

## Core distinction

- **Visibility** (write-side, stored): how exposed an object is —
  `private | campaignOnly | unlisted | public` (reused from A1, single source).
- **Projection** (read-side, derived): the shape a specific viewer is allowed to
  read out — `public | unlisted | owner | gm | player` (+ `denied`).

These are never conflated. An object stores one visibility; different viewers get
different projections of it. **Projection is enforced by the Repository / Service
layer (server-side in B0), never by frontend components filtering fields.**

## Layout

```
src/lib/architecture/
  projection.ts        viewer model, decision logic, per-type field policy, DTOs
  repositories.ts      PermissionProjectionRepository (expanded) + ViewerContext re-export
  mockRepositories.ts  MockPermissionProjectionRepository (no longer a stub)
```

## Types

- `ViewerRole = anonymous | owner | gm | player | campaignMember | admin`
- `ViewerContext = { userId?, role, campaignIds?, knownShareCodes? }` (`ANONYMOUS_VIEWER` provided)
- `ProjectionType = public | unlisted | owner | gm | player | denied`
- `ProjectionReason`, `EntityAccessLevel = none | view | reference | clone | edit`
- `ProjectionDecision = { projection, allowed, reason, accessLevel }`
- `ProjectionInput = { visibility, ownerId?, shareCode? }`
- `ProjectionPolicy` + `ENTITY_PROJECTION_POLICY: Record<EntityType, ProjectionPolicy>`
- `ProjectedEntitySummary` / `ProjectedEntityDetail` (carry the projection + optional DTO)

## Decision rules (§5)

| Visibility | anonymous / non-member | link holder | gm | player / campaignMember | owner | admin |
|---|---|---|---|---|---|---|
| `public` | publicProjection | — | — | — | ownerProjection | ownerProjection |
| `unlisted` | **denied** (not listed/searched) | unlistedProjection | — | — | ownerProjection | ownerProjection |
| `private` | **denied** | — | — | — | ownerProjection | ownerProjection |
| `campaignOnly` | **denied** | — | gmProjection | playerProjection | ownerProjection | ownerProjection |

- `unlisted` is link-gated (`knownShareCodes` contains the object's `shareCode`)
  and never enters public lists / recommendation / search.
- `campaignOnly` differentiates **GM vs player** (mock uses role; real campaign
  membership lands in B0).
- `accessLevel`: owner/admin → `edit`; gm/player/public/unlisted → `view`; denied → `none`.

## Per-EntityType public/internal boundaries (§6)

Encoded as data in `ENTITY_PROJECTION_POLICY` (the authoritative field contract).

- **Actor** — public may include: displayName, systemId, public summary, cover,
  public tags. Public must NOT include: full stats, current HP/resources,
  inventory, secrets, GM notes, private background, hidden relations.
- **Campaign** — public must NOT include: GM spoilers, hidden NPCs, future plot,
  unpublished maps, private members, hidden logs.
- **SessionLog** — separates: internal raw log · public recap summary ·
  player-visible log · GM notes. Public exposes only the recap/player-visible parts.
- **FanWork** — separates: published body · draft · hidden blocks · author private
  notes · unpublished related objects. Public exposes only the published body and
  public relations.
- **WorkshopPackage** — separates: public metadata · cloneable content · read-only
  reference content · private dependencies · unpublished includedEntities. Public
  exposes metadata only.
- **BlockDocument** — separates: public blocks · internal blocks · GM-only blocks ·
  draft blocks · future hidden blocks. (Block-level visibility is **reserved**,
  see §9.)
- Also defined: map, world, npc, mediaAsset, handout.

## PermissionProjectionRepository (§7)

Expanded from A1's stub (id-keyed; entity resolved via the graph):

```
resolveProjection(entityId, viewer): ProjectionDecision
canViewEntity / canEditEntity / canCloneEntity / canReferenceEntity
projectEntitySummary(entityId, viewer): ProjectedEntitySummary
projectEntityDetail(entityId, viewer): ProjectedEntityDetail
```

Mock implementation uses `decideProjection` + `projectNode*` helpers. Owner/admin
edit; clone/reference are view-tier gates here (the real clone allowance is the
WorkshopPackage `clonePolicy`, separate — see §10). Redaction strips owner-only
fields (e.g. `ownerId`) from public/unlisted/player projections.

## Relation to the EntityGraph (§8)

1. The EntityGraph remains the relation authority.
2. Projection decides which nodes/edges a viewer may see.
3. `getRelations` / `getRelatedEntities` must (future) be projection-filtered.
4. publicProjection must not return `private` / `campaignOnly` relations.
5. campaignOnly relations must (future) be GM/player filtered.

This round defines the boundary; it does not yet rewrite every graph query.

## Relation to BlockDocument (§9)

1. BlockDocuments will support **block-level visibility** in future.
2. A3 does not yet require per-block visibility — not changed this round.
3. Reserved: `block.visibility` / `block.audience` (gm-only / player / public).
4. publicProjection returns only public blocks.
5. GM-only blocks must never appear in playerProjection.

## Relation to WorkshopPackageManifest (§10)

1. Manifest metadata can be public.
2. Whether `includedEntities` / `includedDocuments` are visible is decided by
   **projection** (per referenced object's own visibility).
3. `clonePolicy` / `readOnlyPolicy` are **distinct** from projection — do not
   confuse them.
4. **forbidden clone ≠ forbidden view**: a viewable package may still be
   un-cloneable.
5. `referenceOnly` may expose public metadata but not the full payload.

## Loading + projection (§11)

- **Summary DTO** must be projected.
- **Detail DTO** must be projected.
- **Payload DTO** must be projected (most strictly).

Forbidden: list pages fetching full data then hiding fields in the frontend.
Correct: the Repository / Service returns an already-projected DTO per
`viewerContext` (`projectEntitySummary` / `projectEntityDetail`).
