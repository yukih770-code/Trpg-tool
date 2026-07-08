import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';

/**
 * Postgres Actor / Character Vault repository (P5.12A) — server-only.
 *
 * Mirrors the User/Campaign first slices: a safe result envelope, an injectable
 * query executor (transaction-friendly), and DB error mapping that NEVER leaks raw
 * driver errors or credentials. Long-term Character Vault asset persistence only —
 * NOT the Campaign Actor Instance and NOT live runtime authority (current HP/SAN).
 *
 * Identity model:
 * - `actorId` is the global opaque cloud id (caller-provided).
 * - `ownerId` is the asset owner (users.user_id).
 * - `systemId` distinguishes DND / COC / CP RED / future systems.
 * - `localActorId` is the migration/source-origin id (NOT globally unique).
 * - Origin key = (ownerId, systemId, localActorId).
 * - `payload` holds the FULL character sheet as system-agnostic JSON.
 */

export interface PostgresActorRecord {
  actorId: string;
  ownerId: string;
  systemId: string;
  localActorId: string;
  displayName: string;
  /** Full character-sheet payload (system-agnostic JSON). */
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export type PostgresActorRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresActorRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresActorRepositoryErrorKind;
        message: string;
        retryable?: boolean;
      };
    };

export interface CreateActorInput {
  /** Caller provides an opaque global id (identityFactory `actor_<uuid>`). */
  actorId: string;
  ownerId: string;
  systemId: string;
  localActorId: string;
  displayName: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateActorInput {
  actorId: string;
  displayName?: string;
  payload?: Record<string, unknown>;
}

export interface ListActorsByOwnerOptions {
  systemId?: string;
  includeArchived?: boolean;
  limit?: number;
}

export interface PostgresActorRepositoryExecutor {
  query<T extends QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface PostgresActorRepositoryOptions {
  /** Defaults true; smoke tests pass an already-transactional client with false. */
  useInternalTransactions?: boolean;
}

export interface PostgresActorRepository {
  getActorById(actorId: string): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>>;
  getActorByOrigin(
    ownerId: string,
    systemId: string,
    localActorId: string,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>>;
  listActorsByOwner(
    ownerId: string,
    options?: ListActorsByOwnerOptions,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord[]>>;
  createActor(input: CreateActorInput): Promise<PostgresActorRepositoryResult<PostgresActorRecord>>;
  updateActor(input: UpdateActorInput): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>>;
  archiveActor(
    actorId: string,
    archivedAt?: string,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>>;
  restoreActor(actorId: string): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>>;
  checkReadiness(): Promise<PostgresActorRepositoryResult<{ actorsTable: boolean }>>;
}

interface ActorRow extends QueryResultRow {
  actor_id: string;
  owner_id: string;
  system_id: string;
  local_actor_id: string;
  display_name: string;
  actor_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function rowToActor(row: ActorRow): PostgresActorRecord {
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

function mapRepositoryError(error: unknown): PostgresActorRepositoryResult<never> {
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

const defaultExecutor: PostgresActorRepositoryExecutor = {
  query: (text, values) => queryPostgres(text, values),
};

export function createPostgresActorRepository(
  executor: PostgresActorRepositoryExecutor = defaultExecutor,
  _options: PostgresActorRepositoryOptions = {},
): PostgresActorRepository {
  async function getActorById(
    actorId: string,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>> {
    try {
      const result = await executor.query<ActorRow>(
        `${ACTOR_SELECT} WHERE actor_id = $1 LIMIT 1`,
        [actorId],
      );
      return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function getActorByOrigin(
    ownerId: string,
    systemId: string,
    localActorId: string,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>> {
    try {
      const result = await executor.query<ActorRow>(
        `${ACTOR_SELECT}
         WHERE owner_id = $1 AND system_id = $2 AND local_actor_id = $3
         LIMIT 1`,
        [ownerId, systemId, localActorId],
      );
      return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listActorsByOwner(
    ownerId: string,
    options: ListActorsByOwnerOptions = {},
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord[]>> {
    const limit = Number.isInteger(options.limit) && (options.limit as number) > 0 ? (options.limit as number) : 200;
    const conditions = ['owner_id = $1'];
    const values: unknown[] = [ownerId];
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
      const result = await executor.query<ActorRow>(
        `${ACTOR_SELECT}
         WHERE ${conditions.join(' AND ')}
         ORDER BY updated_at DESC
         LIMIT ${limitPlaceholder}`,
        values,
      );
      return { ok: true, value: result.rows.map(rowToActor) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createActor(
    input: CreateActorInput,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord>> {
    const now = new Date().toISOString();
    const record: PostgresActorRecord = {
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
      await executor.query(
        `
          INSERT INTO actors (
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $8)
        `,
        [
          record.actorId,
          record.ownerId,
          record.systemId,
          record.localActorId,
          record.displayName,
          JSON.stringify(record.payload),
          record.schemaVersion,
          now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function updateActor(
    input: UpdateActorInput,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<ActorRow>(
        `
          UPDATE actors SET
            display_name = COALESCE($2, display_name),
            actor_payload = COALESCE($3::jsonb, actor_payload),
            updated_at = $4
          WHERE actor_id = $1
          RETURNING
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at, archived_at
        `,
        [
          input.actorId,
          input.displayName ?? null,
          input.payload === undefined ? null : JSON.stringify(input.payload),
          now,
        ],
      );
      return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function archiveActor(
    actorId: string,
    archivedAt?: string,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>> {
    const at = archivedAt ?? new Date().toISOString();
    try {
      const result = await executor.query<ActorRow>(
        `
          UPDATE actors SET
            archived_at = $2,
            updated_at = $2
          WHERE actor_id = $1
          RETURNING
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at, archived_at
        `,
        [actorId, at],
      );
      return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function restoreActor(
    actorId: string,
  ): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<ActorRow>(
        `
          UPDATE actors SET
            archived_at = NULL,
            updated_at = $2
          WHERE actor_id = $1
          RETURNING
            actor_id, owner_id, system_id, local_actor_id, display_name,
            actor_payload, schema_version, created_at, updated_at, archived_at
        `,
        [actorId, now],
      );
      return { ok: true, value: result.rows[0] ? rowToActor(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function checkReadiness(): Promise<PostgresActorRepositoryResult<{ actorsTable: boolean }>> {
    try {
      const result = await executor.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'actors'
        `,
      );
      return { ok: true, value: { actorsTable: result.rows.length > 0 } };
    } catch (error) {
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

export async function getActorById(
  actorId: string,
): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>> {
  return defaultPostgresActorRepository.getActorById(actorId);
}

export async function getActorByOrigin(
  ownerId: string,
  systemId: string,
  localActorId: string,
): Promise<PostgresActorRepositoryResult<PostgresActorRecord | null>> {
  return defaultPostgresActorRepository.getActorByOrigin(ownerId, systemId, localActorId);
}

export async function listActorsByOwner(
  ownerId: string,
  options?: ListActorsByOwnerOptions,
): Promise<PostgresActorRepositoryResult<PostgresActorRecord[]>> {
  return defaultPostgresActorRepository.listActorsByOwner(ownerId, options);
}

export async function checkPostgresActorRepositoryReadiness(): Promise<
  PostgresActorRepositoryResult<{ actorsTable: boolean }>
> {
  return defaultPostgresActorRepository.checkReadiness();
}
