import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocalCampaignSystemId =
  | 'dnd5e-2024'
  | 'coc7e'
  | 'cp-red';

export type LocalCampaignStatus =
  | 'draft'
  | 'active';

export type LocalCampaignLifecycleStatus =
  | 'active'
  | 'archived'
  | 'trashed';

type LegacyLocalCampaignStatus =
  | LocalCampaignStatus
  | 'archived';

export interface LocalCampaign {
  id: string;
  systemId: LocalCampaignSystemId;
  title: string;
  description?: string;
  roomCode?: string;
  status: LocalCampaignStatus;
  lifecycleStatus: LocalCampaignLifecycleStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  trashedAt?: string;
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
  includeTrashed?: boolean;
}

interface CampaignLocalStoreState {
  schemaVersion: number;
  campaigns: LocalCampaign[];
  listCampaigns: (options?: ListCampaignsOptions) => LocalCampaign[];
  listActiveCampaigns: (systemId?: LocalCampaignSystemId) => LocalCampaign[];
  listArchivedCampaigns: (systemId?: LocalCampaignSystemId) => LocalCampaign[];
  listTrashedCampaigns: (systemId?: LocalCampaignSystemId) => LocalCampaign[];
  getCampaignById: (id: string) => LocalCampaign | undefined;
  createCampaign: (input: CreateLocalCampaignInput) => LocalCampaign;
  updateCampaign: (id: string, patch: UpdateLocalCampaignPatch) => LocalCampaign | undefined;
  archiveCampaign: (id: string) => LocalCampaign | undefined;
  restoreCampaign: (id: string) => LocalCampaign | undefined;
  trashCampaign: (id: string) => LocalCampaign | undefined;
  purgeCampaign: (id: string) => void;
  /**
   * @deprecated Local compatibility alias. Product UI should call explicit
   * lifecycle actions instead of generic delete. This currently moves a
   * campaign to trash and does not physically purge it.
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

export const CAMPAIGN_LOCAL_STORE_SCHEMA_VERSION = 2;
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
    lifecycleStatus: 'active',
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
      lifecycleStatus: 'active',
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
        const { systemId, includeArchived = true, includeTrashed = true } = options;
        return get().campaigns.filter((campaign) => {
          if (systemId && campaign.systemId !== systemId) return false;
          if (!includeArchived && campaign.lifecycleStatus === 'archived') return false;
          if (!includeTrashed && campaign.lifecycleStatus === 'trashed') return false;
          return true;
        });
      },

      listActiveCampaigns: (systemId) =>
        get().campaigns.filter((campaign) =>
          (!systemId || campaign.systemId === systemId) &&
          campaign.lifecycleStatus === 'active'
        ),

      listArchivedCampaigns: (systemId) =>
        get().campaigns.filter((campaign) =>
          (!systemId || campaign.systemId === systemId) &&
          campaign.lifecycleStatus === 'archived'
        ),

      listTrashedCampaigns: (systemId) =>
        get().campaigns.filter((campaign) =>
          (!systemId || campaign.systemId === systemId) &&
          campaign.lifecycleStatus === 'trashed'
        ),

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
        updateCampaignLifecycle(set, id, {
          lifecycleStatus: 'archived',
          archivedAt: nowIso(),
          trashedAt: undefined,
        }),

      restoreCampaign: (id) =>
        updateCampaignLifecycle(set, id, {
          lifecycleStatus: 'active',
          archivedAt: undefined,
          trashedAt: undefined,
        }),

      trashCampaign: (id) =>
        updateCampaignLifecycle(set, id, {
          lifecycleStatus: 'trashed',
          trashedAt: nowIso(),
        }),

      purgeCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
      })),

      deleteCampaign: (id) => {
        get().trashCampaign(id);
      },

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
          campaigns: p.campaigns
            .map(normalizePersistedCampaign)
            .filter((campaign): campaign is LocalCampaign => Boolean(campaign)),
        };
      },
    },
  ),
);

type CampaignLocalStoreSet = (
  partial:
    | Partial<CampaignLocalStoreState>
    | ((state: CampaignLocalStoreState) => Partial<CampaignLocalStoreState>),
  replace?: false,
) => void;

function updateCampaignLifecycle(
  set: CampaignLocalStoreSet,
  id: string,
  lifecyclePatch: Pick<LocalCampaign, 'lifecycleStatus'> & Partial<Pick<LocalCampaign, 'archivedAt' | 'trashedAt'>>,
): LocalCampaign | undefined {
  let updatedCampaign: LocalCampaign | undefined;
  set((state) => ({
    campaigns: state.campaigns.map((campaign) => {
      if (campaign.id !== id) return campaign;
      updatedCampaign = {
        ...campaign,
        ...lifecyclePatch,
        updatedAt: nowIso(),
      };
      return updatedCampaign;
    }),
  }));
  return updatedCampaign;
}

function normalizePersistedCampaign(value: unknown): LocalCampaign | null {
  if (!value || typeof value !== 'object') return null;
  const campaign = value as Omit<Partial<LocalCampaign>, 'status'> & { status?: LegacyLocalCampaignStatus };
  if (
    typeof campaign.id !== 'string' ||
    !isLocalCampaignSystemId(campaign.systemId) ||
    typeof campaign.title !== 'string' ||
    !isLegacyLocalCampaignStatus(campaign.status) ||
    typeof campaign.createdAt !== 'string' ||
    typeof campaign.updatedAt !== 'string'
  ) {
    return null;
  }

  const lifecycleStatus = isLocalCampaignLifecycleStatus(campaign.lifecycleStatus)
    ? campaign.lifecycleStatus
    : campaign.status === 'archived'
      ? 'archived'
      : 'active';
  const status: LocalCampaignStatus = campaign.status === 'draft' ? 'draft' : 'active';

  return {
    id: campaign.id,
    systemId: campaign.systemId,
    title: campaign.title,
    description: campaign.description,
    roomCode: campaign.roomCode,
    status,
    lifecycleStatus,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    archivedAt:
      typeof campaign.archivedAt === 'string'
        ? campaign.archivedAt
        : lifecycleStatus === 'archived'
          ? campaign.updatedAt
          : undefined,
    trashedAt:
      typeof campaign.trashedAt === 'string'
        ? campaign.trashedAt
        : lifecycleStatus === 'trashed'
          ? campaign.updatedAt
          : undefined,
  };
}

function isLocalCampaignSystemId(value: unknown): value is LocalCampaignSystemId {
  return value === 'dnd5e-2024' || value === 'coc7e' || value === 'cp-red';
}

function isLegacyLocalCampaignStatus(value: unknown): value is LegacyLocalCampaignStatus {
  return value === 'draft' || value === 'active' || value === 'archived';
}

function isLocalCampaignLifecycleStatus(value: unknown): value is LocalCampaignLifecycleStatus {
  return value === 'active' || value === 'archived' || value === 'trashed';
}
