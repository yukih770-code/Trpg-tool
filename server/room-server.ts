/**
 * Portable Room Server entry (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_ENTRY_V0
 *
 * Minimal Express HTTP scaffold for the portable Room Server. Provides health +
 * room create/join/list over an in-memory registry, plus a minimal
 * dependency-free CORS middleware for the Vite dev frontend. NO WebSocket, NO
 * Runtime / RuntimeLog / map sync, NO database, NO auth. Same server application
 * runs LAN-hosted / official / third-party — LAN is just where it runs (see
 * backendDeploymentTypes).
 */

import express from 'express';

import { createInMemoryRoomRegistry } from './room-registry.js';
import { createRoom, type CreateRoomInput } from './services/createRoom.js';
import { joinRoom } from './services/joinRoom.js';
import { approveMember } from './services/approveMember.js';
import { rejectMember } from './services/rejectMember.js';
import { MEMORY_STORAGE_CAPABILITY } from './storage/memory-storage-adapter.js';
import type { RoomJoinRequest } from './protocol/room-protocol.js';

const app = express();

// Minimal dependency-free CORS for the Vite dev frontend (scaffold only).
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

const registry = createInMemoryRoomRegistry();
const PORT = Number(process.env.PORT ?? 8787);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'room-server', storage: MEMORY_STORAGE_CAPABILITY.adapterKind });
});

app.get('/rooms', (_req, res) => {
  res.json({
    rooms: registry.list().map((room) => ({
      roomId: room.identity.roomId,
      roomCode: room.identity.roomCode,
      systemId: room.identity.systemId,
      lifecycleStatus: room.identity.lifecycleStatus,
      memberCount: room.members.length,
    })),
  });
});

app.post('/rooms/create', (req, res) => {
  const body = req.body as CreateRoomInput | undefined;
  if (!body || typeof body.hostDisplayName !== 'string' || body.hostDisplayName.trim() === '') {
    res.status(400).json({ error: 'hostDisplayName is required.' });
    return;
  }
  const result = createRoom(body);
  registry.create(result.room);
  res.json(result);
});

app.post('/rooms/join', (req, res) => {
  const body = req.body as RoomJoinRequest | undefined;
  if (
    !body ||
    typeof body.inviteCodeOrRoomCode !== 'string' ||
    typeof body.requestedDisplayName !== 'string'
  ) {
    res.status(400).json({ error: 'inviteCodeOrRoomCode and requestedDisplayName are required.' });
    return;
  }
  const result = joinRoom(registry, body);
  res.json(result);
});

// Debug/scaffold read — full snapshot, NO projection filtering yet.
app.get('/rooms/:roomId', (req, res) => {
  const room = registry.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'roomNotFound', roomId: req.params.roomId });
    return;
  }
  res.json(room);
});

app.post('/rooms/:roomId/members/:memberId/approve', (req, res) => {
  const body = (req.body ?? {}) as { decidedByMemberId?: string };
  const result = approveMember(registry, {
    roomId: req.params.roomId,
    memberId: req.params.memberId,
    decidedByMemberId: body.decidedByMemberId,
  });
  res.status(result.decision === 'roomNotFound' ? 404 : 200).json(result);
});

app.post('/rooms/:roomId/members/:memberId/reject', (req, res) => {
  const body = (req.body ?? {}) as { decidedByMemberId?: string; reason?: string };
  const result = rejectMember(registry, {
    roomId: req.params.roomId,
    memberId: req.params.memberId,
    decidedByMemberId: body.decidedByMemberId,
    reason: body.reason,
  });
  res.status(result.decision === 'roomNotFound' ? 404 : 200).json(result);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[room-server] scaffold listening on http://localhost:${PORT}`);
});
