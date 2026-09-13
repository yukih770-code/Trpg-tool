import { randomUUID, createHash } from 'node:crypto';
import sharp, { type OutputInfo } from 'sharp';
import { createPostgresAssetRepository, type AssetMetadataRecord, type ObjectStorageRefRecord, type PostgresAssetRepository } from '../adapters/postgresAssetRepository.js';
import { withPostgresClient } from '../db/postgresClient.js';
import type { AssetObjectStore } from '../storage/assetObjectStore.js';
import type { MediaAssetSummary } from '../../src/lib/architecture/mediaAsset.js';

export const ASSET_UPLOAD_LIMIT = 20 * 1024 * 1024;
export class AssetError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
export type AssetRepository = Pick<PostgresAssetRepository, 'getAssetById' | 'getStorageRefById' | 'listAssetsByOwner'>;
export type CommitAsset = (asset: AssetMetadataRecord, storage: ObjectStorageRefRecord) => Promise<void>;

/** The existing two metadata tables commit together; no additional Asset table. */
export const commitPostgresAsset: CommitAsset = (asset, storage) => withPostgresClient(async client => {
  await client.query('BEGIN');
  try {
    const repository = createPostgresAssetRepository(client);
    const ref = await repository.createStorageRef(storage);
    if (!ref.ok) throw new AssetError('asset_metadata_unavailable', 503);
    const result = await repository.createAsset(asset);
    if (!result.ok) throw new AssetError('asset_metadata_unavailable', 503);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
});

function summary(asset: AssetMetadataRecord): MediaAssetSummary {
  return { id: asset.assetId, kind: asset.assetKind === 'map' ? 'map' : 'image', status: 'published', visibility: 'private', title: asset.title,
    width: typeof asset.payload.width === 'number' ? asset.payload.width : undefined,
    height: typeof asset.payload.height === 'number' ? asset.payload.height : undefined };
}

export function createPlatformAssets(options: {
  store: AssetObjectStore; repository?: AssetRepository; commit?: CommitAsset;
}) {
  const repository = options.repository ?? createPostgresAssetRepository();
  return {
    async upload(ownerId: string, input: Buffer, declaredMime: string, title: string, kind: 'map' | 'image') {
      if (!input.length || input.length > ASSET_UPLOAD_LIMIT) throw new AssetError('image_size_limit', 413);
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(declaredMime)) throw new AssetError('unsupported_image', 415);
      let normalized: { data: Buffer; info: OutputInfo };
      try {
        const image = sharp(input, { limitInputPixels: 40_000_000, failOn: 'warning' });
        const meta = await image.metadata();
        if (!meta.format || !['png', 'jpeg', 'webp'].includes(meta.format) || `image/${meta.format}` !== declaredMime || (meta.pages ?? 1) !== 1) throw new Error('invalid_format');
        // Decode and re-encode: reject corrupt files and strip EXIF, scripts and trailing data.
        normalized = await image.rotate().webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
      } catch { throw new AssetError('invalid_image', 415); }
      if (normalized.data.length > ASSET_UPLOAD_LIMIT) throw new AssetError('image_size_limit', 413);
      const id = randomUUID(), storageRefId = randomUUID(), key = `${id}.webp`;
      const storage: ObjectStorageRefRecord = { storageRefId, ownerId, providerKind: 'local-filesystem-v1', objectKey: key,
        contentHash: createHash('sha256').update(normalized.data).digest('hex'), payload: {}, schemaVersion: 1 };
      const asset: AssetMetadataRecord = { assetId: id, ownerId, assetKind: kind, title: title.trim().slice(0, 120) || 'Image', mimeType: 'image/webp',
        fileSizeBytes: normalized.data.length, storageRefId, payload: { visibility: 'private', width: normalized.info.width, height: normalized.info.height }, schemaVersion: 1 };
      await options.store.put(key, normalized.data);
      // Retain bytes on an uncertain database commit. An unreachable orphan is
      // preferable to deleting bytes whose metadata may already be committed.
      await (options.commit ?? commitPostgresAsset)(asset, storage);
      return summary(asset);
    },
    async list(ownerId: string) {
      const result = await repository.listAssetsByOwner(ownerId);
      if (!result.ok) throw new AssetError('asset_metadata_unavailable', 503);
      return result.value.filter(a => a.storageRefId && !a.archivedAt && ['map', 'image'].includes(a.assetKind)).map(summary);
    },
    async get(assetId: string) {
      if (!/^[0-9a-f-]{36}$/.test(assetId)) throw new AssetError('asset_not_found', 404);
      const result = await repository.getAssetById(assetId);
      if (!result.ok) throw new AssetError('asset_metadata_unavailable', 503);
      if (!result.value || result.value.archivedAt || !result.value.storageRefId) throw new AssetError('asset_not_found', 404);
      return result.value;
    },
    async read(asset: AssetMetadataRecord) {
      const result = await repository.getStorageRefById(asset.storageRefId!);
      if (!result.ok) throw new AssetError('asset_storage_unavailable', 503);
      const ref = result.value;
      if (!ref || ref.archivedAt || ref.ownerId !== asset.ownerId || ref.providerKind !== 'local-filesystem-v1' || !ref.objectKey) throw new AssetError('asset_not_found', 404);
      return options.store.read(ref.objectKey);
    },
  };
}
