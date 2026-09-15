import { resolveSceneWorldPosition, type SceneSpatialV1 } from './sceneSpatial.js';

export const TOKEN_SPATIAL_FOOTPRINT_SCHEMA_VERSION = 1 as const;

/** Platform-owned occupied bounds. Width and height are Scene world units. */
export type TokenSpatialFootprintV1 = {
  schemaVersion: typeof TOKEN_SPATIAL_FOOTPRINT_SCHEMA_VERSION;
  shape: 'axis-aligned-rectangle';
  coordinateSpace: 'scene-world';
  anchor: 'center';
  width: number;
  height: number;
};

export type TokenWorldBounds = {
  shape: 'axis-aligned-rectangle';
  center: { x: number; y: number };
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type TokenWorldBoundsResolution =
  | { status: 'point-only'; center: { x: number; y: number } }
  | { status: 'bounded'; bounds: TokenWorldBounds };

export type TokenWorldSeparation = {
  status: 'bounded' | 'point-only';
  first: TokenWorldBoundsResolution;
  second: TokenWorldBoundsResolution;
  deltaX: number;
  deltaY: number;
  centerDistance: number;
  overlaps?: boolean;
  separationX?: number;
  separationY?: number;
  nearestBoundaryDistance?: number;
};

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function positive(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1_000_000_000 ? value : undefined;
}

/** Validates and allowlists the complete V1 footprint. */
export function parseTokenSpatialFootprintV1(value: unknown): TokenSpatialFootprintV1 | undefined {
  const input = record(value);
  const width = positive(input?.width);
  const height = positive(input?.height);
  if (input?.schemaVersion !== TOKEN_SPATIAL_FOOTPRINT_SCHEMA_VERSION
    || input.shape !== 'axis-aligned-rectangle'
    || input.coordinateSpace !== 'scene-world'
    || input.anchor !== 'center'
    || width === undefined
    || height === undefined) return undefined;
  return {
    schemaVersion: TOKEN_SPATIAL_FOOTPRINT_SCHEMA_VERSION,
    shape: 'axis-aligned-rectangle',
    coordinateSpace: 'scene-world',
    anchor: 'center',
    width,
    height,
  };
}

export function createTokenSpatialFootprintV1(input: { width: number; height: number }): TokenSpatialFootprintV1 {
  const footprint = parseTokenSpatialFootprintV1({
    schemaVersion: TOKEN_SPATIAL_FOOTPRINT_SCHEMA_VERSION,
    shape: 'axis-aligned-rectangle',
    coordinateSpace: 'scene-world',
    anchor: 'center',
    width: input.width,
    height: input.height,
  });
  if (!footprint) throw new Error('invalid_token_spatial_footprint');
  return footprint;
}

export function resolveTokenWorldBounds(
  spatial: SceneSpatialV1,
  token: { x: number; y: number; footprint?: TokenSpatialFootprintV1 },
): TokenWorldBoundsResolution {
  const center = resolveSceneWorldPosition(spatial, token);
  const footprint = parseTokenSpatialFootprintV1(token.footprint);
  if (!footprint) return { status: 'point-only', center };
  const halfWidth = footprint.width / 2;
  const halfHeight = footprint.height / 2;
  return {
    status: 'bounded',
    bounds: {
      shape: footprint.shape,
      center,
      width: footprint.width,
      height: footprint.height,
      minX: center.x - halfWidth,
      maxX: center.x + halfWidth,
      minY: center.y - halfHeight,
      maxY: center.y + halfHeight,
    },
  };
}

/** Euclidean geometry between axis-aligned world bounds; no Game System rules. */
export function compareTokenWorldBounds(
  spatial: SceneSpatialV1,
  firstToken: { x: number; y: number; footprint?: TokenSpatialFootprintV1 },
  secondToken: { x: number; y: number; footprint?: TokenSpatialFootprintV1 },
): TokenWorldSeparation {
  const first = resolveTokenWorldBounds(spatial, firstToken);
  const second = resolveTokenWorldBounds(spatial, secondToken);
  const firstCenter = first.status === 'bounded' ? first.bounds.center : first.center;
  const secondCenter = second.status === 'bounded' ? second.bounds.center : second.center;
  const deltaX = secondCenter.x - firstCenter.x;
  const deltaY = secondCenter.y - firstCenter.y;
  const base = { first, second, deltaX, deltaY, centerDistance: Math.hypot(deltaX, deltaY) };
  if (first.status !== 'bounded' || second.status !== 'bounded') return { status: 'point-only', ...base };

  const separationX = Math.max(0, first.bounds.minX - second.bounds.maxX, second.bounds.minX - first.bounds.maxX);
  const separationY = Math.max(0, first.bounds.minY - second.bounds.maxY, second.bounds.minY - first.bounds.maxY);
  return {
    status: 'bounded',
    ...base,
    overlaps: separationX === 0 && separationY === 0,
    separationX,
    separationY,
    nearestBoundaryDistance: Math.hypot(separationX, separationY),
  };
}
