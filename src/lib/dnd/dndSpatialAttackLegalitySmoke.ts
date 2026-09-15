import assert from 'node:assert/strict';
import { createMapToken } from '../map/mapRuntimeTypes.js';
import { createSceneSpatialV1 } from '../map/sceneSpatial.js';
import { createTokenSpatialFootprintV1 } from '../map/tokenSpatialFootprint.js';
import { evaluateDndSpatialAttackLegality } from '../dnd2024/gameplay/dndSpatialAttackLegality.js';
import { getDndWeaponAttackModeByActionId } from '../dnd2024/gameplay/dndWeaponAttackModes.js';
import {
  DND_2024_CREATURE_SPACE_WIDTHS_IN_CELLS,
  DND_2024_GRID_CELL_DISTANCE_FEET,
  DND_WEAPON_RANGE_PROVENANCE,
} from '../dnd2024/gameplay/dndWeaponRangeSource.js';

const mode = getDndWeaponAttackModeByActionId('action.item.dagger.melee-weapon-attack')!;
const thrown = getDndWeaponAttackModeByActionId('action.item.dagger.thrown-weapon-attack')!;
const footprint = createTokenSpatialFootprintV1({ width: 1, height: 1 });
const scene = createSceneSpatialV1({ width: 10, height: 10, grid: { cellSize: 1 },
  scale: { unitsPerGridCell: DND_2024_GRID_CELL_DISTANCE_FEET, unitLabel: 'display text only' } });
const token = (x: number, y = 5, bounded = true) => createMapToken({
  id: `${x}-${y}`, name: 'Token', sourceType: 'combatant', size: 'medium', x, y,
  footprint: bounded ? footprint : undefined,
});

const adjacent = evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: token(5), targetToken: token(15) });
assert.deepEqual(adjacent, { status: 'legal', distanceFeet: 5, reachFeet: mode.distanceProfile.reach, distanceSquares: 1 });
const diagonal = evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: token(5, 5), targetToken: token(15, 15) });
assert.equal(diagonal.status, 'legal');
const separated = evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: token(5), targetToken: token(25) });
assert.deepEqual(separated, { status: 'illegal', reason: 'outside-melee-reach', distanceFeet: 10,
  reachFeet: mode.distanceProfile.reach, distanceSquares: 2 });
const largeFootprint = createTokenSpatialFootprintV1({ width: 2, height: 2 });
const explicitLarge = createMapToken({ id: 'large', name: 'Explicit GM space', sourceType: 'manual', size: 'tiny', x: 20, y: 10,
  footprint: largeFootprint });
assert.equal(evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: token(5), targetToken: explicitLarge }).status, 'legal',
  'explicit footprint controls occupied space; legacy display size does not overwrite it');
assert.deepEqual(evaluateDndSpatialAttackLegality({ mode, spatial: undefined, attackerToken: token(5), targetToken: token(15) }),
  { status: 'unavailable', reason: 'missing-scene-spatial' });
assert.deepEqual(evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: token(5, 5, false), targetToken: token(15) }),
  { status: 'unavailable', reason: 'missing-attacker-footprint' });
assert.deepEqual(evaluateDndSpatialAttackLegality({ mode: thrown, spatial: scene, attackerToken: token(5), targetToken: token(25) }),
  { status: 'unavailable', reason: 'unsupported-attack-mode' });
const incompatible = createSceneSpatialV1({ width: 10, height: 10, grid: { cellSize: 1 }, scale: { unitsPerGridCell: 6, unitLabel: 'ft' } });
assert.deepEqual(evaluateDndSpatialAttackLegality({ mode, spatial: incompatible, attackerToken: token(5), targetToken: token(15) }),
  { status: 'unavailable', reason: 'incompatible-scene-scale' });
assert.deepEqual(evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: token(6), targetToken: token(15) }),
  { status: 'unavailable', reason: 'unsupported-occupied-space' });
assert.deepEqual(DND_2024_CREATURE_SPACE_WIDTHS_IN_CELLS, [0.5, 1, 2, 3, 4]);
assert.match(DND_WEAPON_RANGE_PROVENANCE.sources.movementAndPosition.sha256, /^[A-F0-9]{64}$/);
console.log('D&D spatial legality smoke passed: approved 5-foot square metric, diagonal adjacency, occupied bounds, legal/illegal/unavailable, point-only and scale fail-open.');
