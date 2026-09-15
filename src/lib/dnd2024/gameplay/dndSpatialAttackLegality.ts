import type { MapToken } from '../../map/mapRuntimeTypes.js';
import type { SceneSpatialV1 } from '../../map/sceneSpatial.js';
import { resolveTokenWorldBounds, type TokenWorldBounds } from '../../map/tokenSpatialFootprint.js';
import type { DndWeaponAttackMode } from './dndWeaponAttackModes.js';
import {
  DND_2024_CREATURE_SPACE_WIDTHS_IN_CELLS,
  DND_2024_GRID_CELL_DISTANCE_FEET,
} from './dndWeaponRangeSource.js';

export type DndSpatialAttackUnavailableReason =
  | 'unsupported-attack-mode'
  | 'missing-scene-spatial'
  | 'incompatible-scene-scale'
  | 'missing-attacker-token'
  | 'missing-target-token'
  | 'ambiguous-attacker-token'
  | 'ambiguous-target-token'
  | 'different-scenes'
  | 'shared-token-link'
  | 'missing-attacker-footprint'
  | 'missing-target-footprint'
  | 'unsupported-occupied-space';

export type DndSpatialAttackLegalityDecision =
  | { status: 'legal'; distanceFeet: number; reachFeet: number; distanceSquares: number }
  | { status: 'illegal'; reason: 'outside-melee-reach'; distanceFeet: number; reachFeet: number; distanceSquares: number }
  | { status: 'unavailable'; reason: DndSpatialAttackUnavailableReason };

const EPSILON = 1e-7;

function nearInteger(value: number): number | undefined {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) <= EPSILON ? rounded : undefined;
}

type OccupiedGridRange = { minX: number; maxXExclusive: number; minY: number; maxYExclusive: number };

/**
 * Converts platform bounds to exact occupied grid squares. V1 deliberately
 * declines fractional/Tiny and off-grid spaces because the approved source
 * does not establish how a fractional space occupies a shared square.
 */
function occupiedGridRange(spatial: SceneSpatialV1, bounds: TokenWorldBounds): OccupiedGridRange | undefined {
  const grid = spatial.grid;
  if (!grid) return undefined;
  const widthCells = nearInteger(bounds.width / grid.cellSize);
  const heightCells = nearInteger(bounds.height / grid.cellSize);
  if (widthCells === undefined || heightCells === undefined || widthCells !== heightCells
    || !DND_2024_CREATURE_SPACE_WIDTHS_IN_CELLS.includes(widthCells as 1 | 2 | 3 | 4)) return undefined;
  const minX = nearInteger((bounds.minX - grid.originX) / grid.cellSize);
  const maxXExclusive = nearInteger((bounds.maxX - grid.originX) / grid.cellSize);
  const minY = nearInteger((bounds.minY - grid.originY) / grid.cellSize);
  const maxYExclusive = nearInteger((bounds.maxY - grid.originY) / grid.cellSize);
  if (minX === undefined || maxXExclusive === undefined || minY === undefined || maxYExclusive === undefined
    || minX < 0 || minY < 0
    || maxXExclusive * grid.cellSize + grid.originX > spatial.world.width + EPSILON
    || maxYExclusive * grid.cellSize + grid.originY > spatial.world.height + EPSILON) return undefined;
  return { minX, maxXExclusive, minY, maxYExclusive };
}

function axisSquareDistance(firstMin: number, firstMaxExclusive: number, secondMin: number, secondMaxExclusive: number): number {
  if (firstMaxExclusive <= secondMin) return secondMin - firstMaxExclusive + 1;
  if (secondMaxExclusive <= firstMin) return firstMin - secondMaxExclusive + 1;
  return 0;
}

/**
 * D&D-owned interpretation of authoritative Platform geometry. The approved
 * grid rule counts the shortest chain of adjacent squares, including diagonal
 * adjacency, so occupied rectangular ranges use Chebyshev square distance.
 */
export function evaluateDndSpatialAttackLegality(input: {
  mode: DndWeaponAttackMode | undefined;
  spatial: SceneSpatialV1 | undefined;
  attackerToken: MapToken | undefined;
  targetToken: MapToken | undefined;
}): DndSpatialAttackLegalityDecision {
  const { mode, spatial, attackerToken, targetToken } = input;
  if (!mode || mode.availability !== 'executable' || mode.attackKind !== 'melee'
    || mode.spatialEnforcement !== 'active-square-grid-footprint-v1'
    || mode.distanceProfile.unit !== 'ft' || mode.distanceProfile.reach === undefined) {
    return { status: 'unavailable', reason: 'unsupported-attack-mode' };
  }
  if (!spatial) return { status: 'unavailable', reason: 'missing-scene-spatial' };
  // The label remains display text. Exact 5 units/cell is the explicit D&D
  // compatibility signal and is checked against the approved 5-foot grid rule.
  if (!spatial.grid || !spatial.scale
    || spatial.scale.unitsPerGridCell !== DND_2024_GRID_CELL_DISTANCE_FEET) {
    return { status: 'unavailable', reason: 'incompatible-scene-scale' };
  }
  if (!attackerToken) return { status: 'unavailable', reason: 'missing-attacker-token' };
  if (!targetToken) return { status: 'unavailable', reason: 'missing-target-token' };
  const attacker = resolveTokenWorldBounds(spatial, attackerToken);
  const target = resolveTokenWorldBounds(spatial, targetToken);
  if (attacker.status !== 'bounded') return { status: 'unavailable', reason: 'missing-attacker-footprint' };
  if (target.status !== 'bounded') return { status: 'unavailable', reason: 'missing-target-footprint' };
  const attackerRange = occupiedGridRange(spatial, attacker.bounds);
  const targetRange = occupiedGridRange(spatial, target.bounds);
  if (!attackerRange || !targetRange) return { status: 'unavailable', reason: 'unsupported-occupied-space' };
  const distanceSquares = Math.max(
    axisSquareDistance(attackerRange.minX, attackerRange.maxXExclusive, targetRange.minX, targetRange.maxXExclusive),
    axisSquareDistance(attackerRange.minY, attackerRange.maxYExclusive, targetRange.minY, targetRange.maxYExclusive),
  );
  const distanceFeet = distanceSquares * DND_2024_GRID_CELL_DISTANCE_FEET;
  const reachFeet = mode.distanceProfile.reach;
  return distanceFeet <= reachFeet
    ? { status: 'legal', distanceFeet, reachFeet, distanceSquares }
    : { status: 'illegal', reason: 'outside-melee-reach', distanceFeet, reachFeet, distanceSquares };
}
