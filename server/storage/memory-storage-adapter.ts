/**
 * In-memory storage adapter stub (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_MEMORY_STORAGE_V0
 *
 * Capability description only — no read/write methods, no persistence, no IO.
 * Future deployments swap in real adapters per the M8 storage boundary.
 */

import type { StorageAdapterCapabilitySummary } from '../protocol/room-protocol.js';

export const MEMORY_STORAGE_CAPABILITY: StorageAdapterCapabilitySummary = {
  adapterKind: 'memory',
  supportsPersistence: false,
  supportsAppendOnlyLog: false,
  supportsSnapshots: false,
  supportsAssetBlobs: false,
  supportsTransactions: false,
  supportsBackupRestore: false,
  note: 'In-memory scaffold only; no persistence.',
};
