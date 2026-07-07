/**
 * Local read adapters for repository / service layers (P5.6).
 *
 * AI-LANDMARK: LOCAL_REPOSITORY_READ_ADAPTERS_V1
 *
 * A thin, explicit ADAPTER BOUNDARY between the repository/service layer and
 * the P5 local identity / ownership primitives. Everything here DELEGATES to
 * the existing P5 modules — no second identity system, no second ownership
 * registry, no new storage.
 *
 * Boundary notes:
 * - This is a LOCAL READ adapter layer: read-side only, metadata only.
 * - It is NOT cloud auth and NOT permission enforcement — ownership stays
 *   metadata; projection/permission decisions live in P4 `projection.ts`.
 * - Future cloud/Postgres-backed implementations replace these DEFAULT
 *   adapters at the repository/service boundary; UI never rewires.
 * - Dependency direction: UI → repository/service → THIS adapter → P5 local
 *   primitives. P5 primitives never import repositories or UI.
 */

import type { ViewerContext } from '../architecture/projection';
import type { UserProfile } from './userProfile';
import {
  getCurrentLocalProfileUserId,
  getCurrentLocalUserProfile,
  getCurrentLocalViewerContext,
  isLegacySampleOwnerId,
  resolveSeedOwnerIdForCurrentUser,
  seedOwnerMatchesUser,
} from './localViewerIdentity';
import { localUserRepository } from './localUserIdentity';
import {
  getActorOwnerId,
  getActorOwnershipRecord,
  type ActorOwnershipRecord,
} from './actorVaultOwnership';
import {
  getCampaignOwnerId,
  getCampaignOwnershipLabel,
  getCampaignOwnershipRecord,
  type CampaignOwnershipRecord,
} from './campaignOwnership';
import {
  getLocalPersistenceDiagnostics,
  type LocalPersistenceDiagnostics,
} from './localPersistenceAdapter';
// P5.7: local repository adapter availability probes (diagnostics only).
import { localActorVaultReadAdapter } from './actorVaultRepositoryBridge';
import { localCampaignRepositoryAdapter } from './campaignLocalRepositoryAdapter';

// ── Read adapter interfaces (narrow; read-side only) ─────────────────────────

/** Who is looking? (current device-local viewer; future: cloud session viewer) */
export interface ViewerContextReader {
  getCurrentViewer(): ViewerContext;
  getCurrentProfileUserId(): string;
  getCurrentUserProfile(): UserProfile;
}

/** Actor ownership metadata reads (registry-backed; never permission). */
export interface ActorOwnershipReader {
  getActorOwnerId(systemId: string, actorId: string): string | undefined;
  getActorOwnershipRecord(systemId: string, actorId: string): ActorOwnershipRecord | undefined;
  /** Productized copy only — never a raw ownerId for normal UI. */
  getActorOwnershipLabel(systemId: string, actorId: string): string | undefined;
}

/** Campaign ownership metadata reads (registry-backed; never permission). */
export interface CampaignOwnershipReader {
  getCampaignOwnerId(campaignId: string): string | undefined;
  getCampaignOwnershipRecord(campaignId: string): CampaignOwnershipRecord | undefined;
  /** Productized copy only — never a raw ownerId for normal UI. */
  getCampaignOwnershipLabel(campaignId: string): string | undefined;
}

/** P5.4 legacy 'author-sample' seed-owner aliasing (read-time only). */
export interface SeedOwnerAliasResolver {
  resolveSeedOwnerId(ownerId?: string): string | undefined;
  seedOwnerMatchesUser(ownerId: string | undefined, userId: string | undefined): boolean;
  isLegacySampleOwnerId(ownerId?: string | null): boolean;
}

// ── Default (local/offline) implementations — pure delegation ────────────────

export const defaultLocalViewerContextReader: ViewerContextReader = {
  getCurrentViewer: () => getCurrentLocalViewerContext(),
  getCurrentProfileUserId: () => getCurrentLocalProfileUserId(),
  getCurrentUserProfile: () => getCurrentLocalUserProfile(),
};

export const defaultActorOwnershipReader: ActorOwnershipReader = {
  getActorOwnerId: (systemId, actorId) => getActorOwnerId(systemId, actorId),
  getActorOwnershipRecord: (systemId, actorId) => getActorOwnershipRecord(systemId, actorId),
  getActorOwnershipLabel: (systemId, actorId) =>
    getActorOwnerId(systemId, actorId) ? '归属：本地用户' : undefined,
};

export const defaultCampaignOwnershipReader: CampaignOwnershipReader = {
  getCampaignOwnerId: (campaignId) => getCampaignOwnerId(campaignId),
  getCampaignOwnershipRecord: (campaignId) => getCampaignOwnershipRecord(campaignId),
  getCampaignOwnershipLabel: (campaignId) => getCampaignOwnershipLabel(campaignId),
};

export const defaultSeedOwnerAliasResolver: SeedOwnerAliasResolver = {
  resolveSeedOwnerId: (ownerId) => resolveSeedOwnerIdForCurrentUser(ownerId),
  seedOwnerMatchesUser: (ownerId, userId) => seedOwnerMatchesUser(ownerId, userId),
  isLegacySampleOwnerId: (ownerId) => isLegacySampleOwnerId(ownerId),
};

// ── Combined diagnostics (no UI; diagnostic use only) ────────────────────────

export interface LocalFoundationDiagnostics {
  /** A persisted (or in-memory) local anonymous user exists. */
  identityReady: boolean;
  /** Ownership registry read paths are callable (they never throw by design). */
  actorOwnershipReadable: boolean;
  campaignOwnershipReadable: boolean;
  /** P5.7: local repository adapters are present and callable. */
  actorRepositoryAdapterReady: boolean;
  campaignRepositoryAdapterReady: boolean;
  persistence: LocalPersistenceDiagnostics;
}

/** Read-only health snapshot of the P5 local foundation. Never throws. */
export function getLocalFoundationDiagnostics(): LocalFoundationDiagnostics {
  let identityReady = false;
  let actorOwnershipReadable = false;
  let campaignOwnershipReadable = false;
  try {
    identityReady = localUserRepository.loadCurrentUser() !== null;
  } catch {
    /* keep false */
  }
  try {
    getActorOwnershipRecord('__diagnostic__', '__diagnostic__');
    actorOwnershipReadable = true;
  } catch {
    /* keep false */
  }
  try {
    getCampaignOwnershipRecord('__diagnostic__');
    campaignOwnershipReadable = true;
  } catch {
    /* keep false */
  }
  let actorRepositoryAdapterReady = false;
  let campaignRepositoryAdapterReady = false;
  try {
    actorRepositoryAdapterReady = localActorVaultReadAdapter.kind === 'local';
  } catch {
    /* keep false */
  }
  try {
    campaignRepositoryAdapterReady = localCampaignRepositoryAdapter.kind === 'local';
  } catch {
    /* keep false */
  }
  return {
    identityReady,
    actorOwnershipReadable,
    campaignOwnershipReadable,
    actorRepositoryAdapterReady,
    campaignRepositoryAdapterReady,
    persistence: getLocalPersistenceDiagnostics(),
  };
}
