import { parseSceneSpatialV1, type SceneSpatialV1 } from '../../map/sceneSpatial.js';
import { parseTokenSpatialFootprintV1, type TokenSpatialFootprintV1 } from '../../map/tokenSpatialFootprint.js';
import { DND_2024_GRID_CELL_DISTANCE_FEET, DND_WEAPON_RANGE_PROVENANCE } from './dndWeaponRangeSource.js';

export const DND_CREATURE_SIZES = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'] as const;
export type DndCreatureSize = typeof DND_CREATURE_SIZES[number];

export function readDndCreatureSize(value: unknown): DndCreatureSize | undefined {
  return typeof value === 'string' && DND_CREATURE_SIZES.includes(value as DndCreatureSize)
    ? value as DndCreatureSize : undefined;
}

export const DND_CREATURE_SIZE_SOURCE = DND_WEAPON_RANGE_PROVENANCE.sources.movementAndPosition;
/** Creature Size and Space table. Width, not number of occupied squares. */
export const DND_CREATURE_SPACE_CELLS: Readonly<Record<DndCreatureSize, number>> = {
  tiny: 0.5, small: 1, medium: 1, large: 2, huge: 3, gargantuan: 4,
};

const LABELS: Record<DndCreatureSize, readonly [string, string]> = {
  tiny: ['微型', 'Tiny'], small: ['小型', 'Small'], medium: ['中型', 'Medium'],
  large: ['大型', 'Large'], huge: ['巨型', 'Huge'], gargantuan: ['超巨型', 'Gargantuan'],
};
export function dndCreatureSizeLabel(size: DndCreatureSize, locale: string): string {
  return LABELS[size][locale === 'en' ? 1 : 0];
}

/** A suggestion only. Call at creation, never during replay, rendering or attacks. */
export function materializeDndCreatureSizeFootprint(size: unknown, scene: SceneSpatialV1 | undefined): TokenSpatialFootprintV1 | undefined {
  const canonical = readDndCreatureSize(size);
  const spatial = parseSceneSpatialV1(scene);
  if (!canonical || !spatial?.grid || spatial.scale?.unitsPerGridCell !== DND_2024_GRID_CELL_DISTANCE_FEET) return undefined;
  const width = DND_CREATURE_SPACE_CELLS[canonical] * spatial.grid.cellSize;
  return parseTokenSpatialFootprintV1({ schemaVersion: 1, shape: 'axis-aligned-rectangle', coordinateSpace: 'scene-world', anchor: 'center', width, height: width });
}

/** New placement only. Align the lower bounds to grid lines (also for even widths).
 * Explicit footprint/null is an authored choice and is never replaced.
 * If the suggested square cannot fit the Scene, keep the ordinary point Token.
 */
export function initializeDndTokenFootprint<T extends { x: number; y: number; footprint?: TokenSpatialFootprintV1 | null }>(
  token: T, size: unknown, spatial: SceneSpatialV1 | undefined,
): T & { footprint?: TokenSpatialFootprintV1 | null } {
  if (Object.prototype.hasOwnProperty.call(token, 'footprint')) return token;
  const footprint = materializeDndCreatureSizeFootprint(size, spatial);
  if (!footprint || !spatial?.grid || !Number.isFinite(token.x) || !Number.isFinite(token.y)) return token;
  const { cellSize, originX, originY } = spatial.grid;
  const placeAxis = (percent: number, worldSize: number, origin: number) => {
    const min = Math.ceil(-origin / cellSize);
    const max = Math.floor((worldSize - origin - footprint.width) / cellSize);
    if (max < min) return undefined;
    const index = Math.max(min, Math.min(max, Math.round((percent / 100 * worldSize - origin - footprint.width / 2) / cellSize)));
    return (origin + index * cellSize + footprint.width / 2) / worldSize * 100;
  };
  const x = placeAxis(token.x, spatial.world.width, originX);
  const y = placeAxis(token.y, spatial.world.height, originY);
  return x === undefined || y === undefined ? token : { ...token, x, y, footprint };
}
