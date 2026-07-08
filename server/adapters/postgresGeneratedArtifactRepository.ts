import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';

/**
 * Postgres GeneratedArtifact / AI Memory repository (P5.15A) — server-only.
 *
 * Mirrors the User/Campaign/Actor/Asset/RuntimeEvent first slices (safe result
 * envelope, injectable executor, DB error mapping that never leaks raw driver
 * errors). Stores AI OUTPUTS + curated MEMORY records only — generates nothing,
 * calls no model, runs no embeddings/vector search, performs no AI context
 * retrieval. `visibility_scope` / `memory_scope` are stored METADATA for future
 * scope enforcement, NOT a permission system. generated_artifacts +
 * ai_memory_entries are curated (updatable/archivable); ai_context_sources are
 * append-only provenance links.
 */

export type PostgresGeneratedArtifactRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresGeneratedArtifactRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresGeneratedArtifactRepositoryErrorKind;
        message: string;
        retryable?: boolean;
      };
    };

// ── Generated artifact ───────────────────────────────────────────────────────

export interface GeneratedArtifactRecord {
  artifactId: string;
  ownerId: string;
  campaignId?: string;
  runtimeSessionId?: string;
  runtimeEventId?: string;
  artifactKind: string;
  title: string;
  summary?: string;
  contentFormat: string;
  visibilityScope: string;
  payload: Record<string, unknown>;
  sourcePayload: Record<string, unknown>;
  modelPayload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateGeneratedArtifactInput {
  artifactId: string;
  ownerId: string;
  campaignId?: string;
  runtimeSessionId?: string;
  runtimeEventId?: string;
  artifactKind: string;
  title: string;
  summary?: string;
  contentFormat?: string;
  visibilityScope?: string;
  payload?: Record<string, unknown>;
  sourcePayload?: Record<string, unknown>;
  modelPayload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateGeneratedArtifactInput {
  artifactId: string;
  title?: string;
  summary?: string;
  contentFormat?: string;
  visibilityScope?: string;
  payload?: Record<string, unknown>;
  sourcePayload?: Record<string, unknown>;
  modelPayload?: Record<string, unknown>;
}

export interface ListGeneratedArtifactsOptions {
  artifactKind?: string;
  visibilityScope?: string;
  includeArchived?: boolean;
  limit?: number;
}

// ── AI memory entry ──────────────────────────────────────────────────────────

export interface AiMemoryEntryRecord {
  memoryEntryId: string;
  ownerId: string;
  campaignId?: string;
  runtimeSessionId?: string;
  sourceArtifactId?: string;
  memoryKind: string;
  memoryScope: string;
  title?: string;
  contentText: string;
  visibilityScope: string;
  payload: Record<string, unknown>;
  sourcePayload: Record<string, unknown>;
  confidence?: number;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateAiMemoryEntryInput {
  memoryEntryId: string;
  ownerId: string;
  campaignId?: string;
  runtimeSessionId?: string;
  sourceArtifactId?: string;
  memoryKind: string;
  memoryScope?: string;
  title?: string;
  contentText: string;
  visibilityScope?: string;
  payload?: Record<string, unknown>;
  sourcePayload?: Record<string, unknown>;
  confidence?: number;
  schemaVersion?: number;
}

export interface UpdateAiMemoryEntryInput {
  memoryEntryId: string;
  title?: string;
  contentText?: string;
  memoryScope?: string;
  visibilityScope?: string;
  payload?: Record<string, unknown>;
  sourcePayload?: Record<string, unknown>;
  confidence?: number;
}

export interface ListAiMemoryEntriesOptions {
  memoryKind?: string;
  memoryScope?: string;
  visibilityScope?: string;
  includeArchived?: boolean;
  limit?: number;
}

// ── AI context source (append-only provenance link) ──────────────────────────

export interface AiContextSourceRecord {
  contextSourceId: string;
  ownerId: string;
  campaignId?: string;
  artifactId?: string;
  memoryEntryId?: string;
  sourceKind: string;
  sourceRefId?: string;
  sourcePayload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
}

export interface CreateAiContextSourceInput {
  contextSourceId: string;
  ownerId: string;
  campaignId?: string;
  artifactId?: string;
  memoryEntryId?: string;
  sourceKind: string;
  sourceRefId?: string;
  sourcePayload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface PostgresGeneratedArtifactRepositoryExecutor {
  query<T extends QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface PostgresGeneratedArtifactRepositoryOptions {
  /** Defaults true; smoke tests pass an already-transactional client with false. */
  useInternalTransactions?: boolean;
}

export interface PostgresGeneratedArtifactRepository {
  // Generated artifacts
  getGeneratedArtifactById(artifactId: string): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>>;
  listGeneratedArtifactsByOwner(ownerId: string, options?: ListGeneratedArtifactsOptions): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord[]>>;
  listGeneratedArtifactsByCampaign(campaignId: string, options?: ListGeneratedArtifactsOptions): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord[]>>;
  listGeneratedArtifactsByRuntimeSession(runtimeSessionId: string, options?: ListGeneratedArtifactsOptions): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord[]>>;
  createGeneratedArtifact(input: CreateGeneratedArtifactInput): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord>>;
  updateGeneratedArtifact(input: UpdateGeneratedArtifactInput): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>>;
  archiveGeneratedArtifact(artifactId: string, archivedAt?: string): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>>;
  restoreGeneratedArtifact(artifactId: string): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>>;
  // AI memory entries
  getAiMemoryEntryById(memoryEntryId: string): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>>;
  listAiMemoryEntriesByOwner(ownerId: string, options?: ListAiMemoryEntriesOptions): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord[]>>;
  listAiMemoryEntriesByCampaign(campaignId: string, options?: ListAiMemoryEntriesOptions): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord[]>>;
  listAiMemoryEntriesByRuntimeSession(runtimeSessionId: string, options?: ListAiMemoryEntriesOptions): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord[]>>;
  createAiMemoryEntry(input: CreateAiMemoryEntryInput): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord>>;
  updateAiMemoryEntry(input: UpdateAiMemoryEntryInput): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>>;
  archiveAiMemoryEntry(memoryEntryId: string, archivedAt?: string): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>>;
  restoreAiMemoryEntry(memoryEntryId: string): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>>;
  // Context sources
  getAiContextSourceById(contextSourceId: string): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord | null>>;
  listAiContextSourcesForArtifact(artifactId: string): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord[]>>;
  listAiContextSourcesForMemoryEntry(memoryEntryId: string): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord[]>>;
  createAiContextSource(input: CreateAiContextSourceInput): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord>>;
  checkReadiness(): Promise<PostgresGeneratedArtifactRepositoryResult<{ generatedArtifactsTable: boolean; aiMemoryEntriesTable: boolean; aiContextSourcesTable: boolean }>>;
}

interface ArtifactRow extends QueryResultRow {
  artifact_id: string;
  owner_id: string;
  campaign_id: string | null;
  runtime_session_id: string | null;
  runtime_event_id: string | null;
  artifact_kind: string;
  title: string;
  summary: string | null;
  content_format: string;
  visibility_scope: string;
  artifact_payload: unknown;
  source_payload: unknown;
  model_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface MemoryRow extends QueryResultRow {
  memory_entry_id: string;
  owner_id: string;
  campaign_id: string | null;
  runtime_session_id: string | null;
  source_artifact_id: string | null;
  memory_kind: string;
  memory_scope: string;
  title: string | null;
  content_text: string;
  visibility_scope: string;
  memory_payload: unknown;
  source_payload: unknown;
  confidence: string | number | null;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface ContextSourceRow extends QueryResultRow {
  context_source_id: string;
  owner_id: string;
  campaign_id: string | null;
  artifact_id: string | null;
  memory_entry_id: string | null;
  source_kind: string;
  source_ref_id: string | null;
  source_payload: unknown;
  schema_version: number;
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

function toOptionalNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function rowToArtifact(row: ArtifactRow): GeneratedArtifactRecord {
  return {
    artifactId: row.artifact_id,
    ownerId: row.owner_id,
    campaignId: row.campaign_id ?? undefined,
    runtimeSessionId: row.runtime_session_id ?? undefined,
    runtimeEventId: row.runtime_event_id ?? undefined,
    artifactKind: row.artifact_kind,
    title: row.title,
    summary: row.summary ?? undefined,
    contentFormat: row.content_format,
    visibilityScope: row.visibility_scope,
    payload: toPayload(row.artifact_payload),
    sourcePayload: toPayload(row.source_payload),
    modelPayload: toPayload(row.model_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToMemory(row: MemoryRow): AiMemoryEntryRecord {
  return {
    memoryEntryId: row.memory_entry_id,
    ownerId: row.owner_id,
    campaignId: row.campaign_id ?? undefined,
    runtimeSessionId: row.runtime_session_id ?? undefined,
    sourceArtifactId: row.source_artifact_id ?? undefined,
    memoryKind: row.memory_kind,
    memoryScope: row.memory_scope,
    title: row.title ?? undefined,
    contentText: row.content_text,
    visibilityScope: row.visibility_scope,
    payload: toPayload(row.memory_payload),
    sourcePayload: toPayload(row.source_payload),
    confidence: toOptionalNumber(row.confidence),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToContextSource(row: ContextSourceRow): AiContextSourceRecord {
  return {
    contextSourceId: row.context_source_id,
    ownerId: row.owner_id,
    campaignId: row.campaign_id ?? undefined,
    artifactId: row.artifact_id ?? undefined,
    memoryEntryId: row.memory_entry_id ?? undefined,
    sourceKind: row.source_kind,
    sourceRefId: row.source_ref_id ?? undefined,
    sourcePayload: toPayload(row.source_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
  };
}

function mapRepositoryError(error: unknown): PostgresGeneratedArtifactRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
  }
  if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Generated artifact repository table is missing.' } };
  }
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === '23505') {
    return { ok: false, error: { kind: 'conflict', message: 'Generated artifact row already exists.' } };
  }
  if (code === '23503') {
    return { ok: false, error: { kind: 'conflict', message: 'Generated artifact references a missing owner/campaign/runtime/artifact/memory row.' } };
  }
  if (code === '42P01') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Generated artifact repository table is missing.' } };
  }
  const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  return { ok: false, error: { kind: 'database_error', message: 'Generated artifact repository query failed.', retryable } };
}

const ARTIFACT_COLUMNS = `
  artifact_id, owner_id, campaign_id, runtime_session_id, runtime_event_id,
  artifact_kind, title, summary, content_format, visibility_scope,
  artifact_payload, source_payload, model_payload, schema_version,
  created_at, updated_at, archived_at
`;

const MEMORY_COLUMNS = `
  memory_entry_id, owner_id, campaign_id, runtime_session_id, source_artifact_id,
  memory_kind, memory_scope, title, content_text, visibility_scope,
  memory_payload, source_payload, confidence, schema_version,
  created_at, updated_at, archived_at
`;

const CONTEXT_SOURCE_COLUMNS = `
  context_source_id, owner_id, campaign_id, artifact_id, memory_entry_id,
  source_kind, source_ref_id, source_payload, schema_version, created_at
`;

const defaultExecutor: PostgresGeneratedArtifactRepositoryExecutor = {
  query: (text, values) => queryPostgres(text, values),
};

export function createPostgresGeneratedArtifactRepository(
  executor: PostgresGeneratedArtifactRepositoryExecutor = defaultExecutor,
  _options: PostgresGeneratedArtifactRepositoryOptions = {},
): PostgresGeneratedArtifactRepository {
  // ── Generated artifacts ──────────────────────────────────────────────────

  async function getGeneratedArtifactById(
    artifactId: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>> {
    try {
      const result = await executor.query<ArtifactRow>(
        `SELECT ${ARTIFACT_COLUMNS} FROM generated_artifacts WHERE artifact_id = $1 LIMIT 1`,
        [artifactId],
      );
      return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  function listArtifactsWhere(
    column: 'owner_id' | 'campaign_id' | 'runtime_session_id',
    value: string,
    options: ListGeneratedArtifactsOptions,
  ): Promise<QueryResult<ArtifactRow>> {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    if (options.artifactKind) {
      values.push(options.artifactKind);
      conditions.push(`artifact_kind = $${values.length}`);
    }
    if (options.visibilityScope) {
      values.push(options.visibilityScope);
      conditions.push(`visibility_scope = $${values.length}`);
    }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    const limit = Number.isInteger(options.limit) && (options.limit as number) > 0 ? (options.limit as number) : 200;
    values.push(limit);
    return executor.query<ArtifactRow>(
      `SELECT ${ARTIFACT_COLUMNS} FROM generated_artifacts
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC
       LIMIT $${values.length}`,
      values,
    );
  }

  async function listGeneratedArtifactsByOwner(
    ownerId: string,
    options: ListGeneratedArtifactsOptions = {},
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord[]>> {
    try {
      const result = await listArtifactsWhere('owner_id', ownerId, options);
      return { ok: true, value: result.rows.map(rowToArtifact) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listGeneratedArtifactsByCampaign(
    campaignId: string,
    options: ListGeneratedArtifactsOptions = {},
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord[]>> {
    try {
      const result = await listArtifactsWhere('campaign_id', campaignId, options);
      return { ok: true, value: result.rows.map(rowToArtifact) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listGeneratedArtifactsByRuntimeSession(
    runtimeSessionId: string,
    options: ListGeneratedArtifactsOptions = {},
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord[]>> {
    try {
      const result = await listArtifactsWhere('runtime_session_id', runtimeSessionId, options);
      return { ok: true, value: result.rows.map(rowToArtifact) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createGeneratedArtifact(
    input: CreateGeneratedArtifactInput,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord>> {
    const now = new Date().toISOString();
    const record: GeneratedArtifactRecord = {
      artifactId: input.artifactId,
      ownerId: input.ownerId,
      campaignId: input.campaignId,
      runtimeSessionId: input.runtimeSessionId,
      runtimeEventId: input.runtimeEventId,
      artifactKind: input.artifactKind,
      title: input.title,
      summary: input.summary,
      contentFormat: input.contentFormat ?? 'json',
      visibilityScope: input.visibilityScope ?? 'user_private',
      payload: input.payload ?? {},
      sourcePayload: input.sourcePayload ?? {},
      modelPayload: input.modelPayload ?? {},
      schemaVersion: input.schemaVersion ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await executor.query(
        `
          INSERT INTO generated_artifacts (
            artifact_id, owner_id, campaign_id, runtime_session_id, runtime_event_id,
            artifact_kind, title, summary, content_format, visibility_scope,
            artifact_payload, source_payload, model_payload, schema_version,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15, $15)
        `,
        [
          record.artifactId,
          record.ownerId,
          record.campaignId ?? null,
          record.runtimeSessionId ?? null,
          record.runtimeEventId ?? null,
          record.artifactKind,
          record.title,
          record.summary ?? null,
          record.contentFormat,
          record.visibilityScope,
          JSON.stringify(record.payload),
          JSON.stringify(record.sourcePayload),
          JSON.stringify(record.modelPayload),
          record.schemaVersion,
          now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function updateGeneratedArtifact(
    input: UpdateGeneratedArtifactInput,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<ArtifactRow>(
        `
          UPDATE generated_artifacts SET
            title = COALESCE($2, title),
            summary = COALESCE($3, summary),
            content_format = COALESCE($4, content_format),
            visibility_scope = COALESCE($5, visibility_scope),
            artifact_payload = COALESCE($6::jsonb, artifact_payload),
            source_payload = COALESCE($7::jsonb, source_payload),
            model_payload = COALESCE($8::jsonb, model_payload),
            updated_at = $9
          WHERE artifact_id = $1
          RETURNING ${ARTIFACT_COLUMNS}
        `,
        [
          input.artifactId,
          input.title ?? null,
          input.summary ?? null,
          input.contentFormat ?? null,
          input.visibilityScope ?? null,
          input.payload === undefined ? null : JSON.stringify(input.payload),
          input.sourcePayload === undefined ? null : JSON.stringify(input.sourcePayload),
          input.modelPayload === undefined ? null : JSON.stringify(input.modelPayload),
          now,
        ],
      );
      return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function archiveGeneratedArtifact(
    artifactId: string,
    archivedAt?: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>> {
    const at = archivedAt ?? new Date().toISOString();
    try {
      const result = await executor.query<ArtifactRow>(
        `UPDATE generated_artifacts SET archived_at = $2, updated_at = $2 WHERE artifact_id = $1 RETURNING ${ARTIFACT_COLUMNS}`,
        [artifactId, at],
      );
      return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function restoreGeneratedArtifact(
    artifactId: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<ArtifactRow>(
        `UPDATE generated_artifacts SET archived_at = NULL, updated_at = $2 WHERE artifact_id = $1 RETURNING ${ARTIFACT_COLUMNS}`,
        [artifactId, now],
      );
      return { ok: true, value: result.rows[0] ? rowToArtifact(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  // ── AI memory entries ────────────────────────────────────────────────────

  async function getAiMemoryEntryById(
    memoryEntryId: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>> {
    try {
      const result = await executor.query<MemoryRow>(
        `SELECT ${MEMORY_COLUMNS} FROM ai_memory_entries WHERE memory_entry_id = $1 LIMIT 1`,
        [memoryEntryId],
      );
      return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  function listMemoryWhere(
    column: 'owner_id' | 'campaign_id' | 'runtime_session_id',
    value: string,
    options: ListAiMemoryEntriesOptions,
  ): Promise<QueryResult<MemoryRow>> {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    if (options.memoryKind) {
      values.push(options.memoryKind);
      conditions.push(`memory_kind = $${values.length}`);
    }
    if (options.memoryScope) {
      values.push(options.memoryScope);
      conditions.push(`memory_scope = $${values.length}`);
    }
    if (options.visibilityScope) {
      values.push(options.visibilityScope);
      conditions.push(`visibility_scope = $${values.length}`);
    }
    if (!options.includeArchived) conditions.push('archived_at IS NULL');
    const limit = Number.isInteger(options.limit) && (options.limit as number) > 0 ? (options.limit as number) : 200;
    values.push(limit);
    return executor.query<MemoryRow>(
      `SELECT ${MEMORY_COLUMNS} FROM ai_memory_entries
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC
       LIMIT $${values.length}`,
      values,
    );
  }

  async function listAiMemoryEntriesByOwner(
    ownerId: string,
    options: ListAiMemoryEntriesOptions = {},
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord[]>> {
    try {
      const result = await listMemoryWhere('owner_id', ownerId, options);
      return { ok: true, value: result.rows.map(rowToMemory) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listAiMemoryEntriesByCampaign(
    campaignId: string,
    options: ListAiMemoryEntriesOptions = {},
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord[]>> {
    try {
      const result = await listMemoryWhere('campaign_id', campaignId, options);
      return { ok: true, value: result.rows.map(rowToMemory) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listAiMemoryEntriesByRuntimeSession(
    runtimeSessionId: string,
    options: ListAiMemoryEntriesOptions = {},
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord[]>> {
    try {
      const result = await listMemoryWhere('runtime_session_id', runtimeSessionId, options);
      return { ok: true, value: result.rows.map(rowToMemory) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createAiMemoryEntry(
    input: CreateAiMemoryEntryInput,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord>> {
    const now = new Date().toISOString();
    const record: AiMemoryEntryRecord = {
      memoryEntryId: input.memoryEntryId,
      ownerId: input.ownerId,
      campaignId: input.campaignId,
      runtimeSessionId: input.runtimeSessionId,
      sourceArtifactId: input.sourceArtifactId,
      memoryKind: input.memoryKind,
      memoryScope: input.memoryScope ?? 'campaign',
      title: input.title,
      contentText: input.contentText,
      visibilityScope: input.visibilityScope ?? 'campaign',
      payload: input.payload ?? {},
      sourcePayload: input.sourcePayload ?? {},
      confidence: input.confidence,
      schemaVersion: input.schemaVersion ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await executor.query(
        `
          INSERT INTO ai_memory_entries (
            memory_entry_id, owner_id, campaign_id, runtime_session_id, source_artifact_id,
            memory_kind, memory_scope, title, content_text, visibility_scope,
            memory_payload, source_payload, confidence, schema_version,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14, $15, $15)
        `,
        [
          record.memoryEntryId,
          record.ownerId,
          record.campaignId ?? null,
          record.runtimeSessionId ?? null,
          record.sourceArtifactId ?? null,
          record.memoryKind,
          record.memoryScope,
          record.title ?? null,
          record.contentText,
          record.visibilityScope,
          JSON.stringify(record.payload),
          JSON.stringify(record.sourcePayload),
          record.confidence ?? null,
          record.schemaVersion,
          now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function updateAiMemoryEntry(
    input: UpdateAiMemoryEntryInput,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<MemoryRow>(
        `
          UPDATE ai_memory_entries SET
            title = COALESCE($2, title),
            content_text = COALESCE($3, content_text),
            memory_scope = COALESCE($4, memory_scope),
            visibility_scope = COALESCE($5, visibility_scope),
            memory_payload = COALESCE($6::jsonb, memory_payload),
            source_payload = COALESCE($7::jsonb, source_payload),
            confidence = COALESCE($8, confidence),
            updated_at = $9
          WHERE memory_entry_id = $1
          RETURNING ${MEMORY_COLUMNS}
        `,
        [
          input.memoryEntryId,
          input.title ?? null,
          input.contentText ?? null,
          input.memoryScope ?? null,
          input.visibilityScope ?? null,
          input.payload === undefined ? null : JSON.stringify(input.payload),
          input.sourcePayload === undefined ? null : JSON.stringify(input.sourcePayload),
          input.confidence ?? null,
          now,
        ],
      );
      return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function archiveAiMemoryEntry(
    memoryEntryId: string,
    archivedAt?: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>> {
    const at = archivedAt ?? new Date().toISOString();
    try {
      const result = await executor.query<MemoryRow>(
        `UPDATE ai_memory_entries SET archived_at = $2, updated_at = $2 WHERE memory_entry_id = $1 RETURNING ${MEMORY_COLUMNS}`,
        [memoryEntryId, at],
      );
      return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function restoreAiMemoryEntry(
    memoryEntryId: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<MemoryRow>(
        `UPDATE ai_memory_entries SET archived_at = NULL, updated_at = $2 WHERE memory_entry_id = $1 RETURNING ${MEMORY_COLUMNS}`,
        [memoryEntryId, now],
      );
      return { ok: true, value: result.rows[0] ? rowToMemory(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  // ── Context sources (append-only) ─────────────────────────────────────────

  async function getAiContextSourceById(
    contextSourceId: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord | null>> {
    try {
      const result = await executor.query<ContextSourceRow>(
        `SELECT ${CONTEXT_SOURCE_COLUMNS} FROM ai_context_sources WHERE context_source_id = $1 LIMIT 1`,
        [contextSourceId],
      );
      return { ok: true, value: result.rows[0] ? rowToContextSource(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listAiContextSourcesForArtifact(
    artifactId: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord[]>> {
    try {
      const result = await executor.query<ContextSourceRow>(
        `SELECT ${CONTEXT_SOURCE_COLUMNS} FROM ai_context_sources WHERE artifact_id = $1 ORDER BY created_at ASC LIMIT 500`,
        [artifactId],
      );
      return { ok: true, value: result.rows.map(rowToContextSource) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listAiContextSourcesForMemoryEntry(
    memoryEntryId: string,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord[]>> {
    try {
      const result = await executor.query<ContextSourceRow>(
        `SELECT ${CONTEXT_SOURCE_COLUMNS} FROM ai_context_sources WHERE memory_entry_id = $1 ORDER BY created_at ASC LIMIT 500`,
        [memoryEntryId],
      );
      return { ok: true, value: result.rows.map(rowToContextSource) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createAiContextSource(
    input: CreateAiContextSourceInput,
  ): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord>> {
    const now = new Date().toISOString();
    const record: AiContextSourceRecord = {
      contextSourceId: input.contextSourceId,
      ownerId: input.ownerId,
      campaignId: input.campaignId,
      artifactId: input.artifactId,
      memoryEntryId: input.memoryEntryId,
      sourceKind: input.sourceKind,
      sourceRefId: input.sourceRefId,
      sourcePayload: input.sourcePayload ?? {},
      schemaVersion: input.schemaVersion ?? 1,
      createdAt: now,
    };
    try {
      await executor.query(
        `
          INSERT INTO ai_context_sources (
            context_source_id, owner_id, campaign_id, artifact_id, memory_entry_id,
            source_kind, source_ref_id, source_payload, schema_version, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
        `,
        [
          record.contextSourceId,
          record.ownerId,
          record.campaignId ?? null,
          record.artifactId ?? null,
          record.memoryEntryId ?? null,
          record.sourceKind,
          record.sourceRefId ?? null,
          JSON.stringify(record.sourcePayload),
          record.schemaVersion,
          now,
        ],
      );
      return { ok: true, value: record };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function checkReadiness(): Promise<
    PostgresGeneratedArtifactRepositoryResult<{ generatedArtifactsTable: boolean; aiMemoryEntriesTable: boolean; aiContextSourcesTable: boolean }>
  > {
    try {
      const result = await executor.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('generated_artifacts', 'ai_memory_entries', 'ai_context_sources')
        `,
      );
      const names = new Set(result.rows.map((row) => row.table_name));
      return {
        ok: true,
        value: {
          generatedArtifactsTable: names.has('generated_artifacts'),
          aiMemoryEntriesTable: names.has('ai_memory_entries'),
          aiContextSourcesTable: names.has('ai_context_sources'),
        },
      };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    getGeneratedArtifactById,
    listGeneratedArtifactsByOwner,
    listGeneratedArtifactsByCampaign,
    listGeneratedArtifactsByRuntimeSession,
    createGeneratedArtifact,
    updateGeneratedArtifact,
    archiveGeneratedArtifact,
    restoreGeneratedArtifact,
    getAiMemoryEntryById,
    listAiMemoryEntriesByOwner,
    listAiMemoryEntriesByCampaign,
    listAiMemoryEntriesByRuntimeSession,
    createAiMemoryEntry,
    updateAiMemoryEntry,
    archiveAiMemoryEntry,
    restoreAiMemoryEntry,
    getAiContextSourceById,
    listAiContextSourcesForArtifact,
    listAiContextSourcesForMemoryEntry,
    createAiContextSource,
    checkReadiness,
  };
}

const defaultPostgresGeneratedArtifactRepository = createPostgresGeneratedArtifactRepository();

export async function getGeneratedArtifactById(
  artifactId: string,
): Promise<PostgresGeneratedArtifactRepositoryResult<GeneratedArtifactRecord | null>> {
  return defaultPostgresGeneratedArtifactRepository.getGeneratedArtifactById(artifactId);
}

export async function getAiMemoryEntryById(
  memoryEntryId: string,
): Promise<PostgresGeneratedArtifactRepositoryResult<AiMemoryEntryRecord | null>> {
  return defaultPostgresGeneratedArtifactRepository.getAiMemoryEntryById(memoryEntryId);
}

export async function getAiContextSourceById(
  contextSourceId: string,
): Promise<PostgresGeneratedArtifactRepositoryResult<AiContextSourceRecord | null>> {
  return defaultPostgresGeneratedArtifactRepository.getAiContextSourceById(contextSourceId);
}

export async function checkPostgresGeneratedArtifactRepositoryReadiness(): Promise<
  PostgresGeneratedArtifactRepositoryResult<{ generatedArtifactsTable: boolean; aiMemoryEntriesTable: boolean; aiContextSourcesTable: boolean }>
> {
  return defaultPostgresGeneratedArtifactRepository.checkReadiness();
}
