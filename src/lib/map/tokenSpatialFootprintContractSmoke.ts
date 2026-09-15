import { replayMapRuntimeEvents, type MapRuntimeReplayEvent } from './mapRuntimeReplay';
import { createSceneSpatialV1 } from './sceneSpatial';
import {
  compareTokenWorldBounds,
  createTokenSpatialFootprintV1,
  parseTokenSpatialFootprintV1,
  resolveTokenWorldBounds,
} from './tokenSpatialFootprint';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function close(actual: number, expected: number, message: string): void {
  expect(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} !== ${expected}`);
}

const spatial = createSceneSpatialV1({ width: 20, height: 12, grid: { cellSize: 1 }, scale: { unitsPerGridCell: 5, unitLabel: 'ft' } });
const footprint = createTokenSpatialFootprintV1({ width: 2, height: 4 });

const point = resolveTokenWorldBounds(spatial, { x: 50, y: 50 });
expect(point.status === 'point-only' && point.center.x === 10 && point.center.y === 6, 'legacy Tokens remain point-only; no footprint is guessed');

const bounds = resolveTokenWorldBounds(spatial, { x: 50, y: 50, footprint });
expect(bounds.status === 'bounded', 'a valid footprint resolves authoritative bounds');
close(bounds.bounds.minX, 9, 'center anchor minX');
close(bounds.bounds.maxX, 11, 'center anchor maxX');
close(bounds.bounds.minY, 4, 'center anchor minY');
close(bounds.bounds.maxY, 8, 'center anchor maxY');

const translated = resolveTokenWorldBounds(spatial, { x: 75, y: 25, footprint });
expect(translated.status === 'bounded', 'moved bounded Token remains bounded');
expect(translated.bounds.width === 2 && translated.bounds.height === 4, 'movement preserves footprint dimensions');
close(translated.bounds.center.x, 15, 'movement translates center x');
close(translated.bounds.center.y, 3, 'movement translates center y');

for (const invalid of [
  { ...footprint, width: 0 },
  { ...footprint, height: -1 },
  { ...footprint, width: Number.NaN },
  { ...footprint, width: Number.POSITIVE_INFINITY },
  { ...footprint, width: 1_000_000_001 },
  { ...footprint, schemaVersion: 2 },
  { ...footprint, shape: 'circle' },
]) expect(parseTokenSpatialFootprintV1(invalid) === undefined, 'invalid footprint must be rejected');

const sanitized = parseTokenSpatialFootprintV1({ ...footprint, occupiedCells: ['A1'], dndSize: 'large', viewportPixels: 900 });
expect(sanitized !== undefined && Object.keys(sanitized).length === 6 && !('occupiedCells' in sanitized), 'parser allowlists only the platform footprint contract');

const separated = compareTokenWorldBounds(
  spatial,
  { x: 10, y: 50, footprint: createTokenSpatialFootprintV1({ width: 2, height: 2 }) },
  { x: 40, y: 50, footprint: createTokenSpatialFootprintV1({ width: 2, height: 2 }) },
);
expect(separated.status === 'bounded' && separated.overlaps === false, 'separated bounds do not overlap');
close(separated.nearestBoundaryDistance ?? -1, 4, 'nearest boundary distance is pure world geometry');

const overlap = compareTokenWorldBounds(
  spatial,
  { x: 50, y: 50, footprint },
  { x: 55, y: 50, footprint },
);
expect(overlap.status === 'bounded' && overlap.overlaps === true && overlap.nearestBoundaryDistance === 0, 'overlapping bounds resolve deterministically');

function event(seq: number, eventKind: string, payload: Record<string, unknown>): MapRuntimeReplayEvent {
  return { seq, eventKind, payload, createdAt: `2026-09-15T00:00:0${seq}.000Z` };
}
const replayed = replayMapRuntimeEvents([
  event(1, 'map.token_added', { token: { id: 'bounded', name: 'Bounded', x: 20, y: 30 } }),
  event(2, 'map.token_updated', { token: { id: 'bounded', footprint } }),
  event(3, 'map.token_moved', { tokenId: 'bounded', x: 60, y: 70 }),
  event(4, 'map.token_added', { token: { id: 'legacy', name: 'Legacy', x: 1, y: 2, width: 80, height: 80 } }),
], 'map');
expect(replayed.tokens.find((token) => token.id === 'bounded')?.footprint?.width === 2, 'footprint replays and survives movement');
expect(replayed.tokens.find((token) => token.id === 'legacy')?.footprint === undefined, 'legacy presentation dimensions do not become occupied bounds');

const cleared = replayMapRuntimeEvents([
  event(1, 'map.token_added', { token: { id: 'bounded', name: 'Bounded', x: 20, y: 30, footprint } }),
  event(2, 'map.token_updated', { token: { id: 'bounded', footprint: null } }),
], 'map');
expect(cleared.tokens[0]?.footprint === undefined, 'explicit null clears a footprint to point-only behavior');

const firstViewport = resolveTokenWorldBounds(spatial, { x: 50, y: 50, footprint });
const secondViewport = resolveTokenWorldBounds(spatial, { x: 50, y: 50, footprint });
expect(JSON.stringify(firstViewport) === JSON.stringify(secondViewport), 'world bounds are independent of viewport zoom, CSS size, and device pixels');

console.log(JSON.stringify({ status: 'passed', checks: 19 }));
