/**
 * MediaAsset model + media loading strategy.
 *
 * AI-LANDMARK: MEDIA_ASSET_AND_LOADING_STRATEGY_V1
 *
 * Long-term media metadata model for fan art, character portraits, maps, audio,
 * Workshop resources, and BlockDocument image/audio blocks.
 *
 * Hard rules:
 *   - NEVER inline base64 / blob / original-image URLs into Entity / BlockDocument
 *     / FanWork / WorkshopPackage. Those reference a MediaAsset by id only.
 *   - List pages never load `original`; detail pages never load `original` by
 *     default. Original loads only on explicit open / download / edit / clone /
 *     export / enable.
 *   - MediaAsset stores media metadata + storage refs only — no business
 *     semantics. Business meaning stays in EntityGraph / BlockDocument / Manifest.
 *   - PreviewArt remains the deterministic fallback when no real media exists.
 *
 * Types + pure helpers + mock seed only. No upload, no object store, no image
 * processing. `*Ref.ref` values are opaque (NOT real URLs, NOT base64).
 */
import type { EntityStatus, EntityType, EntityVisibility } from './entityGraph';
import { ANONYMOUS_VIEWER, decideProjection, type ProjectionDecision, type ViewerContext } from './projection';

export type MediaAssetId = string;

export type MediaAssetKind =
  | 'image'
  | 'gallery'
  | 'audio'
  | 'map'
  | 'avatar'
  | 'cover'
  | 'documentAttachment'
  | 'unknown';

export type MediaAssetVariant = 'thumbnail' | 'preview' | 'original' | 'waveform' | 'placeholder';

/** Reuse canonical lifecycle/visibility enums (single source). */
export type MediaAssetStatus = EntityStatus;
export type MediaAssetVisibility = EntityVisibility;

export type MediaAssetDimensions = { width?: number; height?: number };

/** A storage reference for one variant. `ref` is opaque — not a real URL/base64. */
export type MediaAssetStorageRef = {
  variant: MediaAssetVariant;
  ref?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
};

/** PreviewArt-compatible placeholder used when no real media exists. */
export type MediaAssetPlaceholder = {
  placeholderKind: string;
};

export type MediaAssetPayloadRef = {
  kind: 'storage' | 'placeholder' | 'none';
  ref?: string;
};

export type MediaAsset = {
  id: MediaAssetId;
  schemaVersion: number;
  kind: MediaAssetKind;
  status: MediaAssetStatus;
  visibility: MediaAssetVisibility;
  ownerId?: string;
  title?: string;
  altText?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  thumbnailRef?: MediaAssetStorageRef;
  previewRef?: MediaAssetStorageRef;
  originalRef?: MediaAssetStorageRef;
  waveformRef?: MediaAssetStorageRef;
  /** PreviewArt fallback kind when no real media is available. */
  placeholderKind?: string;
  createdAt: string;
  updatedAt: string;
};

/** List/card DTO: thumbnail-level only, NEVER original/preview. */
export type MediaAssetSummary = {
  id: MediaAssetId;
  kind: MediaAssetKind;
  status: MediaAssetStatus;
  visibility: MediaAssetVisibility;
  title?: string;
  altText?: string;
  thumbnailRef?: MediaAssetStorageRef;
  placeholderKind?: string;
  width?: number;
  height?: number;
  durationMs?: number;
};

/** Detail DTO: metadata + thumbnail + preview. `original` is stripped (gated). */
export type MediaAssetDetail = {
  asset: MediaAsset;
};

/** Which object uses a media asset (derived reverse-lookup source for mock). */
export type MediaAssetUsage = {
  mediaAssetId: MediaAssetId;
  usedByType: EntityType;
  usedById: string;
  variantHint?: MediaAssetVariant;
  role?: string;
};

/** Result of resolving a single variant under projection. */
export type ResolvedMediaVariant =
  | { kind: 'storage'; ref: MediaAssetStorageRef }
  | { kind: 'placeholder'; placeholder: MediaAssetPlaceholder }
  | { kind: 'denied' };

export type MediaAssetValidationIssue = {
  code: 'unknown-kind' | 'no-resource' | 'invalid-dimensions';
  message: string;
};

export type MediaAssetValidationResult = {
  ok: boolean;
  issues: MediaAssetValidationIssue[];
};

const KNOWN_KINDS = new Set<MediaAssetKind>([
  'image', 'gallery', 'audio', 'map', 'avatar', 'cover', 'documentAttachment', 'unknown',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function resolveMediaProjection(asset: MediaAsset, viewer: ViewerContext = ANONYMOUS_VIEWER): ProjectionDecision {
  return decideProjection({ visibility: asset.visibility, ownerId: asset.ownerId }, viewer);
}

function pickVariantRef(asset: MediaAsset, variant: MediaAssetVariant): MediaAssetStorageRef | undefined {
  switch (variant) {
    case 'thumbnail': return asset.thumbnailRef;
    case 'preview': return asset.previewRef;
    case 'original': return asset.originalRef;
    case 'waveform': return asset.waveformRef;
    case 'placeholder': return undefined;
    default: return undefined;
  }
}

export function toMediaAssetSummary(asset: MediaAsset): MediaAssetSummary {
  return {
    id: asset.id,
    kind: asset.kind,
    status: asset.status,
    visibility: asset.visibility,
    title: asset.title,
    altText: asset.altText,
    thumbnailRef: asset.thumbnailRef,
    placeholderKind: asset.placeholderKind,
    width: asset.width,
    height: asset.height,
    durationMs: asset.durationMs,
  };
}

/** Detail strips `original` (loading strategy: original only via getMediaVariant). */
export function toMediaAssetDetail(asset: MediaAsset): MediaAssetDetail {
  return { asset: { ...asset, originalRef: undefined } };
}

/** Resolve a variant under projection. private/campaignOnly never leak publicly. */
export function resolveMediaVariant(
  asset: MediaAsset,
  variant: MediaAssetVariant,
  viewer: ViewerContext = ANONYMOUS_VIEWER,
): ResolvedMediaVariant {
  const decision = resolveMediaProjection(asset, viewer);
  if (!decision.allowed) return { kind: 'denied' };
  const ref = pickVariantRef(asset, variant);
  if (ref) return { kind: 'storage', ref };
  if (asset.placeholderKind) return { kind: 'placeholder', placeholder: { placeholderKind: asset.placeholderKind } };
  return { kind: 'denied' };
}

export function validateMediaAsset(asset: MediaAsset): MediaAssetValidationResult {
  const issues: MediaAssetValidationIssue[] = [];
  if (!KNOWN_KINDS.has(asset.kind)) {
    issues.push({ code: 'unknown-kind', message: `Unknown media kind "${asset.kind}".` });
  }
  if (!asset.thumbnailRef && !asset.previewRef && !asset.originalRef && !asset.waveformRef && !asset.placeholderKind) {
    issues.push({ code: 'no-resource', message: 'MediaAsset has no variant ref and no placeholderKind.' });
  }
  if ((asset.width !== undefined && asset.width < 0) || (asset.height !== undefined && asset.height < 0)) {
    issues.push({ code: 'invalid-dimensions', message: 'Dimensions must be non-negative.' });
  }
  return { ok: issues.length === 0, issues };
}

// ─── Mock seed ───────────────────────────────────────────────────────────────

const store = (id: string, variant: MediaAssetVariant): MediaAssetStorageRef => ({
  variant,
  ref: `mock-store://${id}/${variant}`,
});

export const MEDIA_ASSET_SEED: MediaAsset[] = [
  {
    id: 'media-elyna-sketch-1',
    schemaVersion: 1,
    kind: 'image',
    status: 'published',
    visibility: 'public',
    ownerId: 'author-sample',
    title: '艾琳娜速写',
    altText: '流亡途中的艾琳娜铅笔速写',
    mimeType: 'image/png',
    width: 1200,
    height: 1600,
    thumbnailRef: { ...store('media-elyna-sketch-1', 'thumbnail'), width: 150, height: 200 },
    previewRef: { ...store('media-elyna-sketch-1', 'preview'), width: 600, height: 800 },
    originalRef: { ...store('media-elyna-sketch-1', 'original'), width: 1200, height: 1600 },
    placeholderKind: 'character',
    createdAt: '2026-05-20',
    updatedAt: '2026-05-28',
  },
  {
    id: 'media-elyna-cover',
    schemaVersion: 1,
    kind: 'cover',
    status: 'published',
    visibility: 'public',
    ownerId: 'author-sample',
    title: '流亡日记封面',
    width: 1600,
    height: 900,
    thumbnailRef: { ...store('media-elyna-cover', 'thumbnail'), width: 160, height: 90 },
    previewRef: { ...store('media-elyna-cover', 'preview'), width: 800, height: 450 },
    placeholderKind: 'story',
    createdAt: '2026-05-20',
    updatedAt: '2026-06-01',
  },
  {
    id: 'media-castle-hall-map',
    schemaVersion: 1,
    kind: 'map',
    status: 'published',
    visibility: 'campaignOnly',
    ownerId: 'author-sample',
    title: '古堡大厅地图',
    width: 2048,
    height: 2048,
    thumbnailRef: { ...store('media-castle-hall-map', 'thumbnail'), width: 200, height: 200 },
    previewRef: { ...store('media-castle-hall-map', 'preview'), width: 1024, height: 1024 },
    originalRef: { ...store('media-castle-hall-map', 'original'), width: 2048, height: 2048 },
    placeholderKind: 'map',
    createdAt: '2026-05-22',
    updatedAt: '2026-05-22',
  },
  {
    id: 'media-graycastle-music-1',
    schemaVersion: 1,
    kind: 'audio',
    status: 'published',
    visibility: 'unlisted',
    ownerId: 'author-sample',
    title: '灰雾古堡印象曲',
    mimeType: 'audio/mpeg',
    durationMs: 184000,
    waveformRef: store('media-graycastle-music-1', 'waveform'),
    originalRef: store('media-graycastle-music-1', 'original'),
    placeholderKind: 'music',
    createdAt: '2026-05-25',
    updatedAt: '2026-05-26',
  },
];

/** Reverse-lookup source (mock). In production this is the media_usage_index / EntityGraph 'uses' edges. */
export const MEDIA_USAGE_SEED: MediaAssetUsage[] = [
  { mediaAssetId: 'media-elyna-sketch-1', usedByType: 'blockDocument', usedById: 'doc-elyna-diary-ch1', role: 'figure' },
  { mediaAssetId: 'media-elyna-sketch-1', usedByType: 'actor', usedById: 'act-elyna', role: 'avatar' },
  { mediaAssetId: 'media-elyna-cover', usedByType: 'fanWork', usedById: 'fw-elyna-diary', role: 'cover' },
  { mediaAssetId: 'media-elyna-cover', usedByType: 'workshopPackage', usedById: 'pkg-elyna-character-template', role: 'cover' },
  { mediaAssetId: 'media-castle-hall-map', usedByType: 'map', usedById: 'map-castle-hall', role: 'map' },
  { mediaAssetId: 'media-castle-hall-map', usedByType: 'workshopPackage', usedById: 'pkg-graycastle-campaign', role: 'map' },
  { mediaAssetId: 'media-graycastle-music-1', usedByType: 'mediaAsset', usedById: 'music-graycastle', role: 'audio' },
  { mediaAssetId: 'media-graycastle-music-1', usedByType: 'workshopPackage', usedById: 'pkg-graycastle-music', role: 'audio' },
];

export function getMediaAssetSeedById(id: string): MediaAsset | undefined {
  return MEDIA_ASSET_SEED.find((m) => m.id === id);
}

export function getMediaUsageBy(usedById: string): MediaAssetUsage[] {
  return MEDIA_USAGE_SEED.filter((u) => u.usedById === usedById);
}
