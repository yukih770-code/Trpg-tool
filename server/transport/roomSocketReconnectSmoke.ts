import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { WebSocket } from 'ws';

import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createRoom } from '../services/createRoom.js';
import type { RoomMapEvent, RoomRuntimeLogEvent } from '../protocol/room-protocol.js';
import { createRoomSocketServer } from './roomSocketServer.js';
import type { RoomSocketClientMessage, RoomSocketServerMessage } from '../../src/lib/platform/roomTransportTypes.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function messageBase(messageId: string) {
  return { protocolVersion: 'room-ws-v0' as const, messageId, sentAt: new Date().toISOString() };
}

async function exchange(url: string, message: RoomSocketClientMessage): Promise<RoomSocketServerMessage[]> {
  const socket = new WebSocket(url);
  const received: RoomSocketServerMessage[] = [];
  await once(socket, 'open');
  const completed = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for room socket server response.')), 2_000);
    socket.on('message', (data) => {
      const parsed = JSON.parse(String(data)) as RoomSocketServerMessage;
      received.push(parsed);
      if (parsed.type === 'roomSnapshot' || parsed.type === 'error') {
        clearTimeout(timeout);
        resolve();
      }
    });
    socket.on('error', reject);
  });
  socket.send(JSON.stringify(message));
  await completed;
  socket.close();
  await once(socket, 'close');
  return received;
}

async function expectUpgradeRejected(url: string): Promise<void> {
  const socket = new WebSocket(url);
  const response = await new Promise<number>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for startup recovery gate.')), 2_000);
    socket.once('unexpected-response', (_request, upgradeResponse) => {
      clearTimeout(timeout);
      resolve(upgradeResponse.statusCode ?? 0);
    });
    socket.once('open', () => {
      clearTimeout(timeout);
      reject(new Error('WebSocket upgrade opened before startup recovery became ready.'));
    });
    socket.once('error', () => {
      // `unexpected-response` owns the status assertion for this rejection.
    });
  });
  assert(response === 503, `Startup recovery WebSocket gate must return 503, received ${response}.`);
  socket.terminate();
}

async function main(): Promise<void> {
  const registry = createInMemoryRoomRegistry();
  const created = createRoom({ hostDisplayName: 'Reconnect Host', hostUserId: 'user-host' });
  registry.create(created.room);
  const roomId = created.room.identity.roomId;
  const memberId = created.room.members[0].memberId;
  const now = new Date().toISOString();
  const runtimeEvents: RoomRuntimeLogEvent[] = [
    { eventId: 'runtime-2', roomId, seq: 2, createdAt: now, kind: 'host.note', visibility: 'public', text: 'visible' },
    { eventId: 'runtime-3', roomId, seq: 3, createdAt: now, kind: 'host.note', visibility: 'hostOnly', text: 'withheld-by-smoke-projection' },
  ];
  const mapEvents: RoomMapEvent[] = [
    { mapEventId: 'map-2', roomId, mapId: `room:${roomId}`, seq: 2, createdAt: now, authorMemberId: memberId, eventKind: 'map.token_moved', payload: { tokenId: 'token-1' } },
  ];
  let startupReady = false;

  const server = createServer();
  createRoomSocketServer({
    server,
    registry,
    isReady: () => startupReady,
    resolveViewer: async () => ({
      viewerUserId: 'user-host',
      isAuthenticated: true,
      authTrustLevel: 'verified_session',
      isDevOnly: false,
      isServiceInternal: false,
      notes: [],
    }),
    readRuntimeLogEvents: (_requestedRoomId, afterSeq) => ({
      roomId,
      latestSeq: 3,
      events: afterSeq === undefined ? runtimeEvents : runtimeEvents.filter((event) => event.seq > afterSeq),
    }),
    readMapEvents: (_requestedRoomId, afterSeq) => ({
      roomId,
      latestSeq: 2,
      events: afterSeq === undefined ? mapEvents : mapEvents.filter((event) => event.seq > afterSeq),
    }),
    projectRuntimeLogEvents: (_requestedRoomId, _requestedMemberId, events) => events.filter((event) => event.visibility === 'public'),
    projectMapEvents: (_requestedRoomId, _requestedMemberId, events) => events,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  const url = `ws://127.0.0.1:${port}/ws`;

  await expectUpgradeRejected(url);
  startupReady = true;

  const replay = await exchange(url, {
    ...messageBase('reconnect-subscribe'),
    type: 'subscribeRoom',
    roomId,
    memberId,
    afterRuntimeLogSeq: 1,
    afterMapEventSeq: 1,
  });
  const runtimeReplay = replay.find((message) => message.type === 'runtimeLogAppended');
  const mapReplay = replay.find((message) => message.type === 'mapEventAppended');
  const replayAck = replay.find((message) => message.type === 'subscribedRoom');
  assert(runtimeReplay?.type === 'runtimeLogAppended' && runtimeReplay.events.length === 1 && runtimeReplay.events[0].eventId === 'runtime-2', 'Runtime catch-up must pass through member projection.');
  assert(mapReplay?.type === 'mapEventAppended' && mapReplay.events.length === 1 && mapReplay.events[0].mapEventId === 'map-2', 'Room Map catch-up must replay only the missing suffix.');
  assert(replayAck?.type === 'subscribedRoom' && replayAck.runtimeLogLatestSeq === 3 && replayAck.mapEventLatestSeq === 2, 'Catch-up acknowledgement must advance both true stream baselines.');

  const initial = await exchange(url, {
    ...messageBase('initial-subscribe'),
    type: 'subscribeRoom',
    roomId,
    memberId,
  });
  assert(!initial.some((message) => message.type === 'runtimeLogAppended' || message.type === 'mapEventAppended'), 'Initial subscription must not replay full stream history.');
  const initialAck = initial.find((message) => message.type === 'subscribedRoom');
  assert(initialAck?.type === 'subscribedRoom' && initialAck.runtimeLogLatestSeq === 3 && initialAck.mapEventLatestSeq === 2, 'Initial subscription must establish both stream baselines.');

  for (const invalidCursor of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const invalid = await exchange(url, {
      ...messageBase(`invalid-cursor-${invalidCursor}`),
      type: 'subscribeRoom',
      roomId,
      memberId,
      afterRuntimeLogSeq: invalidCursor,
    });
    assert(invalid.some((message) => message.type === 'error' && message.code === 'invalidMessage'), `Invalid reconnect cursor ${invalidCursor} must be rejected.`);
  }

  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  console.log('roomSocketReconnectSmoke: startup gate, projected catch-up, baseline, and cursor validation passed');
}

await main();
