import { useCharacterStore } from '../../store/characterStore';
import { useCocStore } from '../../store/cocStore';
import { useCpStore } from '../../store/cpStore';
import type { CharacterData } from '../dnd-types';
import type { CocCharacter } from '../coc-types';
import type { CpCharacter } from '../cp-types';
import { migrateCharacter } from '../characterMigration';
import { migrateCocCharacter } from '../cocMigration';
import { migrateCpCharacter } from '../cpMigration';
import {
  listActorVaultRecords,
  type ActorVaultSystemId,
} from './actorVaultRepositoryBridge';
import {
  importActorVaultLifecycleMetaForActor,
  useActorVaultLifecycleStore,
  type ActorVaultLifecycleStatus,
} from './actorVaultLifecycleStore';
import type {
  ActorVaultImportPreview,
  ActorVaultImportPreviewActor,
} from './actorVaultImportPreview';

export type ActorVaultSafeAppendSkippedReason =
  | 'same-id-existing'
  | 'unsupported-system'
  | 'invalid-record';

export type ActorVaultSafeAppendImportedActor = {
  systemId: ActorVaultSystemId;
  actorId: string;
  displayName: string;
  lifecycleStatus: ActorVaultLifecycleStatus;
};

export type ActorVaultSafeAppendPlan = {
  preview: ActorVaultImportPreview;
  importableActors: ActorVaultImportPreviewActor[];
  skippedConflictCount: number;
  skippedUnsupportedCount: number;
  skippedInvalidCount: number;
};

export type ActorVaultSafeAppendResult = {
  importedActors: ActorVaultSafeAppendImportedActor[];
  skippedConflictCount: number;
  skippedUnsupportedCount: number;
  skippedInvalidCount: number;
  systemCounts: Record<ActorVaultSystemId, number>;
  lifecycleCounts: Record<ActorVaultLifecycleStatus, number>;
};

export function buildActorVaultSafeAppendPlan(
  preview: ActorVaultImportPreview,
): ActorVaultSafeAppendPlan {
  return {
    preview,
    importableActors: preview.isValidSnapshot
      ? preview.actors.filter((actor) => actor.conflict === 'none')
      : [],
    skippedConflictCount: preview.actors.filter((actor) => actor.conflict === 'same-id-existing').length,
    skippedUnsupportedCount: preview.unsupportedActors.filter(
      (actor) => actor.reason === 'unsupported-system',
    ).length,
    skippedInvalidCount: preview.unsupportedActors.filter(
      (actor) => actor.reason === 'invalid-record',
    ).length,
  };
}

export function applyActorVaultSafeAppendImport(
  plan: ActorVaultSafeAppendPlan,
): ActorVaultSafeAppendResult {
  const result: ActorVaultSafeAppendResult = {
    importedActors: [],
    skippedConflictCount: plan.skippedConflictCount,
    skippedUnsupportedCount: plan.skippedUnsupportedCount,
    skippedInvalidCount: plan.skippedInvalidCount,
    systemCounts: createSystemCounts(),
    lifecycleCounts: createLifecycleCounts(),
  };

  for (const actor of plan.importableActors) {
    if (hasExistingActor(actor.systemId, actor.actorId)) {
      result.skippedConflictCount += 1;
      continue;
    }

    const didAppend = appendActorToSystemStore(actor);
    if (!didAppend) {
      result.skippedInvalidCount += 1;
      continue;
    }

    applyLifecycleForImportedActor(actor);
    result.importedActors.push({
      systemId: actor.systemId,
      actorId: actor.actorId,
      displayName: actor.displayName,
      lifecycleStatus: actor.lifecycleStatus,
    });
    result.systemCounts[actor.systemId] += 1;
    result.lifecycleCounts[actor.lifecycleStatus] += 1;
  }

  return result;
}

export function summarizeActorVaultImportResult(result: ActorVaultSafeAppendResult): string {
  return [
    `Imported ${result.importedActors.length}`,
    `conflicts skipped ${result.skippedConflictCount}`,
    `unsupported skipped ${result.skippedUnsupportedCount}`,
    `invalid skipped ${result.skippedInvalidCount}`,
  ].join('; ');
}

function appendActorToSystemStore(actor: ActorVaultImportPreviewActor): boolean {
  switch (actor.systemId) {
    case 'dnd5e-2024':
      return appendDndActor(actor);
    case 'coc7e':
      return appendCocActor(actor);
    case 'cp-red':
      return appendCpActor(actor);
    default:
      return false;
  }
}

function appendDndActor(actor: ActorVaultImportPreviewActor): boolean {
  const state = useCharacterStore.getState();
  if (state.characters.some((item) => item.id === actor.actorId) || state.character.id === actor.actorId) {
    return false;
  }
  const imported: CharacterData = {
    ...migrateCharacter(actor.actorData),
    id: actor.actorId,
  };
  const characters = syncActiveActorForImport(state.character, state.characters, state.activeCharacterId);
  const hasActive = hasExistingActiveActor(characters, state.activeCharacterId);
  useCharacterStore.setState({
    characters: [...characters, imported],
    ...(hasActive ? {} : { character: imported, activeCharacterId: imported.id }),
  });
  return true;
}

function appendCocActor(actor: ActorVaultImportPreviewActor): boolean {
  const state = useCocStore.getState();
  if (state.characters.some((item) => item.id === actor.actorId) || state.character.id === actor.actorId) {
    return false;
  }
  const imported: CocCharacter = {
    ...migrateCocCharacter(actor.actorData),
    id: actor.actorId,
  };
  const characters = syncActiveActorForImport(state.character, state.characters, state.activeCharacterId);
  const hasActive = hasExistingActiveActor(characters, state.activeCharacterId);
  useCocStore.setState({
    characters: [...characters, imported],
    ...(hasActive ? {} : { character: imported, activeCharacterId: imported.id }),
  });
  return true;
}

function appendCpActor(actor: ActorVaultImportPreviewActor): boolean {
  const state = useCpStore.getState();
  if (state.characters.some((item) => item.id === actor.actorId) || state.character.id === actor.actorId) {
    return false;
  }
  const imported: CpCharacter = {
    ...migrateCpCharacter(actor.actorData),
    id: actor.actorId,
  };
  const characters = syncActiveActorForImport(state.character, state.characters, state.activeCharacterId);
  const hasActive = hasExistingActiveActor(characters, state.activeCharacterId);
  useCpStore.setState({
    characters: [...characters, imported],
    ...(hasActive ? {} : { character: imported, activeCharacterId: imported.id }),
  });
  return true;
}

function applyLifecycleForImportedActor(actor: ActorVaultImportPreviewActor): void {
  if (actor.lifecycleMeta) {
    importActorVaultLifecycleMetaForActor({
      ...actor.lifecycleMeta,
      systemId: actor.systemId,
      actorId: actor.actorId,
      lifecycleStatus: actor.lifecycleStatus,
    });
    return;
  }

  if (actor.lifecycleStatus === 'archived') {
    useActorVaultLifecycleStore.getState().archiveActor(actor.systemId, actor.actorId, 'Imported from ActorVault snapshot');
  }
  if (actor.lifecycleStatus === 'trashed') {
    useActorVaultLifecycleStore.getState().trashActor(actor.systemId, actor.actorId, 'Imported from ActorVault snapshot');
  }
}

function hasExistingActor(systemId: ActorVaultSystemId, actorId: string): boolean {
  return listActorVaultRecords(systemId).some((record) => record.id === actorId);
}

function syncActiveActorForImport<T extends { id?: string }>(
  activeActor: T,
  actors: T[],
  activeActorId: string | null,
): T[] {
  const targetId = activeActorId?.trim() || activeActor.id?.trim();
  if (!targetId) return actors;
  if (actors.some((actor) => actor.id === targetId)) {
    return actors.map((actor) => (actor.id === targetId ? activeActor : actor));
  }
  return actors.some((actor) => actor.id === activeActor.id) ? actors : [...actors, activeActor];
}

function hasExistingActiveActor<T extends { id?: string }>(
  actors: T[],
  activeActorId: string | null,
): boolean {
  return Boolean(activeActorId && actors.some((actor) => actor.id === activeActorId));
}

function createSystemCounts(): Record<ActorVaultSystemId, number> {
  return {
    'dnd5e-2024': 0,
    coc7e: 0,
    'cp-red': 0,
  };
}

function createLifecycleCounts(): Record<ActorVaultLifecycleStatus, number> {
  return {
    active: 0,
    archived: 0,
    trashed: 0,
  };
}
