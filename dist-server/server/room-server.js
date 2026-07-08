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
import { createRoom, validateCampaignRef } from './services/createRoom.js';
import { joinRoom } from './services/joinRoom.js';
import { approveMember } from './services/approveMember.js';
import { rejectMember } from './services/rejectMember.js';
import { submitActorBinding } from './services/submitActorBinding.js';
import { approveActorBinding } from './services/approveActorBinding.js';
import { rejectActorBinding } from './services/rejectActorBinding.js';
import { setMemberReady } from './services/setMemberReady.js';
import { appendRuntimeLogEvent } from './services/appendRuntimeLogEvent.js';
import { listRuntimeLogEvents } from './services/listRuntimeLogEvents.js';
import { rollSharedDice } from './services/rollSharedDice.js';
import { createInMemoryRuntimeLogRegistry } from './runtime-log-registry.js';
import { createInMemoryActorAdmissionRegistry } from './actor-admission-registry.js';
import { readServerRuntimeConfigFromEnv } from './config/serverRuntimeConfig.js';
import { checkPostgresHealth } from './db/postgresClient.js';
import { checkPostgresUserSchemaReadiness, } from './db/postgresSchemaReadiness.js';
import { checkPostgresCampaignSchemaReadiness, } from './db/postgresCampaignSchemaReadiness.js';
import { checkPostgresActorSchemaReadiness, } from './db/postgresActorSchemaReadiness.js';
import { checkPostgresAssetSchemaReadiness, } from './db/postgresAssetSchemaReadiness.js';
import { checkPostgresRuntimeEventSchemaReadiness, } from './db/postgresRuntimeEventSchemaReadiness.js';
import { checkPostgresGeneratedArtifactSchemaReadiness, } from './db/postgresGeneratedArtifactSchemaReadiness.js';
import { checkPostgresWorldServerSchemaReadiness, } from './db/postgresWorldServerSchemaReadiness.js';
import { MEMORY_STORAGE_CAPABILITY } from './storage/memory-storage-adapter.js';
import { createRoomSocketServer } from './transport/roomSocketServer.js';
// P5.10G: dev-only read-only User routes (gated; never in production).
import { registerUserDevRoutes } from './api/userDevRoutes.js';
import { defaultPostgresUserApiHandlers } from './api/userApiHandlers.js';
const app = express();
const serverRuntimeConfig = readServerRuntimeConfigFromEnv(process.env);
// ── CORS allowlist (M26, config boundary M104-M107) ─────────────────────────
// Origins come from the shared server runtime config. Local dev defaults remain
// localhost-friendly; cloud/production must use explicit env configuration.
const ALLOWED_ORIGINS = serverRuntimeConfig.allowedOrigins;
const ALLOW_ALL_ORIGINS = ALLOWED_ORIGINS.includes('*');
// Minimal dependency-free CORS. Reflects an allowlisted Origin (or "*" when the
// operator opted in). Non-allowlisted origins simply get no CORS header (the
// browser then blocks the cross-origin read) — the server does not hard-reject,
// so same-origin/non-browser callers (curl, health probes) keep working.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (ALLOW_ALL_ORIGINS) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    else if (typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});
app.use(express.json());
// P5.10G: mount dev-only read-only User routes ONLY when explicitly gated.
// Disabled by default and forced off in production (see serverRuntimeConfig).
// No write/save route is ever mounted; responses use the safe API envelope.
if (serverRuntimeConfig.devUserApiEnabled === true) {
    registerUserDevRoutes(app, defaultPostgresUserApiHandlers);
}
const registry = createInMemoryRoomRegistry();
// Separate, memory-only RuntimeLog store — NOT part of RoomSnapshot (M21).
const runtimeLogRegistry = createInMemoryRuntimeLogRegistry();
// Memory-only ActorAdmission store for Character Clearance (M24.2b).
const actorAdmissionRegistry = createInMemoryActorAdmissionRegistry();
const PORT = serverRuntimeConfig.httpPort;
// HTTP server + WebSocket transport scaffold (room snapshot broadcast only).
const httpServer = createServer(app);
const roomSocketServer = createRoomSocketServer({ server: httpServer, registry, path: '/ws' });
app.get('/health', async (_req, res) => {
    const database = await checkPostgresHealth();
    const schema = database.status === 'ok'
        ? await checkPostgresUserSchemaReadiness()
        : database.configured === false
            ? { status: 'not_configured' }
            : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
    const campaignSchema = database.status === 'ok'
        ? await checkPostgresCampaignSchemaReadiness()
        : database.configured === false
            ? { status: 'not_configured' }
            : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
    const actorSchema = database.status === 'ok'
        ? await checkPostgresActorSchemaReadiness()
        : database.configured === false
            ? { status: 'not_configured' }
            : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
    const assetSchema = database.status === 'ok'
        ? await checkPostgresAssetSchemaReadiness()
        : database.configured === false
            ? { status: 'not_configured' }
            : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
    const runtimeEventSchema = database.status === 'ok'
        ? await checkPostgresRuntimeEventSchemaReadiness()
        : database.configured === false
            ? { status: 'not_configured' }
            : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
    const generatedArtifactSchema = database.status === 'ok'
        ? await checkPostgresGeneratedArtifactSchemaReadiness()
        : database.configured === false
            ? { status: 'not_configured' }
            : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
    const worldServerSchema = database.status === 'ok'
        ? await checkPostgresWorldServerSchemaReadiness()
        : database.configured === false
            ? { status: 'not_configured' }
            : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
    res.json({
        ok: true,
        service: 'room-server',
        version: 'm26',
        storage: MEMORY_STORAGE_CAPABILITY.adapterKind,
        environment: serverRuntimeConfig.environment,
        runtimeMode: serverRuntimeConfig.runtimeMode,
        devUserApiEnabled: serverRuntimeConfig.devUserApiEnabled === true,
        publicHttpUrl: serverRuntimeConfig.publicHttpUrl ?? null,
        publicWsUrl: serverRuntimeConfig.publicWsUrl ?? null,
        database: {
            ...database,
            schema,
            campaignSchema,
            actorSchema,
            assetSchema,
            runtimeEventSchema,
            generatedArtifactSchema,
            worldServerSchema,
        },
    });
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
    const body = req.body;
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
    const body = req.body;
    if (!body ||
        typeof body.inviteCodeOrRoomCode !== 'string' ||
        typeof body.requestedDisplayName !== 'string') {
        res.status(400).json({ error: 'inviteCodeOrRoomCode and requestedDisplayName are required.' });
        return;
    }
    const result = joinRoom(registry, body);
    if (result.roomId) {
        const room = registry.get(result.roomId);
        if (room)
            roomSocketServer.broadcastRoomSnapshot(room.identity.roomId, room, 'memberJoined');
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
    const body = (req.body ?? {});
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
    const body = (req.body ?? {});
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
    const body = (req.body ?? {});
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
            source: body.actorRef.source,
        },
    });
    if (result.room) {
        roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'actorBindingSubmitted');
    }
    res.status(result.decision === 'roomNotFound' ? 404 : result.decision === 'submitted' ? 200 : 400).json(result);
});
app.post('/rooms/:roomId/actor-bindings/:bindingId/approve', (req, res) => {
    const body = (req.body ?? {});
    const result = approveActorBinding(registry, actorAdmissionRegistry, {
        roomId: req.params.roomId,
        bindingId: req.params.bindingId,
        reviewerMemberId: body.reviewerMemberId,
    });
    if (result.room) {
        roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'actorBindingApproved');
    }
    const status = result.decision === 'approved'
        ? 200
        : result.decision === 'roomNotFound' || result.decision === 'bindingNotFound' || result.decision === 'memberNotFound' || result.decision === 'reviewerNotFound'
            ? 404
            : result.decision === 'reviewerNotHost' || result.decision === 'reviewerNotActive'
                ? 403
                : 400;
    res.status(status).json(result);
});
app.post('/rooms/:roomId/actor-bindings/:bindingId/reject', (req, res) => {
    const body = (req.body ?? {});
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
    const body = (req.body ?? {});
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
    let afterSeq;
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
    const body = (req.body ?? {});
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
// ── Shared Dice v0 (M25) ────────────────────────────────────────────────────
// Server-authoritative manual dice: server parses + rolls, appends a public
// dice.roll RuntimeLog event, and broadcasts it via the existing runtimeLogAppended.
app.post('/rooms/:roomId/runtime/dice-roll', (req, res) => {
    const body = (req.body ?? {});
    if (typeof body.memberId !== 'string' || body.memberId.trim() === '') {
        res.status(400).json({ ok: false, error: 'invalidRequest', message: 'memberId is required.' });
        return;
    }
    if (typeof body.expression !== 'string' || body.expression.trim() === '') {
        res.status(400).json({ ok: false, error: 'invalidExpression', message: 'expression is required.' });
        return;
    }
    const result = rollSharedDice(registry, runtimeLogRegistry, {
        roomId: req.params.roomId,
        memberId: body.memberId,
        expression: body.expression,
        label: typeof body.label === 'string' ? body.label : undefined,
    });
    if (result.decision !== 'rolled' || !result.event || !result.roll) {
        const status = result.decision === 'roomNotFound' || result.decision === 'memberNotFound' ? 404 : 400;
        res.status(status).json({ ok: false, error: result.decision, message: result.message });
        return;
    }
    // Only public events are broadcast (dice.roll is public in v0).
    if (result.event.visibility === 'public') {
        roomSocketServer.broadcastRuntimeLogAppended(result.event.roomId, [result.event]);
    }
    res.json({ ok: true, event: result.event, roll: result.roll });
});
httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Room server listening on port ${PORT} (HTTP + WS /ws)`);
    // eslint-disable-next-line no-console
    console.log(`[room-server] runtime config: environment=${serverRuntimeConfig.environment}; ` +
        `runtimeMode=${serverRuntimeConfig.runtimeMode}; ` +
        `publicHttpUrl=${serverRuntimeConfig.publicHttpUrl ?? 'unset'}; ` +
        `publicWsUrl=${serverRuntimeConfig.publicWsUrl ?? 'unset'}`);
    // eslint-disable-next-line no-console
    console.log(ALLOW_ALL_ORIGINS
        ? '[room-server] CORS: all origins (*) — set ROOM_ALLOWED_ORIGINS to restrict.'
        : `[room-server] CORS allowlist: ${ALLOWED_ORIGINS.join(', ')}`);
    for (const warning of serverRuntimeConfig.warnings ?? []) {
        // eslint-disable-next-line no-console
        console.warn(`[room-server] config warning: ${warning}`);
    }
});
