import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalCampaignSystemId } from './campaignLocalStore';

export type CampaignEntryDraftRole = 'player' | 'host';

export interface CampaignEntryDraft {
  campaignId: string;
  systemId: LocalCampaignSystemId;
  /**
   * Selected only for the local campaign entry draft.
   *
   * This is not CampaignMembership, not CampaignActorInstance, not RuntimeActor,
   * and not a persisted actor-to-campaign relationship.
   */
  selectedActorId?: string;
  /**
   * Selected only for the local campaign entry draft.
   *
   * This is local entry-prep preference, not real multiplayer authority.
   */
  selectedEntryRole?: CampaignEntryDraftRole;
  updatedAt: string;
}

interface CampaignEntryDraftStoreState {
  schemaVersion: number;
  drafts: CampaignEntryDraft[];
  listCampaignEntryDrafts: () => CampaignEntryDraft[];
  getCampaignEntryDraft: (campaignId: string) => CampaignEntryDraft | undefined;
  setCampaignEntryDraftActor: (
    campaignId: string,
    systemId: LocalCampaignSystemId,
    actorId: string,
  ) => CampaignEntryDraft;
  setCampaignEntryDraftRole: (
    campaignId: string,
    systemId: LocalCampaignSystemId,
    role: CampaignEntryDraftRole,
  ) => CampaignEntryDraft;
  clearCampaignEntryDraft: (campaignId: string) => void;
  clearAllCampaignEntryDraftsForDev: () => void;
}

export const CAMPAIGN_ENTRY_DRAFT_STORE_SCHEMA_VERSION = 1;
export const CAMPAIGN_ENTRY_DRAFT_STORE_KEY = 'platform-campaign-entry-draft-store';

function nowIso(): string {
  return new Date().toISOString();
}

export const useCampaignEntryDraftStore = create<CampaignEntryDraftStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: CAMPAIGN_ENTRY_DRAFT_STORE_SCHEMA_VERSION,
      drafts: [],

      listCampaignEntryDrafts: () => get().drafts,

      getCampaignEntryDraft: (campaignId) =>
        get().drafts.find((draft) => draft.campaignId === campaignId),

      setCampaignEntryDraftActor: (campaignId, systemId, actorId) => {
        const draft = upsertDraft(get().drafts, campaignId, systemId, {
          selectedActorId: actorId,
        });
        set({ drafts: draft.drafts });
        return draft.value;
      },

      setCampaignEntryDraftRole: (campaignId, systemId, role) => {
        const draft = upsertDraft(get().drafts, campaignId, systemId, {
          selectedEntryRole: role,
        });
        set({ drafts: draft.drafts });
        return draft.value;
      },

      clearCampaignEntryDraft: (campaignId) => set((state) => ({
        drafts: state.drafts.filter((draft) => draft.campaignId !== campaignId),
      })),

      clearAllCampaignEntryDraftsForDev: () => set({ drafts: [] }),
    }),
    {
      name: CAMPAIGN_ENTRY_DRAFT_STORE_KEY,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        drafts: state.drafts,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{
          schemaVersion: unknown;
          drafts: unknown;
        }> | null;
        if (!p || typeof p !== 'object' || !Array.isArray(p.drafts)) {
          return current;
        }
        return {
          ...current,
          schemaVersion: CAMPAIGN_ENTRY_DRAFT_STORE_SCHEMA_VERSION,
          drafts: p.drafts.filter(isCampaignEntryDraft),
        };
      },
    },
  ),
);

function upsertDraft(
  drafts: CampaignEntryDraft[],
  campaignId: string,
  systemId: LocalCampaignSystemId,
  patch: Partial<Pick<CampaignEntryDraft, 'selectedActorId' | 'selectedEntryRole'>>,
): { drafts: CampaignEntryDraft[]; value: CampaignEntryDraft } {
  const timestamp = nowIso();
  const existing = drafts.find((draft) => draft.campaignId === campaignId);
  const value: CampaignEntryDraft = {
    campaignId,
    systemId,
    selectedActorId: existing?.selectedActorId,
    selectedEntryRole: existing?.selectedEntryRole,
    ...patch,
    updatedAt: timestamp,
  };
  return {
    value,
    drafts: existing
      ? drafts.map((draft) => (draft.campaignId === campaignId ? value : draft))
      : [...drafts, value],
  };
}

function isCampaignEntryDraft(value: unknown): value is CampaignEntryDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<CampaignEntryDraft>;
  return (
    typeof draft.campaignId === 'string' &&
    isLocalCampaignSystemId(draft.systemId) &&
    (draft.selectedActorId === undefined || typeof draft.selectedActorId === 'string') &&
    (draft.selectedEntryRole === undefined || isCampaignEntryDraftRole(draft.selectedEntryRole)) &&
    typeof draft.updatedAt === 'string'
  );
}

function isLocalCampaignSystemId(value: unknown): value is LocalCampaignSystemId {
  return value === 'dnd5e-2024' || value === 'coc7e' || value === 'cp-red';
}

function isCampaignEntryDraftRole(value: unknown): value is CampaignEntryDraftRole {
  return value === 'player' || value === 'host';
}
