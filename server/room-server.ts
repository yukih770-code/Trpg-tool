/**
 * Portable Room Server entry (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_ENTRY_V0
 *
 * Minimal Express HTTP scaffold for the portable Room Server. Provides health +
 * room create/join/list over an in-memory registry, plus a minimal
 * dependency-free CORS middleware and a WebSocket transport scaffold at /ws
 * (room snapshots plus separate RuntimeLog and Room Map deltas). No database
 * persistence for portable room state, NO auth, NO projection. Same server application runs LAN-hosted /
 * official / third-party — LAN is just where it runs (see backendDeploymentTypes).
 */

import { createServer, type IncomingMessage } from 'node:http';
import express, { type Request } from 'express';

import { createInMemoryRoomRegistry } from './room-registry.js';
import { createRoom, validateCampaignRef, type CreateRoomInput } from './services/createRoom.js';
import { joinRoom } from './services/joinRoom.js';
import { approveMember } from './services/approveMember.js';
import { rejectMember } from './services/rejectMember.js';
import { submitActorBinding } from './services/submitActorBinding.js';
import { approveActorBinding } from './services/approveActorBinding.js';
import { rejectActorBinding } from './services/rejectActorBinding.js';
import { setMemberReady } from './services/setMemberReady.js';
import { disbandRoom } from './services/disbandRoom.js';
import { appendRuntimeLogEvent } from './services/appendRuntimeLogEvent.js';
import { listRuntimeLogEvents } from './services/listRuntimeLogEvents.js';
import { rollSharedDice } from './services/rollSharedDice.js';
import { createInMemoryRuntimeLogRegistry } from './runtime-log-registry.js';
import { createInMemoryRoomMapRegistry } from './room-map-registry.js';
import { appendRoomMapEvent } from './services/appendRoomMapEvent.js';
import { listRoomMapEvents } from './services/listRoomMapEvents.js';
import { setRoomMapMemberPermission } from './services/setRoomMapMemberPermission.js';
import { mapRuntimeActionForMapEvent, resolveRoomParticipant, resolveRoomRuntimePermission } from './room/roomRuntimePermissionGuard.js';
import { resolveVerifiedRoomTokenMove } from './room/roomTokenControlGuard.js';
import { createInMemoryActorAdmissionRegistry } from './actor-admission-registry.js';
import { readServerRuntimeConfigFromEnv } from './config/serverRuntimeConfig.js';
import { readDatabaseRuntimeConfigFromEnv } from './config/databaseRuntimeConfig.js';
import { validateServerStartupConfig } from './config/serverRuntimeConfig.js';
import { checkPostgresHealth } from './db/postgresClient.js';
import {
  checkPostgresUserSchemaReadiness,
  type PostgresSchemaReadinessResult,
} from './db/postgresSchemaReadiness.js';
import {
  checkPostgresCampaignSchemaReadiness,
  type PostgresCampaignSchemaReadinessResult,
} from './db/postgresCampaignSchemaReadiness.js';
import {
  checkPostgresActorSchemaReadiness,
  type PostgresActorSchemaReadinessResult,
} from './db/postgresActorSchemaReadiness.js';
import {
  checkPostgresAssetSchemaReadiness,
  type PostgresAssetSchemaReadinessResult,
} from './db/postgresAssetSchemaReadiness.js';
import {
  checkPostgresRuntimeEventSchemaReadiness,
  type PostgresRuntimeEventSchemaReadinessResult,
} from './db/postgresRuntimeEventSchemaReadiness.js';
import {
  checkPostgresGeneratedArtifactSchemaReadiness,
  type PostgresGeneratedArtifactSchemaReadinessResult,
} from './db/postgresGeneratedArtifactSchemaReadiness.js';
import {
  checkPostgresWorldServerSchemaReadiness,
  type PostgresWorldServerSchemaReadinessResult,
} from './db/postgresWorldServerSchemaReadiness.js';
import {
  checkPostgresVisibilitySchemaReadiness,
  type PostgresVisibilitySchemaReadinessResult,
} from './db/postgresVisibilitySchemaReadiness.js';
import { MEMORY_STORAGE_CAPABILITY } from './storage/memory-storage-adapter.js';
import { createRoomSocketServer } from './transport/roomSocketServer.js';
import type { AppendRoomMapEventInput, AppendRoomRuntimeLogEventInput, RoomJoinRequest } from './protocol/room-protocol.js';
// P5.10G: dev-only read-only User routes (gated; never in production).
import { registerUserDevRoutes } from './api/userDevRoutes.js';
import { defaultPostgresUserApiHandlers } from './api/userApiHandlers.js';
import { registerWorldServerApiRoutes } from './api/worldServerApiRoutes.js';
import { createWorldServerApiHandlers } from './api/worldServerApiHandlers.js';
import { registerCampaignRoomApiRoutes } from './api/campaignRoomApiRoutes.js';
import { createCampaignRoomApiHandlers } from './api/campaignRoomApiHandlers.js';
import { registerDndPrivateMonsterApiRoutes } from './api/dndPrivateMonsterApiRoutes.js';
import { createDndPrivateMonsterApiHandlers } from './api/dndPrivateMonsterApiHandlers.js';
import { createPrivateAlphaAuthService, readPrivateAlphaAuthConfigFromEnv } from './auth/privateAlphaAuth.js';
import { getVerifiedViewer, setPrivateAlphaViewer } from './auth/requestViewer.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from './auth/currentViewerContext.js';
import { resolveApiAuthSession } from './auth/requestAuthSession.js';
import type { RoomRuntimeAction } from '../src/lib/platform/roomRuntimePermissions.js';
import { createPrivateAlphaAuthApiHandlers } from './api/privateAlphaAuthApiHandlers.js';
import { registerPrivateAlphaAuthApiRoutes } from './api/privateAlphaAuthApiRoutes.js';
import { okResponse } from './api/apiResponse.js';

const app = express();
const serverRuntimeConfig = readServerRuntimeConfigFromEnv(process.env);
const databaseRuntimeConfig = readDatabaseRuntimeConfigFromEnv(process.env);
const privateAlphaAuthConfig = readPrivateAlphaAuthConfigFromEnv(process.env, serverRuntimeConfig.environment);
const startupValidation = validateServerStartupConfig(serverRuntimeConfig, databaseRuntimeConfig.configured);
if (startupValidation.errors.length > 0) {
  // Configuration labels are safe to print; values and secrets are never logged.
  // eslint-disable-next-line no-console
  console.error(`[room-server] startup configuration rejected: ${startupValidation.errors.join(' ')}`);
  throw new Error('Cloud deployment startup configuration is invalid.');
}

// ── CORS allowlist (M26, config boundary M104-M107) ─────────────────────────
// Origins come from the shared server runtime config. Local dev defaults remain
// localhost-friendly; cloud/production must use explicit env configuration.
const ALLOWED_ORIGINS = serverRuntimeConfig.allowedOrigins;
const ALLOW_ALL_ORIGINS = ALLOWED_ORIGINS.includes('*');
const ALLOWED_REQUEST_HEADERS = ['Content-Type'];
if (serverRuntimeConfig.devUserApiEnabled === true) {
  ALLOWED_REQUEST_HEADERS.push('X-Dev-User-Id', 'X-Dev-Viewer-User-Id');
}

// Minimal dependency-free CORS. Reflects an allowlisted Origin (or "*" when the
// operator opted in). Non-allowlisted origins simply get no CORS header (the
// browser then blocks the cross-origin read) — the server does not hard-reject,
// so same-origin/non-browser callers (curl, health probes) keep working.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOW_ALL_ORIGINS) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_REQUEST_HEADERS.join(', '));
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

const privateAlphaAuthService = createPrivateAlphaAuthService(privateAlphaAuthConfig);
const roomAuthSessionOptions = {
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
};

function resolveRoomRequestViewer(request: Request): CurrentViewerContext {
  return getVerifiedViewer(request)
    ?? createCurrentViewerContextFromAuthSession(resolveApiAuthSession({ headers: request.headers }, roomAuthSessionOptions));
}

async function resolveRoomSocketViewer(request: IncomingMessage): Promise<CurrentViewerContext> {
  const verified = await privateAlphaAuthService.resolveRequestViewer(request as unknown as Request);
  if (verified) return verified.viewer;

  // Browsers cannot attach arbitrary headers to a WebSocket handshake. The
  // local-only query hint is accepted only through the same explicit dev gate
  // that enables HTTP dev headers; production relies on the session cookie.
  const requestUrl = new URL(request.url ?? '/', 'http://room.local');
  const devViewerUserId = requestUrl.searchParams.get('devViewerUserId');
  const headers = devViewerUserId ? { ...request.headers, 'x-dev-user-id': devViewerUserId } : request.headers;
  return createCurrentViewerContextFromAuthSession(resolveApiAuthSession({ headers }, roomAuthSessionOptions));
}

// Only a verified server-side session is attached here. Existing localDev header
// handling remains inside API handlers and is never enabled in cloud modes.
const attachPrivateAlphaViewer = async (req: Request, _res: express.Response, next: express.NextFunction) => {
  try {
    setPrivateAlphaViewer(req, await privateAlphaAuthService.resolveRequestViewer(req));
  } catch {
    setPrivateAlphaViewer(req, null);
  }
  next();
};
app.use('/api', attachPrivateAlphaViewer);
app.use('/rooms', attachPrivateAlphaViewer);

registerPrivateAlphaAuthApiRoutes(app, createPrivateAlphaAuthApiHandlers({
  service: privateAlphaAuthService,
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
}), { secureCookies: privateAlphaAuthConfig.secureCookies });

// P5.10G: mount dev-only read-only User routes ONLY when explicitly gated.
// Disabled by default and forced off in production (see serverRuntimeConfig).
// No write/save route is ever mounted; responses use the safe API envelope.
if (serverRuntimeConfig.devUserApiEnabled === true) {
  registerUserDevRoutes(app, defaultPostgresUserApiHandlers);
}

// P5.API-CORE: business API routes are always registered, but dev auth headers
// are accepted only through the existing explicit development gate. With no
// configured database/auth provider, handlers return safe unavailable/401
// envelopes; startup performs no migration or readiness work for these routes.
registerWorldServerApiRoutes(app, createWorldServerApiHandlers({
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
}));
registerCampaignRoomApiRoutes(app, createCampaignRoomApiHandlers({
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
}));
registerDndPrivateMonsterApiRoutes(app, createDndPrivateMonsterApiHandlers({
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
}));

const registry = createInMemoryRoomRegistry();
// Separate, memory-only RuntimeLog store — NOT part of RoomSnapshot (M21).
const runtimeLogRegistry = createInMemoryRuntimeLogRegistry();
// Separate, memory-only map event stream. Not RoomSnapshot and not RuntimeLog.
const roomMapRegistry = createInMemoryRoomMapRegistry();
// Memory-only ActorAdmission store for Character Clearance (M24.2b).
const actorAdmissionRegistry = createInMemoryActorAdmissionRegistry();
const PORT = serverRuntimeConfig.httpPort;

// HTTP server + WebSocket transport scaffold (room snapshot broadcast only).
const httpServer = createServer(app);
const roomSocketServer = createRoomSocketServer({
  server: httpServer,
  registry,
  path: '/ws',
  resolveViewer: resolveRoomSocketViewer,
});

function requireRoomRuntimeAction(
  req: Request,
  res: express.Response,
  roomId: string,
  memberId: string | undefined,
  action: RoomRuntimeAction,
) {
  const room = registry.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'roomNotFound', roomId });
    return undefined;
  }
  const access = resolveRoomRuntimePermission({ room, viewer: resolveRoomRequestViewer(req), memberId, action });
  if (!access.allowed) {
    const status = access.code === 'unauthenticated' ? 401 : access.code === 'room_closed' ? 409 : 403;
    res.status(status).json({
      error: access.code === 'room_closed' ? 'roomClosed' : 'notAuthorized',
      message: access.code === 'room_closed' ? 'This room has been disbanded.' : 'This room action is not permitted for the current user.',
    });
    return undefined;
  }
  return room;
}

function requireRoomParticipant(
  req: Request,
  res: express.Response,
  roomId: string,
  memberId: string | undefined,
) {
  const room = registry.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'roomNotFound', roomId });
    return undefined;
  }
  const access = resolveRoomParticipant({ room, viewer: resolveRoomRequestViewer(req), memberId });
  if (!access.allowed) {
    res.status(access.code === 'unauthenticated' ? 401 : 403).json({ error: 'notAuthorized', message: 'Authenticated room membership is required.' });
    return undefined;
  }
  return room;
}

app.get('/health', async (_req, res) => {
  const database = await checkPostgresHealth();
  const schema: PostgresSchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresUserSchemaReadiness()
      : database.configured === false
        ? { status: 'not_configured' }
        : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
  const campaignSchema: PostgresCampaignSchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresCampaignSchemaReadiness()
      : database.configured === false
        ? { status: 'not_configured' }
        : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
  const actorSchema: PostgresActorSchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresActorSchemaReadiness()
      : database.configured === false
        ? { status: 'not_configured' }
        : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
  const assetSchema: PostgresAssetSchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresAssetSchemaReadiness()
      : database.configured === false
        ? { status: 'not_configured' }
        : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
  const runtimeEventSchema: PostgresRuntimeEventSchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresRuntimeEventSchemaReadiness()
      : database.configured === false
        ? { status: 'not_configured' }
        : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
  const generatedArtifactSchema: PostgresGeneratedArtifactSchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresGeneratedArtifactSchemaReadiness()
      : database.configured === false
        ? { status: 'not_configured' }
        : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
  const worldServerSchema: PostgresWorldServerSchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresWorldServerSchemaReadiness()
      : database.configured === false
        ? { status: 'not_configured' }
        : { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs };
  const visibilitySchema: PostgresVisibilitySchemaReadinessResult =
    database.status === 'ok'
      ? await checkPostgresVisibilitySchemaReadiness()
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
    lanAlpha: {
      enabled: serverRuntimeConfig.lanAlpha?.enabled === true,
      candidateCount: serverRuntimeConfig.lanAlpha?.candidates.length ?? 0,
      allowedOriginsSource: serverRuntimeConfig.lanAlpha?.allowedOriginsSource ?? 'none',
    },
    database: {
      ...database,
      schema,
      campaignSchema,
      actorSchema,
      assetSchema,
      runtimeEventSchema,
      generatedArtifactSchema,
      worldServerSchema,
      visibilitySchema,
    },
  });
});

// LAN Alpha exposes only local-network endpoint metadata. It never returns a
// session, invite code, database configuration, or a permission bypass.
app.get('/api/lan/runtime', (_req, res) => {
  const lanAlpha = serverRuntimeConfig.lanAlpha;
  res.json(okResponse({
    enabled: lanAlpha?.enabled === true,
    bindHost: lanAlpha?.enabled ? lanAlpha.bindHost : undefined,
    frontendPort: lanAlpha?.frontendPort ?? 3000,
    backendPort: lanAlpha?.backendPort ?? PORT,
    allowedOriginsSource: lanAlpha?.allowedOriginsSource ?? 'none',
    endpoints: lanAlpha?.enabled ? lanAlpha.endpoints : [],
    warnings: lanAlpha?.warnings ?? [],
  }));
});

app.get('/rooms', (_req, res) => {
  res.json({
    rooms: registry.list().filter((room) => room.identity.lifecycleStatus !== 'closed' && room.identity.lifecycleStatus !== 'archived').map((room) => ({
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
  const viewer = resolveRoomRequestViewer(req);
  if (!viewer.isAuthenticated || !viewer.viewerUserId) {
    res.status(401).json({ error: 'unauthenticated', message: 'An authenticated user is required to create a room.' });
    return;
  }
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
  const result = createRoom({ ...body, hostUserId: viewer.viewerUserId });
  registry.create(result.room);
  roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'roomCreated');
  res.json(result);
});

app.post('/rooms/join', (req, res) => {
  const body = req.body as RoomJoinRequest | undefined;
  const viewer = resolveRoomRequestViewer(req);
  if (!viewer.isAuthenticated || !viewer.viewerUserId) {
    res.status(401).json({ error: 'unauthenticated', message: 'An authenticated user is required to join a room.' });
    return;
  }
  if (
    !body ||
    typeof body.inviteCodeOrRoomCode !== 'string' ||
    typeof body.requestedDisplayName !== 'string'
  ) {
    res.status(400).json({ error: 'inviteCodeOrRoomCode and requestedDisplayName are required.' });
    return;
  }
  const result = joinRoom(registry, { ...body, userId: viewer.viewerUserId });
  if (result.roomId) {
    const room = registry.get(result.roomId);
    if (room) roomSocketServer.broadcastRoomSnapshot(room.identity.roomId, room, 'memberJoined');
  }
  res.json(result);
});

// Lobby snapshot read. The member id is bound to the authenticated viewer; a
// room code alone never grants access to the full room snapshot.
app.get('/rooms/:roomId', (req, res) => {
  const room = registry.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'roomNotFound', roomId: req.params.roomId });
    return;
  }
  const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
  const access = resolveRoomParticipant({ room, viewer: resolveRoomRequestViewer(req), memberId });
  if (!access.allowed) {
    res.status(access.code === 'unauthenticated' ? 401 : 403).json({ error: 'notAuthorized', message: 'Authenticated room membership is required.' });
    return;
  }
  res.json(room);
});

// Non-destructive room lifecycle action. Existing snapshots, RuntimeLog events,
// map events, and scene saves remain available to their respective history APIs.
app.post('/rooms/:roomId/disband', (req, res) => {
  const body = (req.body ?? {}) as { decidedByMemberId?: unknown };
  if (typeof body.decidedByMemberId !== 'string' || body.decidedByMemberId.trim() === '') {
    res.status(400).json({ error: 'decidedByMemberId is required.' });
    return;
  }
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.decidedByMemberId, 'room.host.manage')) return;
  const result = disbandRoom(registry, { roomId: req.params.roomId, decidedByMemberId: body.decidedByMemberId });
  if (result.room) roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'roomDisbanded');
  const status = result.decision === 'roomNotFound' ? 404 : result.decision === 'disbanded' ? 200 : 409;
  res.status(status).json(result);
});

app.post('/rooms/:roomId/members/:memberId/approve', (req, res) => {
  const body = (req.body ?? {}) as { decidedByMemberId?: string };
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.decidedByMemberId, 'room.host.manage')) return;
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
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.decidedByMemberId, 'room.host.manage')) return;
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
  const body = (req.body ?? {}) as { memberId?: string; actorRef?: { systemId?: string; actorId?: string; displayName?: string; source?: unknown; summary?: string; hpCurrent?: number; hpMax?: number; armorClass?: number; details?: unknown } };
  if (typeof body.memberId !== 'string' || !body.actorRef || typeof body.actorRef.displayName !== 'string') {
    res.status(400).json({ error: 'memberId and actorRef.displayName are required.' });
    return;
  }
  if (!requireRoomParticipant(req, res, req.params.roomId, body.memberId)) return;
  const result = submitActorBinding(registry, {
    roomId: req.params.roomId,
    memberId: body.memberId,
    actorRef: {
      systemId: body.actorRef.systemId,
      actorId: body.actorRef.actorId,
      displayName: body.actorRef.displayName,
      source: body.actorRef.source as never,
      summary: body.actorRef.summary,
      hpCurrent: body.actorRef.hpCurrent,
      hpMax: body.actorRef.hpMax,
      armorClass: body.actorRef.armorClass,
      details: body.actorRef.details,
    },
  });
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'actorBindingSubmitted');
  }
  res.status(result.decision === 'roomNotFound' ? 404 : result.decision === 'submitted' ? 200 : 400).json(result);
});

app.post('/rooms/:roomId/actor-bindings/:bindingId/approve', (req, res) => {
  const body = (req.body ?? {}) as { reviewerMemberId?: string };
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.reviewerMemberId, 'room.host.manage')) return;
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
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.reviewerMemberId, 'room.host.manage')) return;
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
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, req.params.memberId, 'runtime.event.append')) return;
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
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.authorMemberId, 'runtime.event.append')) return;
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

// ── Room Map stream v0 ─────────────────────────────────────────────────────
// Host-managed append-only map events. Map data stays out of RuntimeLog and
// RoomSnapshot. Memory-only until a future persistence boundary is introduced.
app.get('/rooms/:roomId/map-events', (req, res) => {
  const afterSeqRaw = req.query.afterSeq;
  const mapIdRaw = req.query.mapId;
  if (afterSeqRaw !== undefined && (typeof afterSeqRaw !== 'string' || !/^\d+$/.test(afterSeqRaw))) {
    res.status(400).json({ error: 'invalidAfterSeq' });
    return;
  }
  if (mapIdRaw !== undefined && (typeof mapIdRaw !== 'string' || mapIdRaw.trim() === '')) {
    res.status(400).json({ error: 'invalidMapId' });
    return;
  }
  const mapId = typeof mapIdRaw === 'string' ? mapIdRaw : undefined;
  const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, memberId, 'map.view')) return;
  const result = listRoomMapEvents(registry, roomMapRegistry, {
    roomId: req.params.roomId,
    afterSeq: afterSeqRaw === undefined ? undefined : Number(afterSeqRaw),
    mapId,
  });
  if (result.decision === 'roomNotFound') {
    res.status(404).json({ error: 'roomNotFound' });
    return;
  }
  if (result.decision !== 'ok') {
    res.status(400).json({ error: 'invalidMapRequest', message: result.message });
    return;
  }
  res.json(result.result);
});

app.post('/rooms/:roomId/map-events', (req, res) => {
  const body = (req.body ?? {}) as AppendRoomMapEventInput;
  if (body.eventKind === 'map.token_moved') {
    const room = registry.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: 'roomNotFound', roomId: req.params.roomId });
      return;
    }
    const access = resolveVerifiedRoomTokenMove({
      room,
      mapRegistry: roomMapRegistry,
      viewer: resolveRoomRequestViewer(req),
      memberId: body.authorMemberId,
      mapId: body.mapId,
      payload: body.payload,
    });
    if (!access.allowed) {
      res.status(access.code === 'unauthenticated' ? 401 : access.code === 'invalidMove' ? 400 : 403)
        .json({ error: access.code === 'room_closed' ? 'roomClosed' : 'notAuthorized', message: access.code === 'room_closed' ? 'This room has been disbanded.' : 'You can only move your own admitted character token.' });
      return;
    }
  } else if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.authorMemberId, mapRuntimeActionForMapEvent(body.eventKind))) return;
  const result = appendRoomMapEvent(registry, roomMapRegistry, {
    roomId: req.params.roomId,
    authorMemberId: body.authorMemberId,
    mapId: body.mapId,
    eventKind: body.eventKind,
    payload: body.payload,
  });
  if (result.decision !== 'appended' || !result.event) {
    const status = result.decision === 'roomNotFound' || result.decision === 'memberNotFound' ? 404 : 400;
    res.status(status).json({ error: result.decision, message: result.message });
    return;
  }
  roomSocketServer.broadcastMapEventAppended(result.event.roomId, [result.event]);
  res.json({ event: result.event });
});

// Host-managed collaboration grants for the Room Map. Memory-only v0: they
// travel in RoomSnapshot for live UI updates but do not become RuntimeLog data.
app.post('/rooms/:roomId/map-permissions/:memberId', (req, res) => {
  const body = (req.body ?? {}) as { authorizedByMemberId?: unknown; canPinRanges?: unknown };
  if (typeof body.authorizedByMemberId !== 'string' || typeof body.canPinRanges !== 'boolean') {
    res.status(400).json({ error: 'invalidMapPermissionRequest' });
    return;
  }
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.authorizedByMemberId, 'room.host.manage')) return;
  const result = setRoomMapMemberPermission(registry, {
    roomId: req.params.roomId,
    authorizedByMemberId: body.authorizedByMemberId,
    memberId: req.params.memberId,
    canPinRanges: body.canPinRanges,
  });
  if (result.decision !== 'updated' || !result.room) {
    const status = result.decision === 'roomNotFound' || result.decision === 'authorNotFound' || result.decision === 'memberNotFound' ? 404 : 400;
    res.status(status).json({ error: result.decision, message: result.message });
    return;
  }
  // Keep an append-only, host-only audit record while grants remain a
  // memory-only Room Server capability. It is intentionally not a public
  // RuntimeLog event and is not a durable authorization history yet.
  appendRuntimeLogEvent(registry, runtimeLogRegistry, {
    roomId: req.params.roomId,
    authorMemberId: body.authorizedByMemberId,
    kind: 'host.note',
    visibility: 'hostOnly',
    text: body.canPinRanges ? 'Granted fixed map range collaboration.' : 'Revoked fixed map range collaboration.',
    payload: {
      noteKind: 'mapPermissionAudit',
      memberId: req.params.memberId,
      action: 'map.template.fix',
      granted: body.canPinRanges,
      scope: 'roomSession',
    },
  });
  roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'mapPermissionChanged');
  res.json({ room: result.room });
});

// ── Shared Dice v0 (M25) ────────────────────────────────────────────────────
// Server-authoritative manual dice: server parses + rolls, appends a public
// dice.roll RuntimeLog event, and broadcasts it via the existing runtimeLogAppended.
app.post('/rooms/:roomId/runtime/dice-roll', (req, res) => {
  const body = (req.body ?? {}) as { memberId?: unknown; expression?: unknown; label?: unknown };
  if (typeof body.memberId !== 'string' || body.memberId.trim() === '') {
    res.status(400).json({ ok: false, error: 'invalidRequest', message: 'memberId is required.' });
    return;
  }
  if (typeof body.expression !== 'string' || body.expression.trim() === '') {
    res.status(400).json({ ok: false, error: 'invalidExpression', message: 'expression is required.' });
    return;
  }
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.memberId, 'runtime.event.append')) return;
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

const onServerListening = () => {
  // eslint-disable-next-line no-console
  console.log(`Room server listening on port ${PORT} (HTTP + WS /ws)`);
  // eslint-disable-next-line no-console
  console.log(
    `[room-server] runtime config: environment=${serverRuntimeConfig.environment}; ` +
      `runtimeMode=${serverRuntimeConfig.runtimeMode}; ` +
      `publicHttpUrl=${serverRuntimeConfig.publicHttpUrl ?? 'unset'}; ` +
      `publicWsUrl=${serverRuntimeConfig.publicWsUrl ?? 'unset'}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    ALLOW_ALL_ORIGINS
      ? '[room-server] CORS: all origins (*) — set ROOM_ALLOWED_ORIGINS to restrict.'
      : `[room-server] CORS allowlist: ${ALLOWED_ORIGINS.join(', ')}`,
  );
  for (const warning of serverRuntimeConfig.warnings ?? []) {
    // eslint-disable-next-line no-console
    console.warn(`[room-server] config warning: ${warning}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[room-server] database configured: ${databaseRuntimeConfig.configured}; dev auth enabled: ${serverRuntimeConfig.devUserApiEnabled === true}`);
};

if (serverRuntimeConfig.lanAlpha?.enabled && serverRuntimeConfig.lanAlpha.bindHost !== '0.0.0.0') {
  httpServer.listen(PORT, serverRuntimeConfig.lanAlpha.bindHost, onServerListening);
} else {
  // The Node default listener remains dual-stack on supported hosts while still
  // exposing LAN interfaces. This keeps localhost health checks working too.
  httpServer.listen(PORT, onServerListening);
}
