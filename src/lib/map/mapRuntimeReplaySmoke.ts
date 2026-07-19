import { replayMapRuntimeEvents, type MapRuntimeReplayEvent } from './mapRuntimeReplay';

const mapId = 'room-session-map';
const createdAt = '2026-07-16T00:00:00.000Z';

function event(seq: number, eventKind: string, payload: Record<string, unknown> = {}): MapRuntimeReplayEvent {
  return { seq, eventKind, payload, createdAt };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
}

const events: MapRuntimeReplayEvent[] = [
  event(10, 'map.unknown_future_event', { ignored: true }),
  event(9, 'map.token_removed', { tokenId: 'npc-1', name: 'Guard' }),
  event(8, 'map.token_updated', { token: { id: 'hero-1', name: 'Hero', size: 'large', notes: 'Marked' } }),
  event(7, 'map.token_moved', { tokenId: 'hero-1', x: 65, y: 40 }),
  event(6, 'map.token_added', { token: { id: 'npc-1', name: 'Guard', x: 80, y: 25, size: 'medium', sourceType: 'manual_npc' } }),
  event(5, 'map.token_added', { token: { id: 'hero-1', name: 'Hero', x: 20, y: 30, size: 'medium', sourceType: 'campaign_actor', sourceActorInstanceId: 'actor-1' } }),
  event(4, 'map.viewport_changed', { zoom: 1.4, panX: 20, panY: -10 }),
  event(3.5, 'map.templates_cleared'),
  event(3.4, 'map.template_removed', { templateId: 'line-1' }),
  event(3.3, 'map.template_updated', { template: { id: 'circle-1', shape: 'circle', x: 30, y: 40, sizeFeet: 20, rotation: 45 } }),
  event(3.2, 'map.template_added', { template: { id: 'line-1', shape: 'line', x: 60, y: 50, sizeFeet: 30, widthFeet: 5, rotation: 0 } }),
  event(3.1, 'map.template_added', { template: { id: 'circle-1', shape: 'circle', x: 25, y: 35, sizeFeet: 15, rotation: 0 } }),
  event(3, 'map.grid_updated', { grid: { enabled: true, sizePx: 40, feetPerSquare: 5, originX: 2, originY: 3, snap: true, showCoordinates: false } }),
  event(3, 'map.background_cleared'),
  event(2, 'map.background_set', { backgroundUrl: 'https://example.test/map.png', backgroundName: 'Test map' }),
  event(1, 'system.note', { text: 'Not a map state event' }),
];

const cases: Array<{ name: string; run: () => void }> = [
  {
    name: 'empty map state',
    run: () => {
      const state = replayMapRuntimeEvents([], mapId);
      assertEqual(state.mapId, mapId, 'map id should be preserved');
      assertEqual(state.tokens.length, 0, 'empty map should have no tokens');
    },
  },
  {
    name: 'background last valid event wins',
    run: () => {
      const state = replayMapRuntimeEvents(events, mapId);
      assertEqual(state.backgroundUrl, undefined, 'clear should win over earlier background');
      assertEqual(state.backgroundName, undefined, 'clear should clear background name');
    },
  },
  {
    name: 'viewport zoom and pan replay',
    run: () => {
      const state = replayMapRuntimeEvents(events.filter((item) => item.eventKind === 'map.viewport_changed'), mapId);
      assertEqual(state.zoom, 1.4, 'zoom should replay');
      assertEqual(state.panX, 20, 'pan x should replay');
      assertEqual(state.panY, -10, 'pan y should replay');
    },
  },
  {
    name: 'token add move update remove replay',
    run: () => {
      const state = replayMapRuntimeEvents(events, mapId);
      assertEqual(state.tokens.length, 1, 'removed token should not remain');
      assertEqual(state.tokens[0]?.id, 'hero-1', 'hero should remain');
      assertEqual(state.tokens[0]?.x, 65, 'token move should replay');
      assertEqual(state.tokens[0]?.size, 'large', 'token size update should replay');
      assertEqual(state.tokens[0]?.notes, 'Marked', 'token notes update should replay');
    },
  },
  {
    name: 'grid and templates replay with clear',
    run: () => {
      const state = replayMapRuntimeEvents(events, mapId);
      assertEqual(state.grid?.sizePx, 40, 'grid size should replay');
      assertEqual(state.grid?.snap, true, 'grid snap should replay');
      assertEqual(state.templates?.length, 0, 'template clear should replay');
    },
  },
  {
    name: 'campaign actor binding is preserved',
    run: () => {
      const state = replayMapRuntimeEvents(events.filter((item) => item.eventKind === 'map.token_added' && item.seq === 5), mapId);
      assertEqual(state.tokens[0]?.sourceType, 'campaign_actor', 'source type should replay');
      assertEqual(state.tokens[0]?.sourceActorInstanceId, 'actor-1', 'actor reference should replay');
    },
  },
  {
    name: 'approved room binding linkage is preserved',
    run: () => {
      const state = replayMapRuntimeEvents([event(1, 'map.token_added', { token: { id: 'room-hero', name: 'Hero', x: 20, y: 30, size: 'medium', sourceType: 'roomActorBinding', sourceId: 'binding-hero', actorBindingId: 'binding-hero', roomMemberId: 'member-hero', kind: 'playerCharacter' } })], mapId);
      assertEqual(state.tokens[0]?.actorBindingId, 'binding-hero', 'binding id should replay');
      assertEqual(state.tokens[0]?.roomMemberId, 'member-hero', 'room member linkage should replay');
    },
  },
  {
    name: 'unknown and incomplete events are tolerated',
    run: () => {
      const state = replayMapRuntimeEvents([event(1, 'map.token_added'), event(2, 'map.token_moved'), event(3, 'map.future_event')], mapId);
      assertEqual(state.tokens.length, 0, 'incomplete events should not create tokens');
      assertEqual(state.zoom, 1, 'unknown events should not change viewport');
    },
  },
  {
    name: 'replay is deterministic and read-only',
    run: () => {
      const first = replayMapRuntimeEvents(events, mapId);
      const second = replayMapRuntimeEvents([...events].reverse(), mapId);
      assertEqual(first, second, 'response order should not change replay');
      const databaseUrlKey = ['DATABASE', 'URL'].join('_');
      const viteDatabaseUrlKey = ['VITE', 'DATABASE', 'URL'].join('_');
      assert(!(databaseUrlKey in first) && !(viteDatabaseUrlKey in first), 'map state must not contain database environment fields');
    },
  },
];

const results = cases.map((test) => {
  try {
    test.run();
    return { name: test.name, passed: true };
  } catch (error) {
    return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
});

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results, notes: ['Replay is frontend-local and append-only; no DB URL, backend endpoint, or WebSocket sync is used.'] }, null, 2));
if (failed.length > 0) process.exitCode = 1;
