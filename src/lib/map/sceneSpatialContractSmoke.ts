import { replayMapRuntimeEvents } from './mapRuntimeReplay';
import {
  createSceneSpatialV1,
  measureSceneSpatialDelta,
  parseSceneSpatialV1,
  resolveSceneNormalizedPosition,
  resolveSceneWorldPosition,
  snapSceneNormalizedPosition,
} from './sceneSpatial';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const spatial = createSceneSpatialV1({
  width: 20,
  height: 12,
  grid: { cellSize: 1 },
  scale: { unitsPerGridCell: 5, unitLabel: 'ft' },
});

const world = resolveSceneWorldPosition(spatial, { x: 25, y: 50 });
expect(world.x === 5 && world.y === 6, 'normalized positions use independent world extents');
const normalized = resolveSceneNormalizedPosition(spatial, world);
expect(normalized.x === 25 && normalized.y === 50, 'world conversion is reversible');

const measured = measureSceneSpatialDelta(spatial, { x: 0, y: 0 }, { x: 15, y: 50 });
expect(measured.status === 'measured', 'configured scene must measure');
expect(measured.deltaX === 3 && measured.deltaY === 6, 'measurement exposes generic deltas');
expect(measured.directDistance === Math.hypot(3, 6), 'direct center distance is deterministic');
expect(measured.scaledDistance === Math.hypot(3, 6) * 5 && measured.unitLabel === 'ft', 'generic scale is applied');
expect(measured.tokenAnchor === 'center' && measured.footprint === 'point-only', 'anchor and footprint limit are explicit');

const snapped = snapSceneNormalizedPosition(spatial, { x: 27, y: 28 });
expect(Math.abs(snapped.x - 27.5) < 1e-9 && Math.abs(snapped.y - 29.1666666667) < 1e-9, 'snapping uses world space without viewport pixels');
expect(measureSceneSpatialDelta(undefined, { x: 0, y: 0 }, { x: 100, y: 100 }).status === 'unconfigured', 'legacy scenes remain unconfigured');
expect(parseSceneSpatialV1({ ...spatial, world: { width: 0, height: 12 } }) === undefined, 'invalid extent is rejected');
expect(parseSceneSpatialV1({ ...spatial, coordinateSystem: 'pixels' }) === undefined, 'pixels cannot become canonical coordinates');

const replayed = replayMapRuntimeEvents([
  { seq: 1, eventKind: 'map.token_added', payload: { token: { id: 'a', name: 'A', x: 10, y: 20, sourceType: 'manual' } } },
  { seq: 2, eventKind: 'map.spatial_updated', payload: { spatial: { ...spatial, ignored: 'discarded' } } },
  { seq: 3, eventKind: 'map.token_moved', payload: { tokenId: 'a', x: 40, y: 50 } },
], 'spatial-map');
expect(replayed.spatial?.world.width === 20 && replayed.spatial.scale?.unitsPerGridCell === 5, 'spatial event replays');
expect(!('ignored' in (replayed.spatial as object)), 'replay allowlists the versioned shape');
expect(replayed.tokens[0]?.x === 40 && replayed.tokens[0]?.y === 50, 'normalized movement remains the sole stored position');

console.log(JSON.stringify({ status: 'passed', checks: 14, verdict: 'contract-active-point-distance-only' }));
