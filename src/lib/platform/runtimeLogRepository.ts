/**
 * Runtime Log repository boundary.
 *
 * AI-LANDMARK: A7_2_RUNTIME_LOG_REPOSITORY_BOUNDARY_V1
 *
 * This module is a local read facade / boundary over runtimeLogLocalStore.
 * It owns the campaignId filtering + ordering that previously lived inline in
 * CampaignRuntimeShell, so the UI no longer reads state.events directly.
 *
 * Behavior is intentionally identical to the previous Shell logic: filter by
 * campaignId, then sort ascending by createdAt and id. Tombstone / visibility /
 * projection semantics are NOT applied here yet — this seam is where they will
 * live later, without the UI having to change again.
 *
 * Hard boundaries preserved (this module must never break them):
 * - RuntimeLog is NOT a Campaign Library owned object; this only reads events.
 * - No write semantics, schema, or persist-key changes are made here.
 * - No CampaignMembership / CampaignActorInstance / RuntimeActor /
 *   RuntimeSession, no backend, API, WebSocket, permission, or multiplayer.
 */

import { useMemo } from 'react';
import {
  useRuntimeLogLocalStore,
  type LocalRuntimeLogEvent,
} from './runtimeLogLocalStore';

/**
 * Pure selector: scope events to a single campaign and order them ascending by
 * createdAt, breaking ties by id. Operates on a copy (filter creates a new
 * array before sort) so it never mutates the source list.
 */
export function selectRuntimeLogEventsForCampaign(
  events: LocalRuntimeLogEvent[],
  campaignId: string,
): LocalRuntimeLogEvent[] {
  return events
    .filter((event) => event.campaignId === campaignId)
    .sort((a, b) => {
      const createdAtOrder = a.createdAt.localeCompare(b.createdAt);
      if (createdAtOrder !== 0) return createdAtOrder;
      return a.id.localeCompare(b.id);
    });
}

/**
 * Non-reactive read of the campaign-scoped, ordered runtime log events.
 * Reads the live store via getState(); use the hook below inside React render.
 */
export function listRuntimeLogEventsForCampaign(campaignId: string): LocalRuntimeLogEvent[] {
  return selectRuntimeLogEventsForCampaign(
    useRuntimeLogLocalStore.getState().events,
    campaignId,
  );
}

/** Reactive read of the campaign-scoped, ordered runtime log events. */
export function useRuntimeLogEventsForCampaign(campaignId: string): LocalRuntimeLogEvent[] {
  const events = useRuntimeLogLocalStore((state) => state.events);
  return useMemo(
    () => selectRuntimeLogEventsForCampaign(events, campaignId),
    [events, campaignId],
  );
}
