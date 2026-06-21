import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActorVaultSystemId } from './actorVaultRepositoryBridge';

export type ActorVaultLifecycleStatus =
  | 'active'
  | 'archived'
  | 'trashed';

export interface ActorVaultActorRef {
  systemId: ActorVaultSystemId;
  actorId: string;
}

export interface ActorVaultLifecycleMeta extends ActorVaultActorRef {
  /**
   * Platform object lifecycle state only.
   *
   * This metadata does not mutate the DND / COC / CP RED actor stores and does
   * not create CampaignMembership, CampaignActorInstance, RuntimeActor, or any
   * actor-to-campaign relationship.
   */
  lifecycleStatus: ActorVaultLifecycleStatus;
  archivedAt?: string;
  trashedAt?: string;
  restoredAt?: string;
  reason?: string;
  updatedAt: string;
}

interface ActorVaultLifecycleStoreState {
  schemaVersion: number;
  metas: ActorVaultLifecycleMeta[];
  listActorLifecycleMetas: () => ActorVaultLifecycleMeta[];
  getActorLifecycleMeta: (
    systemId: ActorVaultSystemId,
    actorId: string,
  ) => ActorVaultLifecycleMeta | undefined;
  getActorLifecycleStatus: (
    systemId: ActorVaultSystemId,
    actorId: string,
  ) => ActorVaultLifecycleStatus;
  archiveActor: (
    systemId: ActorVaultSystemId,
    actorId: string,
    reason?: string,
  ) => ActorVaultLifecycleMeta;
  trashActor: (
    systemId: ActorVaultSystemId,
    actorId: string,
    reason?: string,
  ) => ActorVaultLifecycleMeta;
  restoreActor: (
    systemId: ActorVaultSystemId,
    actorId: string,
    reason?: string,
  ) => ActorVaultLifecycleMeta;
  clearActorLifecycleMeta: (
    systemId: ActorVaultSystemId,
    actorId: string,
  ) => void;
  clearAllActorLifecycleMetasForDev: () => void;
}

export const ACTOR_VAULT_LIFECYCLE_STORE_SCHEMA_VERSION = 1;
export const ACTOR_VAULT_LIFECYCLE_STORE_KEY = 'platform-actor-vault-lifecycle-store';

function nowIso(): string {
  return new Date().toISOString();
}

function makeActorLifecycleKey(systemId: ActorVaultSystemId, actorId: string): string {
  return `${systemId}:${actorId}`;
}

export const useActorVaultLifecycleStore = create<ActorVaultLifecycleStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: ACTOR_VAULT_LIFECYCLE_STORE_SCHEMA_VERSION,
      metas: [],

      listActorLifecycleMetas: () => get().metas,

      getActorLifecycleMeta: (systemId, actorId) =>
        get().metas.find((meta) => isSameActorRef(meta, systemId, actorId)),

      getActorLifecycleStatus: (systemId, actorId) =>
        get().getActorLifecycleMeta(systemId, actorId)?.lifecycleStatus ?? 'active',

      archiveActor: (systemId, actorId, reason) => {
        const value = upsertLifecycleMeta(get().metas, systemId, actorId, {
          lifecycleStatus: 'archived',
          archivedAt: nowIso(),
          trashedAt: undefined,
          reason,
        });
        set({ metas: value.metas });
        return value.meta;
      },

      trashActor: (systemId, actorId, reason) => {
        const value = upsertLifecycleMeta(get().metas, systemId, actorId, {
          lifecycleStatus: 'trashed',
          trashedAt: nowIso(),
          reason,
        });
        set({ metas: value.metas });
        return value.meta;
      },

      restoreActor: (systemId, actorId, reason) => {
        const value = upsertLifecycleMeta(get().metas, systemId, actorId, {
          lifecycleStatus: 'active',
          archivedAt: undefined,
          trashedAt: undefined,
          restoredAt: nowIso(),
          reason,
        });
        set({ metas: value.metas });
        return value.meta;
      },

      clearActorLifecycleMeta: (systemId, actorId) => set((state) => ({
        metas: state.metas.filter((meta) => !isSameActorRef(meta, systemId, actorId)),
      })),

      clearAllActorLifecycleMetasForDev: () => set({ metas: [] }),
    }),
    {
      name: ACTOR_VAULT_LIFECYCLE_STORE_KEY,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        metas: state.metas,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{
          schemaVersion: unknown;
          metas: unknown;
        }> | null;
        if (!p || typeof p !== 'object' || !Array.isArray(p.metas)) {
          return current;
        }
        return {
          ...current,
          schemaVersion: ACTOR_VAULT_LIFECYCLE_STORE_SCHEMA_VERSION,
          metas: p.metas
            .map(normalizePersistedLifecycleMeta)
            .filter((meta): meta is ActorVaultLifecycleMeta => Boolean(meta)),
        };
      },
    },
  ),
);

export function getActorVaultLifecycleMeta(
  systemId: ActorVaultSystemId,
  actorId: string,
): ActorVaultLifecycleMeta | undefined {
  return useActorVaultLifecycleStore.getState().getActorLifecycleMeta(systemId, actorId);
}

export function getActorVaultLifecycleStatus(
  systemId: ActorVaultSystemId,
  actorId: string,
): ActorVaultLifecycleStatus {
  return useActorVaultLifecycleStore.getState().getActorLifecycleStatus(systemId, actorId);
}

function upsertLifecycleMeta(
  metas: ActorVaultLifecycleMeta[],
  systemId: ActorVaultSystemId,
  actorId: string,
  patch: Partial<Pick<
    ActorVaultLifecycleMeta,
    'lifecycleStatus' | 'archivedAt' | 'trashedAt' | 'restoredAt' | 'reason'
  >>,
): { metas: ActorVaultLifecycleMeta[]; meta: ActorVaultLifecycleMeta } {
  const timestamp = nowIso();
  const existing = metas.find((meta) => isSameActorRef(meta, systemId, actorId));
  const meta: ActorVaultLifecycleMeta = {
    systemId,
    actorId,
    lifecycleStatus: existing?.lifecycleStatus ?? 'active',
    archivedAt: existing?.archivedAt,
    trashedAt: existing?.trashedAt,
    restoredAt: existing?.restoredAt,
    reason: existing?.reason,
    ...patch,
    updatedAt: timestamp,
  };
  return {
    meta,
    metas: existing
      ? metas.map((item) => (isSameActorRef(item, systemId, actorId) ? meta : item))
      : [...metas, meta],
  };
}

function isSameActorRef(
  value: ActorVaultActorRef,
  systemId: ActorVaultSystemId,
  actorId: string,
): boolean {
  return makeActorLifecycleKey(value.systemId, value.actorId) ===
    makeActorLifecycleKey(systemId, actorId);
}

function normalizePersistedLifecycleMeta(value: unknown): ActorVaultLifecycleMeta | null {
  if (!value || typeof value !== 'object') return null;
  const meta = value as Partial<ActorVaultLifecycleMeta>;
  if (
    !isActorVaultSystemId(meta.systemId) ||
    typeof meta.actorId !== 'string' ||
    !isActorVaultLifecycleStatus(meta.lifecycleStatus) ||
    typeof meta.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    systemId: meta.systemId,
    actorId: meta.actorId,
    lifecycleStatus: meta.lifecycleStatus,
    archivedAt: typeof meta.archivedAt === 'string' ? meta.archivedAt : undefined,
    trashedAt: typeof meta.trashedAt === 'string' ? meta.trashedAt : undefined,
    restoredAt: typeof meta.restoredAt === 'string' ? meta.restoredAt : undefined,
    reason: typeof meta.reason === 'string' ? meta.reason : undefined,
    updatedAt: meta.updatedAt,
  };
}

function isActorVaultSystemId(value: unknown): value is ActorVaultSystemId {
  return value === 'dnd5e-2024' || value === 'coc7e' || value === 'cp-red';
}

function isActorVaultLifecycleStatus(value: unknown): value is ActorVaultLifecycleStatus {
  return value === 'active' || value === 'archived' || value === 'trashed';
}
