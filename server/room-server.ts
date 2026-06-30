/**
 * Portable Room Server entry (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_ENTRY_V0
 *
 * Minimal Express HTTP scaffold for the portable Room Server. Provides health +
 * room create/join/list over an in-memory registry, plus a minimal
 * dependency-free CORS middleware and a WebSocket transport scaffold at /ws
 * (room snapshot broadcast only). NO Runtime / RuntimeLog / map sync, NO
 * database, NO auth, NO projection. Same server application runs LAN-hosted /
 * official / third-party — LAN is just where it runs (see backendDeploymentTypes).
 */

import { createServer } from 'node:http';
import express from 'express';

import { createInMemoryRoomRegistry } from './room-registry.js';
import { createRoom, validateCampaignRef, type CreateRoomInput } from './services/createRoom.js';
import { joinRoom } from './services/joinRoom.js';
import { approveMember } from './services/approveMember.js';
import { rejectMember } from './services/rejectMember.js';
import { submitActorBinding } from './services/submitActorBinding.js';
import { approveActorBinding } from './services/approveActorBinding.js';
import { rejectActorBinding } from './services/rejectActorBinding.js';
import { setMemberReady } from './services/setMemberReady.js';
import { appendRuntimeLogEvent } from './services/appendRuntimeLogEvent.js';
import { listRuntimeLogEvents } from './services/listRuntimeLogEvents.js';
import { createInMemoryRuntimeLogRegistry } from './runtime-log-registry.js';
import { createInMemoryActorAdmissionRegistry } from './actor-admission-registry.js';
import { MEMORY_STORAGE_CAPABILITY } from './storage/memory-storage-adapter.js';
import { createRoomSocketServer } from './transport/roomSocketServer.js';
import type { AppendRoomRuntimeLogEventInput, RoomJoinRequest } from './protocol/room-protocol.js';

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
// Separate, memory-only RuntimeLog store — NOT part of RoomSnapshot (M21).
const runtimeLogRegistry = createInMemoryRuntimeLogRegistry();
// Memory-only ActorAdmission store for Character Clearance (M24.2b).
const actorAdmissionRegistry = createInMemoryActorAdmissionRegistry();
const PORT = Number(process.env.PORT ?? 8787);

// HTTP server + WebSocket transport scaffold (room snapshot broadcast only).
const httpServer = createServer(app);
const roomSocketServer = createRoomSocketServer({ server: httpServer, registry, path: '/ws' });

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
  // Optional campaign linkage (M19 / M19.2): validate displayName, source enum,
  // systemId enum, and system match. NOT a permission check.
  const campaignRefError = validateCampaignRef(body.campaignRef, body.systemId ?? 'dnd5e-2024');
  if (campaignRefError) {
    res.status(400).json({ error: campaignRefError });
    return;
  }
  const result = createRoom(body);
  registry.create(result.room);
  roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'roomCreated');
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
  if (result.roomId) {
    const room = registry.get(result.roomId);
    if (room) roomSocketServer.broadcastRoomSnapshot(room.identity.roomId, room, 'memberJoined');
  }
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
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'memberApproved');
  }
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
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'memberRejected');
  }
  res.status(result.decision === 'roomNotFound' ? 404 : 200).json(result);
});

// ── Room Lobby: actor binding + ready check (M15 scaffold) ──────────────────
// Pre-session lobby state only. Host approve/reject here are SCAFFOLD actions,
// NOT a real permission system. No Runtime / actor instance creation.

app.post('/rooms/:roomId/actor-bindings/submit', (req, res) => {
  const body = (req.body ?? {}) as { memberId?: string; actorRef?: { systemId?: string; actorId?: string; displayName?: string; source?: unknown } };
  if (typeof body.memberId !== 'string' || !body.actorRef || typeof body.actorRef.displayName !== 'string') {
    res.status(400).json({ error: 'memberId and actorRef.displayName are required.' });
    return;
  }
  const result = submitActorBinding(registry, {
    roomId: req.params.roomId,
    memberId: body.memberId,
    actorRef: {
      systemId: body.actorRef.systemId,
      actorId: body.actorRef.actorId,
      displayName: body.actorRef.displayName,
      source: body.actorRef.source as never,
    },
  });
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'actorBindingSubmitted');
  }
  res.status(result.decision === 'roomNotFound' ? 404 : result.decision === 'submitted' ? 200 : 400).json(result);
});

app.post('/rooms/:roomId/actor-bindings/:bindingId/approve', (req, res) => {
  const body = (req.body ?? {}) as { reviewerMemberId?: string };
  const result = approveActorBinding(registry, actorAdmissionRegistry, {
    roomId: req.params.roomId,
    bindingId: req.params.bindingId,
    reviewerMemberId: body.reviewerMemberId,
  });
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'actorBindingApproved');
  }
  const status =
    result.decision === 'approved'
      ? 200
      : result.decision === 'roomNotFound' || result.decision === 'bindingNotFound' || result.decision === 'memberNotFound' || result.decision === 'reviewerNotFound'
        ? 404
        : result.decision === 'reviewerNotHost' || result.decision === 'reviewerNotActive'
          ? 403
          : 400;
  res.status(status).json(result);
});

app.post('/rooms/:roomId/actor-bindings/:bindingId/reject', (req, res) => {
  const body = (req.body ?? {}) as { reviewerMemberId?: string; rejectionReason?: string };
  const result = rejectActorBinding(registry, actorAdmissionRegistry, {
    roomId: req.params.roomId,
    bindingId: req.params.bindingId,
    reviewerMemberId: body.reviewerMemberId,
    rejectionReason: body.rejectionReason,
  });
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'actorBindingRejected');
  }
  res.status(result.decision === 'roomNotFound' || result.decision === 'bindingNotFound' ? 404 : 200).json(result);
});

app.post('/rooms/:roomId/members/:memberId/ready', (req, res) => {
  const body = (req.body ?? {}) as { ready?: unknown };
  if (typeof body.ready !== 'boolean') {
    res.status(400).json({ error: 'ready (boolean) is required.' });
    return;
  }
  const result = setMemberReady(registry, actorAdmissionRegistry, {
    roomId: req.params.roomId,
    memberId: req.params.memberId,
    ready: body.ready,
  });
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'memberReadyChanged');
  }
  res.status(result.decision === 'roomNotFound' || result.decision === 'memberNotFound' ? 404 : result.decision === 'updated' ? 200 : 400).json(result);
});

// ── RuntimeLog server v0 (M21) ──────────────────────────────────────────────
// Append-only per-room event stream. NOT in RoomSnapshot, NOT formal Runtime, NO
// real auth/projection. Only public events are broadcast / listed in v0.

app.get('/rooms/:roomId/runtime-log', (req, res) => {
  const afterSeqRaw = req.query.afterSeq;
  let afterSeq: number | undefined;
  if (afterSeqRaw !== undefined) {
    // afterSeq must be a non-negative integer string: '' / NaN / decimals / signs
    // / negatives are rejected (double-checked again in the list service).
    if (typeof afterSeqRaw !== 'string' || !/^\d+$/.test(afterSeqRaw)) {
      res.status(400).json({ error: 'invalidAfterSeq' });
      return;
    }
    afterSeq = Number(afterSeqRaw);
  }
  const result = listRuntimeLogEvents(registry, runtimeLogRegistry, { roomId: req.params.roomId, afterSeq });
  if (result.decision === 'roomNotFound') {
    res.status(404).json({ error: 'roomNotFound' });
    return;
  }
  if (result.decision === 'invalidAfterSeq') {
    res.status(400).json({ error: 'invalidAfterSeq', message: result.message });
    return;
  }
  res.json(result.result);
});

app.post('/rooms/:roomId/runtime-log/events', (req, res) => {
  const body = (req.body ?? {}) as AppendRoomRuntimeLogEventInput;
  const result = appendRuntimeLogEvent(registry, runtimeLogRegistry, {
    roomId: req.params.roomId,
    authorMemberId: body.authorMemberId,
    actorBindingId: body.actorBindingId,
    kind: body.kind,
    visibility: body.visibility,
    text: body.text,
    payload: body.payload,
  });
  if (result.decision !== 'appended') {
    const status = result.decision === 'roomNotFound' || result.decision === 'memberNotFound' ? 404 : 400;
    res.status(status).json({ error: result.decision, message: result.message });
    return;
  }
  // Broadcast public events only; hostOnly is stored but withheld (NOT secure).
  if (result.event && result.event.visibility === 'public') {
    roomSocketServer.broadcastRuntimeLogAppended(result.event.roomId, [result.event]);
  }
  res.json({ event: result.event });
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[room-server] scaffold listening on http://localhost:${PORT} (HTTP + WS /ws)`);
});
