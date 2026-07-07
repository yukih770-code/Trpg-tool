/**
 * Cloud repository contract skeleton (P5.8 — contracts ONLY).
 *
 * AI-LANDMARK: CLOUD_REPOSITORY_CONTRACT_SKELETON_V1
 *
 * These are the FUTURE implementation contracts that cloud/Postgres/API-backed
 * repository adapters will implement. Nothing here connects to a database or a
 * network; nothing here is wired into the app.
 *
 * Boundary notes (read before implementing anything against this file):
 * - NO database access lives in the frontend — a future Postgres adapter is a
 *   BACKEND implementation reached through an API; the frontend only ever sees
 *   these vendor-neutral contract shapes.
 * - CURRENT ACTIVE IMPLEMENTATION stays local: localUserRepository (P5.1),
 *   actorVaultOwnership (P5.2), campaignOwnership (P5.3),
 *   localRepositoryAdapters (P5.6), campaignLocalRepositoryAdapter /
 *   localActorVaultReadAdapter (P5.7). None of them are changed by this file.
 * - Room Server protocol is UNCHANGED; the runtime-event contract below mirrors
 *   the existing P4.4 rules (append-only, server-assigned seq, afterSeq
 *   pagination, visibility metadata, no RuntimeLog in RoomSnapshot, no AI
 *   authoritative writes) without touching the live types.
 * - Vendor names (e.g. Prisma / Drizzle / node-postgres / Supabase / Neon) are
 *   implementation choices BEHIND a future adapter — they never appear in
 *   these types.
 *
 * Local → cloud mapping (documented, not forced):
 * - localUserRepository            → CloudUserRepositoryContract
 * - campaignLocalRepositoryAdapter → CloudCampaignRepositoryContract
 * - localActorVaultReadAdapter     → CloudActorRepositoryContract (read side)
 * - actorVaultOwnership /
 *   campaignOwnership registries   → getActorOwnership / campaign ownerId
 *                                    fields served by the cloud adapters
 * - Room Server RuntimeLog (P4.4)  → CloudRuntimeEventRepositoryContract
 * - mediaAsset seeds / ObjectStorageRef
 *                                  → CloudAssetMetadataRepositoryContract
 * Local adapters intentionally do NOT `implements` these contracts today
 * (they are sync + offline); the correspondence is kept by shape and comments
 * to avoid churn. When a cloud adapter lands, the repository/service boundary
 * (P5.6/P5.7 seams, repositoryComposition) selects between them.
 */

import type {
  AuthIdentity,
  ObjectStorageRef,
  PlatformPermissionContext,
} from './cloudBackendAdapters';
import type { ViewerContext } from '../architecture/projection';
import type { UserProfile } from './userProfile';
import type { CampaignInstanceSummary } from './campaignFlow';
import type {
  CreateLocalCampaignInput,
  LocalCampaign,
  UpdateLocalCampaignPatch,
} from './campaignLocalStore';
import type { ActorVaultRecord, ActorVaultSystemId } from './actorVaultRepositoryBridge';
import type { ActorOwnershipRecord } from './actorVaultOwnership';
import type {
  AppendRoomRuntimeLogEventInput,
  RoomRuntimeLogEvent,
} from './roomRuntimeLogTypes';

// ── Environment / health ─────────────────────────────────────────────────────

export type CloudRepositoryEnvironmentKind =
  | 'development'
  | 'staging'
  | 'production'
  | 'selfHosted';

export interface CloudRepositoryEnvironment {
  kind: CloudRepositoryEnvironmentKind;
  /** API base URL of the backend that fronts the database. Never a DB DSN. */
  apiBaseUrl?: string;
  region?: string;
  note?: string;
}

export type CloudRepositoryHealthStatus = 'ok' | 'degraded' | 'unavailable' | 'unknown';

export interface CloudRepositoryHealth {
  status: CloudRepositoryHealthStatus;
  checkedAt: string;
  latencyMs?: number;
  note?: string;
}

// ── Result / error boundary (non-throwing across the repository boundary) ────

export type CloudRepositoryErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

/**
 * The ONLY error shape that crosses the repository boundary. Raw vendor /
 * driver / HTTP errors must be translated into this by the adapter — callers
 * never see them and adapters never throw across the boundary.
 */
export interface CloudRepositoryError {
  kind: CloudRepositoryErrorKind;
  message: string;
  retryable?: boolean;
  /** Adapter-internal detail for logs/diagnostics; never shown in normal UI. */
  detail?: string;
}

export type CloudRepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CloudRepositoryError };

/** Cursor page. `nextCursor` is opaque (adapter-defined); absent = no more. */
export interface CloudRepositoryPage<T> {
  items: T[];
  nextCursor?: string;
  totalCount?: number;
}

/** Optimistic-concurrency conflict info attached to failed mutations. */
export interface CloudRepositoryConflict {
  entityId: string;
  entityType?: string;
  expectedRevision?: string;
  actualRevision?: string;
  note?: string;
}

export type CloudRepositoryMutationResult<T> =
  | { ok: true; value: T; revision?: string }
  | { ok: false; error: CloudRepositoryError; conflict?: CloudRepositoryConflict };

// ── Viewer / ownership / permission boundary ─────────────────────────────────

/**
 * How every cloud repository call receives "who is asking":
 * - `identity`   — WHO the user is (auth provider only IDENTIFIES; the local
 *                  anonymous user arrives as providerKind 'localAnonymous').
 * - `permission` — optional platform role context for the touched scope.
 * - `projection` — the P4 ViewerContext used for visibility decisions.
 * Permissions are DERIVED at the service/repository boundary from these —
 * never taken from a raw vendor auth object, which must not cross this
 * boundary. ownerId on returned records stays asset-ownership METADATA;
 * it is not itself an access decision.
 */
export interface CloudRepositoryViewer {
  identity: AuthIdentity;
  permission?: PlatformPermissionContext;
  projection: ViewerContext;
}

// ── Capability matrix ─────────────────────────────────────────────────────────

/** What a repository adapter supports. Honest flags — never aspirational. */
export interface CloudRepositoryCapabilities {
  supportsOffline: boolean;
  supportsServerAuthority: boolean;
  supportsTransactions: boolean;
  supportsAppendOnlyLog: boolean;
  supportsPagination: boolean;
  supportsOptimisticConcurrency: boolean;
  supportsObjectStorageRefs: boolean;
  /** Claiming local anonymous data into a real account (future flow). */
  supportsIdentityClaim: boolean;
  supportsMembership: boolean;
}

/** What TODAY's local adapters honestly support (they do not pretend more). */
export const LOCAL_ADAPTER_CAPABILITY_BASELINE: CloudRepositoryCapabilities = {
  supportsOffline: true,
  supportsServerAuthority: false,
  supportsTransactions: false,
  supportsAppendOnlyLog: false,
  supportsPagination: false,
  supportsOptimisticConcurrency: false,
  supportsObjectStorageRefs: false,
  supportsIdentityClaim: false,
  supportsMembership: false,
} as const;

// ── Domain contracts (future cloud adapters implement these) ─────────────────

/** Future cloud counterpart of `localUserRepository` (P5.1). */
export interface CloudUserRepositoryContract {
  getCurrentUser(viewer: CloudRepositoryViewer): Promise<CloudRepositoryResult<AuthIdentity>>;
  getUserById(userId: string, viewer: CloudRepositoryViewer): Promise<CloudRepositoryResult<UserProfile>>;
  saveUserProfile(
    profile: UserProfile,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryMutationResult<UserProfile>>;
}

/**
 * Future cloud counterpart of `campaignLocalRepositoryAdapter` (P5.7).
 * DTOs reuse the existing local campaign types on purpose: the persisted
 * LocalCampaign schema is stable and vendor-neutral. `ownerId` arrives as
 * summary metadata (see CampaignInstanceSummary.hostUserId compatibility note
 * in campaignFlow.ts).
 */
export interface CloudCampaignRepositoryContract {
  listOwnedCampaigns(
    viewer: CloudRepositoryViewer,
    cursor?: string,
  ): Promise<CloudRepositoryResult<CloudRepositoryPage<CampaignInstanceSummary>>>;
  getCampaignById(
    campaignId: string,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryResult<LocalCampaign>>;
  saveCampaignDraft(
    input: CreateLocalCampaignInput & { campaignId?: string; patch?: UpdateLocalCampaignPatch },
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryMutationResult<LocalCampaign>>;
  archiveCampaign(
    campaignId: string,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryMutationResult<LocalCampaign>>;
  restoreCampaign(
    campaignId: string,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryMutationResult<LocalCampaign>>;
}

/**
 * Future cloud counterpart of `localActorVaultReadAdapter` (P5.7) plus the
 * P5.2 ownership registry read. Full character-sheet payloads stay opaque
 * (`unknown` snapshot) — per-system schemas are not platform contracts.
 */
export interface CloudActorRepositoryContract {
  listOwnedActors(
    viewer: CloudRepositoryViewer,
    systemId?: ActorVaultSystemId,
    cursor?: string,
  ): Promise<CloudRepositoryResult<CloudRepositoryPage<ActorVaultRecord>>>;
  getActorById(
    systemId: ActorVaultSystemId,
    actorId: string,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryResult<ActorVaultRecord>>;
  saveActorSnapshot(
    systemId: ActorVaultSystemId,
    actorId: string,
    snapshot: unknown,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryMutationResult<ActorVaultRecord>>;
  getActorOwnership(
    systemId: ActorVaultSystemId,
    actorId: string,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryResult<ActorOwnershipRecord | undefined>>;
}

/**
 * Future cloud runtime-event store. Mirrors P4.4 / the live Room Server rules:
 * append-only; seq is SERVER-ASSIGNED and monotonic per room in cloud mode;
 * reads paginate with afterSeq; events carry visibility metadata and are
 * projected per viewer; RuntimeLog never rides in RoomSnapshot; AI never
 * writes authoritatively. NOT wired into the Room Server or WebSocket layer —
 * the live protocol types (roomRuntimeLogTypes) are reused, unchanged.
 */
export interface CloudRuntimeEventRepositoryContract {
  appendRuntimeEvent(
    roomId: string,
    input: AppendRoomRuntimeLogEventInput,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryMutationResult<RoomRuntimeLogEvent>>;
  listRuntimeEventsAfterSeq(
    roomId: string,
    afterSeq: number,
    viewer: CloudRepositoryViewer,
    limit?: number,
  ): Promise<CloudRepositoryResult<CloudRepositoryPage<RoomRuntimeLogEvent>>>;
  getLatestSeq(
    roomId: string,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryResult<number>>;
}

/** Asset METADATA only — blobs live behind ObjectStorageRef, never inline. */
export interface CloudAssetMetadataRecord {
  assetId: string;
  ownerId: string;
  storageRef: ObjectStorageRef;
  title?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CloudAssetMetadataRepositoryContract {
  createAssetMetadata(
    record: Omit<CloudAssetMetadataRecord, 'createdAt' | 'updatedAt'>,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryMutationResult<CloudAssetMetadataRecord>>;
  getAssetMetadata(
    assetId: string,
    viewer: CloudRepositoryViewer,
  ): Promise<CloudRepositoryResult<CloudAssetMetadataRecord>>;
  listAssetsForOwner(
    ownerId: string,
    viewer: CloudRepositoryViewer,
    cursor?: string,
  ): Promise<CloudRepositoryResult<CloudRepositoryPage<CloudAssetMetadataRecord>>>;
}

// ── Adapter boundary grouping + selection ────────────────────────────────────

/**
 * Future implementation-selection kind. NOT wired anywhere today: the app has
 * no toggle, no env switch, no runtime-mode change — 'local' is the only
 * active implementation. Selection will live at the repository composition
 * boundary (repositoryComposition / P5.6-P5.7 seams), never in UI.
 */
export type RepositoryImplementationKind = 'local' | 'cloud' | 'hybrid';

/** Everything a future cloud adapter package hands to the composition root. */
export interface CloudRepositoryAdapterBoundary {
  kind: Extract<RepositoryImplementationKind, 'cloud'>;
  environment: CloudRepositoryEnvironment;
  capabilities: CloudRepositoryCapabilities;
  health?: CloudRepositoryHealth;
  users: CloudUserRepositoryContract;
  campaigns: CloudCampaignRepositoryContract;
  actors: CloudActorRepositoryContract;
  runtimeEvents: CloudRuntimeEventRepositoryContract;
  assetMetadata: CloudAssetMetadataRepositoryContract;
}

// ── Contract-level diagnostics (pure; no network, no UI) ─────────────────────

export const CLOUD_REPOSITORY_CONTRACT_VERSION = 'v1' as const;

export interface CloudRepositoryContractReadiness {
  contractVersion: typeof CLOUD_REPOSITORY_CONTRACT_VERSION;
  /** Contract surface exists (this module compiled and is importable). */
  contractsDefined: true;
  /** No implementation is registered — local adapters remain active. */
  activeImplementation: Extract<RepositoryImplementationKind, 'local'>;
}

/** Pure readiness report: contracts exist; 'local' remains the active impl. */
export function getCloudRepositoryContractReadiness(): CloudRepositoryContractReadiness {
  return {
    contractVersion: CLOUD_REPOSITORY_CONTRACT_VERSION,
    contractsDefined: true,
    activeImplementation: 'local',
  };
}
