import type { QueryResult, QueryResultRow } from 'pg';

import { PostgresDatabaseError, queryPostgres } from '../db/postgresClient.js';

/**
 * Postgres Asset / Media metadata repository (P5.13A) — server-only.
 *
 * Mirrors the User/Campaign/Actor first slices: a safe result envelope, an
 * injectable query executor (transaction-friendly), and DB error mapping that
 * NEVER leaks raw driver errors or credentials.
 *
 * METADATA ONLY. Binary blobs are never stored in Postgres. `object_storage_refs`
 * is a vendor-neutral pointer (bucket/object_key/url); this slice performs no
 * upload/download, no signed URLs, no provider SDK. `external_url` supports today's
 * URL-referenced assets that have no managed blob (storage_ref_id null).
 *
 * `owner_id` is the asset owner (users.user_id). `campaign_id` is an OPTIONAL
 * association, NOT a permission model.
 */

export type PostgresAssetRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresAssetRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresAssetRepositoryErrorKind;
        message: string;
        retryable?: boolean;
      };
    };

// ── Object storage ref ───────────────────────────────────────────────────────

export interface ObjectStorageRefRecord {
  storageRefId: string;
  ownerId: string;
  providerKind: string;
  bucket?: string;
  objectKey?: string;
  url?: string;
  contentHash?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateStorageRefInput {
  storageRefId: string;
  ownerId: string;
  providerKind: string;
  bucket?: string;
  objectKey?: string;
  url?: string;
  contentHash?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateStorageRefInput {
  storageRefId: string;
  bucket?: string;
  objectKey?: string;
  url?: string;
  contentHash?: string;
  payload?: Record<string, unknown>;
}

// ── Asset metadata ───────────────────────────────────────────────────────────

export interface AssetMetadataRecord {
  assetId: string;
  ownerId: string;
  campaignId?: string;
  assetKind: string;
  title: string;
  description?: string;
  mimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  storageRefId?: string;
  externalUrl?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
}

export interface CreateAssetInput {
  assetId: string;
  ownerId: string;
  campaignId?: string;
  assetKind: string;
  title: string;
  description?: string;
  mimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  storageRefId?: string;
  externalUrl?: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
}

export interface UpdateAssetInput {
  assetId: string;
  title?: string;
  description?: string;
  mimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  storageRefId?: string;
  externalUrl?: string;
  payload?: Record<string, unknown>;
}

export interface ListAssetsOptions {
  assetKind?: string;
  includeArchived?: boolean;
  limit?: number;
}

export interface PostgresAssetRepositoryExecutor {
  query<T extends QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
}

export interface PostgresAssetRepositoryOptions {
  /** Defaults true; smoke tests pass an already-transactional client with false. */
  useInternalTransactions?: boolean;
}

export interface PostgresAssetRepository {
  // Object storage refs
  getStorageRefById(storageRefId: string): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>>;
  createStorageRef(input: CreateStorageRefInput): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord>>;
  updateStorageRef(input: UpdateStorageRefInput): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>>;
  archiveStorageRef(
    storageRefId: string,
    archivedAt?: string,
  ): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>>;
  restoreStorageRef(storageRefId: string): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>>;
  // Asset metadata
  getAssetById(assetId: string): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>>;
  listAssetsByOwner(
    ownerId: string,
    options?: ListAssetsOptions,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord[]>>;
  listAssetsByCampaign(
    campaignId: string,
    options?: ListAssetsOptions,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord[]>>;
  createAsset(input: CreateAssetInput): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord>>;
  updateAsset(input: UpdateAssetInput): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>>;
  archiveAsset(
    assetId: string,
    archivedAt?: string,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>>;
  restoreAsset(assetId: string): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>>;
  checkReadiness(): Promise<PostgresAssetRepositoryResult<{ assetMetadataTable: boolean; objectStorageRefsTable: boolean }>>;
}

interface StorageRefRow extends QueryResultRow {
  storage_ref_id: string;
  owner_id: string;
  provider_kind: string;
  bucket: string | null;
  object_key: string | null;
  url: string | null;
  content_hash: string | null;
  metadata_payload: unknown;
  schema_version: number;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
}

interface AssetRow extends QueryResultRow {
  asset_id: string;
  owner_id: string;
  campaign_id: string | null;
  asset_kind: string;
  title: string;
  description: string | null;
  mime_type: string | null;
  file_name: string | null;
  file_size_bytes: string | number | null;
  storage_ref_id: string | null;
  external_url: string | null;
  metadata_payload: unknown;
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

function toOptionalNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function rowToStorageRef(row: StorageRefRow): ObjectStorageRefRecord {
  return {
    storageRefId: row.storage_ref_id,
    ownerId: row.owner_id,
    providerKind: row.provider_kind,
    bucket: row.bucket ?? undefined,
    objectKey: row.object_key ?? undefined,
    url: row.url ?? undefined,
    contentHash: row.content_hash ?? undefined,
    payload: toPayload(row.metadata_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function rowToAsset(row: AssetRow): AssetMetadataRecord {
  return {
    assetId: row.asset_id,
    ownerId: row.owner_id,
    campaignId: row.campaign_id ?? undefined,
    assetKind: row.asset_kind,
    title: row.title,
    description: row.description ?? undefined,
    mimeType: row.mime_type ?? undefined,
    fileName: row.file_name ?? undefined,
    fileSizeBytes: toOptionalNumber(row.file_size_bytes),
    storageRefId: row.storage_ref_id ?? undefined,
    externalUrl: row.external_url ?? undefined,
    payload: toPayload(row.metadata_payload),
    schemaVersion: row.schema_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    archivedAt: toIso(row.archived_at),
  };
}

function mapRepositoryError(error: unknown): PostgresAssetRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return { ok: false, error: { kind: 'not_configured', message: 'DATABASE_URL is not configured.' } };
  }
  if (error instanceof PostgresDatabaseError && error.message === 'schema_missing') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Asset repository table is missing.' } };
  }
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '23505') {
    return { ok: false, error: { kind: 'conflict', message: 'Asset row already exists.' } };
  }
  if (code === '23503') {
    return { ok: false, error: { kind: 'conflict', message: 'Asset references a missing owner/campaign/storage ref.' } };
  }
  if (code === '42P01') {
    return { ok: false, error: { kind: 'schema_missing', message: 'Asset repository table is missing.' } };
  }
  const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  return { ok: false, error: { kind: 'database_error', message: 'Asset repository query failed.', retryable } };
}

const STORAGE_REF_SELECT = `
  SELECT
    storage_ref_id, owner_id, provider_kind, bucket, object_key, url,
    content_hash, metadata_payload, schema_version, created_at, updated_at, archived_at
  FROM object_storage_refs
`;

const STORAGE_REF_RETURNING = `
  storage_ref_id, owner_id, provider_kind, bucket, object_key, url,
  content_hash, metadata_payload, schema_version, created_at, updated_at, archived_at
`;

const ASSET_SELECT = `
  SELECT
    asset_id, owner_id, campaign_id, asset_kind, title, description, mime_type,
    file_name, file_size_bytes, storage_ref_id, external_url, metadata_payload,
    schema_version, created_at, updated_at, archived_at
  FROM asset_metadata
`;

const ASSET_RETURNING = `
  asset_id, owner_id, campaign_id, asset_kind, title, description, mime_type,
  file_name, file_size_bytes, storage_ref_id, external_url, metadata_payload,
  schema_version, created_at, updated_at, archived_at
`;

const defaultExecutor: PostgresAssetRepositoryExecutor = {
  query: (text, values) => queryPostgres(text, values),
};

export function createPostgresAssetRepository(
  executor: PostgresAssetRepositoryExecutor = defaultExecutor,
  _options: PostgresAssetRepositoryOptions = {},
): PostgresAssetRepository {
  // ── Object storage refs ──────────────────────────────────────────────────

  async function getStorageRefById(
    storageRefId: string,
  ): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>> {
    try {
      const result = await executor.query<StorageRefRow>(
        `${STORAGE_REF_SELECT} WHERE storage_ref_id = $1 LIMIT 1`,
        [storageRefId],
      );
      return { ok: true, value: result.rows[0] ? rowToStorageRef(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createStorageRef(
    input: CreateStorageRefInput,
  ): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord>> {
    const now = new Date().toISOString();
    const record: ObjectStorageRefRecord = {
      storageRefId: input.storageRefId,
      ownerId: input.ownerId,
      providerKind: input.providerKind,
      bucket: input.bucket,
      objectKey: input.objectKey,
      url: input.url,
      contentHash: input.contentHash,
      payload: input.payload ?? {},
      schemaVersion: input.schemaVersion ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await executor.query(
        `
          INSERT INTO object_storage_refs (
            storage_ref_id, owner_id, provider_kind, bucket, object_key, url,
            content_hash, metadata_payload, schema_version, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $10)
        `,
        [
          record.storageRefId,
          record.ownerId,
          record.providerKind,
          record.bucket ?? null,
          record.objectKey ?? null,
          record.url ?? null,
          record.contentHash ?? null,
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

  async function updateStorageRef(
    input: UpdateStorageRefInput,
  ): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<StorageRefRow>(
        `
          UPDATE object_storage_refs SET
            bucket = COALESCE($2, bucket),
            object_key = COALESCE($3, object_key),
            url = COALESCE($4, url),
            content_hash = COALESCE($5, content_hash),
            metadata_payload = COALESCE($6::jsonb, metadata_payload),
            updated_at = $7
          WHERE storage_ref_id = $1
          RETURNING ${STORAGE_REF_RETURNING}
        `,
        [
          input.storageRefId,
          input.bucket ?? null,
          input.objectKey ?? null,
          input.url ?? null,
          input.contentHash ?? null,
          input.payload === undefined ? null : JSON.stringify(input.payload),
          now,
        ],
      );
      return { ok: true, value: result.rows[0] ? rowToStorageRef(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function archiveStorageRef(
    storageRefId: string,
    archivedAt?: string,
  ): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>> {
    const at = archivedAt ?? new Date().toISOString();
    try {
      const result = await executor.query<StorageRefRow>(
        `
          UPDATE object_storage_refs SET archived_at = $2, updated_at = $2
          WHERE storage_ref_id = $1
          RETURNING ${STORAGE_REF_RETURNING}
        `,
        [storageRefId, at],
      );
      return { ok: true, value: result.rows[0] ? rowToStorageRef(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function restoreStorageRef(
    storageRefId: string,
  ): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<StorageRefRow>(
        `
          UPDATE object_storage_refs SET archived_at = NULL, updated_at = $2
          WHERE storage_ref_id = $1
          RETURNING ${STORAGE_REF_RETURNING}
        `,
        [storageRefId, now],
      );
      return { ok: true, value: result.rows[0] ? rowToStorageRef(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  // ── Asset metadata ─────────────────────────────────────────────────────────

  async function getAssetById(
    assetId: string,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>> {
    try {
      const result = await executor.query<AssetRow>(
        `${ASSET_SELECT} WHERE asset_id = $1 LIMIT 1`,
        [assetId],
      );
      return { ok: true, value: result.rows[0] ? rowToAsset(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  function listAssetsWhere(
    column: 'owner_id' | 'campaign_id',
    value: string,
    options: ListAssetsOptions,
  ): Promise<QueryResult<AssetRow>> {
    const conditions = [`${column} = $1`];
    const values: unknown[] = [value];
    if (options.assetKind) {
      values.push(options.assetKind);
      conditions.push(`asset_kind = $${values.length}`);
    }
    if (!options.includeArchived) {
      conditions.push('archived_at IS NULL');
    }
    const limit = Number.isInteger(options.limit) && (options.limit as number) > 0 ? (options.limit as number) : 200;
    values.push(limit);
    return executor.query<AssetRow>(
      `${ASSET_SELECT}
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC
       LIMIT $${values.length}`,
      values,
    );
  }

  async function listAssetsByOwner(
    ownerId: string,
    options: ListAssetsOptions = {},
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord[]>> {
    try {
      const result = await listAssetsWhere('owner_id', ownerId, options);
      return { ok: true, value: result.rows.map(rowToAsset) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function listAssetsByCampaign(
    campaignId: string,
    options: ListAssetsOptions = {},
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord[]>> {
    try {
      const result = await listAssetsWhere('campaign_id', campaignId, options);
      return { ok: true, value: result.rows.map(rowToAsset) };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function createAsset(
    input: CreateAssetInput,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord>> {
    const now = new Date().toISOString();
    const record: AssetMetadataRecord = {
      assetId: input.assetId,
      ownerId: input.ownerId,
      campaignId: input.campaignId,
      assetKind: input.assetKind,
      title: input.title,
      description: input.description,
      mimeType: input.mimeType,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      storageRefId: input.storageRefId,
      externalUrl: input.externalUrl,
      payload: input.payload ?? {},
      schemaVersion: input.schemaVersion ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await executor.query(
        `
          INSERT INTO asset_metadata (
            asset_id, owner_id, campaign_id, asset_kind, title, description,
            mime_type, file_name, file_size_bytes, storage_ref_id, external_url,
            metadata_payload, schema_version, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $14)
        `,
        [
          record.assetId,
          record.ownerId,
          record.campaignId ?? null,
          record.assetKind,
          record.title,
          record.description ?? null,
          record.mimeType ?? null,
          record.fileName ?? null,
          record.fileSizeBytes ?? null,
          record.storageRefId ?? null,
          record.externalUrl ?? null,
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

  async function updateAsset(
    input: UpdateAssetInput,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<AssetRow>(
        `
          UPDATE asset_metadata SET
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            mime_type = COALESCE($4, mime_type),
            file_name = COALESCE($5, file_name),
            file_size_bytes = COALESCE($6, file_size_bytes),
            storage_ref_id = COALESCE($7, storage_ref_id),
            external_url = COALESCE($8, external_url),
            metadata_payload = COALESCE($9::jsonb, metadata_payload),
            updated_at = $10
          WHERE asset_id = $1
          RETURNING ${ASSET_RETURNING}
        `,
        [
          input.assetId,
          input.title ?? null,
          input.description ?? null,
          input.mimeType ?? null,
          input.fileName ?? null,
          input.fileSizeBytes ?? null,
          input.storageRefId ?? null,
          input.externalUrl ?? null,
          input.payload === undefined ? null : JSON.stringify(input.payload),
          now,
        ],
      );
      return { ok: true, value: result.rows[0] ? rowToAsset(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function archiveAsset(
    assetId: string,
    archivedAt?: string,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>> {
    const at = archivedAt ?? new Date().toISOString();
    try {
      const result = await executor.query<AssetRow>(
        `
          UPDATE asset_metadata SET archived_at = $2, updated_at = $2
          WHERE asset_id = $1
          RETURNING ${ASSET_RETURNING}
        `,
        [assetId, at],
      );
      return { ok: true, value: result.rows[0] ? rowToAsset(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function restoreAsset(
    assetId: string,
  ): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>> {
    const now = new Date().toISOString();
    try {
      const result = await executor.query<AssetRow>(
        `
          UPDATE asset_metadata SET archived_at = NULL, updated_at = $2
          WHERE asset_id = $1
          RETURNING ${ASSET_RETURNING}
        `,
        [assetId, now],
      );
      return { ok: true, value: result.rows[0] ? rowToAsset(result.rows[0]) : null };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async function checkReadiness(): Promise<
    PostgresAssetRepositoryResult<{ assetMetadataTable: boolean; objectStorageRefsTable: boolean }>
  > {
    try {
      const result = await executor.query<{ table_name: string }>(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name IN ('asset_metadata', 'object_storage_refs')
        `,
      );
      const names = new Set(result.rows.map((row) => row.table_name));
      return {
        ok: true,
        value: {
          assetMetadataTable: names.has('asset_metadata'),
          objectStorageRefsTable: names.has('object_storage_refs'),
        },
      };
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  return {
    getStorageRefById,
    createStorageRef,
    updateStorageRef,
    archiveStorageRef,
    restoreStorageRef,
    getAssetById,
    listAssetsByOwner,
    listAssetsByCampaign,
    createAsset,
    updateAsset,
    archiveAsset,
    restoreAsset,
    checkReadiness,
  };
}

const defaultPostgresAssetRepository = createPostgresAssetRepository();

export async function getAssetById(
  assetId: string,
): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord | null>> {
  return defaultPostgresAssetRepository.getAssetById(assetId);
}

export async function getStorageRefById(
  storageRefId: string,
): Promise<PostgresAssetRepositoryResult<ObjectStorageRefRecord | null>> {
  return defaultPostgresAssetRepository.getStorageRefById(storageRefId);
}

export async function listAssetsByOwner(
  ownerId: string,
  options?: ListAssetsOptions,
): Promise<PostgresAssetRepositoryResult<AssetMetadataRecord[]>> {
  return defaultPostgresAssetRepository.listAssetsByOwner(ownerId, options);
}

export async function checkPostgresAssetRepositoryReadiness(): Promise<
  PostgresAssetRepositoryResult<{ assetMetadataTable: boolean; objectStorageRefsTable: boolean }>
> {
  return defaultPostgresAssetRepository.checkReadiness();
}
