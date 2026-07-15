import { randomUUID } from 'node:crypto';

export type RuntimeEventPersistenceBridgeStatus =
  | 'persisted'
  | 'skipped'
  | 'not_configured'
  | 'missing_context'
  | 'repository_error'
  | 'disabled';

export type RuntimeBridgeEventSource =
  | 'room_server'
  | 'runtime_api'
  | 'websocket'
  | 'system'
  | 'unknown';

export type RuntimeBridgeVisibilityScope =
  | 'campaign'
  | 'server'
  | 'user_private'
  | 'global_public'
  | 'unlisted'
  | 'private'
  | 'public'
  | 'hostOnly';

export interface RuntimeEventPersistenceCandidate {
  worldServerId?: string | null;
  campaignId?: string | null;
  roomId?: string | null;
  runtimeSessionId?: string | null;
  source: RuntimeBridgeEventSource | string | null | undefined;
  eventKind: string;
  eventPayload: Record<string, unknown>;
  actorId?: string | null;
  causedByEventId?: string | null;
  actorUserId?: string | null;
  idempotencyKey?: string | null;
  clientEventId?: string | null;
  occurredAt?: string | null;
  visibilityScope?: RuntimeBridgeVisibilityScope;
  notes?: string[];
}

export interface NormalizedRuntimeEventPersistenceCandidate
  extends RuntimeEventPersistenceCandidate {
  source: RuntimeBridgeEventSource;
  eventKind: string;
  eventPayload: Record<string, unknown>;
  occurredAt: string;
  visibilityScope: RuntimeBridgeVisibilityScope;
  notes: string[];
}

export interface RuntimeEventPersistenceAppendInput {
  runtimeEventId: string;
  runtimeSessionId: string;
  campaignId: string;
  eventKind: string;
  visibility: RuntimeBridgeVisibilityScope;
  idempotencyKey: string;
  actorId?: string;
  causedByEventId?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdByUserId?: string;
}

export type RuntimeEventPersistenceRepositoryResult =
  | { ok: true; value: { runtimeEventId: string; seq: number; record?: unknown } }
  | {
      ok: false;
      error: { kind?: string; message?: string; retryable?: boolean };
    };

export interface RuntimeEventPersistenceRepositoryPort {
  appendRuntimeEvent(
    input: RuntimeEventPersistenceAppendInput,
  ): Promise<RuntimeEventPersistenceRepositoryResult>;
}

export interface RuntimeEventPersistenceBridgeOptions {
  enabled?: boolean;
  repository: RuntimeEventPersistenceRepositoryPort;
}

export interface RuntimeEventPersistenceBridgeResult {
  status: RuntimeEventPersistenceBridgeStatus;
  normalizedCandidate?: NormalizedRuntimeEventPersistenceCandidate;
  idempotencyKey?: string;
  persistedEvent?: { runtimeEventId: string; seq: number; record?: unknown };
  notes: string[];
}

export const RUNTIME_BRIDGE_EVENT_KINDS = [
  'room.created',
  'room.updated',
  'runtime_session.created',
  'runtime_session.updated',
  'runtime.event.appended',
  'lobby.participant.joined',
  'lobby.participant.left',
  'system.note',
] as const;

const KNOWN_SOURCES = new Set<RuntimeBridgeEventSource>([
  'room_server',
  'runtime_api',
  'websocket',
  'system',
  'unknown',
]);

function stringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function normalizeSource(value: unknown): RuntimeBridgeEventSource {
  const source = stringOrUndefined(value);
  return source && KNOWN_SOURCES.has(source as RuntimeBridgeEventSource)
    ? (source as RuntimeBridgeEventSource)
    : 'unknown';
}

function toJsonSafe(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item, seen) ?? null);
  }
  if (typeof value !== 'object') return undefined;
  if (seen.has(value)) return undefined;
  seen.add(value);
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const safe = toJsonSafe(item, seen);
    if (safe !== undefined) result[key] = safe;
  }
  seen.delete(value);
  return result;
}

function jsonSafeRecord(value: unknown): Record<string, unknown> {
  const safe = toJsonSafe(value);
  return safe && typeof safe === 'object' && !Array.isArray(safe)
    ? (safe as Record<string, unknown>)
    : {};
}

function stablePart(value: unknown): string {
  return encodeURIComponent(stringOrUndefined(value) ?? '');
}

export function createRuntimeEventIdempotencyKey(
  input: Pick<
    RuntimeEventPersistenceCandidate,
    | 'worldServerId'
    | 'campaignId'
    | 'roomId'
    | 'runtimeSessionId'
    | 'source'
    | 'eventKind'
    | 'actorId'
    | 'causedByEventId'
    | 'actorUserId'
    | 'clientEventId'
    | 'occurredAt'
  >,
): string {
  return [
    'runtime-bridge-v1',
    stablePart(input.worldServerId),
    stablePart(input.campaignId),
    stablePart(input.roomId),
    stablePart(input.runtimeSessionId),
    stablePart(normalizeSource(input.source)),
    stablePart(input.eventKind),
    stablePart(input.actorId),
    stablePart(input.causedByEventId),
    stablePart(input.actorUserId),
    stablePart(input.clientEventId),
    stablePart(input.occurredAt),
  ].join(':');
}

export function normalizeRuntimeEventPersistenceCandidate(
  input: RuntimeEventPersistenceCandidate,
): NormalizedRuntimeEventPersistenceCandidate {
  const occurredAt = stringOrUndefined(input.occurredAt) ?? new Date().toISOString();
  return {
    ...input,
    worldServerId: stringOrUndefined(input.worldServerId),
    campaignId: stringOrUndefined(input.campaignId),
    roomId: stringOrUndefined(input.roomId),
    runtimeSessionId: stringOrUndefined(input.runtimeSessionId),
    source: normalizeSource(input.source),
    eventKind: stringOrUndefined(input.eventKind) ?? '',
    eventPayload: jsonSafeRecord(input.eventPayload),
    actorId: stringOrUndefined(input.actorId),
    causedByEventId: stringOrUndefined(input.causedByEventId),
    actorUserId: stringOrUndefined(input.actorUserId),
    idempotencyKey: stringOrUndefined(input.idempotencyKey),
    clientEventId: stringOrUndefined(input.clientEventId),
    occurredAt,
    visibilityScope: input.visibilityScope ?? 'campaign',
    notes: Array.isArray(input.notes)
      ? input.notes.filter((note): note is string => typeof note === 'string').map((note) => note.trim()).filter(Boolean)
      : [],
  };
}

function safeRepositoryNote(error: { kind?: string; retryable?: boolean } | undefined): string {
  if (error?.kind === 'not_configured') return 'Runtime event persistence is not configured.';
  if (error?.retryable === true) return 'Runtime event persistence is temporarily unavailable.';
  return 'Runtime event persistence did not accept the event.';
}

export async function persistRuntimeEventCandidate(
  input: RuntimeEventPersistenceCandidate,
  options: RuntimeEventPersistenceBridgeOptions,
): Promise<RuntimeEventPersistenceBridgeResult> {
  if (options.enabled === false) {
    return { status: 'disabled', notes: ['Runtime event persistence bridge is disabled.'] };
  }

  const normalizedCandidate = normalizeRuntimeEventPersistenceCandidate(input);
  if (!normalizedCandidate.campaignId || !normalizedCandidate.runtimeSessionId || !normalizedCandidate.eventKind) {
    return {
      status: 'missing_context',
      normalizedCandidate,
      notes: ['Campaign, runtime session, and event kind are required.'],
    };
  }

  const idempotencyKey =
    normalizedCandidate.idempotencyKey ??
    createRuntimeEventIdempotencyKey({
      ...normalizedCandidate,
      // A generated normalization timestamp must not make retries produce a
      // different idempotency key when the caller did not provide one.
      occurredAt: stringOrUndefined(input.occurredAt),
    });

  try {
    const repositoryResult = await options.repository.appendRuntimeEvent({
      runtimeEventId: randomUUID(),
      runtimeSessionId: normalizedCandidate.runtimeSessionId,
      campaignId: normalizedCandidate.campaignId,
      eventKind: normalizedCandidate.eventKind,
      visibility: normalizedCandidate.visibilityScope,
      idempotencyKey,
      actorId: normalizedCandidate.actorId ?? undefined,
      causedByEventId: normalizedCandidate.causedByEventId ?? undefined,
      payload: normalizedCandidate.eventPayload,
      schemaVersion: 1,
      createdByUserId: normalizedCandidate.actorUserId ?? undefined,
    });

    if (repositoryResult.ok === false) {
      if (repositoryResult.error.kind === 'not_configured') {
        return {
          status: 'not_configured',
          normalizedCandidate,
          idempotencyKey,
          notes: [safeRepositoryNote(repositoryResult.error)],
        };
      }
      return {
        status: 'repository_error',
        normalizedCandidate,
        idempotencyKey,
        notes: [safeRepositoryNote(repositoryResult.error)],
      };
    }

    return {
      status: 'persisted',
      normalizedCandidate,
      idempotencyKey,
      persistedEvent: repositoryResult.value,
      notes: ['Runtime event appended to long-term persistence.'],
    };
  } catch {
    return {
      status: 'repository_error',
      normalizedCandidate,
      idempotencyKey,
      notes: ['Runtime event persistence failed without changing live authority.'],
    };
  }
}
