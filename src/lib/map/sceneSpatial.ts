export const SCENE_SPATIAL_SCHEMA_VERSION = 1 as const;

export type SceneSpatialV1 = {
  schemaVersion: typeof SCENE_SPATIAL_SCHEMA_VERSION;
  coordinateSystem: 'normalized-100';
  tokenAnchor: 'center';
  world: {
    width: number;
    height: number;
  };
  grid?: {
    kind: 'square';
    originX: number;
    originY: number;
    cellSize: number;
  };
  scale?: {
    unitsPerGridCell: number;
    unitLabel?: string;
  };
};

export type SceneNormalizedPosition = { x: number; y: number };
export type SceneWorldPosition = { x: number; y: number };

export type SceneSpatialMeasurement =
  | { status: 'unconfigured' }
  | {
      status: 'measured';
      start: SceneWorldPosition;
      end: SceneWorldPosition;
      deltaX: number;
      deltaY: number;
      directDistance: number;
      gridCells?: number;
      scaledDistance?: number;
      unitLabel?: string;
      tokenAnchor: 'center';
      footprint: 'point-only';
    };

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function positive(value: unknown): number | undefined {
  const parsed = finite(value);
  return parsed !== undefined && parsed > 0 && parsed <= 1_000_000_000 ? parsed : undefined;
}

/**
 * Reads the versioned authoritative shape and discards unknown fields. This is
 * used both at the server append boundary and during replay/snapshot import.
 */
export function parseSceneSpatialV1(value: unknown): SceneSpatialV1 | undefined {
  const input = record(value);
  const world = record(input?.world);
  if (input?.schemaVersion !== SCENE_SPATIAL_SCHEMA_VERSION
    || input.coordinateSystem !== 'normalized-100'
    || input.tokenAnchor !== 'center') return undefined;
  const width = positive(world?.width);
  const height = positive(world?.height);
  if (width === undefined || height === undefined) return undefined;

  const rawGrid = input.grid === undefined ? undefined : record(input.grid);
  let grid: SceneSpatialV1['grid'];
  if (input.grid !== undefined) {
    const originX = finite(rawGrid?.originX);
    const originY = finite(rawGrid?.originY);
    const cellSize = positive(rawGrid?.cellSize);
    if (rawGrid?.kind !== 'square' || originX === undefined || originY === undefined || cellSize === undefined) return undefined;
    grid = { kind: 'square', originX, originY, cellSize };
  }

  const rawScale = input.scale === undefined ? undefined : record(input.scale);
  let scale: SceneSpatialV1['scale'];
  if (input.scale !== undefined) {
    const unitsPerGridCell = positive(rawScale?.unitsPerGridCell);
    const unitLabel = typeof rawScale?.unitLabel === 'string' ? rawScale.unitLabel.trim().slice(0, 24) : undefined;
    if (!grid || unitsPerGridCell === undefined) return undefined;
    scale = { unitsPerGridCell, unitLabel: unitLabel || undefined };
  }

  return {
    schemaVersion: SCENE_SPATIAL_SCHEMA_VERSION,
    coordinateSystem: 'normalized-100',
    tokenAnchor: 'center',
    world: { width, height },
    grid,
    scale,
  };
}

export function createSceneSpatialV1(input: {
  width: number;
  height: number;
  grid?: { originX?: number; originY?: number; cellSize: number };
  scale?: { unitsPerGridCell: number; unitLabel?: string };
}): SceneSpatialV1 {
  const parsed = parseSceneSpatialV1({
    schemaVersion: SCENE_SPATIAL_SCHEMA_VERSION,
    coordinateSystem: 'normalized-100',
    tokenAnchor: 'center',
    world: { width: input.width, height: input.height },
    grid: input.grid && { kind: 'square', originX: input.grid.originX ?? 0, originY: input.grid.originY ?? 0, cellSize: input.grid.cellSize },
    scale: input.scale,
  });
  if (!parsed) throw new Error('invalid_scene_spatial_configuration');
  return parsed;
}

export function resolveSceneWorldPosition(
  spatial: SceneSpatialV1,
  position: SceneNormalizedPosition,
): SceneWorldPosition {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error('invalid_scene_position');
  return {
    x: position.x / 100 * spatial.world.width,
    y: position.y / 100 * spatial.world.height,
  };
}

export function resolveSceneNormalizedPosition(
  spatial: SceneSpatialV1,
  position: SceneWorldPosition,
): SceneNormalizedPosition {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error('invalid_scene_position');
  return {
    x: position.x / spatial.world.width * 100,
    y: position.y / spatial.world.height * 100,
  };
}

/** Returns system-neutral point-to-point geometry; game systems own rules. */
export function measureSceneSpatialDelta(
  spatial: SceneSpatialV1 | undefined,
  startPosition: SceneNormalizedPosition,
  endPosition: SceneNormalizedPosition,
): SceneSpatialMeasurement {
  if (!spatial) return { status: 'unconfigured' };
  const start = resolveSceneWorldPosition(spatial, startPosition);
  const end = resolveSceneWorldPosition(spatial, endPosition);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const directDistance = Math.hypot(deltaX, deltaY);
  const gridCells = spatial.grid ? directDistance / spatial.grid.cellSize : undefined;
  const scaledDistance = gridCells !== undefined && spatial.scale
    ? gridCells * spatial.scale.unitsPerGridCell
    : undefined;
  return {
    status: 'measured', start, end, deltaX, deltaY, directDistance, gridCells,
    scaledDistance, unitLabel: spatial.scale?.unitLabel,
    tokenAnchor: spatial.tokenAnchor, footprint: 'point-only',
  };
}

export function snapSceneNormalizedPosition(
  spatial: SceneSpatialV1,
  position: SceneNormalizedPosition,
): SceneNormalizedPosition {
  if (!spatial.grid) return position;
  const world = resolveSceneWorldPosition(spatial, position);
  const { originX, originY, cellSize } = spatial.grid;
  const snap = (value: number, origin: number) => origin + cellSize / 2 + Math.round((value - origin - cellSize / 2) / cellSize) * cellSize;
  const normalized = resolveSceneNormalizedPosition(spatial, { x: snap(world.x, originX), y: snap(world.y, originY) });
  return { x: Math.min(100, Math.max(0, normalized.x)), y: Math.min(100, Math.max(0, normalized.y)) };
}
