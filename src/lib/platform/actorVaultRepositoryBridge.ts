/**
 * Platform Actor Vault repository bridge.
 *
 * AI-LANDMARK: ACTOR_VAULT_LOCAL_REPOSITORY_BRIDGE_V1
 *
 * This module exposes a read-only platform index over the current system
 * character stores. It is not a new actor schema and it does not move full
 * character sheet data into the platform layer.
 *
 * V1 constraints:
 * - DND, COC, and CP RED read per-system multi-actor local stores.
 * - COC / CP RED keep legacy single-actor aliases only for old flow/draft
 *   compatibility; new ActorVaultRecord ids always use real actor ids.
 * - No actor writes, campaign membership, runtime actor, import/export, or
 *   store migration behavior is implemented here.
 */

import { useCharacterStore } from '../../store/characterStore';
import { useCocStore } from '../../store/cocStore';
import { useCpStore } from '../../store/cpStore';
import type { CharacterData } from '../dnd-types';
import { isPristineDndCharacterDraft } from '../dnd2024/dndLevelOneCharacter';
import type { CocCharacter } from '../coc-types';
import type { CpCharacter } from '../cp-types';
import {
  getActorVaultLifecycleMeta,
  getActorVaultLifecycleStatus,
  type ActorVaultLifecycleStatus,
} from './actorVaultLifecycleStore';

export type ActorVaultSystemId =
  | 'dnd5e-2024'
  | 'coc7e'
  | 'cp-red';

export type ActorVaultRecordStatus =
  | 'active'
  | 'archived';

export type ActorVaultRecordSource =
  | 'dnd-store'
  | 'coc-store'
  | 'cp-store';

export interface ActorVaultRecord {
  id: string;
  systemId: ActorVaultSystemId;
  displayName: string;
  subtitle?: string;
  status: ActorVaultRecordStatus;
  /**
   * Platform object lifecycle metadata.
   *
   * This is separate from the system actor store and separate from campaign
   * membership/runtime state. Missing metadata is normalized to active.
   */
  lifecycleStatus: ActorVaultLifecycleStatus;
  archivedAt?: string;
  trashedAt?: string;
  restoredAt?: string;
  updatedAt?: string;
  source: ActorVaultRecordSource;
  originalRef: {
    store: string;
    id?: string;
  };
}

export type ActorVaultRepositoryBridgeMode =
  | 'multi-actor'
  | 'single-actor';

export interface ActorVaultRepositoryBridgeCapability {
  systemId: ActorVaultSystemId;
  source: ActorVaultRecordSource;
  mode: ActorVaultRepositoryBridgeMode;
  canList: true;
  canRead: true;
  canReadActive: true;
  canCreate: false;
  canUpdate: false;
  canArchive: false;
  canDelete: false;
  note: string;
}

export const ACTOR_VAULT_REPOSITORY_BRIDGE_CAPABILITIES: Record<
  ActorVaultSystemId,
  ActorVaultRepositoryBridgeCapability
> = {
  'dnd5e-2024': {
    systemId: 'dnd5e-2024',
    source: 'dnd-store',
    mode: 'multi-actor',
    canList: true,
    canRead: true,
    canReadActive: true,
    canCreate: false,
    canUpdate: false,
    canArchive: false,
    canDelete: false,
    note: 'DND reads existing multi-character local store records. This bridge is read-only in v1.',
  },
  coc7e: {
    systemId: 'coc7e',
    source: 'coc-store',
    mode: 'multi-actor',
    canList: true,
    canRead: true,
    canReadActive: true,
    canCreate: false,
    canUpdate: false,
    canArchive: false,
    canDelete: false,
    note: 'COC reads the multi-investigator local store. Legacy coc-single remains an alias only for old local flow references.',
  },
  'cp-red': {
    systemId: 'cp-red',
    source: 'cp-store',
    mode: 'multi-actor',
    canList: true,
    canRead: true,
    canReadActive: true,
    canCreate: false,
    canUpdate: false,
    canArchive: false,
    canDelete: false,
    note: 'CP RED reads the multi-edgerunner local store. Legacy cp-single remains an alias only for old local flow references.',
  },
};

export function getActorVaultRepositoryBridgeCapability(
  systemId: ActorVaultSystemId,
): ActorVaultRepositoryBridgeCapability {
  return ACTOR_VAULT_REPOSITORY_BRIDGE_CAPABILITIES[systemId];
}

// ── Explicit read adapter boundary (P5.7) ────────────────────────────────────
// AI-LANDMARK: ACTOR_VAULT_LOCAL_READ_ADAPTER_V1
//
// Narrow read-side contract over the actor vault. This bridge IS the local,
// offline-first implementation; the per-system character stores remain the
// authority for local mode. It is NOT a cloud repository — a future
// cloud/Postgres adapter implements this SAME outer shape (likely async) and
// is selected at the repository boundary, without rewiring UI or the runtime
// actor snapshot path. Actor OWNERSHIP stays read-side metadata in the P5.2
// registry (actorVaultOwnership / localRepositoryAdapters), never here.
// P5.8: the future cloud counterpart is `CloudActorRepositoryContract`
// (cloudRepositoryContracts.ts) — async, result-typed, viewer-passed. This
// local adapter does NOT implement it; correspondence is by shape only.

/** Read-only actor vault contract (local-mode authority: system stores). */
export interface ActorVaultReadAdapter {
  /** Implementation marker for diagnostics/boundary clarity. */
  readonly kind: 'local';
  listActorVaultRecords(systemId: ActorVaultSystemId): ActorVaultRecord[];
  getActorVaultRecord(systemId: ActorVaultSystemId, actorId: string): ActorVaultRecord | undefined;
  getActiveActorVaultRecord(systemId: ActorVaultSystemId): ActorVaultRecord | undefined;
  getCapability(systemId: ActorVaultSystemId): ActorVaultRepositoryBridgeCapability;
}

/** Default local implementation — 1:1 delegation to the existing bridge reads. */
export const localActorVaultReadAdapter: ActorVaultReadAdapter = {
  kind: 'local',
  listActorVaultRecords: (systemId) => listActorVaultRecords(systemId),
  getActorVaultRecord: (systemId, actorId) => getActorVaultRecord(systemId, actorId),
  getActiveActorVaultRecord: (systemId) => getActiveActorVaultRecord(systemId),
  getCapability: (systemId) => getActorVaultRepositoryBridgeCapability(systemId),
};

export function listActorVaultRecords(systemId: ActorVaultSystemId): ActorVaultRecord[] {
  switch (systemId) {
    case 'dnd5e-2024':
      return listDndActorVaultRecords();
    case 'coc7e':
      return listCocActorVaultRecords();
    case 'cp-red':
      return listCpActorVaultRecords();
  }
}

export function getActorVaultRecord(
  systemId: ActorVaultSystemId,
  actorId: string,
): ActorVaultRecord | undefined {
  const records = listActorVaultRecords(systemId);
  return records.find((record) => record.id === actorId) ??
    resolveLegacyActorVaultAlias(systemId, actorId, records);
}

/**
 * Reads a detached snapshot for the current browser owner's local vault actor.
 * It is intentionally read-only and never exposes another user's character.
 */
export function getActorVaultLocalSnapshot(
  systemId: ActorVaultSystemId,
  actorId: string,
): Record<string, unknown> | undefined {
  const record = getActorVaultRecord(systemId, actorId);
  const resolvedActorId = record?.id ?? actorId;
  const snapshot = (() => {
    switch (systemId) {
      case 'dnd5e-2024': {
        const state = useCharacterStore.getState();
        return mergeDndActiveCharacter(state.characters, state.character, state.activeCharacterId)
          .find((character) => character.id === resolvedActorId);
      }
      case 'coc7e': {
        const state = useCocStore.getState();
        return mergeCocActiveCharacter(state.characters, state.character, state.activeCharacterId)
          .find((character) => character.id === resolvedActorId);
      }
      case 'cp-red': {
        const state = useCpStore.getState();
        return mergeCpActiveCharacter(state.characters, state.character, state.activeCharacterId)
          .find((character) => character.id === resolvedActorId);
      }
    }
  })();

  // Do not return a mutable reference into a Zustand store to the API layer.
  return snapshot ? JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown> : undefined;
}

export function getActiveActorVaultRecord(
  systemId: ActorVaultSystemId,
): ActorVaultRecord | undefined {
  switch (systemId) {
    case 'dnd5e-2024': {
      const state = useCharacterStore.getState();
      const activeId = state.activeCharacterId ?? state.character.id;
      const records = listDndActorVaultRecords();
      return records.find((record) => record.id === activeId) ?? records[0];
    }
    case 'coc7e': {
      const state = useCocStore.getState();
      const activeId = state.activeCharacterId ?? state.character.id;
      const records = listCocActorVaultRecords();
      return records.find((record) => record.id === activeId) ?? records[0];
    }
    case 'cp-red': {
      const state = useCpStore.getState();
      const activeId = state.activeCharacterId ?? state.character.id;
      const records = listCpActorVaultRecords();
      return records.find((record) => record.id === activeId) ?? records[0];
    }
  }
}

function listDndActorVaultRecords(): ActorVaultRecord[] {
  const state = useCharacterStore.getState();
  const characters = mergeDndActiveCharacter(
    state.characters,
    state.character,
    state.activeCharacterId,
  );

  return characters
    .filter((character) => Boolean(character.id) && !isPristineDndCharacterDraft(character))
    .map((character) => makeDndActorVaultRecord(character));
}

function mergeDndActiveCharacter(
  characters: CharacterData[],
  activeCharacter: CharacterData,
  activeCharacterId: string | null,
): CharacterData[] {
  if (!activeCharacter.id) return characters;
  if (!activeCharacterId) {
    return characters.some((character) => character.id === activeCharacter.id)
      ? characters
      : [...characters, activeCharacter];
  }
  if (characters.some((character) => character.id === activeCharacterId)) {
    return characters.map((character) =>
      character.id === activeCharacterId ? activeCharacter : character,
    );
  }
  return [...characters, activeCharacter];
}

function makeDndActorVaultRecord(character: CharacterData): ActorVaultRecord {
  const classLabel = character.subclass
    ? `${character.jobClass || 'Class'} / ${character.subclass}`
    : character.jobClass || 'Class';
  const subtitleParts = [
    `Level ${character.level || 1}`,
    classLabel,
    character.race || undefined,
    character.background || undefined,
  ].filter(Boolean);

  return withActorLifecycle({
    id: character.id,
    systemId: 'dnd5e-2024',
    displayName: character.name?.trim() || 'Unnamed DND Character',
    subtitle: subtitleParts.join(' / '),
    status: 'active',
    source: 'dnd-store',
    originalRef: {
      store: 'dnd-character-storage',
      id: character.id,
    },
  });
}

function listCocActorVaultRecords(): ActorVaultRecord[] {
  const state = useCocStore.getState();
  const characters = mergeCocActiveCharacter(
    state.characters,
    state.character,
    state.activeCharacterId,
  );
  return characters
    .filter((character) => Boolean(character.id?.trim()))
    .map((character) => makeCocActorVaultRecord(character));
}

function mergeCocActiveCharacter(
  characters: CocCharacter[],
  activeCharacter: CocCharacter,
  activeCharacterId: string | null,
): CocCharacter[] {
  if (!activeCharacter.id) return characters;
  if (!activeCharacterId) {
    return characters.some((character) => character.id === activeCharacter.id)
      ? characters
      : [...characters, activeCharacter];
  }
  if (characters.some((character) => character.id === activeCharacterId)) {
    return characters.map((character) =>
      character.id === activeCharacterId ? activeCharacter : character,
    );
  }
  return [...characters, activeCharacter];
}

function makeCocActorVaultRecord(character: CocCharacter): ActorVaultRecord {
  const id = character.id.trim();
  const subtitleParts = [
    character.occupation?.trim() || undefined,
    character.age ? `Age ${character.age}` : undefined,
    character.residence?.trim() || undefined,
  ].filter(Boolean);

  return withActorLifecycle({
    id,
    systemId: 'coc7e',
    displayName: character.name?.trim() || 'Unnamed Investigator',
    subtitle: subtitleParts.join(' / '),
    status: 'active',
    source: 'coc-store',
    originalRef: {
      store: 'coc-character-storage',
      id,
    },
  });
}

function listCpActorVaultRecords(): ActorVaultRecord[] {
  const state = useCpStore.getState();
  const characters = mergeCpActiveCharacter(
    state.characters,
    state.character,
    state.activeCharacterId,
  );
  return characters
    .filter((character) => Boolean(character.id?.trim()))
    .map((character) => makeCpActorVaultRecord(character));
}

function mergeCpActiveCharacter(
  characters: CpCharacter[],
  activeCharacter: CpCharacter,
  activeCharacterId: string | null,
): CpCharacter[] {
  if (!activeCharacter.id) return characters;
  if (!activeCharacterId) {
    return characters.some((character) => character.id === activeCharacter.id)
      ? characters
      : [...characters, activeCharacter];
  }
  if (characters.some((character) => character.id === activeCharacterId)) {
    return characters.map((character) =>
      character.id === activeCharacterId ? activeCharacter : character,
    );
  }
  return [...characters, activeCharacter];
}

function makeCpActorVaultRecord(character: CpCharacter): ActorVaultRecord {
  const id = character.id.trim();
  const displayName =
    character.lifePath?.handle?.trim() ||
    character.name?.trim() ||
    'Unnamed Edgerunner';
  const subtitleParts = [
    character.role?.trim() || undefined,
    character.roleLevel != null ? `Role ${character.roleLevel}` : undefined,
    character.hp ? `HP ${character.hp.current}/${character.hp.max}` : undefined,
    character.humanity ? `Humanity ${character.humanity.current}/${character.humanity.max}` : undefined,
  ].filter(Boolean);

  return withActorLifecycle({
    id,
    systemId: 'cp-red',
    displayName,
    subtitle: subtitleParts.join(' / '),
    status: 'active',
    source: 'cp-store',
    originalRef: {
      store: 'cp-red-character-storage',
      id,
    },
  });
}

function withActorLifecycle(
  record: Omit<
    ActorVaultRecord,
    'lifecycleStatus' | 'archivedAt' | 'trashedAt' | 'restoredAt'
  >,
): ActorVaultRecord {
  const meta = getActorVaultLifecycleMeta(record.systemId, record.id);
  return {
    ...record,
    lifecycleStatus: meta?.lifecycleStatus ??
      getActorVaultLifecycleStatus(record.systemId, record.id),
    archivedAt: meta?.archivedAt,
    trashedAt: meta?.trashedAt,
    restoredAt: meta?.restoredAt,
  };
}

function resolveLegacyActorVaultAlias(
  systemId: ActorVaultSystemId,
  actorId: string,
  records: ActorVaultRecord[],
): ActorVaultRecord | undefined {
  if (systemId === 'coc7e' && actorId === 'coc-single') {
    return getActiveActorVaultRecord('coc7e') ?? records[0];
  }
  if (systemId === 'cp-red' && actorId === 'cp-single') {
    return getActiveActorVaultRecord('cp-red') ?? records[0];
  }
  return undefined;
}
