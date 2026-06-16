# MediaAsset + Loading Strategy v1

<!-- AI-LANDMARK: MEDIA_ASSET_AND_LOADING_STRATEGY_V1 -->

Last updated: 2026-06-17
Task: `A6 MediaAsset + Loading Strategy v1`
Builds on: A1 (EntityGraph), A3 (BlockDocument), A4 (WorkshopPackage), A5 (Projection)

Types + pure helpers + mock seed only. No upload, no object store / CDN / OSS, no
image processing, no UI change. The three rule engines are untouched.

## Purpose

A long-term media metadata model + 3-variant resource model + Summary/Detail/
Payload loading strategy for fan art, character portraits, maps, audio, Workshop
resources, and BlockDocument image/audio blocks.

## Layout

```
src/lib/architecture/
  mediaAsset.ts        MediaAsset model, variants, helpers, mock seed + usage
  blockDocument.ts     + documentMediaRefs() helper
  repositories.ts      MediaAssetRepository (expanded, not duplicated)
  mockRepositories.ts  MockMediaAssetRepository (no longer a stub)
```

## Model

`MediaAsset` stores **media metadata + storage refs only** — no business meaning.
`status`/`visibility` reuse the canonical `EntityStatus`/`EntityVisibility`.
`*Ref.ref` values are opaque (NOT real URLs, NOT base64).

- `MediaAssetKind`: image · gallery · audio · map · avatar · cover ·
  documentAttachment · unknown.
- `MediaAssetVariant`: thumbnail · preview · original · waveform · placeholder.
- `MediaAssetStorageRef { variant, ref?, width?, height?, sizeBytes?, mimeType? }`.
- `MediaAssetUsage { mediaAssetId, usedByType, usedById, variantHint?, role? }` —
  the reverse-lookup source for mock (production: media_usage_index / EntityGraph
  `uses` edges).

## Three resource variants (§5)

| Variant | Used by | Notes |
|---|---|---|
| **thumbnail** | list / card / search | small, fast; PreviewArt fallback when absent |
| **preview** | detail-page main visual | medium; not necessarily the original |
| **original** | open / download / edit / clone / export only | full image / raw audio / map source |

Summary and Detail **never** return `original` by default
(`toMediaAssetDetail` strips `originalRef`; `original` only via `getMediaVariant`).

## Loading strategy (§10) — per object

| Object | Summary (list) | Detail (page) | Payload (edit/clone/export/download) |
|---|---|---|---|
| **FanWork** | title, author, cover **thumbnail**, tags, counts, light relations | block structure, relation summaries, **preview** media | full BlockDocument body, original media |
| **WorkshopPackage** | title, cover thumbnail, system, version, author, tags, sourceTrust, counts | manifest + included entity/doc summaries + deps + entryPoints | included entities/documents, original media |
| **BlockDocument** | title, summary, block-type tags, cover thumbnail | full block structure, lazy media/entity resolution | block payloads, media originals |
| **LinkableEntity** | id/type/title/summary/visibility/tags/cover | relation graph summary | payload by `payloadRef` |
| **ActorPublicProfile** | displayName, systemId, cover thumbnail | public summary projection | (full actor stays local/private) |
| **CampaignPublicProfile** | title, system, cover thumbnail | public summary + public members | internal payload (owner/gm only) |
| **SessionLogPublicSummary** | title, time | public recap segments | internal raw log (owner/gm only) |
| **MediaAsset** | thumbnail + placeholderKind + dims | metadata + thumbnail + **preview** | original / waveform on demand |

Rules: list pages never load `original`; detail pages never load `original` or full
cloneable package payload by default; payload loads only on explicit user action.

## Relation to the EntityGraph (§6)

- A MediaAsset **may be an Entity node** (so it can be referenced/related), but the
  **binary payload never enters the EntityGraph** — the graph only records *who
  uses* a media asset.
- `Entity / FanWork / WorkshopPackage / BlockDocument / Actor / Campaign / Map
  --uses--> MediaAsset` (reusing the existing `uses` RelationType — **no new
  member**).

## Relation to BlockDocument (§7)

- `image` block stores `mediaAssetId`; `imageGallery` stores `mediaAssetId[]`;
  `audio` stores `mediaAssetId`; `mapPreview` stores `mediaAssetId` or `entityId`.
- BlockDocument never inlines base64 / blob / original-image URLs as content truth.
- Render resolves thumbnail/preview/original through `MediaAssetRepository`.
- `documentMediaRefs(doc)` extracts the referenced media ids.

## Relation to WorkshopPackageManifest (§8)

- `includedMediaAssets` references `MediaAssetId` only — the manifest never copies
  media files.
- Export packages may carry media metadata + optional media files; `original`
  loads only on clone / export / enable-to-campaign (future).

## Relation to Projection (§9)

- A MediaAsset has its own `visibility`; access is decided by the A5 projection
  contract (`resolveMediaVariant` runs `decideProjection`).
- publicProjection returns only allowed thumbnail/preview.
- `original` accessibility is decided by projection/permission — `private` /
  `campaignOnly` media never leak through a public page.
- **FanWork public ≠ all its media originals are downloadable.**
- **WorkshopPackage viewable ≠ all includedMediaAssets are cloneable** (clone is
  governed by the manifest `clonePolicy`, A4 — separate from view projection).

## MediaAssetRepository (§11)

Expanded from A1's stub:

```
getMediaSummary(id, viewer?)     getMediaDetail(id, viewer?)
getMediaVariant(id, variant, viewer?)  → ResolvedMediaVariant (storage | placeholder | denied)
getMediaByEntity / getMediaByDocument / getMediaByPackage (projection-filtered)
validateMediaAsset(asset)
```

Mock reads `MEDIA_ASSET_SEED` + `MEDIA_USAGE_SEED`. No upload / object store.

## PreviewArt positioning (§12)

- **PreviewArt** = the deterministic placeholder / fallback when there is no real
  media (current behavior, unchanged).
- **MediaAsset** = the long-term media metadata model.
- They do not conflict: `MediaAsset.placeholderKind` reuses PreviewArt semantics,
  and `resolveMediaVariant` falls back to a `placeholder` result when no storage
  ref exists. PreviewArt UI is not changed this round.

## Cache / index boundaries (§13)

`relation_count_cache` · `related_entity_index` · `media_usage_index` ·
`search_index` · `thumbnail_cache` are **derived data, rebuildable, never the
source of truth** for relations / media / permissions.

## Hard rules (restated)

1. No base64 / blob inlined into Entity / BlockDocument / FanWork / WorkshopPackage.
2. List pages never load `original`; detail never loads `original` by default.
3. MediaAsset = metadata + storage refs; business meaning stays in graph/doc/manifest.
4. Media access is projection-gated; private/campaignOnly media never leak publicly.
