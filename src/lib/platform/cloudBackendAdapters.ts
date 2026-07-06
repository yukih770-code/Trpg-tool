/**
 * Cloud backend adapter boundary contracts (v0, types only).
 *
 * AI-LANDMARK: CLOUD_BACKEND_ADAPTER_BOUNDARY_CONTRACTS_V0
 *
 * These contracts describe identity, permission, object storage, and persistence
 * seams for a future cloud backend. They do not implement auth, database IO,
 * object storage IO, migrations, server protocol changes, RuntimeLog
 * persistence, or AI workflows.
 *
 * Vendor examples such as Supabase, Neon, R2, S3, Clerk, Redis, or NATS are
 * implementation choices behind adapters, not platform object boundaries.
 */

export type CloudAuthProviderKind =
  // P5.1: device-local anonymous identity (offline-first; no login, no provider).
  | 'localAnonymous'
  | 'custom'
  | 'external'
  | 'unknown';

export interface AuthIdentity {
  userId: string;
  providerKind: CloudAuthProviderKind;
  providerUserId?: string;
  displayName?: string;
  email?: string;
}

export type PlatformPermissionRole =
  | 'owner'
  | 'host'
  | 'coHost'
  | 'player'
  | 'spectator'
  | 'guest';

export interface PlatformPermissionContext {
  userId: string;
  role: PlatformPermissionRole;
  campaignId?: string;
  roomId?: string;
  actorId?: string;
  runtimeSessionId?: string;
}

export type ObjectStorageProviderKind =
  | 's3Compatible'
  | 'custom'
  | 'unknown';

export interface ObjectStorageRef {
  providerKind: ObjectStorageProviderKind;
  bucket: string;
  objectKey: string;
  contentType?: string;
  sizeBytes?: number;
  checksum?: string;
  publicUrl?: string;
}

export type PrimaryPersistenceStore =
  | 'postgres'
  | 'localDevMemory'
  | 'custom';

export interface PersistenceBoundaryNote {
  primaryDatabase: PrimaryPersistenceStore;
  runtimeAuthority: 'roomServer';
  objectStorage: ObjectStorageProviderKind;
  note?: string;
}

export interface CloudBackendAdapterBoundary {
  authIdentity: AuthIdentity;
  permissionContext: PlatformPermissionContext;
  persistence: PersistenceBoundaryNote;
}

/**
 * AI and clients may request drafts or submit intents. They must not bypass
 * backend permission checks or write authoritative room/runtime state directly.
 */
export interface AuthoritativeWriteBoundary {
  submittedByUserId: string;
  permissionContext: PlatformPermissionContext;
  requiresServerValidation: true;
  requiresHumanConfirmation?: boolean;
  note?: string;
}
