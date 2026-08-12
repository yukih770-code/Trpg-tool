/**
 * Portable Room Server entry (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_ENTRY_V0
 *
 * Minimal Express HTTP scaffold for the portable Room Server. Provides health +
 * room create/join/list over an in-memory registry, plus a minimal
 * dependency-free CORS middleware and a WebSocket transport at /ws (room
 * snapshots plus separate RuntimeLog and Room Map deltas). Live portable room
 * state remains memory-resident; authenticated API and visibility-projection
 * boundaries are layered around the runtime surfaces. The same server
 * application runs LAN-hosted / official / third-party — LAN is just where it
 * runs (see backendDeploymentTypes).
 */

import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { projectRoomMapEventsForViewer, projectRoomSnapshotForViewer, projectRuntimeLogEventsForViewer } from './room/roomRuntimeVisibilityProjection.js';
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
import { registerPrivateCompendiumPackApiRoutes } from './api/privateCompendiumPackApiRoutes.js';
import { createPrivateCompendiumPackApiHandlers } from './api/privateCompendiumPackApiHandlers.js';
import { registerPersonalCompendiumPackApiRoutes } from './api/personalCompendiumPackApiRoutes.js';
import { createPersonalCompendiumPackApiHandlers } from './api/personalCompendiumPackApiHandlers.js';
import { registerActorApiRoutes } from './api/actorApiRoutes.js';
import { createActorApiHandlers } from './api/actorApiHandlers.js';
import { createPrivateAlphaAuthService, readPrivateAlphaAuthConfigFromEnv } from './auth/privateAlphaAuth.js';
import { getVerifiedViewer, setPrivateAlphaViewer } from './auth/requestViewer.js';
import { createCurrentViewerContextFromAuthSession, type CurrentViewerContext } from './auth/currentViewerContext.js';
import { resolveApiAuthSession } from './auth/requestAuthSession.js';
import type { RoomRuntimeAction } from '../src/lib/platform/roomRuntimePermissions.js';
import { createPrivateAlphaAuthApiHandlers } from './api/privateAlphaAuthApiHandlers.js';
import { registerPrivateAlphaAuthApiRoutes } from './api/privateAlphaAuthApiRoutes.js';
import { okResponse } from './api/apiResponse.js';
import { createPostgresActorRepository } from './adapters/postgresActorRepository.js';
import { resolveOwnedRoomActorBinding } from './services/resolveOwnedRoomActorBinding.js';
import { resolveOwnedPersonalContentReferences } from './services/resolveOwnedPersonalContentReferences.js';
import { createPostgresPlatformFoundationRepository } from './adapters/postgresPlatformFoundationRepository.js';
import { createPostgresWorldServerRepository } from './adapters/postgresWorldServerRepository.js';
import { createPostgresRuntimeEventRepository } from './adapters/postgresRuntimeEventRepository.js';
import { linkApprovedRoomBindingToCampaignActor } from './services/linkApprovedRoomBindingToCampaignActor.js';
import { projectRoomRuntimeActorProjections } from './services/projectRoomRuntimeActorProjections.js';
import { authorizeCloudRoomCreate } from './services/authorizeCloudRoomCreate.js';
import {
  createLiveRoomLifecyclePersistenceCoordinator,
  restoreLiveRoomLifecycles,
} from './services/liveRoomLifecyclePersistence.js';
import {
  createLiveRoomRuntimeLogPersistenceCoordinator,
  prepareLiveRoomRuntimeSession,
  restoreLiveRoomRuntimeLogs,
} from './services/liveRoomRuntimeLogPersistence.js';

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
registerPrivateCompendiumPackApiRoutes(app, createPrivateCompendiumPackApiHandlers({
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
}));
registerPersonalCompendiumPackApiRoutes(app, createPersonalCompendiumPackApiHandlers({
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
}));
registerActorApiRoutes(app, createActorApiHandlers({
  allowDevAuthHeaders: serverRuntimeConfig.devUserApiEnabled === true,
  nodeEnv: serverRuntimeConfig.environment === 'localDev' ? 'development' : 'production',
}));

// Memory-only ActorAdmission store for Character Clearance (M24.2b).
const actorAdmissionRegistry = createInMemoryActorAdmissionRegistry();
// The Vault repository remains independent from rooms. It is consulted only to
// canonicalize an explicit persisted actorId during lobby binding submission.
const actorVaultRepository = createPostgresActorRepository();
const platformFoundationRepository = createPostgresPlatformFoundationRepository();
const worldServerRepository = createPostgresWorldServerRepository();
const runtimeEventRepository = createPostgresRuntimeEventRepository();
const liveRoomLifecyclePersistence = createLiveRoomLifecyclePersistenceCoordinator(platformFoundationRepository);
const registry = createInMemoryRoomRegistry({
  onRoomUpdated: (snapshot) => liveRoomLifecyclePersistence.queue(snapshot),
});
const liveRoomRuntimeLogPersistence = createLiveRoomRuntimeLogPersistenceCoordinator(runtimeEventRepository);
// RuntimeLog remains separate from RoomSnapshot and authoritative in memory for
// live play. Campaign-linked cloud rooms additionally mirror appends to their
// dedicated Runtime Session so the stream can be rebuilt after a restart.
const runtimeLogRegistry = createInMemoryRuntimeLogRegistry({
  onEventAppended: (event) => {
    const room = registry.get(event.roomId);
    if (room?.campaignRef?.worldServerId && room.campaignRef.campaignId && room.identity.sessionId) {
      void liveRoomRuntimeLogPersistence.queue(room, event);
    }
  },
});
// Separate, memory-only map event stream. Not RoomSnapshot and not RuntimeLog.
const roomMapRegistry = createInMemoryRoomMapRegistry();
const PORT = serverRuntimeConfig.httpPort;

// HTTP server + WebSocket transport scaffold (room snapshot broadcast only).
const httpServer = createServer(app);
const roomSocketServer = createRoomSocketServer({
  server: httpServer,
  registry,
  path: '/ws',
  resolveViewer: resolveRoomSocketViewer,
  projectRoomSnapshot: projectRoomSnapshotForViewer,
  readRuntimeLogEvents: (roomId, afterSeq) => runtimeLogRegistry.list(roomId, {
    // With no cursor, return only the latest baseline; initial history remains
    // owned by the existing HTTP list endpoint.
    afterSeq: afterSeq ?? Number.MAX_SAFE_INTEGER,
  }),
  readMapEvents: (roomId, afterSeq) => roomMapRegistry.list(roomId, {
    afterSeq: afterSeq ?? Number.MAX_SAFE_INTEGER,
  }),
  projectRuntimeLogEvents: (roomId, memberId, events) => {
    const room = registry.get(roomId);
    if (!room) return [];
    const raw = listRuntimeLogEvents(registry, runtimeLogRegistry, {
      roomId,
      includeHostOnly: room.members.some((member) => member.memberId === memberId && member.role === 'host'),
    }).result?.events ?? [];
    const requested = new Set(events.map((event) => event.eventId));
    return projectRuntimeLogEventsForViewer(room, memberId, raw, roomMapRegistry.list(roomId).events)
      .filter((event) => requested.has(event.eventId));
  },
  projectMapEvents: (roomId, memberId, events) => {
    const room = registry.get(roomId);
    if (!room) return [];
    const projectedAll = projectRoomMapEventsForViewer(room, memberId, roomMapRegistry.list(roomId).events);
    const requested = new Set(events.map((event) => event.mapEventId));
    return projectedAll.filter((event) => requested.has(event.mapEventId));
  },
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
    authMode: serverRuntimeConfig.privateAlphaAuthEnabled
      ? 'privateAlpha'
      : serverRuntimeConfig.devUserApiEnabled
        ? 'localDev'
        : 'unauthenticated',
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

app.post('/rooms/create', async (req, res) => {
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
  // systemId enum, and system match.
  const campaignRefError = validateCampaignRef(body.campaignRef, body.systemId ?? 'dnd5e-2024');
  if (campaignRefError) {
    res.status(400).json({ error: campaignRefError });
    return;
  }
  const worldServerId = body.campaignRef?.worldServerId?.trim();
  const campaignId = body.campaignRef?.campaignId?.trim();
  if (Boolean(worldServerId) !== Boolean(campaignId)) {
    res.status(400).json({ error: 'worldServerId and campaignId must be supplied together.' });
    return;
  }
  if (worldServerId && campaignId) {
    const authorization = await authorizeCloudRoomCreate(worldServerRepository, {
      worldServerId,
      campaignId,
      viewerUserId: viewer.viewerUserId,
    });
    if (authorization.status === 'unavailable') {
      res.status(503).json({ error: 'worldContextUnavailable', message: 'The campaign context is temporarily unavailable.' });
      return;
    }
    if (authorization.status === 'denied') {
      res.status(403).json({ error: 'campaignRoomCreateDenied', message: 'You cannot create a live room for this campaign.' });
      return;
    }
  }
  const result = createRoom({
    ...body,
    hostUserId: viewer.viewerUserId,
    // Cloud live rooms own a server-issued Runtime Session. Local/LAN rooms
    // retain the portable caller-supplied session boundary and stay memory-only.
    sessionId: worldServerId && campaignId ? `runtime_session_${randomUUID()}` : body.sessionId,
  });
  if (worldServerId && campaignId) {
    const runtimePrepared = await prepareLiveRoomRuntimeSession(runtimeEventRepository, result.room);
    if (runtimePrepared.decision !== 'ready') {
      res.status(503).json({ error: 'roomRuntimeUnavailable', message: 'The live room RuntimeLog could not be prepared for recovery.' });
      return;
    }
    const persisted = await liveRoomLifecyclePersistence.persist(result.room);
    if (persisted.decision !== 'persisted') {
      res.status(503).json({ error: 'roomLifecycleUnavailable', message: 'The live room could not be prepared for recovery.' });
      return;
    }
  }
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

// Re-enter a restored lobby without retaining a browser-side member id. The
// signed-in user still has to match an active persisted room member.
app.get('/rooms/:roomId/entry', (req, res) => {
  const room = registry.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'roomNotFound', roomId: req.params.roomId });
    return;
  }
  const viewer = resolveRoomRequestViewer(req);
  if (!viewer.isAuthenticated || !viewer.viewerUserId) {
    res.status(401).json({ error: 'unauthenticated', message: 'Authentication required.' });
    return;
  }
  const member = room.members.find((candidate) =>
    candidate.userId === viewer.viewerUserId && candidate.status !== 'kicked' && candidate.status !== 'left' && candidate.status !== 'disconnected',
  );
  if (!member) {
    res.status(403).json({ error: 'notAuthorized', message: 'An active room membership is required.' });
    return;
  }
  res.json({
    room: projectRoomSnapshotForViewer(room, member.memberId),
    memberId: member.memberId,
    role: member.role,
  });
});

// Narrow Runtime read for safe combat-facing campaign actor facts. This route
// deliberately does not reuse the general campaign actor API because that API
// can return full owner-scoped source snapshots.
app.get('/rooms/:roomId/runtime-actors', async (req, res) => {
  const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
  const room = requireRoomRuntimeAction(req, res, req.params.roomId, memberId, 'combat.view');
  if (!room) return;

  const result = await projectRoomRuntimeActorProjections({ room, repository: platformFoundationRepository, currentMemberId: memberId });
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
  res.json(projectRoomSnapshotForViewer(room, memberId));
});

// A pending applicant may only learn their own membership outcome. This keeps
// the room snapshot and Lobby content private until the host accepts them.
app.get('/rooms/:roomId/join-status', (req, res) => {
  const room = registry.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'roomNotFound', roomId: req.params.roomId });
    return;
  }
  const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
  const viewer = resolveRoomRequestViewer(req);
  const member = memberId ? room.members.find((candidate) => candidate.memberId === memberId) : undefined;
  if (!viewer.isAuthenticated || !viewer.viewerUserId || !member || !member.userId || member.userId !== viewer.viewerUserId) {
    res.status(viewer.isAuthenticated ? 403 : 401).json({ error: 'notAuthorized' });
    return;
  }
  res.json({
    roomId: room.identity.roomId,
    memberId: member.memberId,
    memberStatus: member.status,
    assignedRole: member.role,
  });
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

app.post('/rooms/:roomId/actor-bindings/submit', async (req, res) => {
  const body = (req.body ?? {}) as { memberId?: string; actorRef?: { systemId?: string; actorId?: string; displayName?: string; source?: unknown; summary?: string; hpCurrent?: number; hpMax?: number; armorClass?: number; details?: unknown; contentReferences?: unknown } };
  if (typeof body.memberId !== 'string' || !body.actorRef || typeof body.actorRef.displayName !== 'string') {
    res.status(400).json({ error: 'memberId and actorRef.displayName are required.' });
    return;
  }
  // Preserve the runtime validation above in a concrete shape across the await
  // below. It also makes the canonicalization seam explicit at this boundary.
  const submittedActorRef = {
    systemId: body.actorRef.systemId,
    actorId: body.actorRef.actorId,
    displayName: body.actorRef.displayName,
    source: body.actorRef.source,
    summary: body.actorRef.summary,
    hpCurrent: body.actorRef.hpCurrent,
    hpMax: body.actorRef.hpMax,
    armorClass: body.actorRef.armorClass,
    details: body.actorRef.details,
    contentReferences: body.actorRef.contentReferences,
  };
  const room = requireRoomParticipant(req, res, req.params.roomId, body.memberId);
  if (!room) return;
  const viewer = resolveRoomRequestViewer(req);
  if (!viewer.viewerUserId) {
    res.status(401).json({ error: 'unauthenticated', message: 'Authentication required.' });
    return;
  }
  const resolvedContent = await resolveOwnedPersonalContentReferences(platformFoundationRepository, {
    viewerUserId: viewer.viewerUserId,
    references: submittedActorRef.contentReferences,
  });
  if (resolvedContent.ok === false) {
    res.status(resolvedContent.code === 'unavailable' ? 503 : resolvedContent.code === 'invalid' ? 400 : 404)
      .json({ error: resolvedContent.code, message: resolvedContent.message });
    return;
  }
  const resolvedActor = await resolveOwnedRoomActorBinding(actorVaultRepository, {
    viewerUserId: viewer.viewerUserId,
    roomSystemId: room.identity.systemId,
    actorRef: { ...submittedActorRef, contentReferences: resolvedContent.references },
  });
  if (resolvedActor.ok === false) {
    const status = resolvedActor.code === 'unavailable' ? 503 : resolvedActor.code === 'system_mismatch' ? 400 : 404;
    res.status(status).json({ error: resolvedActor.code, message: resolvedActor.message });
    return;
  }
  const result = submitActorBinding(registry, {
    roomId: req.params.roomId,
    memberId: body.memberId,
    actorRef: {
      systemId: resolvedActor.actorRef.systemId,
      actorId: resolvedActor.actorRef.actorId,
      displayName: resolvedActor.actorRef.displayName,
      source: resolvedActor.actorRef.source as never,
      summary: resolvedActor.actorRef.summary,
      hpCurrent: resolvedActor.actorRef.hpCurrent,
      hpMax: resolvedActor.actorRef.hpMax,
      armorClass: resolvedActor.actorRef.armorClass,
      details: resolvedActor.actorRef.details,
      contentReferences: resolvedActor.actorRef.contentReferences,
    },
  });
  if (result.room) {
    roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'actorBindingSubmitted');
  }
  res.status(result.decision === 'roomNotFound' ? 404 : result.decision === 'submitted' ? 200 : 400).json(result);
});

app.post('/rooms/:roomId/actor-bindings/:bindingId/approve', async (req, res) => {
  const body = (req.body ?? {}) as { reviewerMemberId?: string };
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.reviewerMemberId, 'room.host.manage')) return;
  const result = approveActorBinding(registry, actorAdmissionRegistry, {
    roomId: req.params.roomId,
    bindingId: req.params.bindingId,
    reviewerMemberId: body.reviewerMemberId,
  });
  let campaignActorLink: Awaited<ReturnType<typeof linkApprovedRoomBindingToCampaignActor>> | undefined;
  const viewer = resolveRoomRequestViewer(req);
  if (result.decision === 'approved' && viewer.viewerUserId) {
    campaignActorLink = await linkApprovedRoomBindingToCampaignActor(
      registry,
      actorVaultRepository,
      platformFoundationRepository,
      worldServerRepository,
      { roomId: req.params.roomId, bindingId: req.params.bindingId, reviewerUserId: viewer.viewerUserId },
    );
  }
  if (campaignActorLink && result.room) result.room = registry.get(req.params.roomId) ?? result.room;
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
  res.status(status).json({ ...result, campaignActorLink });
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
// Append-only per-room event stream. It remains separate from RoomSnapshot, but
// every read is now bound to a verified active member and projected per viewer.

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
  const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
  const room = requireRoomRuntimeAction(req, res, req.params.roomId, memberId, 'combat.view');
  if (!room) return;
  const member = room.members.find((candidate) => candidate.memberId === memberId);
  const result = listRuntimeLogEvents(registry, runtimeLogRegistry, {
    roomId: req.params.roomId,
    includeHostOnly: member?.role === 'host',
  });
  if (result.decision === 'roomNotFound') {
    res.status(404).json({ error: 'roomNotFound' });
    return;
  }
  if (result.decision === 'invalidAfterSeq') {
    res.status(400).json({ error: 'invalidAfterSeq', message: result.message });
    return;
  }
  const raw = result.result;
  const projected = raw
    ? projectRuntimeLogEventsForViewer(room, memberId, raw.events, roomMapRegistry.list(room.identity.roomId).events)
    : [];
  res.json(raw && {
    ...raw,
    // Projection needs all prior events to produce a coherent current safe
    // combat snapshot; afterSeq belongs on the already-projected view.
    events: afterSeq === undefined ? projected : projected.filter((event) => event.seq > afterSeq),
  });
});

app.post('/rooms/:roomId/runtime-log/events', async (req, res) => {
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
  // Socket delivery applies a per-member projection. Host-only events reach only
  // the host; public combat data is still redacted for non-host viewers.
  if (result.event) {
    await liveRoomRuntimeLogPersistence.flush(result.event.roomId);
    roomSocketServer.broadcastRuntimeLogAppended(result.event.roomId, [result.event]);
  }
  const room = registry.get(req.params.roomId);
  const authorIsHost = room?.members.some((member) => member.memberId === body.authorMemberId && member.role === 'host') ?? false;
  const raw = room
    ? listRuntimeLogEvents(registry, runtimeLogRegistry, { roomId: room.identity.roomId, includeHostOnly: authorIsHost }).result?.events ?? []
    : [];
  const projected = room
    ? projectRuntimeLogEventsForViewer(room, body.authorMemberId, raw, roomMapRegistry.list(room.identity.roomId).events)
      .find((event) => event.eventId === result.event?.eventId)
    : result.event;
  res.json({ event: projected ?? result.event });
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
  });
  if (result.decision === 'roomNotFound') {
    res.status(404).json({ error: 'roomNotFound' });
    return;
  }
  if (result.decision !== 'ok') {
    res.status(400).json({ error: 'invalidMapRequest', message: result.message });
    return;
  }
  const room = registry.get(req.params.roomId);
  const raw = result.result;
  const projected = room && raw ? projectRoomMapEventsForViewer(room, memberId, raw.events) : raw?.events ?? [];
  const afterSeq = afterSeqRaw === undefined ? undefined : Number(afterSeqRaw);
  res.json(raw && {
    ...raw,
    // Hidden token transitions require replay of the full authoritative map
    // stream before applying caller filters.
    events: projected.filter((event) => (mapId === undefined || event.mapId === mapId) && (afterSeq === undefined || event.seq > afterSeq)),
  });
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
  const room = registry.get(req.params.roomId);
  const projected = room ? projectRoomMapEventsForViewer(room, body.authorMemberId, roomMapRegistry.list(room.identity.roomId).events).find((event) => event.mapEventId === result.event?.mapEventId) : undefined;
  res.json({ event: projected ?? result.event });
});

// Host-managed collaboration grants for the Room Map. Memory-only v0: they
// travel in RoomSnapshot for live UI updates but do not become RuntimeLog data.
app.post('/rooms/:roomId/map-permissions/:memberId', async (req, res) => {
  const body = (req.body ?? {}) as { authorizedByMemberId?: unknown; canPinRanges?: unknown; canManageTokens?: unknown };
  if (
    typeof body.authorizedByMemberId !== 'string'
    || (typeof body.canPinRanges !== 'boolean' && typeof body.canManageTokens !== 'boolean')
  ) {
    res.status(400).json({ error: 'invalidMapPermissionRequest' });
    return;
  }
  if (!requireRoomRuntimeAction(req, res, req.params.roomId, body.authorizedByMemberId, 'room.host.manage')) return;
  const result = setRoomMapMemberPermission(registry, {
    roomId: req.params.roomId,
    authorizedByMemberId: body.authorizedByMemberId,
    memberId: req.params.memberId,
    canPinRanges: typeof body.canPinRanges === 'boolean' ? body.canPinRanges : undefined,
    canManageTokens: typeof body.canManageTokens === 'boolean' ? body.canManageTokens : undefined,
  });
  if (result.decision !== 'updated' || !result.room) {
    const status = result.decision === 'roomNotFound' || result.decision === 'authorNotFound' || result.decision === 'memberNotFound' ? 404 : 400;
    res.status(status).json({ error: result.decision, message: result.message });
    return;
  }
  // Keep an append-only, host-only audit record while grants remain a
  // memory-only Room Server capability. It is intentionally not a public
  // RuntimeLog event and is not a durable authorization history yet.
  const auditLogResult = appendRuntimeLogEvent(registry, runtimeLogRegistry, {
    roomId: req.params.roomId,
    authorMemberId: body.authorizedByMemberId,
    kind: 'host.note',
    visibility: 'hostOnly',
    text: typeof body.canManageTokens === 'boolean'
      ? (body.canManageTokens ? 'Granted own-token movement.' : 'Revoked own-token movement.')
      : body.canPinRanges ? 'Granted fixed map range collaboration.' : 'Revoked fixed map range collaboration.',
    payload: {
      noteKind: 'mapPermissionAudit',
      memberId: req.params.memberId,
      action: typeof body.canManageTokens === 'boolean' ? 'map.token.move.own' : 'map.template.fix',
      granted: typeof body.canManageTokens === 'boolean' ? body.canManageTokens : body.canPinRanges,
      scope: 'roomSession',
    },
  });
  if (auditLogResult.event) await liveRoomRuntimeLogPersistence.flush(auditLogResult.event.roomId);
  roomSocketServer.broadcastRoomSnapshot(result.room.identity.roomId, result.room, 'mapPermissionChanged');
  res.json({ room: result.room });
});

// ── Shared Dice v0 (M25) ────────────────────────────────────────────────────
// Server-authoritative manual dice: server parses + rolls, appends a public
// dice.roll RuntimeLog event, and broadcasts it via the existing runtimeLogAppended.
app.post('/rooms/:roomId/runtime/dice-roll', async (req, res) => {
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
  await liveRoomRuntimeLogPersistence.flush(result.event.roomId);
  // Only public events are broadcast (dice.roll is public in v0).
  if (result.event.visibility === 'public') {
    roomSocketServer.broadcastRuntimeLogAppended(result.event.roomId, [result.event]);
  }
  res.json({ ok: true, event: result.event, roll: result.roll });
});

// A cloud private-alpha deployment is one public Node service: it owns the
// API, WebSocket upgrade at /ws, and the already-built frontend. Register this
// after every API route so client-side navigation never shadows API endpoints.
if (serverRuntimeConfig.runtimeMode === 'cloud') {
  const serverEntryDirectory = dirname(fileURLToPath(import.meta.url));
  const frontendBuildDirectory = resolve(serverEntryDirectory, '../../dist');
  const frontendIndexFile = resolve(frontendBuildDirectory, 'index.html');

  if (!existsSync(frontendIndexFile)) {
    throw new Error('Cloud startup requires dist/index.html. Run npm run build before npm run server:start.');
  }

  app.use(express.static(frontendBuildDirectory, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/') || req.path === '/rooms' || req.path.startsWith('/rooms/')) {
      res.status(404).json({ error: 'notFound' });
      return;
    }
    res.sendFile(frontendIndexFile, (error) => {
      if (error) next(error);
    });
  });
}

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
  void restoreLiveRoomLifecycles(platformFoundationRepository, registry).then(async (result) => {
    if (result.decision === 'restored' && result.restoredCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`[room-server] restored ${result.restoredCount} live room lobby/lobbies.`);
    }
    const runtimeLogResult = await restoreLiveRoomRuntimeLogs(runtimeEventRepository, registry, runtimeLogRegistry);
    if (runtimeLogResult.restoredEventCount > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `[room-server] restored ${runtimeLogResult.restoredEventCount} RuntimeLog event(s) `
        + `across ${runtimeLogResult.restoredRoomCount} live room(s).`,
      );
    }
    if (runtimeLogResult.unavailableRoomCount > 0) {
      // eslint-disable-next-line no-console
      console.warn(`[room-server] RuntimeLog recovery unavailable for ${runtimeLogResult.unavailableRoomCount} live room(s).`);
    }
  });
};

if (serverRuntimeConfig.lanAlpha?.enabled && serverRuntimeConfig.lanAlpha.bindHost !== '0.0.0.0') {
  httpServer.listen(PORT, serverRuntimeConfig.lanAlpha.bindHost, onServerListening);
} else {
  // The Node default listener remains dual-stack on supported hosts while still
  // exposing LAN interfaces. This keeps localhost health checks working too.
  httpServer.listen(PORT, onServerListening);
}
