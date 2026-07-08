import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';
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
function rowToActor(row) {
    return {
        actorId: row.actor_id,
        ownerId: row.owner_id,
        systemId: row.system_id,
        localActorId: row.local_actor_id,
        displayName: row.display_name,
        payload: toPayload(row.actor_payload),
        schemaVersion: row.schema_version,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
    };
}
function mapRepositoryError(error) {
    if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
        return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
    }
    if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
        return { ok: false, error: { kind: 'schema_missing', message: 'Actor repository table is missing.' } };
    }
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === '23505') {
        return { ok: false, error: { kind: 'conflict', message: 'Actor already exists.' } };
    }
    if (code === '23503') {
        return { ok: false, error: { kind: 'conflict', message: 'Actor owner does not exist.' } };
    }
    if (code === '42P01') {
        return { ok: false, error: { kind: 'schema_missing', message: 'Actor repository table is missing.' } };
    }
    const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
    return { ok: false, error: { kind: 'database_error', message: 'Actor repository query failed.', retryable } };
}
const ACTOR_SELECT = `
  SELECT
    actor_id,
    owner_id,
    system_id,
    local_actor_id,
    display_name,
    actor_payload,
    schema_version,
    created_at,
    updated_at,
    archived_at
  FROM actors
`;
const defaultExecutor = {
    query: (text, values) => queryPostgres(text, values),
};
export function createPostgresActorRepository(executor = defaultExecutor, _options = {}) {
    async function getActorById(actorId) {
        try {
            const result = await executor.query(`${ACTOR_SELECT} WHERE actor_id = $1 LIMIT 1`, [actorId]);
            return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function getActorByOrigin(ownerId, systemId, localActorId) {
        try {
            const result = await executor.query(`${ACTOR_SELECT}
         WHERE owner_id = $1 AND system_id = $2 AND local_actor_id = $3
         LIMIT 1`, [ownerId, systemId, localActorId]);
            return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function listActorsByOwner(ownerId, options = {}) {
        const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 200;
        const conditions = ['owner_id = $1'];
        const values = [ownerId];
        if (options.systemId) {
            values.push(options.systemId);
            conditions.push(`system_id = $${values.length}`);
        }
        if (!options.includeArchived) {
            conditions.push('archived_at IS NULL');
        }
        values.push(limit);
        const limitPlaceholder = `$${values.length}`;
        try {
            const result = await executor.query(`${ACTOR_SELECT}
         WHERE ${conditions.join(' AND ')}
         ORDER BY updated_at DESC
         LIMIT ${limitPlaceholder}`, values);
            return { ok: true, value: result.rows.map(rowToActor) };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function createActor(input) {
        const now = new Date().toISOString();
        const record = {
            actorId: input.actorId,
            ownerId: input.ownerId,
            systemId: input.systemId,
            localActorId: input.localActorId,
            displayName: input.displayName,
            payload: input.payload ?? {},
            schemaVersion: input.schemaVersion ?? 1,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await executor.query(`
          INSERT INTO actors (
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $8)
        `, [
                record.actorId,
                record.ownerId,
                record.systemId,
                record.localActorId,
                record.displayName,
                JSON.stringify(record.payload),
                record.schemaVersion,
                now,
            ]);
            return { ok: true, value: record };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function updateActor(input) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE actors SET
            display_name = COALESCE($2, display_name),
            actor_payload = COALESCE($3::jsonb, actor_payload),
            updated_at = $4
          WHERE actor_id = $1
          RETURNING
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at, archived_at
        `, [
                input.actorId,
                input.displayName ?? null,
                input.payload === undefined ? null : JSON.stringify(input.payload),
                now,
            ]);
            return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function archiveActor(actorId, archivedAt) {
        const at = archivedAt ?? new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE actors SET
            archived_at = $2,
            updated_at = $2
          WHERE actor_id = $1
          RETURNING
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at, archived_at
        `, [actorId, at]);
            return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function restoreActor(actorId) {
        const now = new Date().toISOString();
        try {
            const result = await executor.query(`
          UPDATE actors SET
            archived_at = NULL,
            updated_at = $2
          WHERE actor_id = $1
          RETURNING
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at, archived_at
        `, [actorId, now]);
            return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    async function checkReadiness() {
        try {
            const result = await executor.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'actors'
        `);
            return { ok: true, value: { actorsTable: result.rows.length > 0 } };
        }
        catch (error) {
            return mapRepositoryError(error);
        }
    }
    return {
        getActorById,
        getActorByOrigin,
        listActorsByOwner,
        createActor,
        updateActor,
        archiveActor,
        restoreActor,
        checkReadiness,
    };
}
const defaultPostgresActorRepository = createPostgresActorRepository();
export async function getActorById(actorId) {
    return defaultPostgresActorRepository.getActorById(actorId);
}
export async function getActorByOrigin(ownerId, systemId, localActorId) {
    return defaultPostgresActorRepository.getActorByOrigin(ownerId, systemId, localActorId);
}
export async function listActorsByOwner(ownerId, options) {
    return defaultPostgresActorRepository.listActorsByOwner(ownerId, options);
}
export async function checkPostgresActorRepositoryReadiness() {
    return defaultPostgresActorRepository.checkReadiness();
}
