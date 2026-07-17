import { createMapAreaTemplate, createMapBoardState, createMapGridConfig, measureMapDistance, snapMapPosition } from './mapRuntimeTypes';
import { replayMapRuntimeEvents, type MapRuntimeReplayEvent } from './mapRuntimeReplay';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const defaultBoard = createMapBoardState('grid-map');
assert(defaultBoard.grid?.enabled && defaultBoard.grid.feetPerSquare === 5, 'default grid is enabled at five feet per square');

const grid = createMapGridConfig({ enabled: true, sizePx: 50, feetPerSquare: 5, snap: true });
const snapped = snapMapPosition(26, 26, grid, 500, 500);
assert(snapped.x === 25 && snapped.y === 25, 'snap uses grid centers');
const distance = measureMapDistance({ x: 0, y: 0 }, { x: 30, y: 40 }, grid, 500, 500);
assert(distance.squares === 5 && distance.feet === 25, 'ruler uses Euclidean distance and configured scale');

const shapes = ['circle', 'cone', 'line', 'square', 'rectangle'] as const;
for (const shape of shapes) {
  const template = createMapAreaTemplate({ id: shape, shape, x: 50, y: 50, sizeFeet: 15, widthFeet: 5, rotation: 45 });
  assert(template.shape === shape && template.sizeFeet === 15, `${shape} template is created`);
}

const events: MapRuntimeReplayEvent[] = [
  { seq: 1, createdAt: '2026-07-18T00:00:00.000Z', eventKind: 'map.grid_updated', payload: { grid } },
  { seq: 2, createdAt: '2026-07-18T00:00:01.000Z', eventKind: 'map.template_added', payload: { template: createMapAreaTemplate({ id: 'circle', shape: 'circle', x: 40, y: 40, sizeFeet: 20 }) } },
  { seq: 3, createdAt: '2026-07-18T00:00:02.000Z', eventKind: 'map.template_updated', payload: { template: createMapAreaTemplate({ id: 'circle', shape: 'circle', x: 45, y: 40, sizeFeet: 20, rotation: 90 }) } },
  { seq: 4, createdAt: '2026-07-18T00:00:03.000Z', eventKind: 'map.template_removed', payload: { templateId: 'circle' } },
  { seq: 5, createdAt: '2026-07-18T00:00:04.000Z', eventKind: 'map.template_added', payload: { template: createMapAreaTemplate({ id: 'line', shape: 'line', x: 55, y: 55, sizeFeet: 30, widthFeet: 5 }) } },
  { seq: 6, createdAt: '2026-07-18T00:00:05.000Z', eventKind: 'map.templates_cleared', payload: {} },
  { seq: 7, createdAt: '2026-07-18T00:00:06.000Z', eventKind: 'map.unknown_future_event', payload: {} },
];
const replayed = replayMapRuntimeEvents(events, 'grid-map');
assert(replayed.grid?.snap && replayed.grid.sizePx === 50, 'grid event replays');
assert(replayed.templates?.length === 0, 'template lifecycle replays');
console.log('DND grid/range smoke passed.');
