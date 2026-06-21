import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { LocalCampaignSystemId } from './campaignLocalStore';

// AI-LANDMARK: RUNTIME_LOG_LOCAL_REPOSITORY_V1
// Local MVP repository only: this is not a rules engine, multiplayer sync,
// permission system, CampaignMembership, CampaignActorInstance, or RuntimeActor.

export type RuntimeLogEventType =
  | 'session.started'
  | 'roll.performed'
  | 'actor.note'
  | 'actor.hpChanged'
  | 'actor.resourceChanged'
  | 'actor.sanChanged'
  | 'actor.humanityChanged'
  | 'system.note';

export type RuntimeLogLifecycleStatus = 'active' | 'tombstoned';

export interface LocalRuntimeLogEvent {
  id: string;
  campaignId: string;
  sessionId?: string;
  actorId?: string;
  systemId: LocalCampaignSystemId;
  type: RuntimeLogEventType;
  message: string;
  /**
   * MVP extension field. UI and future export/import code must not assume this
   * structure is stable; replace it with discriminated payload types later.
   */
  payload?: unknown;
  lifecycleStatus?: RuntimeLogLifecycleStatus;
  tombstonedAt?: string;
  tombstoneReason?: string;
  tombstoneSource?: string;
  correctsEventId?: string;
  correctionReason?: string;
  createdAt: string;
}

export type AppendRuntimeLogEventInput = Omit<
  LocalRuntimeLogEvent,
  'id' | 'createdAt' | 'lifecycleStatus' | 'tombstonedAt' | 'tombstoneReason' | 'tombstoneSource'
>;

export interface RuntimeLogListOptions {
  includeTombstoned?: boolean;
}

export interface TombstoneRuntimeLogEntryInput {
  eventId: string;
  reason?: string;
  source?: string;
}

interface RuntimeLogLocalStoreState {
  schemaVersion: number;
  events: LocalRuntimeLogEvent[];
  listRuntimeLogEvents: (
    campaignId: string,
    options?: RuntimeLogListOptions,
  ) => LocalRuntimeLogEvent[];
  listRuntimeLogEventsBySession: (
    campaignId: string,
    sessionId: string,
    options?: RuntimeLogListOptions,
  ) => LocalRuntimeLogEvent[];
  appendRuntimeLogEvent: (input: AppendRuntimeLogEventInput) => LocalRuntimeLogEvent;
  tombstoneRuntimeLogEntry: (input: TombstoneRuntimeLogEntryInput) => LocalRuntimeLogEvent;
  /**
   * Local/dev escape hatch for physical cleanup only. This is not the normal
   * product lifecycle path and does not define future hard-delete semantics.
   */
  deleteRuntimeLogEvent: (eventId: string) => void;
  /**
   * Local/dev escape hatch for physical cleanup only. Prefer tombstones for
   * normal RuntimeLog lifecycle behavior.
   */
  clearRuntimeLogForCampaign: (campaignId: string) => void;
  /**
   * Dev reset helper. This intentionally purges local browser state and must
   * not be presented as ordinary user-facing deletion.
   */
  clearAllRuntimeLogsForDev: () => void;
}

export const RUNTIME_LOG_LOCAL_STORE_SCHEMA_VERSION = 1;
export const RUNTIME_LOG_LOCAL_STORE_KEY = 'platform-runtime-log-local-store';

function nowIso(): string {
  return new Date().toISOString();
}

function makeRuntimeLogEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `runtime-log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  return trimmed || 'Runtime log event';
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeRuntimeLogEvent(event: LocalRuntimeLogEvent): LocalRuntimeLogEvent {
  return {
    ...event,
    lifecycleStatus: event.lifecycleStatus ?? 'active',
  };
}

function isActiveRuntimeLogEvent(event: LocalRuntimeLogEvent): boolean {
  return (event.lifecycleStatus ?? 'active') === 'active';
}

function filterRuntimeLogEvents(
  events: LocalRuntimeLogEvent[],
  options?: RuntimeLogListOptions,
): LocalRuntimeLogEvent[] {
  if (options?.includeTombstoned) return events;
  return events.filter(isActiveRuntimeLogEvent);
}

function sortRuntimeLogEvents(events: LocalRuntimeLogEvent[]): LocalRuntimeLogEvent[] {
  return [...events].sort((a, b) => {
    const createdAtOrder = a.createdAt.localeCompare(b.createdAt);
    if (createdAtOrder !== 0) return createdAtOrder;
    return a.id.localeCompare(b.id);
  });
}

function createRuntimeLogEvent(input: AppendRuntimeLogEventInput): LocalRuntimeLogEvent {
  return {
    ...input,
    id: makeRuntimeLogEventId(),
    message: normalizeMessage(input.message),
    lifecycleStatus: 'active',
    createdAt: nowIso(),
  };
}

export const useRuntimeLogLocalStore = create<RuntimeLogLocalStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: RUNTIME_LOG_LOCAL_STORE_SCHEMA_VERSION,
      events: [],

      listRuntimeLogEvents: (campaignId, options) =>
        sortRuntimeLogEvents(filterRuntimeLogEvents(
          get().events.filter((event) => event.campaignId === campaignId),
          options,
        )),

      listRuntimeLogEventsBySession: (campaignId, sessionId, options) =>
        sortRuntimeLogEvents(filterRuntimeLogEvents(
          get().events.filter((event) => (
            event.campaignId === campaignId && event.sessionId === sessionId
          )),
          options,
        )),

      appendRuntimeLogEvent: (input) => {
        const event = createRuntimeLogEvent(input);
        set((state) => ({
          events: [...state.events, event],
        }));
        return event;
      },

      tombstoneRuntimeLogEntry: (input) => {
        let tombstonedEvent: LocalRuntimeLogEvent | null = null;
        const tombstonedAt = nowIso();
        const tombstoneReason = normalizeOptionalText(input.reason);
        const tombstoneSource = normalizeOptionalText(input.source) ?? 'local';

        set((state) => {
          const eventIndex = state.events.findIndex((event) => event.id === input.eventId);
          if (eventIndex < 0) return state;

          const existing = state.events[eventIndex];
          const nextEvent: LocalRuntimeLogEvent = {
            ...existing,
            lifecycleStatus: 'tombstoned',
            tombstonedAt,
            tombstoneSource,
            ...(tombstoneReason ? { tombstoneReason } : {}),
          };
          const nextEvents = [...state.events];
          nextEvents[eventIndex] = nextEvent;
          tombstonedEvent = nextEvent;
          return { events: nextEvents };
        });

        if (!tombstonedEvent) {
          throw new Error(`Runtime log event not found: ${input.eventId}`);
        }
        return tombstonedEvent;
      },

      deleteRuntimeLogEvent: (eventId) => set((state) => ({
        events: state.events.filter((event) => event.id !== eventId),
      })),

      clearRuntimeLogForCampaign: (campaignId) => set((state) => ({
        events: state.events.filter((event) => event.campaignId !== campaignId),
      })),

      clearAllRuntimeLogsForDev: () => set({ events: [] }),
    }),
    {
      name: RUNTIME_LOG_LOCAL_STORE_KEY,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        events: state.events,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<{
          schemaVersion: unknown;
          events: unknown;
        }> | null;
        if (!p || typeof p !== 'object' || !Array.isArray(p.events)) {
          return current;
        }
        return {
          ...current,
          schemaVersion: RUNTIME_LOG_LOCAL_STORE_SCHEMA_VERSION,
          events: p.events.filter(isLocalRuntimeLogEvent).map(normalizeRuntimeLogEvent),
        };
      },
    },
  ),
);

function isLocalRuntimeLogEvent(value: unknown): value is LocalRuntimeLogEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<LocalRuntimeLogEvent>;
  return (
    typeof event.id === 'string' &&
    typeof event.campaignId === 'string' &&
    isOptionalString(event.sessionId) &&
    isOptionalString(event.actorId) &&
    isLocalCampaignSystemId(event.systemId) &&
    isRuntimeLogEventType(event.type) &&
    typeof event.message === 'string' &&
    isOptionalRuntimeLogLifecycleStatus(event.lifecycleStatus) &&
    isOptionalString(event.tombstonedAt) &&
    isOptionalString(event.tombstoneReason) &&
    isOptionalString(event.tombstoneSource) &&
    isOptionalString(event.correctsEventId) &&
    isOptionalString(event.correctionReason) &&
    typeof event.createdAt === 'string'
  );
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isLocalCampaignSystemId(value: unknown): value is LocalCampaignSystemId {
  return value === 'dnd5e-2024' || value === 'coc7e' || value === 'cp-red';
}

function isRuntimeLogEventType(value: unknown): value is RuntimeLogEventType {
  return (
    value === 'session.started' ||
    value === 'roll.performed' ||
    value === 'actor.note' ||
    value === 'actor.hpChanged' ||
    value === 'actor.resourceChanged' ||
    value === 'actor.sanChanged' ||
    value === 'actor.humanityChanged' ||
    value === 'system.note'
  );
}

function isOptionalRuntimeLogLifecycleStatus(
  value: unknown,
): value is RuntimeLogLifecycleStatus | undefined {
  return value === undefined || value === 'active' || value === 'tombstoned';
}
