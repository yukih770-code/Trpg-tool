/**
 * Storage adapter boundary contracts (v0, types only).
 *
 * AI-LANDMARK: STORAGE_ADAPTER_BOUNDARY_CONTRACTS_V0
 *
 * These are platform-level storage adapter boundary contracts for the portable
 * Room Server model. They describe storage domains, record references, operation
 * intents, capability summaries, and error shapes. They do not implement file
 * IO, database access, persistence, networking, serialization, or migrations.
 *
 * Boundary only: LAN / self-hosted / official deployments later implement this
 * via different adapters. The protocol must not bind to a specific database.
 * Platform-neutral (no DND/COC/CP RED rules); imports nothing.
 */

export type StorageDomain =
  | 'room'
  | 'session'
  | 'runtimeSnapshot'
  | 'runtimeLog'
  | 'mapState'
  | 'asset'
  | 'package'
  | 'member'
  | 'custom';

export type StorageAdapterKind =
  | 'memory'
  | 'localJson'
  | 'sqlite'
  | 'postgres'
  | 'cloudDatabase'
  | 'objectStorage'
  | 'custom';

export interface StorageRecordRef {
  domain: StorageDomain;
  recordId: string;
  roomId?: string;
  sessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StorageOperationKind =
  | 'read'
  | 'write'
  | 'append'
  | 'delete'
  | 'list'
  | 'snapshot'
  | 'restore'
  | 'custom';

/** Describes a storage operation request shape — no method/IO implemented. */
export interface StorageOperationIntent {
  operationId: string;
  kind: StorageOperationKind;
  domain: StorageDomain;
  recordRef?: StorageRecordRef;
  payload?: unknown;
  createdAt?: string;
}

export interface StorageAdapterCapabilitySummary {
  adapterKind: StorageAdapterKind;
  supportsPersistence: boolean;
  supportsAppendOnlyLog: boolean;
  supportsSnapshots: boolean;
  supportsAssetBlobs: boolean;
  supportsTransactions: boolean;
  supportsBackupRestore: boolean;
  note?: string;
}

export type StorageAdapterErrorKind =
  | 'notFound'
  | 'conflict'
  | 'permissionDenied'
  | 'quotaExceeded'
  | 'corruptData'
  | 'unsupportedOperation'
  | 'ioError'
  | 'custom';

export interface StorageAdapterErrorShape {
  errorId: string;
  kind: StorageAdapterErrorKind;
  message: string;
  domain?: StorageDomain;
  recordId?: string;
  retryable?: boolean;
  createdAt?: string;
}

export interface StorageSnapshotManifest {
  snapshotId: string;
  roomId?: string;
  sessionId?: string;
  includedDomains: StorageDomain[];
  recordRefs: StorageRecordRef[];
  createdAt?: string;
  note?: string;
}
