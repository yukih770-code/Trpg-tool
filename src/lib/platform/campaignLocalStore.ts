import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocalCampaignSystemId =
  | 'dnd5e-2024'
  | 'coc7e'
  | 'cp-red';

export type LocalCampaignStatus =
  | 'draft'
  | 'active'
  | 'archived';

export interface LocalCampaign {
  id: string;
  systemId: LocalCampaignSystemId;
  title: string;
  description?: string;
  roomCode?: string;
  status: LocalCampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocalCampaignInput {
  systemId: LocalCampaignSystemId;
  title: string;
  description?: string;
  roomCode?: string;
  status?: LocalCampaignStatus;
}

export type UpdateLocalCampaignPatch = Partial<
  Pick<LocalCampaign, 'title' | 'description' | 'roomCode' | 'status'>
>;

export interface ListCampaignsOptions {
  systemId?: LocalCampaignSystemId;
  includeArchived?: boolean;
}

interface CampaignLocalStoreState {
  schemaVersion: number;
  campaigns: LocalCampaign[];
  listCampaigns: (options?: ListCampaignsOptions) => LocalCampaign[];
  listActiveCampaigns: (systemId?: LocalCampaignSystemId) => LocalCampaign[];
  getCampaignById: (id: string) => LocalCampaign | undefined;
  createCampaign: (input: CreateLocalCampaignInput) => LocalCampaign;
  updateCampaign: (id: string, patch: UpdateLocalCampaignPatch) => LocalCampaign | undefined;
  archiveCampaign: (id: string) => LocalCampaign | undefined;
  /**
   * Local/dev escape hatch. Product flows should prefer archiveCampaign so
   * accidental data loss is avoided when a trash model arrives later.
   */
  deleteCampaign: (id: string) => void;
  clearCampaignsForDev: () => void;
  resetCampaignsForDev: () => void;
  /**
   * Dev-only helper. Demo campaigns are never created automatically and should
   * not masquerade as real campaign management in production flows.
   */
  seedDemoCampaignsForDev: () => LocalCampaign[];
}

export const CAMPAIGN_LOCAL_STORE_SCHEMA_VERSION = 1;
export const CAMPAIGN_LOCAL_STORE_KEY = 'platform-campaign-local-store';

function nowIso(): string {
  return new Date().toISOString();
}

function makeCampaignId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed || 'Untitled Campaign';
}

function createLocalCampaign(input: CreateLocalCampaignInput): LocalCampaign {
  const timestamp = nowIso();
  return {
    id: makeCampaignId(),
    systemId: input.systemId,
    title: normalizeTitle(input.title),
    description: input.description,
    roomCode: input.roomCode,
    status: input.status ?? 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createDemoCampaigns(): LocalCampaign[] {
  const timestamp = nowIso();
  return [
    {
      id: 'demo-grey-mist-a12f',
      systemId: 'dnd5e-2024',
      title: 'Grey Mist Castle',
      description: 'Dev-only local campaign seed for testing Campaign Library data flows.',
      roomCode: 'A12F',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

export const useCampaignLocalStore = create<CampaignLocalStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: CAMPAIGN_LOCAL_STORE_SCHEMA_VERSION,
      campaigns: [],

      listCampaigns: (options = {}) => {
        const { systemId, includeArchived = true } = options;
        return get().campaigns.filter((campaign) => {
          if (systemId && campaign.systemId !== systemId) return false;
          if (!includeArchived && campaign.status === 'archived') return false;
          return true;
        });
      },

      listActiveCampaigns: (systemId) =>
        get().listCampaigns({ systemId, includeArchived: false }),

      getCampaignById: (id) =>
        get().campaigns.find((campaign) => campaign.id === id),

      createCampaign: (input) => {
        const campaign = createLocalCampaign(input);
        set((state) => ({
          campaigns: [...state.campaigns, campaign],
        }));
        return campaign;
      },

      updateCampaign: (id, patch) => {
        let updatedCampaign: LocalCampaign | undefined;
        set((state) => ({
          campaigns: state.campaigns.map((campaign) => {
            if (campaign.id !== id) return campaign;
            updatedCampaign = {
              ...campaign,
              ...patch,
              title: patch.title !== undefined ? normalizeTitle(patch.title) : campaign.title,
              updatedAt: nowIso(),
            };
            return updatedCampaign;
          }),
        }));
        return updatedCampaign;
      },

      archiveCampaign: (id) =>
        get().updateCampaign(id, { status: 'archived' }),

      deleteCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
      })),

      clearCampaignsForDev: () => set({ campaigns: [] }),

      resetCampaignsForDev: () => set({ campaigns: [] }),

      seedDemoCampaignsForDev: () => {
        const demoCampaigns = createDemoCampaigns();
        set((state) => {
          const existingIds = new Set(state.campaigns.map((campaign) => campaign.id));
          return {
            campaigns: [
              ...state.campaigns,
              ...demoCampaigns.filter((campaign) => !existingIds.has(campaign.id)),
            ],
          };
        });
        return demoCampaigns;
      },
    }),
    {
      name: CAMPAIGN_LOCAL_STORE_KEY,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        campaigns: state.campaigns,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{
          schemaVersion: unknown;
          campaigns: unknown;
        }> | null;
        if (!p || typeof p !== 'object' || !Array.isArray(p.campaigns)) {
          return current;
        }
        return {
          ...current,
          schemaVersion: CAMPAIGN_LOCAL_STORE_SCHEMA_VERSION,
          campaigns: p.campaigns.filter(isLocalCampaign),
        };
      },
    },
  ),
);

function isLocalCampaign(value: unknown): value is LocalCampaign {
  if (!value || typeof value !== 'object') return false;
  const campaign = value as Partial<LocalCampaign>;
  return (
    typeof campaign.id === 'string' &&
    isLocalCampaignSystemId(campaign.systemId) &&
    typeof campaign.title === 'string' &&
    isLocalCampaignStatus(campaign.status) &&
    typeof campaign.createdAt === 'string' &&
    typeof campaign.updatedAt === 'string'
  );
}

function isLocalCampaignSystemId(value: unknown): value is LocalCampaignSystemId {
  return value === 'dnd5e-2024' || value === 'coc7e' || value === 'cp-red';
}

function isLocalCampaignStatus(value: unknown): value is LocalCampaignStatus {
  return value === 'draft' || value === 'active' || value === 'archived';
}
