import { useCharacterStore } from '../../store/characterStore';
import { useCocStore } from '../../store/cocStore';
import { useCpStore } from '../../store/cpStore';
import type { CharacterData } from '../dnd-types';
import type { CocCharacter } from '../coc-types';
import type { CpCharacter } from '../cp-types';
import {
  createPlatformExportEnvelope,
  type PlatformExportEnvelope,
} from '../data-contract/platform-envelope';
import {
  listActorVaultRecords,
  type ActorVaultRecord,
  type ActorVaultSystemId,
} from './actorVaultRepositoryBridge';
import {
  getActorVaultLifecycleMeta,
  type ActorVaultLifecycleMeta,
  type ActorVaultLifecycleStatus,
} from './actorVaultLifecycleStore';

export const ACTOR_VAULT_EXPORT_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const ACTOR_VAULT_EXPORT_KIND = 'actor-vault-snapshot' as const;

export type ActorVaultExportSnapshotSystemId = ActorVaultSystemId;

export type ActorVaultExportSnapshotActor = {
  systemId: ActorVaultExportSnapshotSystemId;
  actorId: string;
  lifecycleStatus: ActorVaultLifecycleStatus;
  lifecycleMeta?: ActorVaultLifecycleMeta;
  actorVaultRecord: ActorVaultRecord;
  actorData: unknown;
};

export type ActorVaultExportSnapshotPayload = {
  schemaVersion: typeof ACTOR_VAULT_EXPORT_SNAPSHOT_SCHEMA_VERSION;
  exportKind: typeof ACTOR_VAULT_EXPORT_KIND;
  exportedAt: string;
  source: {
    app: 'trpg-platform';
    mode: 'local';
  };
  includedSystems: ActorVaultExportSnapshotSystemId[];
  includedLifecycleStatuses: ActorVaultLifecycleStatus[];
  actors: ActorVaultExportSnapshotActor[];
  boundaries: {
    includesCampaignMembership: false;
    includesCampaignActorInstance: false;
    includesRuntimeActor: false;
    includesRuntimeSession: false;
    includesBackendState: false;
  };
};

export type ActorVaultExportSnapshotEnvelope = PlatformExportEnvelope & {
  payload: ActorVaultExportSnapshotPayload;
};

const ACTOR_VAULT_EXPORT_SYSTEM_IDS: ActorVaultExportSnapshotSystemId[] = [
  'dnd5e-2024',
  'coc7e',
  'cp-red',
];

const ACTOR_VAULT_EXPORT_LIFECYCLE_STATUSES: ActorVaultLifecycleStatus[] = [
  'active',
  'archived',
  'trashed',
];

export function createActorVaultExportSnapshot(
  exportedAt = new Date().toISOString(),
): ActorVaultExportSnapshotEnvelope {
  const actorDataBySystem = collectActorDataBySystem();
  const actors = ACTOR_VAULT_EXPORT_SYSTEM_IDS.flatMap((systemId) =>
    listActorVaultRecords(systemId).flatMap((record) => {
      const actorData = actorDataBySystem[systemId].get(record.id);
      if (!actorData) return [];
      const lifecycleMeta = getActorVaultLifecycleMeta(systemId, record.id);
      return [{
        systemId,
        actorId: record.id,
        lifecycleStatus: record.lifecycleStatus ?? 'active',
        lifecycleMeta,
        actorVaultRecord: record,
        actorData,
      }];
    }),
  );

  const payload: ActorVaultExportSnapshotPayload = {
    schemaVersion: ACTOR_VAULT_EXPORT_SNAPSHOT_SCHEMA_VERSION,
    exportKind: ACTOR_VAULT_EXPORT_KIND,
    exportedAt,
    source: {
      app: 'trpg-platform',
      mode: 'local',
    },
    includedSystems: ACTOR_VAULT_EXPORT_SYSTEM_IDS,
    includedLifecycleStatuses: ACTOR_VAULT_EXPORT_LIFECYCLE_STATUSES,
    actors,
    boundaries: {
      includesCampaignMembership: false,
      includesCampaignActorInstance: false,
      includesRuntimeActor: false,
      includesRuntimeSession: false,
      includesBackendState: false,
    },
  };

  return createPlatformExportEnvelope({
    kind: 'platformBackup',
    schemaVersion: ACTOR_VAULT_EXPORT_SNAPSHOT_SCHEMA_VERSION,
    exportScope: 'ownerBackup',
    exportedAt,
    source: {
      sourceApp: 'trpg-platform',
      sourceVersion: ACTOR_VAULT_EXPORT_KIND,
    },
    payload,
    metadata: {
      exportKind: ACTOR_VAULT_EXPORT_KIND,
      includedSystems: ACTOR_VAULT_EXPORT_SYSTEM_IDS.join(','),
      includedLifecycleStatuses: ACTOR_VAULT_EXPORT_LIFECYCLE_STATUSES.join(','),
    },
  }) as ActorVaultExportSnapshotEnvelope;
}

export function makeActorVaultExportSnapshotFilename(date = new Date()): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `actor-vault-snapshot-${year}-${month}-${day}-${hour}${minute}.json`;
}

export function downloadActorVaultExportSnapshot(): ActorVaultExportSnapshotEnvelope {
  const snapshot = createActorVaultExportSnapshot();
  downloadJson(snapshot, makeActorVaultExportSnapshotFilename());
  return snapshot;
}

function collectActorDataBySystem(): Record<ActorVaultExportSnapshotSystemId, Map<string, unknown>> {
  return {
    'dnd5e-2024': collectDndActorData(),
    coc7e: collectCocActorData(),
    'cp-red': collectCpActorData(),
  };
}

function collectDndActorData(): Map<string, CharacterData> {
  const state = useCharacterStore.getState();
  return collectActorData(state.characters, state.character, state.activeCharacterId);
}

function collectCocActorData(): Map<string, CocCharacter> {
  const state = useCocStore.getState();
  return collectActorData(state.characters, state.character, state.activeCharacterId);
}

function collectCpActorData(): Map<string, CpCharacter> {
  const state = useCpStore.getState();
  return collectActorData(state.characters, state.character, state.activeCharacterId);
}

function collectActorData<T extends { id?: string }>(
  actors: T[],
  activeActor: T,
  activeActorId: string | null,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const actor of actors) {
    const id = actor.id?.trim();
    if (id) map.set(id, actor);
  }
  const activeId = activeActorId?.trim() || activeActor.id?.trim();
  if (activeId) map.set(activeId, activeActor);
  return map;
}

function downloadJson(value: unknown, filename: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
