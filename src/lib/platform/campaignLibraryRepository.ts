/**
 * Campaign Library repository boundary.
 *
 * AI-LANDMARK: A7_1_CAMPAIGN_LIBRARY_REPOSITORY_BOUNDARY_V1
 *
 * This module is a local facade / boundary, NOT a backend repository.
 * It collects the non-UI data access that previously lived inside
 * CampaignLibraryShell: system campaign selection + sorting, visible-list
 * filtering, campaign lookup, entry-draft summary resolution, selectedActorId
 * -> ActorVault record lookup, and a campaign lifecycle / draft action facade.
 *
 * Hard boundaries preserved (this module must never break them):
 * - Campaign Entry Draft is NOT CampaignMembership, NOT CampaignActorInstance,
 *   NOT RuntimeActor. selectedActorId stays a draft-only UI selection.
 * - roomCode / publicCode is NOT a permission system.
 * - No CampaignMembership / CampaignActorInstance / RuntimeActor /
 *   RuntimeSession, no backend, API, WebSocket, permission, overwrite, merge,
 *   or purge behavior is implemented here.
 * - Import/export envelope semantics are owned elsewhere and are untouched.
 */

import { useMemo } from 'react';
import {
  useCampaignLocalStore,
  type CreateLocalCampaignInput,
  type LocalCampaign,
  type LocalCampaignLifecycleStatus,
  type LocalCampaignStatus,
  type LocalCampaignSystemId,
  type UpdateLocalCampaignPatch,
} from './campaignLocalStore';
import {
  useCampaignEntryDraftStore,
  type CampaignEntryDraft,
  type CampaignEntryDraftRole,
} from './campaignEntryDraftStore';
import { getActorVaultRecord } from './actorVaultRepositoryBridge';
import { getCampaignOwnerId } from './campaignOwnership';
import type { CampaignInstanceSummary, CampaignSuggestedActor } from './campaignFlow';

export type CampaignLibraryLifecycleFilter = Extract<
  LocalCampaignLifecycleStatus,
  'active' | 'archived' | 'trashed'
>;

export interface CampaignLibraryActorSummary {
  actorId: string;
  actorName: string;
}

export interface CampaignLibraryDraftSummary {
  /** The raw local entry draft for the campaign, if any. Draft-only, never membership. */
  draft?: CampaignEntryDraft;
  /** Resolved ActorVault summary for the draft's selectedActorId, if it still exists. */
  selectedActor: CampaignLibraryActorSummary | null;
  /** Suggested actor derived from the draft selection (same shape as selectedActor). */
  suggestedActor: CampaignSuggestedActor | null;
  /** True when the draft references an actor id that no longer resolves. */
  hasStaleDraftActor: boolean;
}

const statusOrder: Record<LocalCampaignStatus, number> = {
  active: 0,
  draft: 1,
};

const lifecycleOrder: Record<LocalCampaignLifecycleStatus, number> = {
  active: 0,
  archived: 1,
  trashed: 2,
};

/**
 * Select the campaigns for a single system, sorted by lifecycle, then status,
 * then most-recently-updated. Pure: takes the full campaign list as input.
 */
export function selectSystemCampaigns(
  allCampaigns: LocalCampaign[],
  systemId: LocalCampaignSystemId,
): LocalCampaign[] {
  return allCampaigns
    .filter((campaign) => campaign.systemId === systemId)
    .sort((a, b) => {
      const lifecycleDiff = lifecycleOrder[a.lifecycleStatus] - lifecycleOrder[b.lifecycleStatus];
      if (lifecycleDiff !== 0) return lifecycleDiff;
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

/**
 * Filter already-system-scoped campaigns by lifecycle tab + search query.
 * Pure: search normalization is handled here so the Shell only holds raw input.
 */
export function filterVisibleCampaigns(
  systemCampaigns: LocalCampaign[],
  lifecycleFilter: CampaignLibraryLifecycleFilter,
  searchQuery: string,
): LocalCampaign[] {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  return systemCampaigns.filter((campaign) => {
    if (campaign.lifecycleStatus !== lifecycleFilter) return false;
    if (!normalizedSearchQuery) return true;
    return [
      campaign.title,
      campaign.description ?? '',
      campaign.roomCode ?? '',
    ].some((value) => value.toLowerCase().includes(normalizedSearchQuery));
  });
}

export function findCampaignById(
  campaigns: LocalCampaign[],
  id: string | null | undefined,
): LocalCampaign | undefined {
  if (!id) return undefined;
  return campaigns.find((campaign) => campaign.id === id);
}

/**
 * Resolve a draft selectedActorId to a lightweight ActorVault summary.
 *
 * This is a read-only lookup against the ActorVault repository bridge. It does
 * not create membership, actor instances, or runtime actors.
 */
export function resolveCampaignDraftActor(
  systemId: LocalCampaignSystemId,
  actorId: string | undefined,
): CampaignLibraryActorSummary | null {
  if (!actorId) return null;
  const record = getActorVaultRecord(systemId, actorId);
  if (!record) return null;
  return {
    actorId: record.id,
    actorName: record.displayName,
  };
}

/**
 * Build the entry-draft summary for the currently selected campaign: the raw
 * draft, the resolved actor selection, the derived suggested actor, and a stale
 * flag for drafts pointing at an actor that no longer exists.
 */
export function getCampaignEntryDraftSummary(params: {
  drafts: CampaignEntryDraft[];
  campaign: LocalCampaign | undefined;
  systemId: LocalCampaignSystemId;
}): CampaignLibraryDraftSummary {
  const { drafts, campaign, systemId } = params;
  const draft = campaign
    ? drafts.find((candidate) => candidate.campaignId === campaign.id)
    : undefined;
  const isSystemDraft = draft?.systemId === systemId;
  const selectedActor =
    isSystemDraft && draft?.selectedActorId
      ? resolveCampaignDraftActor(systemId, draft.selectedActorId)
      : null;
  const hasStaleDraftActor = Boolean(
    isSystemDraft && draft?.selectedActorId && !selectedActor,
  );
  return {
    draft,
    selectedActor,
    suggestedActor: selectedActor,
    hasStaleDraftActor,
  };
}

export function toCampaignInstanceSummary(campaign: LocalCampaign): CampaignInstanceSummary {
  return {
    campaignId: campaign.id,
    systemId: campaign.systemId,
    title: campaign.title,
    roomCode: campaign.roomCode,
    // P5.3: ownership metadata from the additive campaign ownership registry.
    // Reuses the PRE-EXISTING optional hostUserId field on the summary type —
    // metadata only, never a permission input, undefined until backfilled.
    hostUserId: getCampaignOwnerId(campaign.id),
    lastPlayedAt: campaign.updatedAt,
  };
}

/**
 * Reactive read of the campaign list for a system. Returns both the full list
 * (needed for snapshot import preview cross-checks) and the system-scoped,
 * sorted list used by the library UI.
 */
export function useCampaignLibraryData(systemId: LocalCampaignSystemId): {
  allCampaigns: LocalCampaign[];
  campaigns: LocalCampaign[];
} {
  const allCampaigns = useCampaignLocalStore((state) => state.campaigns);
  const campaigns = useMemo(
    () => selectSystemCampaigns(allCampaigns, systemId),
    [allCampaigns, systemId],
  );
  return { allCampaigns, campaigns };
}

/** Reactive read of all local campaign entry drafts (draft-only, never membership). */
export function useCampaignEntryDrafts(): CampaignEntryDraft[] {
  return useCampaignEntryDraftStore((state) => state.drafts);
}

export interface CampaignLibraryActions {
  createCampaign: (input: CreateLocalCampaignInput) => LocalCampaign;
  updateCampaign: (id: string, patch: UpdateLocalCampaignPatch) => LocalCampaign | undefined;
  archiveCampaign: (id: string) => LocalCampaign | undefined;
  restoreCampaign: (id: string) => LocalCampaign | undefined;
  trashCampaign: (id: string) => LocalCampaign | undefined;
  setEntryDraftActor: (
    campaignId: string,
    systemId: LocalCampaignSystemId,
    actorId: string,
  ) => void;
  setEntryDraftRole: (
    campaignId: string,
    systemId: LocalCampaignSystemId,
    role: CampaignEntryDraftRole,
  ) => void;
  clearEntryDraft: (campaignId: string) => void;
}

/**
 * Campaign lifecycle + entry-draft action facade.
 *
 * Each call reads the live store via getState(), so the returned object is
 * stable and safe to memoize once. This intentionally exposes only the simple,
 * already-implemented local actions. It does NOT add overwrite, merge, purge,
 * membership, actor-instance, runtime, or backend behavior.
 */
export function createCampaignLibraryActions(): CampaignLibraryActions {
  return {
    createCampaign: (input) => useCampaignLocalStore.getState().createCampaign(input),
    updateCampaign: (id, patch) => useCampaignLocalStore.getState().updateCampaign(id, patch),
    archiveCampaign: (id) => useCampaignLocalStore.getState().archiveCampaign(id),
    restoreCampaign: (id) => useCampaignLocalStore.getState().restoreCampaign(id),
    trashCampaign: (id) => useCampaignLocalStore.getState().trashCampaign(id),
    setEntryDraftActor: (campaignId, systemId, actorId) => {
      useCampaignEntryDraftStore.getState().setCampaignEntryDraftActor(campaignId, systemId, actorId);
    },
    setEntryDraftRole: (campaignId, systemId, role) => {
      useCampaignEntryDraftStore.getState().setCampaignEntryDraftRole(campaignId, systemId, role);
    },
    clearEntryDraft: (campaignId) => {
      useCampaignEntryDraftStore.getState().clearCampaignEntryDraft(campaignId);
    },
  };
}
