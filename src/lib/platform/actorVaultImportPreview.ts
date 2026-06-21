import {
  ACTOR_VAULT_EXPORT_KIND,
  ACTOR_VAULT_EXPORT_SNAPSHOT_SCHEMA_VERSION,
} from './actorVaultExportSnapshot';
import {
  listActorVaultRecords,
  type ActorVaultRecord,
  type ActorVaultSystemId,
} from './actorVaultRepositoryBridge';
import type { ActorVaultLifecycleStatus } from './actorVaultLifecycleStore';

export type ActorVaultImportPreviewConflict =
  | 'none'
  | 'same-id-existing';

export type ActorVaultImportPreviewUnsupportedReason =
  | 'unsupported-system'
  | 'invalid-record';

export type ActorVaultImportPreviewActor = {
  systemId: ActorVaultSystemId;
  actorId: string;
  displayName: string;
  lifecycleStatus: ActorVaultLifecycleStatus;
  conflict: ActorVaultImportPreviewConflict;
};

export type ActorVaultImportPreviewUnsupportedActor = {
  systemId?: string;
  actorId?: string;
  displayName?: string;
  reason: ActorVaultImportPreviewUnsupportedReason;
  message: string;
};

export type ActorVaultImportPreview = {
  isValidSnapshot: boolean;
  exportKind?: string;
  schemaVersion?: number;
  exportedAt?: string;
  actorCount: number;
  supportedActorCount: number;
  unsupportedActorCount: number;
  conflictCount: number;
  systemCounts: Record<ActorVaultSystemId, number>;
  lifecycleCounts: Record<ActorVaultLifecycleStatus, number>;
  actors: ActorVaultImportPreviewActor[];
  unsupportedActors: ActorVaultImportPreviewUnsupportedActor[];
  errors: string[];
  warnings: string[];
};

const SUPPORTED_SYSTEM_IDS: ActorVaultSystemId[] = [
  'dnd5e-2024',
  'coc7e',
  'cp-red',
];

const SUPPORTED_LIFECYCLE_STATUSES: ActorVaultLifecycleStatus[] = [
  'active',
  'archived',
  'trashed',
];

export function parseActorVaultImportPreview(
  fileText: string,
  currentRecords = listCurrentActorVaultRecords(),
): ActorVaultImportPreview {
  try {
    return buildActorVaultImportPreview(JSON.parse(fileText) as unknown, currentRecords);
  } catch {
    return createEmptyPreview({
      errors: ['The selected file is not valid JSON.'],
    });
  }
}

export function buildActorVaultImportPreview(
  value: unknown,
  currentRecords = listCurrentActorVaultRecords(),
): ActorVaultImportPreview {
  if (!isRecord(value)) {
    return createEmptyPreview({
      errors: ['The selected file is not a platform export envelope.'],
    });
  }

  const payload = value.payload;
  if (!isRecord(payload)) {
    return createEmptyPreview({
      exportKind: readString(value.metadata, 'exportKind'),
      schemaVersion: readNumber(value, 'schemaVersion'),
      exportedAt: readString(value, 'exportedAt'),
      errors: ['The selected file is missing an ActorVault snapshot payload.'],
    });
  }

  const exportKind = readString(payload, 'exportKind');
  const schemaVersion = readNumber(payload, 'schemaVersion');
  const exportedAt = readString(payload, 'exportedAt') ?? readString(value, 'exportedAt');
  const errors: string[] = [];

  if (readString(value, 'kind') !== 'platformBackup') {
    errors.push('The selected file is not a platform backup envelope.');
  }
  if (exportKind !== ACTOR_VAULT_EXPORT_KIND) {
    errors.push('The selected file is not an ActorVault export snapshot.');
  }
  if (schemaVersion !== ACTOR_VAULT_EXPORT_SNAPSHOT_SCHEMA_VERSION) {
    errors.push(`Unsupported ActorVault snapshot schema version: ${schemaVersion ?? 'missing'}.`);
  }
  if (!Array.isArray(payload.actors)) {
    errors.push('The ActorVault snapshot payload is missing its actors array.');
  }

  if (errors.length > 0 || !Array.isArray(payload.actors)) {
    return createEmptyPreview({
      exportKind,
      schemaVersion,
      exportedAt,
      errors,
    });
  }

  const existingKeys = new Set(
    currentRecords.map((record) => makeActorKey(record.systemId, record.id)),
  );
  const warnings: string[] = [];
  const actors: ActorVaultImportPreviewActor[] = [];
  const unsupportedActors: ActorVaultImportPreviewUnsupportedActor[] = [];

  for (const rawActor of payload.actors) {
    const parsed = parsePreviewActor(rawActor, existingKeys);
    if ('actor' in parsed) {
      actors.push(parsed.actor);
      if (parsed.actor.conflict === 'same-id-existing') {
        warnings.push(`Actor ${parsed.actor.systemId}/${parsed.actor.actorId} already exists locally.`);
      }
    } else {
      unsupportedActors.push(parsed.unsupported);
      warnings.push(parsed.unsupported.message);
    }
  }

  const systemCounts = createSystemCounts();
  const lifecycleCounts = createLifecycleCounts();
  for (const actor of actors) {
    systemCounts[actor.systemId] += 1;
    lifecycleCounts[actor.lifecycleStatus] += 1;
  }

  return {
    isValidSnapshot: true,
    exportKind,
    schemaVersion,
    exportedAt,
    actorCount: payload.actors.length,
    supportedActorCount: actors.length,
    unsupportedActorCount: unsupportedActors.length,
    conflictCount: actors.filter((actor) => actor.conflict !== 'none').length,
    systemCounts,
    lifecycleCounts,
    actors,
    unsupportedActors,
    errors,
    warnings,
  };
}

export function listCurrentActorVaultRecords(): ActorVaultRecord[] {
  return SUPPORTED_SYSTEM_IDS.flatMap((systemId) => listActorVaultRecords(systemId));
}

function parsePreviewActor(
  value: unknown,
  existingKeys: Set<string>,
): { actor: ActorVaultImportPreviewActor } | { unsupported: ActorVaultImportPreviewUnsupportedActor } {
  if (!isRecord(value)) {
    return {
      unsupported: {
        reason: 'invalid-record',
        message: 'A snapshot actor entry is not an object.',
      },
    };
  }

  const systemId = readString(value, 'systemId');
  const actorId = readString(value, 'actorId');
  const displayName = readDisplayName(value, actorId);
  const lifecycleStatus = readString(value, 'lifecycleStatus');

  if (!systemId || !actorId || !isLifecycleStatus(lifecycleStatus)) {
    return {
      unsupported: {
        systemId,
        actorId,
        displayName,
        reason: 'invalid-record',
        message: `Invalid actor snapshot record${actorId ? ` (${actorId})` : ''}.`,
      },
    };
  }

  if (!isActorVaultSystemId(systemId)) {
    return {
      unsupported: {
        systemId,
        actorId,
        displayName,
        reason: 'unsupported-system',
        message: `Unsupported actor system "${systemId}" for actor ${actorId}.`,
      },
    };
  }

  return {
    actor: {
      systemId,
      actorId,
      displayName: displayName ?? actorId,
      lifecycleStatus,
      conflict: existingKeys.has(makeActorKey(systemId, actorId))
        ? 'same-id-existing'
        : 'none',
    },
  };
}

function createEmptyPreview(params: {
  exportKind?: string;
  schemaVersion?: number;
  exportedAt?: string;
  errors?: string[];
}): ActorVaultImportPreview {
  return {
    isValidSnapshot: false,
    exportKind: params.exportKind,
    schemaVersion: params.schemaVersion,
    exportedAt: params.exportedAt,
    actorCount: 0,
    supportedActorCount: 0,
    unsupportedActorCount: 0,
    conflictCount: 0,
    systemCounts: createSystemCounts(),
    lifecycleCounts: createLifecycleCounts(),
    actors: [],
    unsupportedActors: [],
    errors: params.errors ?? [],
    warnings: [],
  };
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

function makeActorKey(systemId: ActorVaultSystemId, actorId: string): string {
  return `${systemId}:${actorId}`;
}

function isActorVaultSystemId(value: string): value is ActorVaultSystemId {
  return SUPPORTED_SYSTEM_IDS.includes(value as ActorVaultSystemId);
}

function isLifecycleStatus(value: unknown): value is ActorVaultLifecycleStatus {
  return SUPPORTED_LIFECYCLE_STATUSES.includes(value as ActorVaultLifecycleStatus);
}

function readDisplayName(value: Record<string, unknown>, actorId?: string): string | undefined {
  const actorVaultRecord = value.actorVaultRecord;
  if (isRecord(actorVaultRecord)) {
    const displayName = readString(actorVaultRecord, 'displayName');
    if (displayName) return displayName;
  }
  const actorData = value.actorData;
  if (isRecord(actorData)) {
    const name = readString(actorData, 'name');
    if (name) return name;
  }
  return actorId;
}

function readString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined;
  const raw = value[key];
  return typeof raw === 'string' && raw.trim() ? raw : undefined;
}

function readNumber(value: unknown, key: string): number | undefined {
  if (!isRecord(value)) return undefined;
  const raw = value[key];
  return typeof raw === 'number' ? raw : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
