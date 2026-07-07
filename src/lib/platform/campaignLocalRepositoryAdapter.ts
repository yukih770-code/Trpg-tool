/**
 * Campaign LOCAL repository adapter (P5.7).
 *
 * AI-LANDMARK: CAMPAIGN_LOCAL_REPOSITORY_ADAPTER_V1
 *
 * Explicit local adapter boundary between the Campaign Library repository
 * facade and the zustand campaign local store. This is the ONE place where
 * campaign lifecycle/write operations touch `useCampaignLocalStore.getState()`
 * on behalf of the repository layer.
 *
 * Boundary notes:
 * - This is the OFFLINE-FIRST implementation; the local store remains the
 *   authority for local mode. It is NOT a cloud repository.
 * - A future cloud/Postgres adapter implements this SAME outer shape
 *   (`CampaignLocalRepositoryAdapter`-compatible, likely async) and is
 *   selected at the repository boundary — UI and the campaignLibraryRepository
 *   facade do not rewire.
 * - No schema change, no storage-key change, no lifecycle-semantics change:
 *   every method delegates 1:1 to the existing store actions.
 * - Reactive READS (React hooks) intentionally stay in
 *   campaignLibraryRepository — a plain adapter object cannot carry zustand
 *   subscriptions; only imperative operations live here.
 * - Ownership stays in the P5.3 registry (campaignOwnership); this adapter
 *   does not duplicate it.
 *
 * No React, no vendor SDK, no permission behavior.
 */

import {
  useCampaignLocalStore,
  type CreateLocalCampaignInput,
  type ListCampaignsOptions,
  type LocalCampaign,
  type UpdateLocalCampaignPatch,
} from './campaignLocalStore';

/** Narrow imperative contract over local campaign data (local-mode authority). */
export interface CampaignLocalRepositoryAdapter {
  /** Implementation marker for diagnostics/boundary clarity. */
  readonly kind: 'local';
  listCampaigns(options?: ListCampaignsOptions): LocalCampaign[];
  getCampaignById(id: string): LocalCampaign | undefined;
  createCampaign(input: CreateLocalCampaignInput): LocalCampaign;
  updateCampaign(id: string, patch: UpdateLocalCampaignPatch): LocalCampaign | undefined;
  archiveCampaign(id: string): LocalCampaign | undefined;
  restoreCampaign(id: string): LocalCampaign | undefined;
  trashCampaign(id: string): LocalCampaign | undefined;
}

/** Default local implementation — 1:1 delegation to the existing store actions. */
export const localCampaignRepositoryAdapter: CampaignLocalRepositoryAdapter = {
  kind: 'local',
  listCampaigns: (options) => useCampaignLocalStore.getState().listCampaigns(options),
  getCampaignById: (id) => useCampaignLocalStore.getState().getCampaignById(id),
  createCampaign: (input) => useCampaignLocalStore.getState().createCampaign(input),
  updateCampaign: (id, patch) => useCampaignLocalStore.getState().updateCampaign(id, patch),
  archiveCampaign: (id) => useCampaignLocalStore.getState().archiveCampaign(id),
  restoreCampaign: (id) => useCampaignLocalStore.getState().restoreCampaign(id),
  trashCampaign: (id) => useCampaignLocalStore.getState().trashCampaign(id),
};
