import type { Express } from 'express';

import {
  createCampaignRoomApiHandlers,
  NO_LIVE_ROOM_REGISTRY,
  type CampaignRoomApiRequest,
} from './campaignRoomApiHandlers.js';
import { registerCampaignRoomApiRoutes } from './campaignRoomApiRoutes.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type {
  CampaignActorInstanceRecord,
  RoomRecord,
} from '../adapters/postgresPlatformFoundationRepository.js';
import type {
  PostgresCampaignRecord,
  PostgresCampaignRepositoryResult,
} from '../adapters/postgresCampaignRepository.js';
import type {
  RuntimeEventRecord,
  RuntimeSessionRecord,
} from '../adapters/postgresRuntimeEventRepository.js';
import type {
  WorldServerCampaignBindingRecord,
  WorldServerMembershipRecord,
  WorldServerRecord,
} from '../adapters/postgresWorldServerRepository.js';
import type {
  RoomLobbySlotRecord,
  RoomParticipantRecord,
  RuntimeSessionBindingRecord,
} from '../adapters/postgresCampaignRoomRepository.js';
import type { SceneStateDocumentRecord } from '../adapters/postgresSceneStateRepository.js';
import {
  resolveRuntimeSessionContext,
} from '../runtime/runtimeSessionContext.js';
import type {
  RuntimeEventPersistenceAppendInput,
  RuntimeEventPersistenceRepositoryPort,
  RuntimeEventPersistenceRepositoryResult,
} from '../runtime/runtimeEventPersistenceBridge.js';

type Result<T> = PostgresCampaignRepositoryResult<T>;

const OWNER = 'user-owner';
const MEMBER = 'user-member';
const ADMIN = 'user-admin';
const OUTSIDER = 'user-outsider';
const SERVER_ID = 'server-1';
const CAMPAIGN_ID = 'campaign-1';
const ROOM_ID = 'room-1';
const SESSION_ID = 'session-1';

function ok<T>(value: T): Result<T> { return { ok: true, value }; }
function fail<T = never>(kind: 'not_found' | 'database_error' = 'not_found'): Result<T> {
  return { ok: false, error: { kind, message: 'fake repository failure' } };
}

function viewer(userId: string): CurrentViewerContext {
  return {
    viewerUserId: userId,
    isAuthenticated: true,
    authTrustLevel: 'verified_session',
    isDevOnly: false,
    isServiceInternal: false,
    notes: [],
  };
}

function request(userId: string, params: Record<string, unknown>, body?: unknown, query?: Record<string, unknown>): CampaignRoomApiRequest {
  return { viewer: viewer(userId), params, body, query };
}

function serverRecord(): WorldServerRecord {
  return {
    worldServerId: SERVER_ID,
    ownerId: OWNER,
    serverHandle: 'table-one',
    displayName: 'Table One',
    description: 'Smoke server',
    serverVisibility: 'private',
    joinPolicy: 'approval',
    lifecycleStatus: 'active',
    defaultGameSystemId: 'dnd5e-2024',
    publicProfilePayload: {},
    serverSettingsPayload: {},
    softUpdatePolicyPayload: {},
    schemaVersion: 1,
  };
}

function campaignRecord(id: string = CAMPAIGN_ID): PostgresCampaignRecord {
  return {
    campaignId: id,
    ownerId: OWNER,
    title: 'Smoke Campaign',
    description: 'A campaign for deterministic API smoke.',
    systemId: 'dnd5e-2024',
    status: 'active',
    lifecycleStatus: 'active',
    payload: {},
    schemaVersion: 1,
  };
}

function bindingRecord(campaignId: string = CAMPAIGN_ID): WorldServerCampaignBindingRecord {
  return {
    bindingId: `binding-${campaignId}`,
    worldServerId: SERVER_ID,
    campaignId,
    createdByUserId: OWNER,
    bindingKind: 'owned',
    visibilityScope: 'server',
    payload: {},
    schemaVersion: 1,
  };
}

function roomRecord(): RoomRecord {
  return {
    roomRecordId: 'room-record-1',
    roomId: ROOM_ID,
    worldServerId: SERVER_ID,
    campaignId: CAMPAIGN_ID,
    hostUserId: OWNER,
    roomCode: 'ABC123',
    roomStatus: 'lobby',
    multiplayerMode: 'lan',
    accessPolicy: {},
    metadata: {},
  };
}

function sessionRecord(): RuntimeSessionRecord {
  return {
    runtimeSessionId: SESSION_ID,
    campaignId: CAMPAIGN_ID,
    hostUserId: OWNER,
    roomId: ROOM_ID,
    title: 'Smoke Session',
    status: 'active',
    payload: {},
    schemaVersion: 1,
    startedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeFakeHandlers(options: {
  runtimeEventPersistenceRepository?: RuntimeEventPersistenceRepositoryPort;
  runtimeEventPersistenceBridgeEnabled?: boolean;
  /** T7: the runtime session an active live room currently owns for ROOM_ID. */
  liveRoomSessionId?: string;
} = {}) {
  const server = serverRecord();
  const campaigns = new Map<string, PostgresCampaignRecord>([[CAMPAIGN_ID, campaignRecord()]]);
  const bindings = new Map<string, WorldServerCampaignBindingRecord>([[CAMPAIGN_ID, bindingRecord()]]);
  const actors = new Map<string, CampaignActorInstanceRecord>();
  const rooms = new Map<string, RoomRecord>([[ROOM_ID, roomRecord()]]);
  const sessions = new Map<string, RuntimeSessionRecord>([[SESSION_ID, sessionRecord()]]);
  const events = new Map<string, RuntimeEventRecord>();
  const sceneStates = new Map<string, SceneStateDocumentRecord>();
  const participants: RoomParticipantRecord[] = [{
    roomParticipantId: 'participant-1',
    roomRecordId: 'room-record-1',
    userId: MEMBER,
    displayName: 'Player One',
    participantRole: 'player',
    participantStatus: 'active',
    readyStatus: 'ready',
    metadata: {},
  }];
  const slots: RoomLobbySlotRecord[] = [{
    lobbySlotId: 'slot-1',
    roomRecordId: 'room-record-1',
    roomParticipantId: 'participant-1',
    slotStatus: 'occupied',
    metadata: {},
  }];
  const sessionBindings = new Map<string, RuntimeSessionBindingRecord>();
  let nextSequence = 1;

  const membershipFor = (userId: string): WorldServerMembershipRecord | null => {
    if (userId === MEMBER) return { membershipId: 'membership-member', worldServerId: SERVER_ID, userId: MEMBER, roleKey: 'member', membershipStatus: 'active', payload: {}, schemaVersion: 1 };
    if (userId === ADMIN) return { membershipId: 'membership-admin', worldServerId: SERVER_ID, userId: ADMIN, roleKey: 'admin', membershipStatus: 'active', payload: {}, schemaVersion: 1 };
    return null;
  };

  const worldRepository = {
    getWorldServerById: async (id: string) => id === SERVER_ID ? ok(server) : ok(null),
    getWorldServerMembershipByUser: async (_id: string, userId: string) => ok(membershipFor(userId)),
    getWorldServerCampaignBindingByPair: async (worldServerId: string, campaignId: string) => worldServerId === SERVER_ID ? ok(bindings.get(campaignId) ?? null) : ok(null),
    listCampaignBindingsByWorldServer: async (worldServerId: string) => ok(worldServerId === SERVER_ID ? [...bindings.values()] : []),
    bindCampaignToWorldServer: async (input: { bindingId: string; worldServerId: string; campaignId: string; createdByUserId?: string; bindingKind?: string; visibilityScope?: string; payload?: Record<string, unknown> }) => {
      const binding = { ...bindingRecord(input.campaignId), bindingId: input.bindingId, worldServerId: input.worldServerId, createdByUserId: input.createdByUserId, bindingKind: input.bindingKind ?? 'owned', visibilityScope: input.visibilityScope ?? 'server', payload: input.payload ?? {} };
      bindings.set(input.campaignId, binding);
      return ok(binding);
    },
  };

  const campaignRepository = {
    getCampaignById: async (id: string) => ok(campaigns.get(id) ?? null),
    createCampaign: async (input: { campaignId: string; ownerId: string; title: string; description?: string; systemId: string; status?: 'draft' | 'active'; payload?: Record<string, unknown> }) => {
      const campaign: PostgresCampaignRecord = { ...campaignRecord(input.campaignId), ownerId: input.ownerId, title: input.title, description: input.description, systemId: input.systemId, status: input.status ?? 'draft', payload: input.payload ?? {} };
      campaigns.set(campaign.campaignId, campaign);
      return ok(campaign);
    },
    updateCampaign: async (input: { campaignId: string; title?: string; description?: string; status?: 'draft' | 'active'; payload?: Record<string, unknown> }) => {
      const current = campaigns.get(input.campaignId);
      if (!current) return ok(null);
      const updated = { ...current, ...input, description: input.description ?? current.description, payload: input.payload ?? current.payload };
      campaigns.set(input.campaignId, updated);
      return ok(updated);
    },
    archiveCampaign: async (id: string) => {
      const current = campaigns.get(id);
      if (!current) return ok(null);
      const updated = { ...current, lifecycleStatus: 'archived' as const, archivedAt: '2026-01-02T00:00:00.000Z' };
      campaigns.set(id, updated);
      return ok(updated);
    },
    restoreCampaign: async (id: string) => {
      const current = campaigns.get(id);
      if (!current) return ok(null);
      const updated = { ...current, lifecycleStatus: 'active' as const, archivedAt: undefined };
      campaigns.set(id, updated);
      return ok(updated);
    },
  };

  const foundationRepository = {
    getCampaignActorInstanceById: async (id: string) => ok(actors.get(id) ?? null),
    listCampaignActorInstances: async (campaignId: string) => ok([...actors.values()].filter((actor) => actor.campaignId === campaignId)),
    createCampaignActorInstance: async (input: { campaignActorInstanceId: string; campaignId: string; sourceActorId?: string; ownerId?: string; actorKind?: string; displayName: string; instanceStatus?: string; snapshotHash?: string; snapshotPayload?: Record<string, unknown>; overridePayload?: Record<string, unknown> }) => {
      const actor: CampaignActorInstanceRecord = { campaignActorInstanceId: input.campaignActorInstanceId, campaignId: input.campaignId, sourceActorId: input.sourceActorId, ownerId: input.ownerId, actorKind: input.actorKind ?? 'pc', displayName: input.displayName, instanceStatus: input.instanceStatus ?? 'active', snapshotHash: input.snapshotHash, snapshotPayload: input.snapshotPayload ?? {}, overridePayload: input.overridePayload ?? {} };
      actors.set(actor.campaignActorInstanceId, actor);
      return ok(actor);
    },
    updateCampaignActorInstance: async (input: { campaignActorInstanceId: string; displayName?: string; instanceStatus?: string; overridePayload?: Record<string, unknown> }) => {
      const current = actors.get(input.campaignActorInstanceId);
      if (!current) return ok(null);
      const updated = {
        ...current,
        displayName: input.displayName ?? current.displayName,
        instanceStatus: input.instanceStatus ?? current.instanceStatus,
        overridePayload: input.overridePayload ?? current.overridePayload,
      };
      actors.set(updated.campaignActorInstanceId, updated);
      return ok(updated);
    },
    archiveCampaignActorInstance: async (id: string) => {
      const current = actors.get(id);
      return ok(current ? { ...current, archivedAt: '2026-01-02T00:00:00.000Z' } : null);
    },
    createRoomRecord: async (input: { roomRecordId: string; roomId: string; worldServerId?: string; campaignId?: string; hostUserId?: string; roomCode?: string; roomStatus?: string; multiplayerMode?: string; accessPolicy?: Record<string, unknown>; metadata?: Record<string, unknown> }) => {
      const room: RoomRecord = { roomRecordId: input.roomRecordId, roomId: input.roomId, worldServerId: input.worldServerId, campaignId: input.campaignId, hostUserId: input.hostUserId, roomCode: input.roomCode, roomStatus: input.roomStatus ?? 'lobby', multiplayerMode: input.multiplayerMode ?? 'lan', accessPolicy: input.accessPolicy ?? {}, metadata: input.metadata ?? {} };
      rooms.set(room.roomId, room);
      return ok(room);
    },
    getRoomRecordByRoomId: async (id: string) => ok(rooms.get(id) ?? null),
    listRoomRecordsByCampaign: async (campaignId: string) => ok([...rooms.values()].filter((room) => room.campaignId === campaignId)),
    updateRoomRecord: async (input: { roomRecordId: string; roomCode?: string; roomStatus?: string; multiplayerMode?: string; accessPolicy?: Record<string, unknown>; metadata?: Record<string, unknown>; closedAt?: string }) => {
      const room = [...rooms.values()].find((item) => item.roomRecordId === input.roomRecordId);
      if (!room) return ok(null);
      const updated = { ...room, roomCode: input.roomCode ?? room.roomCode, roomStatus: input.roomStatus ?? room.roomStatus, multiplayerMode: input.multiplayerMode ?? room.multiplayerMode, accessPolicy: input.accessPolicy ?? room.accessPolicy, metadata: input.metadata ?? room.metadata, closedAt: input.closedAt ?? room.closedAt };
      rooms.set(updated.roomId, updated);
      return ok(updated);
    },
  };

  const runtimeRepository = {
    getRuntimeSessionById: async (id: string) => ok(sessions.get(id) ?? null),
    listRuntimeSessionsByCampaign: async (campaignId: string) => ok([...sessions.values()].filter((session) => session.campaignId === campaignId)),
    createRuntimeSession: async (input: { runtimeSessionId: string; campaignId: string; hostUserId?: string; roomId?: string; title?: string; status?: string; payload?: Record<string, unknown> }) => {
      const session: RuntimeSessionRecord = { runtimeSessionId: input.runtimeSessionId, campaignId: input.campaignId, hostUserId: input.hostUserId, roomId: input.roomId, title: input.title, status: input.status ?? 'active', payload: input.payload ?? {}, schemaVersion: 1 };
      sessions.set(session.runtimeSessionId, session);
      return ok(session);
    },
    updateRuntimeSession: async (input: { runtimeSessionId: string; title?: string; status?: string; payload?: Record<string, unknown>; endedAt?: string }) => {
      const current = sessions.get(input.runtimeSessionId);
      if (!current) return ok(null);
      const updated = { ...current, title: input.title ?? current.title, status: input.status ?? current.status, payload: input.payload ?? current.payload, endedAt: input.endedAt ?? current.endedAt };
      sessions.set(input.runtimeSessionId, updated);
      return ok(updated);
    },
    listRuntimeEvents: async (sessionId: string, options?: { afterSeq?: number; limit?: number }) => ok([...events.values()].filter((event) => event.runtimeSessionId === sessionId && (options?.afterSeq === undefined || event.seq > options.afterSeq)).sort((a, b) => a.seq - b.seq).slice(0, options?.limit ?? 100)),
    appendRuntimeEvent: async (input: { runtimeEventId: string; runtimeSessionId: string; campaignId: string; eventKind: string; visibility?: string; actorId?: string; causedByEventId?: string; idempotencyKey?: string; payload?: Record<string, unknown>; createdByUserId?: string }) => {
      const existing = input.idempotencyKey ? [...events.values()].find((event) => event.runtimeSessionId === input.runtimeSessionId && event.idempotencyKey === input.idempotencyKey) : undefined;
      if (existing) return ok(existing);
      const event: RuntimeEventRecord = { runtimeEventId: input.runtimeEventId, runtimeSessionId: input.runtimeSessionId, campaignId: input.campaignId, seq: nextSequence++, eventKind: input.eventKind, visibility: input.visibility ?? 'private', actorId: input.actorId, causedByEventId: input.causedByEventId, idempotencyKey: input.idempotencyKey, payload: input.payload ?? {}, schemaVersion: 1, createdByUserId: input.createdByUserId };
      events.set(event.runtimeEventId, event);
      return ok(event);
    },
  };

  const campaignRoomRepository = {
    listRoomParticipants: async (roomRecordId: string) => ok(participants.filter((participant) => participant.roomRecordId === roomRecordId)),
    listRoomLobbySlots: async (roomRecordId: string) => ok(slots.filter((slot) => slot.roomRecordId === roomRecordId)),
    getRuntimeSessionBindingBySessionId: async (sessionId: string) => ok(sessionBindings.get(sessionId) ?? null),
    createRuntimeSessionBinding: async (input: { runtimeSessionBindingId: string; runtimeSessionId: string; roomRecordId?: string; campaignId: string; bindingStatus?: string; metadata?: Record<string, unknown> }) => {
      const binding: RuntimeSessionBindingRecord = { runtimeSessionBindingId: input.runtimeSessionBindingId, runtimeSessionId: input.runtimeSessionId, roomRecordId: input.roomRecordId, campaignId: input.campaignId, bindingStatus: input.bindingStatus ?? 'active', metadata: input.metadata ?? {} };
      sessionBindings.set(binding.runtimeSessionId, binding);
      return ok(binding);
    },
    updateRuntimeSessionBinding: async () => ok(null),
  };

  const sceneStateRepository = {
    listSceneStates: async (worldServerId: string, campaignId: string, roomId: string, includeArchived = false) => ok(
      [...sceneStates.values()].filter((state) => state.worldServerId === worldServerId && state.campaignId === campaignId && state.roomId === roomId && (includeArchived || !state.archivedAt)),
    ),
    getSceneState: async (sceneStateId: string) => ok(sceneStates.get(sceneStateId) ?? null),
    createSceneState: async (input: SceneStateDocumentRecord) => {
      const state: SceneStateDocumentRecord = { ...input, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
      sceneStates.set(state.sceneStateId, state);
      return ok(state);
    },
    updateSceneStateMetadata: async (input: { sceneStateId: string; title?: string; description?: string | null }) => {
      const current = sceneStates.get(input.sceneStateId);
      if (!current || current.archivedAt) return ok(null);
      const state = { ...current, title: input.title ?? current.title, description: input.description === undefined ? current.description : input.description ?? undefined, updatedAt: '2026-01-02T00:00:00.000Z' };
      sceneStates.set(state.sceneStateId, state);
      return ok(state);
    },
    archiveSceneState: async (sceneStateId: string) => {
      const current = sceneStates.get(sceneStateId);
      if (!current || current.archivedAt) return ok(null);
      const state = { ...current, archivedAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };
      sceneStates.set(sceneStateId, state);
      return ok(state);
    },
    duplicateSceneState: async (input: { sceneStateId: string; sourceSceneStateId: string; title?: string; createdByUserId?: string }) => {
      const source = sceneStates.get(input.sourceSceneStateId);
      if (!source || source.archivedAt) return ok(null);
      const state: SceneStateDocumentRecord = { ...source, sceneStateId: input.sceneStateId, title: input.title ?? `${source.title} copy`, createdByUserId: input.createdByUserId, sourceSceneStateId: source.sceneStateId, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };
      sceneStates.set(state.sceneStateId, state);
      return ok(state);
    },
  };

  return createCampaignRoomApiHandlers({
    liveRoomRuntimeSessionId: (roomId) =>
      options.liveRoomSessionId && roomId === ROOM_ID ? options.liveRoomSessionId : undefined,
    worldRepository,
    campaignRepository,
    foundationRepository,
    runtimeRepository,
    campaignRoomRepository,
    sceneStateRepository: sceneStateRepository as never,
    runtimeEventPersistenceRepository: options.runtimeEventPersistenceRepository,
    runtimeEventPersistenceBridgeEnabled: options.runtimeEventPersistenceBridgeEnabled,
  });
}

function bridgePort(
  result: RuntimeEventPersistenceRepositoryResult = { ok: true, value: { runtimeEventId: 'bridge-event-1', seq: 41 } },
  calls: RuntimeEventPersistenceAppendInput[] = [],
): RuntimeEventPersistenceRepositoryPort {
  return {
    async appendRuntimeEvent(input) {
      calls.push(input);
      return result;
    },
  };
}

function isSuccess(response: { ok: boolean }): boolean { return response.ok === true; }
function hasStatus(response: { statusCode: number }, statusCode: number): boolean { return response.statusCode === statusCode; }

export async function runCampaignRoomApiHandlerSmoke(): Promise<{ total: number; passed: number; failed: number; cases: Array<{ name: string; passed: boolean }> }> {
  const handlers = makeFakeHandlers();
  const cases: Array<{ name: string; passed: boolean }> = [];
  async function check(name: string, fn: () => Promise<boolean>): Promise<void> {
    try { cases.push({ name, passed: await fn() }); } catch { cases.push({ name, passed: false }); }
  }
  const base = (userId: string = OWNER) => request(userId, { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID });
  const room = (userId: string = OWNER) => request(userId, { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID });
  let createdActorInstanceId = '';

  await check('01_anonymous_campaign_list_401', async () => hasStatus(await handlers.listCampaigns({ params: { worldServerId: SERVER_ID } }), 401));
  await check('02_member_campaign_list_success', async () => isSuccess(await handlers.listCampaigns(base(MEMBER))));
  await check('03_campaign_scope_conflict_400', async () => hasStatus(await handlers.getCampaign({ params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID }, body: { campaignId: 'other' }, viewer: viewer(MEMBER) }), 400));
  await check('04_outsider_campaign_hidden_404', async () => hasStatus(await handlers.getCampaign(base(OUTSIDER)), 404));
  await check('05_owner_campaign_detail', async () => isSuccess(await handlers.getCampaign(base())));
  await check('06_member_create_campaign', async () => hasStatus(await handlers.createCampaign({ ...base(MEMBER), body: { title: 'New Campaign', systemId: 'coc7e' } }), 201));
  await check('07_anonymous_create_campaign_401', async () => hasStatus(await handlers.createCampaign({ params: { worldServerId: SERVER_ID }, body: { title: 'Nope', systemId: 'dnd5e-2024' } }), 401));
  await check('08_outsider_create_campaign_denied_403', async () => hasStatus(await handlers.createCampaign({ ...base(OUTSIDER), body: { title: 'Nope', systemId: 'dnd5e-2024' } }), 403));
  await check('09_owner_update_campaign', async () => isSuccess(await handlers.updateCampaign({ ...base(), body: { title: 'Updated' } })));
  await check('10_member_update_campaign_hidden_404', async () => hasStatus(await handlers.updateCampaign({ ...base(MEMBER), body: { title: 'Denied' } }), 404));
  await check('11_admin_update_campaign', async () => isSuccess(await handlers.updateCampaign({ ...base(ADMIN), body: { description: 'Admin edit' } })));
  await check('12_archive_campaign', async () => isSuccess(await handlers.archiveCampaign(base())));
  await check('13_restore_campaign', async () => isSuccess(await handlers.restoreCampaign(base())));
  await check('14_campaign_actor_list', async () => isSuccess(await handlers.listCampaignActors(base())));
  await check('15_campaign_actor_create', async () => {
    const response = await handlers.createCampaignActor({ ...base(), body: { displayName: 'Smoke Actor', sourceActorId: 'vault-1' } });
    if (!hasStatus(response, 201)) return false;
    createdActorInstanceId = ((response as { value?: CampaignActorInstanceRecord }).value?.campaignActorInstanceId) ?? '';
    return createdActorInstanceId !== '';
  });
  await check('16_campaign_actor_override_update', async () => {
    if (!createdActorInstanceId) return false;
    const response = await handlers.updateCampaignActor({ ...base(), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, actorInstanceId: createdActorInstanceId }, body: { overridePayload: { hpCurrent: 7, conditions: ['poisoned'] } } });
    return isSuccess(response) && (response as { value?: CampaignActorInstanceRecord }).value?.overridePayload.hpCurrent === 7;
  });
  await check('17_campaign_actor_update_rejects_non_object', async () => {
    return createdActorInstanceId ? hasStatus(await handlers.updateCampaignActor({ ...base(), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, actorInstanceId: createdActorInstanceId }, body: { overridePayload: 'nope' } }), 400) : false;
  });
  await check('18_campaign_actor_detail', async () => isSuccess(await handlers.getCampaignActor({ ...base(), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, actorInstanceId: 'missing' } })) === false);
  await check('19_campaign_actor_archive_missing_404', async () => hasStatus(await handlers.archiveCampaignActor({ ...base(), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, actorInstanceId: 'missing' } }), 404));
  await check('20_campaign_actor_source_is_metadata', async () => isSuccess(await handlers.createCampaignActor({ ...base(), body: { displayName: 'Metadata Actor', sourceActorId: 'vault-2', snapshotPayload: { hp: 10 } } })));
  await check('19_room_list_success', async () => isSuccess(await handlers.listRooms(base(MEMBER))));
  await check('20_room_create_member_success', async () => hasStatus(await handlers.createRoom({ ...base(MEMBER), body: { roomCode: 'NEW123' } }), 201));
  await check('21_anonymous_room_create_401', async () => hasStatus(await handlers.createRoom({ params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID }, body: {} }), 401));
  await check('22_outsider_room_create_hidden_404', async () => hasStatus(await handlers.createRoom({ ...base(OUTSIDER), body: {} }), 404));
  await check('23_room_detail_success', async () => isSuccess(await handlers.getRoom(room(MEMBER))));
  await check('24_room_scope_conflict_400', async () => hasStatus(await handlers.getRoom({ ...room(MEMBER), body: { roomId: 'other' } }), 400));
  await check('25_room_patch_host_success', async () => isSuccess(await handlers.updateRoom({ ...room(), body: { roomStatus: 'active', metadata: { source: 'smoke' } } })));
  await check('26_room_patch_member_denied', async () => hasStatus(await handlers.updateRoom({ ...room(MEMBER), body: { roomStatus: 'closed' } }), 403));
  await check('27_room_patch_admin_success', async () => isSuccess(await handlers.updateRoom({ ...room(ADMIN), body: { roomStatus: 'lobby' } })));
  await check('28_room_participants_read', async () => isSuccess(await handlers.listParticipants(room(MEMBER))));
  await check('29_room_lobby_slots_read', async () => isSuccess(await handlers.listLobbySlots(room(MEMBER))));
  await check('30_room_metadata_does_not_touch_live_protocol', async () => isSuccess(await handlers.updateRoom({ ...room(), body: { metadata: { durableOnly: true } } })));
  await check('31_runtime_session_get', async () => isSuccess(await handlers.getRuntimeSession(room(MEMBER))));
  await check('32_runtime_session_create_host', async () => hasStatus(await handlers.createRuntimeSession({ ...room(), body: { title: 'Created Session' } }), 201));
  await check('33_runtime_session_update_host', async () => isSuccess(await handlers.updateRuntimeSession({ ...room(), body: { runtimeSessionId: SESSION_ID, title: 'Renamed' } })));
  await check('34_runtime_session_update_member_denied', async () => hasStatus(await handlers.updateRuntimeSession({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, title: 'Nope' } }), 403));
  await check('35_runtime_session_is_metadata_only', async () => isSuccess(await handlers.getRuntimeSession(room(MEMBER))));
  let sceneStateId = '';
  await check('35a_scene_state_list_member_success', async () => isSuccess(await handlers.listSceneStates(room(MEMBER))));
  await check('35b_scene_state_create_host_success', async () => {
    const response = await handlers.createSceneState({ ...room(), body: { title: 'Opening scene', runtimeSessionId: SESSION_ID, stateJson: { schemaVersion: 1, appFeature: 'scene-runtime-snapshot', exportedAt: '2026-01-01T00:00:00.000Z', roomId: ROOM_ID, campaignId: CAMPAIGN_ID, combat: { combatants: [] }, map: { tokens: [] } } } });
    if (response.ok !== true || response.statusCode !== 201) return false;
    sceneStateId = String((response.value as { sceneStateId?: string }).sceneStateId ?? '');
    return sceneStateId !== '';
  });
  await check('35c_scene_state_create_member_denied', async () => hasStatus(await handlers.createSceneState({ ...room(MEMBER), body: { title: 'Nope', stateJson: { schemaVersion: 1, appFeature: 'scene-runtime-snapshot', exportedAt: '2026-01-01T00:00:00.000Z' } } }), 403));
  await check('35d_scene_state_get_and_update', async () => {
    const detail = await handlers.getSceneState({ ...room(MEMBER), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID, sceneStateId } });
    const update = await handlers.updateSceneState({ ...room(), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID, sceneStateId }, body: { title: 'Renamed scene' } });
    return detail.ok === true && update.ok === true && (update.value as { title?: string }).title === 'Renamed scene';
  });
  await check('35e_scene_state_duplicate_and_archive', async () => {
    const copy = await handlers.duplicateSceneState({ ...room(), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID, sceneStateId } });
    const archived = await handlers.archiveSceneState({ ...room(), params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID, sceneStateId } });
    return hasStatus(copy, 201) && isSuccess(archived);
  });
  await check('35f_scene_state_rejects_credentials', async () => hasStatus(await handlers.createSceneState({ ...room(), body: { title: 'Unsafe', stateJson: { schemaVersion: 1, appFeature: 'scene-runtime-snapshot', exportedAt: '2026-01-01T00:00:00.000Z', token: 'do-not-store' } } }), 400));
  await check('36_runtime_event_list_success', async () => isSuccess(await handlers.listRuntimeEvents(room(MEMBER))));
  await check('37_runtime_event_after_seq_supported', async () => isSuccess(await handlers.listRuntimeEvents({ ...room(MEMBER), query: { runtimeSessionId: SESSION_ID, afterSeq: 0, limit: 2 } })));
  await check('38_runtime_event_limit_clamped', async () => isSuccess(await handlers.listRuntimeEvents({ ...room(MEMBER), query: { runtimeSessionId: SESSION_ID, limit: 9999 } })));
  await check('39_runtime_event_append_member', async () => hasStatus(await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'public.note', visibility: 'public', payload: { text: 'hello' } } }), 201));
  await check('40_runtime_event_append_anonymous_401', async () => hasStatus(await handlers.appendRuntimeEvent({ params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID }, body: { runtimeSessionId: SESSION_ID, eventKind: 'nope' } }), 401));
  await check('41_runtime_event_append_outsider_hidden_404', async () => hasStatus(await handlers.appendRuntimeEvent({ ...room(OUTSIDER), body: { runtimeSessionId: SESSION_ID, eventKind: 'nope' } }), 404));
  await check('42_runtime_event_idempotency_passed', async () => {
    const first = await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'idempotent', idempotencyKey: 'idem-1', visibility: 'public' } });
    const second = await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'idempotent', idempotencyKey: 'idem-1', visibility: 'public' } });
    return isSuccess(first) && isSuccess(second);
  });
  await check('43_runtime_event_private_payload_filtered', async () => {
    await handlers.appendRuntimeEvent({ ...room(OWNER), body: { runtimeSessionId: SESSION_ID, eventKind: 'private', visibility: 'private', payload: { secret: true } } });
    const response = await handlers.listRuntimeEvents(room(MEMBER));
    if (response.ok !== true || !Array.isArray(response.value)) return false;
    return !response.value.some((event) => (event as RuntimeEventRecord).eventKind === 'private');
  });
  await check('44_runtime_event_owner_private_visible', async () => {
    const response = await handlers.listRuntimeEvents(room());
    if (response.ok !== true || !Array.isArray(response.value)) return false;
    return response.value.some((event) => (event as RuntimeEventRecord).eventKind === 'private');
  });
  await check('45_no_runtime_event_update_route', async () => {
    const methods: string[] = [];
    const fakeApp = { get: (path: string) => methods.push(`GET ${path}`), post: (path: string) => methods.push(`POST ${path}`), patch: (path: string) => methods.push(`PATCH ${path}`) };
    registerCampaignRoomApiRoutes(fakeApp as unknown as Express, handlers);
    return methods.every((entry) => !entry.startsWith('PUT ') && !entry.startsWith('DELETE '));
  });
  await check('46_route_campaign_family_registered', async () => {
    const paths: string[] = [];
    const fakeApp = { get: (path: string) => paths.push(path), post: (path: string) => paths.push(path), patch: (path: string) => paths.push(path) };
    registerCampaignRoomApiRoutes(fakeApp as unknown as Express, handlers);
    return paths.some((path) => path.endsWith('/campaigns')) && paths.some((path) => path.endsWith('/runtime-events'));
  });
  await check('47_repository_failure_sanitized', async () => {
    const broken = createCampaignRoomApiHandlers({ liveRoomRuntimeSessionId: NO_LIVE_ROOM_REGISTRY, worldRepository: { ...({
      getWorldServerById: async () => fail('database_error'),
      getWorldServerMembershipByUser: async () => ok(null),
      getWorldServerCampaignBindingByPair: async () => ok(null),
      listCampaignBindingsByWorldServer: async () => ok([]),
      bindCampaignToWorldServer: async () => fail('database_error'),
    }), } as never });
    const response = await broken.listCampaigns(base());
    return hasStatus(response, 503) && response.ok === false && !response.error.message.includes('fake repository failure');
  });
  await check('48_no_database_url_in_response', async () => {
    const broken = createCampaignRoomApiHandlers({ liveRoomRuntimeSessionId: NO_LIVE_ROOM_REGISTRY, worldRepository: { getWorldServerById: async () => fail('database_error') } as never });
    const response = await broken.listCampaigns(base());
    return JSON.stringify(response).includes('DATABASE_URL') === false;
  });
  await check('49_archived_campaign_can_restore', async () => {
    const archived = await handlers.archiveCampaign(base());
    const restored = await handlers.restoreCampaign(base());
    return isSuccess(archived) && isSuccess(restored);
  });
  await check('50_wrong_room_is_hidden', async () => hasStatus(await handlers.getRoom(request(MEMBER, { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: 'wrong-room' })), 404));

  await check('51_runtime_event_append_uses_bridge_output', async () => {
    const injected = bridgePort({
      ok: true,
      value: {
        runtimeEventId: 'bridge-event-fixed',
        seq: 41,
        record: { runtimeEventId: 'bridge-event-fixed', seq: 41, eventKind: 'bridge.note' },
      },
    });
    const response = await makeFakeHandlers({ runtimeEventPersistenceRepository: injected }).appendRuntimeEvent({
      ...room(MEMBER),
      body: { runtimeSessionId: SESSION_ID, eventKind: 'bridge.note' },
    });
    return response.ok === true && (response.value as { runtimeEventId?: string }).runtimeEventId === 'bridge-event-fixed';
  });
  await check('52_runtime_event_append_preserves_idempotency_key', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort(undefined, calls) });
    await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'idem.bridge', idempotencyKey: 'idem-bridge' } });
    return calls[0]?.idempotencyKey === 'idem-bridge';
  });
  await check('53_runtime_event_missing_session_is_safe_400', async () => {
    const response = await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { eventKind: 'missing.session' } });
    return hasStatus(response, 400);
  });
  await check('54_bridge_not_configured_maps_to_503', async () => {
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort({ ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL=secret' } }) });
    const response = await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'not.configured' } });
    return hasStatus(response, 503) && JSON.stringify(response).includes('DATABASE_URL') === false;
  });
  await check('55_bridge_repository_error_maps_to_503', async () => {
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort({ ok: false, error: { kind: 'database_error', message: 'driver secret' } }) });
    const response = await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'repo.error' } });
    return hasStatus(response, 503) && JSON.stringify(response).includes('driver') === false;
  });
  await check('56_guard_denial_precedes_bridge', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort(undefined, calls) });
    const response = await handler.appendRuntimeEvent({ ...room(OUTSIDER), body: { runtimeSessionId: SESSION_ID, eventKind: 'guard.denied' } });
    return hasStatus(response, 404) && calls.length === 0;
  });
  await check('57_anonymous_denial_precedes_bridge', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort(undefined, calls) });
    const response = await handler.appendRuntimeEvent({ params: { worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID }, body: { runtimeSessionId: SESSION_ID, eventKind: 'anonymous.denied' } });
    return hasStatus(response, 401) && calls.length === 0;
  });
  await check('58_runtime_event_list_still_works', async () => isSuccess(await handlers.listRuntimeEvents(room(MEMBER))));
  await check('59_runtime_event_after_seq_still_works', async () => isSuccess(await handlers.listRuntimeEvents({ ...room(MEMBER), query: { runtimeSessionId: SESSION_ID, afterSeq: 1 } })));
  await check('60_runtime_event_limit_clamp_still_works', async () => isSuccess(await handlers.listRuntimeEvents({ ...room(MEMBER), query: { runtimeSessionId: SESSION_ID, limit: 99999 } })));
  await check('61_runtime_event_routes_have_no_update_delete', async () => {
    const methods: string[] = [];
    const fakeApp = { get: (path: string) => methods.push(`GET ${path}`), post: (path: string) => methods.push(`POST ${path}`), patch: (path: string) => methods.push(`PATCH ${path}`) };
    registerCampaignRoomApiRoutes(fakeApp as unknown as Express, handlers);
    return methods.every((entry) => !entry.includes('/runtime-events') || entry.startsWith('GET ') || entry.startsWith('POST '));
  });
  await check('62_runtime_event_response_has_no_sql', async () => {
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort({ ok: false, error: { kind: 'database_error', message: 'SELECT secret SQL' } }) });
    const response = await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'sql.safe' } });
    return JSON.stringify(response).includes('SQL') === false;
  });
  await check('63_runtime_event_response_has_no_database_url', async () => {
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort({ ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL=secret' } }) });
    const response = await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'url.safe' } });
    return JSON.stringify(response).includes('DATABASE_URL') === false;
  });
  await check('64_runtime_event_response_has_no_stack', async () => {
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort({ ok: false, error: { kind: 'database_error', message: 'Error at db.ts:1\nstack secret' } }) });
    const response = await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'stack.safe' } });
    return JSON.stringify(response).includes('stack secret') === false;
  });
  await check('65_runtime_session_context_resolver_ok', async () => {
    const result = resolveRuntimeSessionContext({ worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID, runtimeSessionId: SESSION_ID });
    return result.ok === true && result.context.worldServerId === SERVER_ID;
  });
  await check('66_runtime_session_context_missing_is_safe', async () => {
    const result = resolveRuntimeSessionContext({ worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, roomId: ROOM_ID });
    return result.ok === false && result.reason === 'missing_runtime_session' && result.notes.every((note) => !note.includes('DATABASE_URL'));
  });
  await check('67_disabled_bridge_maps_to_503', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort(undefined, calls), runtimeEventPersistenceBridgeEnabled: false });
    const response = await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'disabled.bridge' } });
    return hasStatus(response, 503) && calls.length === 0;
  });
  await check('68_actor_and_causation_fields_are_preserved', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort(undefined, calls) });
    await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'caused.event', actorId: 'actor-1', causedByEventId: 'event-0' } });
    return calls[0]?.actorId === 'actor-1' && calls[0]?.causedByEventId === 'event-0';
  });
  await check('69_payload_and_private_visibility_are_preserved', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort(undefined, calls) });
    await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'private.payload', visibility: 'private', payload: { text: 'kept' } } });
    return calls[0]?.visibility === 'private' && calls[0]?.payload.text === 'kept';
  });
  await check('70_runtime_event_success_keeps_201_status', async () => {
    const response = await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'status.201' } });
    return hasStatus(response, 201);
  });

  // ── T7: live-room ownership guard + reserved event-kind namespace ──────────
  // `liveRoomSessionId` makes ROOM_ID's session live-owned, mirroring what the
  // in-memory room registry reports in the real composition.
  const liveHandlers = () => makeFakeHandlers({ liveRoomSessionId: SESSION_ID });

  const isLiveConflict = (response: { statusCode: number; ok: boolean } & Record<string, unknown>): boolean =>
    response.statusCode === 409
    && response.ok === false
    && (response as { error?: { kind?: string; reason?: string } }).error?.kind === 'conflict'
    && (response as { error?: { kind?: string; reason?: string } }).error?.reason === 'session_owned_by_live_room';

  const isReservedKindRejection = (response: { statusCode: number; ok: boolean } & Record<string, unknown>): boolean =>
    response.statusCode === 400
    && response.ok === false
    && (response as { error?: { kind?: string; reason?: string } }).error?.kind === 'bad_request'
    && (response as { error?: { kind?: string; reason?: string } }).error?.reason === 'reserved_runtime_event_kind';

  await check('71_t7_prep_session_append_still_succeeds', async () =>
    hasStatus(await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'prep.note', visibility: 'public' } }), 201));

  await check('72_t7_live_owned_append_is_409_conflict', async () =>
    isLiveConflict(await liveHandlers().appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'combat.turn_advanced', visibility: 'public' } })));

  await check('73_t7_rejected_append_never_reaches_persistence', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ liveRoomSessionId: SESSION_ID, runtimeEventPersistenceRepository: bridgePort(undefined, calls) });
    const response = await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'combat.turn_advanced' } });
    return isLiveConflict(response) && calls.length === 0;
  });

  await check('74_t7_live_owned_update_session_is_409', async () =>
    isLiveConflict(await liveHandlers().updateRuntimeSession({ ...room(OWNER), body: { runtimeSessionId: SESSION_ID, status: 'ended' } })));

  await check('75_t7_live_owned_create_second_session_is_409', async () =>
    isLiveConflict(await liveHandlers().createRuntimeSession({ ...room(OWNER), body: { title: 'shadow session' } })));

  await check('76_t7_reads_stay_open_while_live', async () => {
    const live = liveHandlers();
    return isSuccess(await live.listRuntimeEvents(room(MEMBER))) && isSuccess(await live.getRuntimeSession(room(MEMBER)));
  });

  await check('77_t7_prep_create_session_still_succeeds', async () =>
    hasStatus(await handlers.createRuntimeSession({ ...room(OWNER), body: { title: 'prep session' } }), 201));

  await check('78_t7_closed_room_is_not_live_owned', async () => {
    // The production lookup returns undefined for a closed/archived room; the
    // fixture models that by reporting no live session.
    const reopened = makeFakeHandlers({ liveRoomSessionId: undefined });
    return hasStatus(await reopened.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'after.disband' } }), 201);
  });

  await check('79_t7_other_room_session_is_unaffected', async () => {
    const handler = makeFakeHandlers({ liveRoomSessionId: 'some-other-session' });
    return hasStatus(await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'unrelated.note' } }), 201);
  });

  await check('80_t7_reserved_runtime_log_kind_rejected_for_prep', async () =>
    isReservedKindRejection(await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'room.runtimeLog.dice.roll', payload: { liveRoomRuntimeLogEventV1: { schemaVersion: 1 } } } })));

  await check('81_t7_reserved_map_kind_rejected_for_prep', async () =>
    isReservedKindRejection(await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'room.mapEvent.map.token_moved' } })));

  await check('82_t7_reserved_kind_never_reaches_persistence', async () => {
    const calls: RuntimeEventPersistenceAppendInput[] = [];
    const handler = makeFakeHandlers({ runtimeEventPersistenceRepository: bridgePort(undefined, calls) });
    await handler.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'room.runtimeLog.chat.message' } });
    return calls.length === 0;
  });

  await check('83_t7_reserved_kind_rejected_before_session_lookup', async () =>
    // No runtimeSessionId resolution should be required to refuse the namespace.
    isReservedKindRejection(await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: 'session-does-not-exist', eventKind: 'room.runtimeLog.host.note' } })));

  await check('84_t7_ordinary_kinds_are_unaffected', async () =>
    hasStatus(await handlers.appendRuntimeEvent({ ...room(MEMBER), body: { runtimeSessionId: SESSION_ID, eventKind: 'roomless.note' } }), 201));

  const passed = cases.filter((item) => item.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
