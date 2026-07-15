import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres, withPostgresClient } from '../db/postgresClient.js';

/**
 * Postgres RuntimeEvent repository (P5.14A) — server-only.
 *
 * Mirrors the User/Campaign/Actor/Asset first slices (safe result envelope,
 * injectable executor, DB error mapping that never leaks raw driver errors), but
 * respects APPEND-ONLY semantics for runtime_events:
 *   - events are never updated or deleted; corrections/tombstones are future rows;
 *   - `seq` is per-session monotonic, allocated transactionally
 *     (SELECT COALESCE(MAX(seq),0)+1 ... then INSERT, guarded by
 *      UNIQUE(runtime_session_id, seq));
 *   - `idempotency_key` de-duplicates appends within a session.
 *
 * LONG-TERM PERSISTENCE ONLY — NOT the live room authority. Nothing here is wired
 * to the WebSocket protocol or live broadcast in this slice.
 */

export type PostgresRuntimeEventRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresRuntimeEventRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresRuntimeEventRepositoryErrorKind;
        message: string;
        retryable?: boolean;
      };
    };

// ── Runtime session ──────────────────────────────────────────────────────────

export interface RuntimeSessionRecord {
  runtimeSessionId: string;
  campaignId: string;
  hostUserId?: string;
  roomId?: string;
  title?: string;
  status: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateRuntimeSessionInput {
  runtimeSessionId: string;
  campaignId: string;
  hostUserId?: string;
  roomId?: string;
  title?: string;
  status?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
  startedAt?: string;
}

export interface UpdateRuntimeSessionInput {
  runtimeSessionId: string;
  title?: string;
  status?: string;
  payload?: Record<string, unknown>;
  endedAt?: string;
}

export interface ListRuntimeSessionsOptions {
  includeArchived?: boolean;
  limit?: number;
}

// ── Runtime event (append-only) ──────────────────────────────────────────────

export interface RuntimeEventRecord {
  runtimeEventId: string;
  runtimeSessionId: string;
  campaignId: string;
  seq: number;
  eventKind: string;
  visibility: string;
  actorId?: string;
  causedByEventId?: string;
  idempotencyKey?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdByUserId?: string;
  createdAt?: string;
}

export interface AppendRuntimeEventInput {
  runtimeEventId: string;
  runtimeSessionId: string;
  campaignId: string;
  eventKind: string;
  visibility?: string;
  actorId?: string;
  causedByEventId?: string;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
  createdByUserId?: string;
}

export interface ListRuntimeEventsOptions {
  afterSeq?: number;
  limit?: number;
  eventKind?: string;
  visibility?: string;
  actorId?: string;
}

export interface PostgresRuntimeEventRepositoryExecutor {
  query<T extends QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface PostgresRuntimeEventRepositoryOptions {
  /**
   * Defaults true. When true, appendRuntimeEvent opens its own transaction so the
   * seq allocation + insert are atomic. Smoke tests pass an already-transactional
   * client and set this false (the caller owns BEGIN/ROLLBACK).
   */
  useInternalTransactions?: boolean;
}

export interface PostgresRuntimeEventRepository {
  // Runtime session
  getRuntimeSessionById(runtimeSessionId: string): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>>;
  listRuntimeSessionsByCampaign(
    campaignId: string,
    options?: ListRuntimeSessionsOptions,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord[]>>;
  createRuntimeSession(input: CreateRuntimeSessionInput): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord>>;
  updateRuntimeSession(input: UpdateRuntimeSessionInput): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>>;
  endRuntimeSession(
    runtimeSessionId: string,
    endedAt?: string,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>>;
  archiveRuntimeSession(
    runtimeSessionId: string,
    archivedAt?: string,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>>;
  restoreRuntimeSession(runtimeSessionId: string): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>>;
  // Runtime events (append-only)
  getRuntimeEventById(runtimeEventId: string): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord | null>>;
  listRuntimeEvents(
    runtimeSessionId: string,
    options?: ListRuntimeEventsOptions,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord[]>>;
  appendRuntimeEvent(input: AppendRuntimeEventInput): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord>>;
  checkReadiness(): Promise<PostgresRuntimeEventRepositoryResult<{ runtimeSessionsTable: boolean; runtimeEventsTable: boolean }>>;
}

interface SessionRow extends QueryResultRow {
  runtime_session_id: string;
  campaign_id: string;
  host_user_id: string | null;
  room_id: string | null;
  title: string | null;
  status: string;
  session_payload: unknown;
  schema_version: number;
  started_at: Date | string;
  ended_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface EventRow extends QueryResultRow {
  runtime_event_id: string;
  runtime_session_id: string;
  campaign_id: string;
  seq: string | number;
  event_kind: string;
  visibility: string;
  actor_id: string | null;
  caused_by_event_id: string | null;
  idempotency_key: string | null;
  event_payload: unknown;
  schema_version: number;
  created_by_user_id: string | null;
  created_at: Date | string;
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toSeq(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function rowToSession(row: SessionRow): RuntimeSessionRecord {
  return {
    runtimeSessionId: row.runtime_session_id,
    campaignId: row.campaign_id,
    hostUserId: row.host_user_id ?? undefined,
    roomId: row.room_id ?? undefined,
    title: row.title ?? undefined,
    status: row.status,
    payload: toPayload(row.session_payload),
    schemaVersion: row.schema_version,
    startedAt: toIso(row.started_at),
    endedAt: toIso(row.ended_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToEvent(row: EventRow): RuntimeEventRecord {
  return {
    runtimeEventId: row.runtime_event_id,
    runtimeSessionId: row.runtime_session_id,
    campaignId: row.campaign_id,
    seq: toSeq(row.seq),
    eventKind: row.event_kind,
    visibility: row.visibility,
    actorId: row.actor_id ?? undefined,
    causedByEventId: row.caused_by_event_id ?? undefined,
    idempotencyKey: row.idempotency_key ?? undefined,
    payload: toPayload(row.event_payload),
    schemaVersion: row.schema_version,
    createdByUserId: row.created_by_user_id ?? undefined,
    createdAt: toIso(row.created_at),
  };
}

function errorCode(error: unknown): string {
  return typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
}

function errorConstraint(error: unknown): string {
  return typeof error === 'object' && error && 'constraint' in error ? String((error as { constraint: unknown }).constraint) : '';
}

function mapRepositoryError(error: unknown): PostgresRuntimeEventRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
  }
  if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Runtime event repository table is missing.' } };
  }
  const code = errorCode(error);
  if (code === '23505') {
    return { ok: false, error: { kind: 'conflict', message: 'Runtime event conflicts with an existing row.', retryable: true } };
  }
  if (code === '23503') {
    return { ok: false, error: { kind: 'conflict', message: 'Runtime event references a missing session/campaign/actor/user.' } };
  }
  if (code === '42P01') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Runtime event repository table is missing.' } };
  }
  const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  return { ok: false, error: { kind: 'database_error', message: 'Runtime event repository query failed.', retryable } };
}

const SESSION_SELECT = `
  SELECT
    runtime_session_id, campaign_id, host_user_id, room_id, title, status,
    session_payload, schema_version, started_at, ended_at, created_at, updated_at, archived_at
  FROM runtime_sessions
`;

const SESSION_RETURNING = `
  runtime_session_id, campaign_id, host_user_id, room_id, title, status,
  session_payload, schema_version, started_at, ended_at, created_at, updated_at, archived_at
`;

const EVENT_SELECT = `
  SELECT
    runtime_event_id, runtime_session_id, campaign_id, seq, event_kind, visibility,
    actor_id, caused_by_event_id, idempotency_key, event_payload, schema_version,
    created_by_user_id, created_at
  FROM runtime_events
`;

const EVENT_RETURNING = `
  runtime_event_id, runtime_session_id, campaign_id, seq, event_kind, visibility,
  actor_id, caused_by_event_id, idempotency_key, event_payload, schema_version,
  created_by_user_id, created_at
`;

const defaultExecutor: PostgresRuntimeEventRepositoryExecutor = {
  query: (text, values) => queryPostgres(text, values),
};

export function createPostgresRuntimeEventRepository(
  executor: PostgresRuntimeEventRepositoryExecutor = defaultExecutor,
  options: PostgresRuntimeEventRepositoryOptions = {},
): PostgresRuntimeEventRepository {
  const useInternalTransactions = options.useInternalTransactions ?? true;

  // ── Runtime session ────────────────────────────────────────────────────────

  async function getRuntimeSessionById(
    runtimeSessionId: string,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>> {
    try {
      const result = await executor.query<SessionRow>(
        `${SESSION_SELECT} WHERE runtime_session_id = $1 LIMIT 1`,
        [runtimeSessionId],
      );
      return { ok: true, value: result.rows[0] ? rowToSession(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listRuntimeSessionsByCampaign(
    campaignId: string,
    listOptions: ListRuntimeSessionsOptions = {},
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord[]>> {
    const conditions = ['campaign_id = $1'];
    const values: unknown[] = [campaignId];
    if (!listOptions.includeArchived) conditions.push('archived_at IS NULL');
    const limit = Number.isInteger(listOptions.limit) && (listOptions.limit as number) > 0 ? (listOptions.limit as number) : 200;
    values.push(limit);
    try {
      const result = await executor.query<SessionRow>(
        `${SESSION_SELECT}
         WHERE ${conditions.join(' AND ')}
         ORDER BY updated_at DESC
         LIMIT $${values.length}`,
        values,
      );
      return { ok: true, value: result.rows.map(rowToSession) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createRuntimeSession(
    input: CreateRuntimeSessionInput,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord>> {
    const now = new Date().toISOString();
    const startedAt = input.startedAt ?? now;
    const record: RuntimeSessionRecord = {
      runtimeSessionId: input.runtimeSessionId,
      campaignId: input.campaignId,
      hostUserId: input.hostUserId,
      roomId: input.roomId,
      title: input.title,
      status: input.status ?? 'active',
      payload: input.payload ?? {},
      schemaVersion: input.schemaVersion ?? 1,
      startedAt,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await executor.query(
        `
          INSERT INTO runtime_sessions (
            runtime_session_id, campaign_id, host_user_id, room_id, title, status,
            session_payload, schema_version, started_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $10)
        `,
        [
          record.runtimeSessionId,
          record.campaignId,
          record.hostUserId ?? null,
          record.roomId ?? null,
          record.title ?? null,
          record.status,
          JSON.stringify(record.payload),
          record.schemaVersion,
          startedAt,
          now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function updateRuntimeSession(
    input: UpdateRuntimeSessionInput,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<SessionRow>(
        `
          UPDATE runtime_sessions SET
            title = COALESCE($2, title),
            status = COALESCE($3, status),
            session_payload = COALESCE($4::jsonb, session_payload),
            ended_at = COALESCE($5, ended_at),
            updated_at = $6
          WHERE runtime_session_id = $1
          RETURNING ${SESSION_RETURNING}
        `,
        [
          input.runtimeSessionId,
          input.title ?? null,
          input.status ?? null,
          input.payload ? JSON.stringify(input.payload) : null,
          input.endedAt ?? null,
          now,
        ],
      );
      return { ok: true, value: result.rows[0] ? rowToSession(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function updateSessionLifecycle(
    runtimeSessionId: string,
    setClause: string,
    extraValues: unknown[],
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>> {
    try {
      const result = await executor.query<SessionRow>(
        `
          UPDATE runtime_sessions SET ${setClause}
          WHERE runtime_session_id = $1
          RETURNING ${SESSION_RETURNING}
        `,
        [runtimeSessionId, ...extraValues],
      );
      return { ok: true, value: result.rows[0] ? rowToSession(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function endRuntimeSession(
    runtimeSessionId: string,
    endedAt?: string,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>> {
    const at = endedAt ?? new Date().toISOString();
    return updateSessionLifecycle(runtimeSessionId, `status = 'ended', ended_at = $2, updated_at = $2`, [at]);
  }

  async function archiveRuntimeSession(
    runtimeSessionId: string,
    archivedAt?: string,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>> {
    const at = archivedAt ?? new Date().toISOString();
    return updateSessionLifecycle(runtimeSessionId, `archived_at = $2, updated_at = $2`, [at]);
  }

  async function restoreRuntimeSession(
    runtimeSessionId: string,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>> {
    const now = new Date().toISOString();
    return updateSessionLifecycle(runtimeSessionId, `archived_at = NULL, updated_at = $2`, [now]);
  }

  // ── Runtime events (append-only) ─────────────────────────────────────────────

  async function getRuntimeEventById(
    runtimeEventId: string,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord | null>> {
    try {
      const result = await executor.query<EventRow>(
        `${EVENT_SELECT} WHERE runtime_event_id = $1 LIMIT 1`,
        [runtimeEventId],
      );
      return { ok: true, value: result.rows[0] ? rowToEvent(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listRuntimeEvents(
    runtimeSessionId: string,
    listOptions: ListRuntimeEventsOptions = {},
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord[]>> {
    const conditions = ['runtime_session_id = $1'];
    const values: unknown[] = [runtimeSessionId];
    if (Number.isFinite(listOptions.afterSeq)) {
      values.push(listOptions.afterSeq);
      conditions.push(`seq > $${values.length}`);
    }
    if (listOptions.eventKind) {
      values.push(listOptions.eventKind);
      conditions.push(`event_kind = $${values.length}`);
    }
    if (listOptions.visibility) {
      values.push(listOptions.visibility);
      conditions.push(`visibility = $${values.length}`);
    }
    if (listOptions.actorId) {
      values.push(listOptions.actorId);
      conditions.push(`actor_id = $${values.length}`);
    }
    const limit = Number.isInteger(listOptions.limit) && (listOptions.limit as number) > 0 ? (listOptions.limit as number) : 500;
    values.push(limit);
    try {
      // afterSeq cursor pagination (never OFFSET): ascending seq order.
      const result = await executor.query<EventRow>(
        `${EVENT_SELECT}
         WHERE ${conditions.join(' AND ')}
         ORDER BY seq ASC
         LIMIT $${values.length}`,
        values,
      );
      return { ok: true, value: result.rows.map(rowToEvent) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function findEventByIdempotencyKey(
    exec: PostgresRuntimeEventRepositoryExecutor,
    runtimeSessionId: string,
    idempotencyKey: string,
  ): Promise<RuntimeEventRecord | null> {
    const existing = await exec.query<EventRow>(
      `${EVENT_SELECT} WHERE runtime_session_id = $1 AND idempotency_key = $2 LIMIT 1`,
      [runtimeSessionId, idempotencyKey],
    );
    return existing.rows[0] ? rowToEvent(existing.rows[0]) : null;
  }

  /** Runs the atomic append (idempotency pre-check → next seq → insert) on one executor. */
  async function runAppend(
    exec: PostgresRuntimeEventRepositoryExecutor,
    input: AppendRuntimeEventInput,
    now: string,
  ): Promise<RuntimeEventRecord> {
    if (input.idempotencyKey) {
      const existing = await findEventByIdempotencyKey(exec, input.runtimeSessionId, input.idempotencyKey);
      if (existing) return existing;
    }

    const seqResult = await exec.query<{ next_seq: string | number }>(
      `SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM runtime_events WHERE runtime_session_id = $1`,
      [input.runtimeSessionId],
    );
    const nextSeq = seqResult.rows[0]?.next_seq ?? 1;

    const inserted = await exec.query<EventRow>(
      `
        INSERT INTO runtime_events (
          runtime_event_id, runtime_session_id, campaign_id, seq, event_kind, visibility,
          actor_id, caused_by_event_id, idempotency_key, event_payload, schema_version,
          created_by_user_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)
        RETURNING ${EVENT_RETURNING}
      `,
      [
        input.runtimeEventId,
        input.runtimeSessionId,
        input.campaignId,
        nextSeq,
        input.eventKind,
        input.visibility ?? 'private',
        input.actorId ?? null,
        input.causedByEventId ?? null,
        input.idempotencyKey ?? null,
        JSON.stringify(input.payload ?? {}),
        input.schemaVersion ?? 1,
        input.createdByUserId ?? null,
        now,
      ],
    );
    return rowToEvent(inserted.rows[0]);
  }

  async function appendRuntimeEvent(
    input: AppendRuntimeEventInput,
  ): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord>> {
    const now = new Date().toISOString();
    try {
      let value: RuntimeEventRecord;
      if (useInternalTransactions) {
        value = await withPostgresClient(async (client) => {
          await client.query('BEGIN');
          try {
            const result = await runAppend(
              { query: (text, values) => client.query(text, values ? [...values] : undefined) },
              input,
              now,
            );
            await client.query('COMMIT');
            return result;
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          }
        });
      } else {
        value = await runAppend(executor, input, now);
      }
      return { ok: true, value };
    } catch (error) {
      // Idempotency race: another append with the same key committed first.
      if (input.idempotencyKey && errorCode(error) === '23505' && errorConstraint(error) === 'uq_runtime_events_session_idem') {
        try {
          const existing = await findEventByIdempotencyKey(executor, input.runtimeSessionId, input.idempotencyKey);
          if (existing) return { ok: true, value: existing };
        } catch {
          // fall through to safe error mapping
        }
      }
      return mapRepositoryError(error);
    }
  }

  async function checkReadiness(): Promise<
    PostgresRuntimeEventRepositoryResult<{ runtimeSessionsTable: boolean; runtimeEventsTable: boolean }>
  > {
    try {
      const result = await executor.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name IN ('runtime_sessions', 'runtime_events')
        `,
      );
      const names = new Set(result.rows.map((row) => row.table_name));
      return {
        ok: true,
        value: {
          runtimeSessionsTable: names.has('runtime_sessions'),
          runtimeEventsTable: names.has('runtime_events'),
        },
      };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    getRuntimeSessionById,
    listRuntimeSessionsByCampaign,
    createRuntimeSession,
    updateRuntimeSession,
    endRuntimeSession,
    archiveRuntimeSession,
    restoreRuntimeSession,
    getRuntimeEventById,
    listRuntimeEvents,
    appendRuntimeEvent,
    checkReadiness,
  };
}

const defaultPostgresRuntimeEventRepository = createPostgresRuntimeEventRepository();

export async function getRuntimeSessionById(
  runtimeSessionId: string,
): Promise<PostgresRuntimeEventRepositoryResult<RuntimeSessionRecord | null>> {
  return defaultPostgresRuntimeEventRepository.getRuntimeSessionById(runtimeSessionId);
}

export async function getRuntimeEventById(
  runtimeEventId: string,
): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord | null>> {
  return defaultPostgresRuntimeEventRepository.getRuntimeEventById(runtimeEventId);
}

export async function listRuntimeEvents(
  runtimeSessionId: string,
  options?: ListRuntimeEventsOptions,
): Promise<PostgresRuntimeEventRepositoryResult<RuntimeEventRecord[]>> {
  return defaultPostgresRuntimeEventRepository.listRuntimeEvents(runtimeSessionId, options);
}

export async function checkPostgresRuntimeEventRepositoryReadiness(): Promise<
  PostgresRuntimeEventRepositoryResult<{ runtimeSessionsTable: boolean; runtimeEventsTable: boolean }>
> {
  return defaultPostgresRuntimeEventRepository.checkReadiness();
}
