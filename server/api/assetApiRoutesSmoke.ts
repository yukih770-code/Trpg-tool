import assert from 'node:assert/strict';
import { mkdtemp, readdir, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import sharp from 'sharp';
import { registerAssetApiRoutes } from './assetApiRoutes.js';
import { createPlatformAssets, type AssetRepository } from '../services/platformAssets.js';
import { createFileAssetObjectStore } from '../storage/assetObjectStore.js';
import type { AssetMetadataRecord, ObjectStorageRefRecord } from '../adapters/postgresAssetRepository.js';
import { t12Fixture } from '../services/t12TestFixture.js';
import { canReadRoomAsset } from '../room/roomAssetAccess.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { appendRoomMapEvent } from '../services/appendRoomMapEvent.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';

const directory = await mkdtemp(join(tmpdir(), 'dnd-assets-test-'));
const records = new Map<string, AssetMetadataRecord>(), refs = new Map<string, ObjectStorageRefRecord>();
const repository: AssetRepository = {
  getAssetById: async id => ({ ok: true, value: records.get(id) ?? null }),
  getStorageRefById: async id => ({ ok: true, value: refs.get(id) ?? null }),
  listAssetsByOwner: async owner => ({ ok: true, value: [...records.values()].filter(a => a.ownerId === owner) }),
};
const store = createFileAssetObjectStore(directory);
const assets = createPlatformAssets({ store, repository, commit: async (asset, ref) => { records.set(asset.assetId, asset); refs.set(ref.storageRefId, ref); } });
const f = t12Fixture();
const viewer = (id: string): CurrentViewerContext => ({ viewerUserId: id, isAuthenticated: !!id, authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] });
const app = express();
registerAssetApiRoutes(app, { assets, viewer: req => viewer(req.header('x-test-user') ?? ''), canReadRoomAsset: (req, id) => canReadRoomAsset(f.room, f.maps, viewer(req.header('x-test-user') ?? ''), String(req.query.memberId ?? ''), id) });
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address(); assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api/assets`;
const read = (id: string, user: string, memberId = '') => fetch(`${base}/${id}/content?memberId=${memberId}`, { headers: { 'x-test-user': user } });
try {
  const ids: string[] = [];
  for (const format of ['png', 'jpeg', 'webp'] as const) {
    const bytes = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#336699' } }).toFormat(format).toBuffer();
    const response = await fetch(`${base}?kind=map&title=Test`, { method: 'POST', headers: { 'content-type': `image/${format}`, 'x-test-user': 'host-user' }, body: new Uint8Array(bytes) });
    assert.equal(response.status, 201);
    const id = (await response.json() as any).value.id as string; ids.push(id);
    assert.equal(records.get(id)?.ownerId, 'host-user');
    const content = await read(id, 'host-user'); assert.equal(content.status, 200); assert.equal(content.headers.get('x-content-type-options'), 'nosniff');
    const decoded = await sharp(Buffer.from(await content.arrayBuffer())).metadata(); assert.equal(decoded.format, 'webp'); assert.equal(decoded.width, 64);
    // A new storage/service instance reads the same durable bytes.
    const restarted = createPlatformAssets({ store: createFileAssetObjectStore(directory), repository });
    assert.ok((await restarted.read(await restarted.get(id))).length > 0);
    assert.equal((await read(id, 'player-user', 'player')).status, 404);
    assert.equal((await read(id, '')).status, 401);
  }
  const map = (eventKind: Parameters<typeof appendRoomMapEvent>[2]['eventKind'], payload: Record<string, unknown>) => {
    const result = appendRoomMapEvent(f.rooms, f.maps, { roomId: f.room.identity.roomId, authorMemberId: 'host', mapId: 'map', eventKind, payload });
    if (result.event) f.maps.confirmPending(f.room.identity.roomId, result.event.mapEventId);
    return result;
  };
  assert.equal(map('map.background_set', { backgroundAssetId: ids[0] }).decision, 'appended');
  assert.equal((await read(ids[0], 'player-user', 'player')).status, 200);
  assert.equal((await read(ids[0], 'spectator-user', 'spectator')).status, 200);
  assert.equal((await read(ids[0], 'outsider', 'player')).status, 404);
  map('map.token_added', { token: { id: 'portrait', name: 'Hidden', imageAssetId: ids[1], isHidden: true } });
  assert.equal((await read(ids[1], 'player-user', 'player')).status, 404);
  map('map.token_updated', { token: { id: 'portrait', isHidden: false } });
  assert.equal((await read(ids[1], 'player-user', 'player')).status, 200);
  map('map.token_updated', { token: { id: 'portrait', isHidden: true } });
  assert.equal((await read(ids[1], 'player-user', 'player')).status, 404);
  const board = replayMapRuntimeEvents(JSON.parse(JSON.stringify(f.maps.list(f.room.identity.roomId).events)), 'map');
  assert.equal(board.backgroundAssetId, ids[0]); assert.equal(board.tokens[0].imageAssetId, ids[1]);
  assert.equal(map('map.background_set', { backgroundUrl: 'https://example.com/legacy.png' }).decision, 'appended');
  const legacy = replayMapRuntimeEvents(f.maps.list(f.room.identity.roomId).events, 'map');
  assert.equal(legacy.backgroundAssetId, undefined); assert.equal(legacy.backgroundUrl, 'https://example.com/legacy.png');
  assert.equal((await read(ids[0], 'player-user', 'player')).status, 404);
  for (const url of ['blob:private', 'data:image/png;base64,x', 'file:///etc/passwd', 'C:\\private.png']) assert.equal(map('map.background_set', { backgroundUrl: url }).decision, 'invalidMapEvent');
  assert.equal(map('map.background_set', { backgroundAssetId: ids[0], backgroundUrl: 'https://example.com/a' }).decision, 'invalidMapEvent');
  for (const [mime, bytes] of [['image/png', Buffer.from('not an image')], ['image/svg+xml', Buffer.from('<svg/>')], ['image/jpeg', await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer()]] as const) {
    const response = await fetch(base, { method: 'POST', headers: { 'content-type': mime, 'x-test-user': 'host-user' }, body: new Uint8Array(bytes) });
    assert.equal(response.status, 415);
  }
  await assert.rejects(assets.upload('host-user', Buffer.alloc(20 * 1024 * 1024 + 1), 'image/png', 'too large', 'map'));
  assert.throws(() => store.read('../private'));
  assert.equal(records.size, 3);
  console.log('Asset smoke passed: PNG/JPEG/WebP HTTP upload, full decode, durable store reopen, owner and projected-room reads, spoofed membership denial, hidden token revocation, replay, HTTPS compatibility, invalid MIME/bytes/size/path rejection.');
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  for (const name of await readdir(directory)) await unlink(join(directory, name));
  await rmdir(directory);
}
