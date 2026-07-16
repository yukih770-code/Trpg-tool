import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';

export type SceneStateRepositoryErrorKind = 'not_configured' | 'schema_missing' | 'conflict' | 'not_found' | 'database_error';
export type SceneStateRepositoryResult<T> = { ok: true; value: T } | { ok: false; error: { kind: SceneStateRepositoryErrorKind; message: string; retryable?: boolean } };

export interface SceneStateDocumentRecord {
  sceneStateId: string;
  worldServerId: string;
  campaignId: string;
  roomId: string;
  runtimeSessionId?: string;
  title: string;
  description?: string;
  schemaVersion: number;
  stateJson: Record<string, unknown>;
  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  sourceSceneStateId?: string;
}

export interface CreateSceneStateInput {
  sceneStateId: string;
  worldServerId: string;
  campaignId: string;
  roomId: string;
  runtimeSessionId?: string;
  title: string;
  description?: string;
  schemaVersion?: number;
  stateJson: Record<string, unknown>;
  createdByUserId?: string;
  sourceSceneStateId?: string;
}

export interface UpdateSceneStateMetadataInput { sceneStateId: string; title?: string; description?: string | null; }
export interface DuplicateSceneStateInput { sceneStateId: string; sourceSceneStateId: string; title?: string; createdByUserId?: string; }
export interface SceneStateRepositoryExecutor { query<T extends QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<T>>; }

const COLS = 'scene_state_id,world_server_id,campaign_id,room_id,runtime_session_id,title,description,schema_version,state_json,created_by_user_id,created_at,updated_at,archived_at,source_scene_state_id';
const iso = (value: Date | string | null | undefined) => value ? value instanceof Date ? value.toISOString() : value : undefined;
const payload = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
function record(row: Record<string, unknown>): SceneStateDocumentRecord {
  return { sceneStateId: String(row.scene_state_id), worldServerId: String(row.world_server_id), campaignId: String(row.campaign_id), roomId: String(row.room_id), runtimeSessionId: row.runtime_session_id ? String(row.runtime_session_id) : undefined, title: String(row.title), description: row.description ? String(row.description) : undefined, schemaVersion: Number(row.schema_version), stateJson: payload(row.state_json), createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : undefined, createdAt: iso(row.created_at as Date | string | null), updatedAt: iso(row.updated_at as Date | string | null), archivedAt: iso(row.archived_at as Date | string | null), sourceSceneStateId: row.source_scene_state_id ? String(row.source_scene_state_id) : undefined };
}
function failure(error: unknown): SceneStateRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') return { ok: false, error: { kind: 'not_configured', message: 'Scene state repository is not configured.' } };
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '42P01') return { ok: false, error: { kind: 'schema_missing', message: 'Scene state schema is missing.' } };
  if (code === '23505') return { ok: false, error: { kind: 'conflict', message: 'Scene state already exists.' } };
  return { ok: false, error: { kind: 'database_error', message: 'Scene state request failed.' } };
}

export interface PostgresSceneStateRepository {
  listSceneStates(worldServerId: string, campaignId: string, roomId: string, includeArchived?: boolean): Promise<SceneStateRepositoryResult<SceneStateDocumentRecord[]>>;
  getSceneState(sceneStateId: string): Promise<SceneStateRepositoryResult<SceneStateDocumentRecord | null>>;
  createSceneState(input: CreateSceneStateInput): Promise<SceneStateRepositoryResult<SceneStateDocumentRecord>>;
  updateSceneStateMetadata(input: UpdateSceneStateMetadataInput): Promise<SceneStateRepositoryResult<SceneStateDocumentRecord | null>>;
  archiveSceneState(sceneStateId: string): Promise<SceneStateRepositoryResult<SceneStateDocumentRecord | null>>;
  duplicateSceneState(input: DuplicateSceneStateInput): Promise<SceneStateRepositoryResult<SceneStateDocumentRecord>>;
}

export function createPostgresSceneStateRepository(executor: SceneStateRepositoryExecutor = { query: queryPostgres }): PostgresSceneStateRepository {
  async function one(text: string, values: readonly unknown[]): Promise<SceneStateRepositoryResult<SceneStateDocumentRecord | null>> { try { const result = await executor.query<Record<string, unknown>>(text, values); return { ok: true, value: result.rows[0] ? record(result.rows[0]) : null }; } catch (error) { return failure(error); } }
  return {
    async listSceneStates(worldServerId, campaignId, roomId, includeArchived = false) { try { const result = await executor.query<Record<string, unknown>>(`SELECT ${COLS} FROM scene_state_documents WHERE world_server_id=$1 AND campaign_id=$2 AND room_id=$3 ${includeArchived ? '' : 'AND archived_at IS NULL'} ORDER BY updated_at DESC LIMIT 200`, [worldServerId, campaignId, roomId]); return { ok: true, value: result.rows.map(record) }; } catch (error) { return failure(error); } },
    async getSceneState(sceneStateId) { return one(`SELECT ${COLS} FROM scene_state_documents WHERE scene_state_id=$1 LIMIT 1`, [sceneStateId]); },
    async createSceneState(input) { const now = new Date().toISOString(); const result = await one(`INSERT INTO scene_state_documents (${COLS}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,NULL,$13) RETURNING ${COLS}`, [input.sceneStateId, input.worldServerId, input.campaignId, input.roomId, input.runtimeSessionId ?? null, input.title, input.description ?? null, input.schemaVersion ?? 1, JSON.stringify(input.stateJson), input.createdByUserId ?? null, now, now, input.sourceSceneStateId ?? null]); return result.ok && result.value ? { ok: true, value: result.value } : result.ok ? { ok: false, error: { kind: 'database_error', message: 'Scene state was not created.' } } : result; },
    async updateSceneStateMetadata(input) {
      return one(
        `UPDATE scene_state_documents
         SET title=COALESCE($2,title),
             description=CASE WHEN $3 THEN $4 ELSE description END,
             updated_at=$5
         WHERE scene_state_id=$1 AND archived_at IS NULL
         RETURNING ${COLS}`,
        [input.sceneStateId, input.title?.trim() || null, input.description !== undefined, input.description?.trim() || null, new Date().toISOString()],
      );
    },
    async archiveSceneState(sceneStateId) { return one(`UPDATE scene_state_documents SET archived_at=$2, updated_at=$2 WHERE scene_state_id=$1 AND archived_at IS NULL RETURNING ${COLS}`, [sceneStateId, new Date().toISOString()]); },
    async duplicateSceneState(input) { const now = new Date().toISOString(); const result = await one(`INSERT INTO scene_state_documents (${COLS}) SELECT $1,world_server_id,campaign_id,room_id,runtime_session_id,COALESCE($3,title || ' copy'),description,schema_version,state_json,$4,$5,$5,NULL,$2 FROM scene_state_documents WHERE scene_state_id=$2 AND archived_at IS NULL RETURNING ${COLS}`, [input.sceneStateId, input.sourceSceneStateId, input.title?.trim() || null, input.createdByUserId ?? null, now]); return result.ok && result.value ? { ok: true, value: result.value } : result.ok ? { ok: false, error: { kind: 'not_found', message: 'Scene state was not found.' } } : result; },
  };
}
