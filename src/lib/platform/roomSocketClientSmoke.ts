import { createServer } from 'node:http';
import { once } from 'node:events';
import { WebSocketServer } from 'ws';

import { createRoomSocketClient, type RoomSocketConnectionState } from './roomSocketClient.js';
import type { RoomSocketSubscribeMessage } from './roomTransportTypes.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error('Timed out waiting for room socket reconnect.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function main(): Promise<void> {
  const server = createServer();
  const wss = new WebSocketServer({ server, path: '/ws' });
  let connectionCount = 0;
  const subscriptions: RoomSocketSubscribeMessage[] = [];

  wss.on('connection', (socket) => {
    connectionCount += 1;
    const connectionNumber = connectionCount;
    socket.on('message', (data) => {
      const message = JSON.parse(String(data)) as RoomSocketSubscribeMessage;
      if (message.type !== 'subscribeRoom') return;
      subscriptions.push(message);
      socket.send(JSON.stringify({
        protocolVersion: 'room-ws-v0',
        messageId: `subscribed-${connectionNumber}`,
        sentAt: new Date().toISOString(),
        type: 'subscribedRoom',
        roomId: message.roomId,
        runtimeLogLatestSeq: 4,
        mapEventLatestSeq: 7,
      }));
      if (connectionNumber === 1) {
        socket.send(JSON.stringify({
          protocolVersion: 'room-ws-v0',
          messageId: 'runtime-delta-5',
          sentAt: new Date().toISOString(),
          type: 'runtimeLogAppended',
          roomId: message.roomId,
          serverSeq: 1,
          events: [{ eventId: 'runtime-5', roomId: message.roomId, seq: 5, createdAt: new Date().toISOString(), kind: 'host.note', visibility: 'public' }],
        }));
        socket.send(JSON.stringify({
          protocolVersion: 'room-ws-v0',
          messageId: 'map-delta-8',
          sentAt: new Date().toISOString(),
          type: 'mapEventAppended',
          roomId: message.roomId,
          serverSeq: 2,
          events: [{ mapEventId: 'map-8', roomId: message.roomId, mapId: message.roomId, seq: 8, createdAt: new Date().toISOString(), authorMemberId: 'member-smoke', eventKind: 'map.token_moved', payload: {} }],
        }));
        setTimeout(() => socket.terminate(), 15);
      }
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object', 'Expected an ephemeral HTTP server address.');

  const states: RoomSocketConnectionState[] = [];
  let subscribedCallbackCount = 0;
  const client = createRoomSocketClient({
    baseUrl: `http://127.0.0.1:${address.port}`,
    reconnect: { initialDelayMs: 10, maxDelayMs: 10 },
    onConnectionStateChange: (state) => states.push(state),
    onSubscribedRoom: () => { subscribedCallbackCount += 1; },
  });
  client.subscribeRoom('room-smoke', 'member-smoke');
  client.connect();

  await waitFor(() => subscriptions.length >= 2);
  assert(connectionCount === 2, `Expected exactly one reconnect, got ${connectionCount} connections.`);
  assert(subscriptions[0].afterRuntimeLogSeq === undefined, 'First subscription must not claim a RuntimeLog cursor.');
  assert(subscriptions[0].afterMapEventSeq === undefined, 'First subscription must not claim a Room Map cursor.');
  assert(subscriptions[1].afterRuntimeLogSeq === 5, 'Reconnect must carry the latest observed RuntimeLog sequence.');
  assert(subscriptions[1].afterMapEventSeq === 8, 'Reconnect must carry the latest observed Room Map sequence.');
  assert(states.filter((state) => state === 'open').length === 2, 'Expected both initial and recovered open states.');
  assert(subscribedCallbackCount === 2, 'Subscription acknowledgement callback must run after initial connect and reconnect.');

  client.close();
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert(connectionCount === 2, 'Explicit close must cancel further reconnect attempts.');

  for (const socket of wss.clients) socket.terminate();
  await new Promise<void>((resolve, reject) => wss.close((error) => error ? reject(error) : resolve()));
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  console.log('roomSocketClientSmoke: reconnect, cursor restore, and explicit-close cancellation passed');
}

await main();
