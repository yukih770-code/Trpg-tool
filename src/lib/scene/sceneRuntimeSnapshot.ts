import {
  createCombatant,
  createCombatRuntimeTableState,
  type Combatant,
  type CombatRuntimeStatus,
  type CombatRuntimeTableState,
  type CombatantKind,
  type CombatantSourceType,
  type CombatantStatus,
} from '../combat/combatRuntimeTypes';
import { createMapBoardState, createMapToken, type MapBoardState, type MapToken, type MapTokenSize, type MapTokenSourceType } from '../map/mapRuntimeTypes';
import {
  SCENE_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
  type SceneRuntimeSnapshot,
  type SceneRuntimeSnapshotContext,
  type SceneRuntimeSnapshotImportResult,
  type SceneRuntimeSnapshotSummary,
  type SceneRuntimeSnapshotValidation,
  type SceneRuntimeSnapshotWarning,
} from './sceneRuntimeSnapshotTypes';

type SnapshotInput = {
  context?: SceneRuntimeSnapshotContext;
  combat?: CombatRuntimeTableState;
  map?: MapBoardState;
  metadata?: SceneRuntimeSnapshot['metadata'];
  exportedAt?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function oneOf<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return typeof value === 'string' && values.includes(value as T) ? value as T : fallback;
}

function sanitizeCombatant(value: unknown): Combatant | null {
  const input = isRecord(value) ? value : null;
  const id = stringValue(input?.id);
  if (!id) return null;
  const conditions = Array.isArray(input?.conditions)
    ? input.conditions.flatMap((condition) => stringValue(condition) ? [stringValue(condition) as string] : [])
    : [];
  return createCombatant({
    id,
    name: stringValue(input?.name),
    displayName: stringValue(input?.displayName),
    kind: oneOf<CombatantKind>(input?.kind, ['character', 'npc', 'other'], 'other'),
    sourceType: oneOf<CombatantSourceType>(input?.sourceType, ['campaign_actor', 'manual_npc', 'manual_pc', 'unknown'], 'unknown'),
    sourceActorInstanceId: stringValue(input?.sourceActorInstanceId),
    initiative: numberValue(input?.initiative),
    initiativeModifier: numberValue(input?.initiativeModifier) ?? 0,
    initiativeFormula: stringValue(input?.initiativeFormula),
    hpCurrent: numberValue(input?.hpCurrent ?? input?.hitPoints),
    hpMax: numberValue(input?.hpMax ?? input?.maxHitPoints),
    armorClass: numberValue(input?.armorClass),
    conditions,
    notes: stringValue(input?.notes),
    isDefeated: input?.isDefeated === true || input?.status === 'defeated',
    status: oneOf<CombatantStatus>(input?.status, ['active', 'defeated', 'removed'], 'active'),
  });
}

function sanitizeCombat(value: unknown): CombatRuntimeTableState | undefined {
  if (!isRecord(value)) return undefined;
  const combatants = Array.isArray(value.combatants)
    ? value.combatants.flatMap((combatant) => {
        const next = sanitizeCombatant(combatant);
        return next ? [next] : [];
      })
    : [];
  const inputTurn = isRecord(value.turn) ? value.turn : {};
  const base = createCombatRuntimeTableState();
  const activeCombatantId = stringValue(inputTurn.activeCombatantId);
  return {
    combatants,
    turn: {
      status: oneOf<CombatRuntimeStatus>(inputTurn.status, ['setup', 'active', 'paused', 'ended'], base.turn.status),
      roundNumber: Math.max(1, Math.floor(numberValue(inputTurn.roundNumber) ?? base.turn.roundNumber)),
      turnIndex: Math.floor(numberValue(inputTurn.turnIndex) ?? base.turn.turnIndex),
      startedAt: stringValue(inputTurn.startedAt),
      activeCombatantId: activeCombatantId && combatants.some((combatant) => combatant.id === activeCombatantId) ? activeCombatantId : undefined,
    },
  };
}

function sanitizeToken(value: unknown): MapToken | null {
  const input = isRecord(value) ? value : null;
  const id = stringValue(input?.id);
  if (!id) return null;
  return createMapToken({
    id,
    name: stringValue(input?.name),
    x: numberValue(input?.x),
    y: numberValue(input?.y),
    size: oneOf<MapTokenSize>(input?.size, ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'custom'], 'medium'),
    width: numberValue(input?.width),
    height: numberValue(input?.height),
    sourceType: oneOf<MapTokenSourceType>(input?.sourceType, ['combatant', 'campaign_actor', 'manual', 'unknown'], 'unknown'),
    sourceCombatantId: stringValue(input?.sourceCombatantId),
    sourceActorInstanceId: stringValue(input?.sourceActorInstanceId),
    colorLabel: stringValue(input?.colorLabel),
    notes: stringValue(input?.notes),
    isHidden: input?.isHidden === true,
  });
}

function sanitizeMap(value: unknown): MapBoardState | undefined {
  if (!isRecord(value)) return undefined;
  const mapId = stringValue(value.mapId) ?? 'snapshot-map';
  const base = createMapBoardState(mapId);
  const tokens = Array.isArray(value.tokens)
    ? value.tokens.flatMap((token) => {
        const next = sanitizeToken(token);
        return next ? [next] : [];
      })
    : [];
  const uniqueTokens = tokens.filter((token, index) => tokens.findIndex((candidate) => candidate.id === token.id) === index);
  const selectedTokenId = stringValue(value.selectedTokenId);
  return {
    ...base,
    backgroundUrl: stringValue(value.backgroundUrl),
    backgroundName: stringValue(value.backgroundName),
    zoom: clamp(numberValue(value.zoom) ?? base.zoom, 0.5, 2.5),
    panX: numberValue(value.panX) ?? base.panX,
    panY: numberValue(value.panY) ?? base.panY,
    tokens: uniqueTokens,
    selectedTokenId: selectedTokenId && uniqueTokens.some((token) => token.id === selectedTokenId) ? selectedTokenId : undefined,
    updatedAt: stringValue(value.updatedAt),
  };
}

function sanitizeMetadata(value: unknown): SceneRuntimeSnapshot['metadata'] | undefined {
  if (!isRecord(value)) return undefined;
  const title = stringValue(value.title);
  const notes = stringValue(value.notes);
  return title || notes ? { title, notes } : undefined;
}

function snapshotWarnings(snapshot: SceneRuntimeSnapshot, context?: SceneRuntimeSnapshotContext): SceneRuntimeSnapshotWarning[] {
  if (!context) return [];
  const warnings: SceneRuntimeSnapshotWarning[] = [];
  if (snapshot.roomId && context.roomId && snapshot.roomId !== context.roomId) warnings.push('room_mismatch');
  if (snapshot.campaignId && context.campaignId && snapshot.campaignId !== context.campaignId) warnings.push('campaign_mismatch');
  if (snapshot.runtimeSessionId && context.runtimeSessionId && snapshot.runtimeSessionId !== context.runtimeSessionId) warnings.push('runtime_session_mismatch');
  return warnings;
}

export function sanitizeSceneRuntimeSnapshot(snapshot: SceneRuntimeSnapshot): SceneRuntimeSnapshot {
  const combat = sanitizeCombat(snapshot.combat);
  const board = sanitizeMap(snapshot.map?.board);
  return {
    schemaVersion: SCENE_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
    exportedAt: stringValue(snapshot.exportedAt) ?? new Date().toISOString(),
    appFeature: 'scene-runtime-snapshot',
    roomId: stringValue(snapshot.roomId),
    campaignId: stringValue(snapshot.campaignId),
    runtimeSessionId: stringValue(snapshot.runtimeSessionId),
    combat,
    map: board ? { board } : undefined,
    metadata: sanitizeMetadata(snapshot.metadata),
  };
}

export function createSceneRuntimeSnapshot(input: SnapshotInput): SceneRuntimeSnapshot {
  return sanitizeSceneRuntimeSnapshot({
    schemaVersion: SCENE_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    appFeature: 'scene-runtime-snapshot',
    roomId: input.context?.roomId,
    campaignId: input.context?.campaignId,
    runtimeSessionId: input.context?.runtimeSessionId,
    combat: input.combat,
    map: input.map ? { board: input.map } : undefined,
    metadata: input.metadata,
  });
}

export function validateSceneRuntimeSnapshot(value: unknown, context?: SceneRuntimeSnapshotContext): SceneRuntimeSnapshotValidation {
  if (!isRecord(value)) return { ok: false, errors: ['Snapshot must be a JSON object.'] };
  if (value.schemaVersion !== SCENE_RUNTIME_SNAPSHOT_SCHEMA_VERSION) return { ok: false, errors: ['Unsupported scene snapshot schema version.'] };
  if (value.appFeature !== 'scene-runtime-snapshot') return { ok: false, errors: ['This is not a scene runtime snapshot.'] };
  if (!stringValue(value.exportedAt)) return { ok: false, errors: ['Snapshot export time is missing.'] };
  const snapshot = sanitizeSceneRuntimeSnapshot(value as SceneRuntimeSnapshot);
  return { ok: true, snapshot, warnings: snapshotWarnings(snapshot, context) };
}

export function importSceneRuntimeSnapshot(value: unknown, context?: SceneRuntimeSnapshotContext): SceneRuntimeSnapshotImportResult {
  return validateSceneRuntimeSnapshot(value, context);
}

export function summarizeSceneRuntimeSnapshot(snapshot: SceneRuntimeSnapshot): SceneRuntimeSnapshotSummary {
  return {
    hasCombat: Boolean(snapshot.combat),
    hasMap: Boolean(snapshot.map),
    combatantCount: snapshot.combat?.combatants.length ?? 0,
    tokenCount: snapshot.map?.board.tokens.length ?? 0,
    hasMapBackground: Boolean(snapshot.map?.board.backgroundUrl),
  };
}
