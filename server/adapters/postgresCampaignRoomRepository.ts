/**
 * Campaign/Room metadata repository seam (P5.API-CAMPAIGN-ROOM).
 *
 * This adapter only reads/writes durable metadata tables introduced by the
 * existing foundation migration. It does not talk to the live Room Server,
 * WebSocket transport, runtime log broadcaster, or permission policy.
 */

import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';

export type PostgresCampaignRoomRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresCampaignRoomRepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { kind: PostgresCampaignRoomRepositoryErrorKind; message: string; retryable?: boolean } };

export interface RoomParticipantRecord {
  roomParticipantId: string;
  roomRecordId: string;
  userId?: string;
  displayName: string;
  participantRole: string;
  participantStatus: string;
  readyStatus: string;
  actorBindingId?: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  leftAt?: string;
  archivedAt?: string;
}

export interface RoomLobbySlotRecord {
  lobbySlotId: string;
  roomRecordId: string;
  roomParticipantId?: string;
  campaignActorInstanceId?: string;
  slotLabel?: string;
  slotStatus: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface RuntimeSessionBindingRecord {
  runtimeSessionBindingId: string;
  runtimeSessionId: string;
  roomRecordId?: string;
  campaignId: string;
  bindingStatus: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  archivedAt?: string;
}

export interface CreateRuntimeSessionBindingInput {
  runtimeSessionBindingId: string;
  runtimeSessionId: string;
  roomRecordId?: string;
  campaignId: string;
  bindingStatus?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateRuntimeSessionBindingInput {
  runtimeSessionBindingId: string;
  bindingStatus?: string;
  metadata?: Record<string, unknown>;
}

export interface PostgresCampaignRoomRepositoryExecutor {
  query<T extends QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<T>>;
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function toPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function limitOf(value: number | undefined, fallback = 200): number {
  return Number.isInteger(value) && (value as number) > 0 ? Math.min(value as number, 500) : fallback;
}

function mapError(error: unknown): PostgresCampaignRoomRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { ok: false, error: { kind: 'not_configured', message: 'Campaign room repository is not configured.' } };
  }
  if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Campaign room repository schema is missing.' } };
  }
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '23505') return { ok: false, error: { kind: 'conflict', message: 'Campaign room metadata already exists.' } };
  if (code === '23503') return { ok: false, error: { kind: 'conflict', message: 'Campaign room metadata references missing data.' } };
  if (code === '42P01') return { ok: false, error: { kind: 'schema_missing', message: 'Campaign room repository schema is missing.' } };
  return { ok: false, error: { kind: 'database_error', message: 'Campaign room repository query failed.', retryable: false } };
}

const PARTICIPANT_COLS = 'room_participant_id,room_record_id,user_id,display_name,participant_role,participant_status,ready_status,actor_binding_id,metadata_payload,created_at,updated_at,left_at,archived_at';
const SLOT_COLS = 'lobby_slot_id,room_record_id,room_participant_id,campaign_actor_instance_id,slot_label,slot_status,metadata_payload,created_at,updated_at,archived_at';
const BINDING_COLS = 'runtime_session_binding_id,runtime_session_id,room_record_id,campaign_id,binding_status,metadata_payload,created_at,archived_at';

function participantFromRow(row: Record<string, unknown>): RoomParticipantRecord {
  return {
    roomParticipantId: String(row.room_participant_id),
    roomRecordId: String(row.room_record_id),
    userId: row.user_id ? String(row.user_id) : undefined,
    displayName: String(row.display_name),
    participantRole: String(row.participant_role),
    participantStatus: String(row.participant_status),
    readyStatus: String(row.ready_status),
    actorBindingId: row.actor_binding_id ? String(row.actor_binding_id) : undefined,
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at as Date | string | null),
    updatedAt: toIso(row.updated_at as Date | string | null),
    leftAt: toIso(row.left_at as Date | string | null),
    archivedAt: toIso(row.archived_at as Date | string | null),
  };
}

function slotFromRow(row: Record<string, unknown>): RoomLobbySlotRecord {
  return {
    lobbySlotId: String(row.lobby_slot_id),
    roomRecordId: String(row.room_record_id),
    roomParticipantId: row.room_participant_id ? String(row.room_participant_id) : undefined,
    campaignActorInstanceId: row.campaign_actor_instance_id ? String(row.campaign_actor_instance_id) : undefined,
    slotLabel: row.slot_label ? String(row.slot_label) : undefined,
    slotStatus: String(row.slot_status),
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at as Date | string | null),
    updatedAt: toIso(row.updated_at as Date | string | null),
    archivedAt: toIso(row.archived_at as Date | string | null),
  };
}

function bindingFromRow(row: Record<string, unknown>): RuntimeSessionBindingRecord {
  return {
    runtimeSessionBindingId: String(row.runtime_session_binding_id),
    runtimeSessionId: String(row.runtime_session_id),
    roomRecordId: row.room_record_id ? String(row.room_record_id) : undefined,
    campaignId: String(row.campaign_id),
    bindingStatus: String(row.binding_status),
    metadata: toPayload(row.metadata_payload),
    createdAt: toIso(row.created_at as Date | string | null),
    archivedAt: toIso(row.archived_at as Date | string | null),
  };
}

export interface PostgresCampaignRoomRepository {
  listRoomParticipants(roomRecordId: string, limit?: number): Promise<PostgresCampaignRoomRepositoryResult<RoomParticipantRecord[]>>;
  listRoomLobbySlots(roomRecordId: string, limit?: number): Promise<PostgresCampaignRoomRepositoryResult<RoomLobbySlotRecord[]>>;
  getRuntimeSessionBindingBySessionId(runtimeSessionId: string): Promise<PostgresCampaignRoomRepositoryResult<RuntimeSessionBindingRecord | null>>;
  createRuntimeSessionBinding(input: CreateRuntimeSessionBindingInput): Promise<PostgresCampaignRoomRepositoryResult<RuntimeSessionBindingRecord>>;
  updateRuntimeSessionBinding(input: UpdateRuntimeSessionBindingInput): Promise<PostgresCampaignRoomRepositoryResult<RuntimeSessionBindingRecord | null>>;
}

export function createPostgresCampaignRoomRepository(
  executor: PostgresCampaignRoomRepositoryExecutor = { query: queryPostgres },
): PostgresCampaignRoomRepository {
  async function list<T>(text: string, values: readonly unknown[], map: (row: Record<string, unknown>) => T): Promise<PostgresCampaignRoomRepositoryResult<T[]>> {
    try {
      const result = await executor.query<Record<string, unknown>>(text, values);
      return { ok: true, value: result.rows.map(map) };
    } catch (error) {
      return mapError(error);
    }
  }

  async function one<T>(text: string, values: readonly unknown[], map: (row: Record<string, unknown>) => T): Promise<PostgresCampaignRoomRepositoryResult<T | null>> {
    try {
      const result = await executor.query<Record<string, unknown>>(text, values);
      return { ok: true, value: result.rows[0] ? map(result.rows[0]) : null };
    } catch (error) {
      return mapError(error);
    }
  }

  const listRoomParticipants = (roomRecordId: string, limit?: number) =>
    list<RoomParticipantRecord>(
      `SELECT ${PARTICIPANT_COLS} FROM room_participants WHERE room_record_id = $1 AND archived_at IS NULL ORDER BY created_at ASC LIMIT $2`,
      [roomRecordId, limitOf(limit)],
      participantFromRow,
    );

  const listRoomLobbySlots = (roomRecordId: string, limit?: number) =>
    list<RoomLobbySlotRecord>(
      `SELECT ${SLOT_COLS} FROM room_lobby_slots WHERE room_record_id = $1 AND archived_at IS NULL ORDER BY created_at ASC LIMIT $2`,
      [roomRecordId, limitOf(limit)],
      slotFromRow,
    );

  const getRuntimeSessionBindingBySessionId = (runtimeSessionId: string) =>
    one<RuntimeSessionBindingRecord>(
      `SELECT ${BINDING_COLS} FROM runtime_session_bindings WHERE runtime_session_id = $1 AND archived_at IS NULL LIMIT 1`,
      [runtimeSessionId],
      bindingFromRow,
    );

  const createRuntimeSessionBinding = async (input: CreateRuntimeSessionBindingInput): Promise<PostgresCampaignRoomRepositoryResult<RuntimeSessionBindingRecord>> => {
    const now = new Date().toISOString();
    const result = await one<RuntimeSessionBindingRecord>(
      `INSERT INTO runtime_session_bindings (runtime_session_binding_id,runtime_session_id,room_record_id,campaign_id,binding_status,metadata_payload,created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING ${BINDING_COLS}`,
      [input.runtimeSessionBindingId, input.runtimeSessionId, input.roomRecordId ?? null, input.campaignId, input.bindingStatus ?? 'active', JSON.stringify(input.metadata ?? {}), now],
      bindingFromRow,
    );
    if (result.ok === false) return result;
    return result.value
      ? { ok: true, value: result.value }
      : { ok: false, error: { kind: 'database_error', message: 'Runtime session binding was not created.' } };
  };

  const updateRuntimeSessionBinding = (input: UpdateRuntimeSessionBindingInput) =>
    one<RuntimeSessionBindingRecord>(
      `UPDATE runtime_session_bindings SET binding_status = COALESCE($2, binding_status), metadata_payload = COALESCE($3::jsonb, metadata_payload)
       WHERE runtime_session_binding_id = $1 RETURNING ${BINDING_COLS}`,
      [input.runtimeSessionBindingId, input.bindingStatus ?? null, input.metadata ? JSON.stringify(input.metadata) : null],
      bindingFromRow,
    );

  return { listRoomParticipants, listRoomLobbySlots, getRuntimeSessionBindingBySessionId, createRuntimeSessionBinding, updateRuntimeSessionBinding };
}
