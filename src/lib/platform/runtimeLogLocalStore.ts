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
  createdAt: string;
}

export type AppendRuntimeLogEventInput = Omit<LocalRuntimeLogEvent, 'id' | 'createdAt'>;

interface RuntimeLogLocalStoreState {
  schemaVersion: number;
  events: LocalRuntimeLogEvent[];
  listRuntimeLogEvents: (campaignId: string) => LocalRuntimeLogEvent[];
  listRuntimeLogEventsBySession: (
    campaignId: string,
    sessionId: string,
  ) => LocalRuntimeLogEvent[];
  appendRuntimeLogEvent: (input: AppendRuntimeLogEventInput) => LocalRuntimeLogEvent;
  /**
   * Local/dev escape hatch. Real shared logs should eventually prefer
   * tombstones or archival semantics instead of physical deletion.
   */
  deleteRuntimeLogEvent: (eventId: string) => void;
  clearRuntimeLogForCampaign: (campaignId: string) => void;
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
    createdAt: nowIso(),
  };
}

export const useRuntimeLogLocalStore = create<RuntimeLogLocalStoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: RUNTIME_LOG_LOCAL_STORE_SCHEMA_VERSION,
      events: [],

      listRuntimeLogEvents: (campaignId) =>
        sortRuntimeLogEvents(get().events.filter((event) => event.campaignId === campaignId)),

      listRuntimeLogEventsBySession: (campaignId, sessionId) =>
        sortRuntimeLogEvents(get().events.filter((event) => (
          event.campaignId === campaignId && event.sessionId === sessionId
        ))),

      appendRuntimeLogEvent: (input) => {
        const event = createRuntimeLogEvent(input);
        set((state) => ({
          events: [...state.events, event],
        }));
        return event;
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
          events: p.events.filter(isLocalRuntimeLogEvent),
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
