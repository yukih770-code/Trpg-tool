import { PostgresDatabaseError, queryPostgres, withPostgresClient } from '../db/postgresClient.js';
function toIso(value) {
    if (!value)
        return undefined;
    if (value instanceof Date)
        return value.toISOString();
    return value;
}
function toPayload(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function toSeq(value) {
    return typeof value === 'number' ? value : Number(value);
}
function rowToSession(row) {
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
function rowToEvent(row) {
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
function errorCode(error) {
    return typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
}
function errorConstraint(error) {
    return typeof error === 'object' && error && 'constraint' in error ? String(error.constraint) : '';
}
function mapRepositoryError(error) {
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
const defaultExecutor = {
    query: (text, values) => queryPostgres(text, values),
};
export function createPostgresRuntimeEventRepository(executor = defaultExecutor, options = {}) {
    const useInternalTransactions = options.useInternalTransactions ?? true;
    // ── Runtime session ────────────────────────────────────────────────────────
    async function getRuntimeSessionById(runtimeSessionId) {
        try {
            const result = await executor.query(`${SESSION_SELECT} WHERE runtime_session_id = $1 LIMIT 1`, [runtimeSessionId]);
            return { ok: true, value: result.rows[0] ? rowToSession(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listRuntimeSessionsByCampaign(campaignId, listOptions = {}) {
        const conditions = ['campaign_id = $1'];
        const values = [campaignId];
        if (!listOptions.includeArchived)
            conditions.push('archived_at IS NULL');
        const limit = Number.isInteger(listOptions.limit) && listOptions.limit > 0 ? listOptions.limit : 200;
        values.push(limit);
        try {
            const result = await executor.query(`${SESSION_SELECT}
         WHERE ${conditions.join(' AND ')}
         ORDER BY updated_at DESC
         LIMIT $${values.length}`, values);
            return { ok: true, value: result.rows.map(rowToSession) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function createRuntimeSession(input) {
        const now = new Date().toISOString();
        const startedAt = input.startedAt ?? now;
        const record = {
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
            await executor.query(`
          INSERT INTO runtime_sessions (
            runtime_session_id, campaign_id, host_user_id, room_id, title, status,
            session_payload, schema_version, started_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $10)
        `, [
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
            ]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function updateSessionLifecycle(runtimeSessionId, setClause, extraValues) {
        try {
            const result = await executor.query(`
          UPDATE runtime_sessions SET ${setClause}
          WHERE runtime_session_id = $1
          RETURNING ${SESSION_RETURNING}
        `, [runtimeSessionId, ...extraValues]);
            return { ok: true, value: result.rows[0] ? rowToSession(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function endRuntimeSession(runtimeSessionId, endedAt) {
        const at = endedAt ?? new Date().toISOString();
        return updateSessionLifecycle(runtimeSessionId, `status = 'ended', ended_at = $2, updated_at = $2`, [at]);
    }
    async function archiveRuntimeSession(runtimeSessionId, archivedAt) {
        const at = archivedAt ?? new Date().toISOString();
        return updateSessionLifecycle(runtimeSessionId, `archived_at = $2, updated_at = $2`, [at]);
    }
    async function restoreRuntimeSession(runtimeSessionId) {
        const now = new Date().toISOString();
        return updateSessionLifecycle(runtimeSessionId, `archived_at = NULL, updated_at = $2`, [now]);
    }
    // ── Runtime events (append-only) ─────────────────────────────────────────────
    async function getRuntimeEventById(runtimeEventId) {
        try {
            const result = await executor.query(`${EVENT_SELECT} WHERE runtime_event_id = $1 LIMIT 1`, [runtimeEventId]);
            return { ok: true, value: result.rows[0] ? rowToEvent(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listRuntimeEvents(runtimeSessionId, listOptions = {}) {
        const conditions = ['runtime_session_id = $1'];
        const values = [runtimeSessionId];
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
        const limit = Number.isInteger(listOptions.limit) && listOptions.limit > 0 ? listOptions.limit : 500;
        values.push(limit);
        try {
            // afterSeq cursor pagination (never OFFSET): ascending seq order.
            const result = await executor.query(`${EVENT_SELECT}
         WHERE ${conditions.join(' AND ')}
         ORDER BY seq ASC
         LIMIT $${values.length}`, values);
            return { ok: true, value: result.rows.map(rowToEvent) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function findEventByIdempotencyKey(exec, runtimeSessionId, idempotencyKey) {
        const existing = await exec.query(`${EVENT_SELECT} WHERE runtime_session_id = $1 AND idempotency_key = $2 LIMIT 1`, [runtimeSessionId, idempotencyKey]);
        return existing.rows[0] ? rowToEvent(existing.rows[0]) : null;
    }
    /** Runs the atomic append (idempotency pre-check → next seq → insert) on one executor. */
    async function runAppend(exec, input, now) {
        if (input.idempotencyKey) {
            const existing = await findEventByIdempotencyKey(exec, input.runtimeSessionId, input.idempotencyKey);
            if (existing)
                return existing;
        }
        const seqResult = await exec.query(`SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM runtime_events WHERE runtime_session_id = $1`, [input.runtimeSessionId]);
        const nextSeq = seqResult.rows[0]?.next_seq ?? 1;
        const inserted = await exec.query(`
        INSERT INTO runtime_events (
          runtime_event_id, runtime_session_id, campaign_id, seq, event_kind, visibility,
          actor_id, caused_by_event_id, idempotency_key, event_payload, schema_version,
          created_by_user_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)
        RETURNING ${EVENT_RETURNING}
      `, [
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
        ]);
        return rowToEvent(inserted.rows[0]);
    }
    async function appendRuntimeEvent(input) {
        const now = new Date().toISOString();
        try {
            let value;
            if (useInternalTransactions) {
                value = await withPostgresClient(async (client) => {
                    await client.query('BEGIN');
                    try {
                        const result = await runAppend({ query: (text, values) => client.query(text, values ? [...values] : undefined) }, input, now);
                        await client.query('COMMIT');
                        return result;
                    }
                    catch (error) {
                        await client.query('ROLLBACK');
                        throw error;
                    }
                });
            }
            else {
                value = await runAppend(executor, input, now);
            }
            return { ok: true, value };
        }
        catch (error) {
            // Idempotency race: another append with the same key committed first.
            if (input.idempotencyKey && errorCode(error) === '23505' && errorConstraint(error) === 'uq_runtime_events_session_idem') {
                try {
                    const existing = await findEventByIdempotencyKey(executor, input.runtimeSessionId, input.idempotencyKey);
                    if (existing)
                        return { ok: true, value: existing };
                }
                catch {
                    // fall through to safe error mapping
                }
            }
            return mapRepositoryError(error);
        }
    }
    async function checkReadiness() {
        try {
            const result = await executor.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name IN ('runtime_sessions', 'runtime_events')
        `);
            const names = new Set(result.rows.map((row) => row.table_name));
            return {
                ok: true,
                value: {
                    runtimeSessionsTable: names.has('runtime_sessions'),
                    runtimeEventsTable: names.has('runtime_events'),
                },
            };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    return {
        getRuntimeSessionById,
        listRuntimeSessionsByCampaign,
        createRuntimeSession,
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
export async function getRuntimeSessionById(runtimeSessionId) {
    return defaultPostgresRuntimeEventRepository.getRuntimeSessionById(runtimeSessionId);
}
export async function getRuntimeEventById(runtimeEventId) {
    return defaultPostgresRuntimeEventRepository.getRuntimeEventById(runtimeEventId);
}
export async function listRuntimeEvents(runtimeSessionId, options) {
    return defaultPostgresRuntimeEventRepository.listRuntimeEvents(runtimeSessionId, options);
}
export async function checkPostgresRuntimeEventRepositoryReadiness() {
    return defaultPostgresRuntimeEventRepository.checkReadiness();
}
