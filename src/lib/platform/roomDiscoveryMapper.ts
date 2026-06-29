/**
 * Room discovery mapper (v0).
 *
 * AI-LANDMARK: ROOM_DISCOVERY_MAPPER_V0
 *
 * Converts a Room Server list-summary into the platform `DiscoveredRoomSummary`
 * so the UI never depends directly on the raw Room Server response. The caller
 * supplies source / serverBaseUrl / serverLabel (no localhost hardcoded here).
 * Platform-neutral — no DND/COC/CP RED concepts.
 */

import type { RoomServerRoomListItem } from './roomServerHttpClient';
import type { DiscoveredRoomSummary, RoomDiscoverySource } from './roomDiscoveryTypes';
import type { RoomSystemId } from './roomTypes';

export interface MapRoomServerRoomOptions {
  source: RoomDiscoverySource;
  serverBaseUrl?: string;
  serverLabel?: string;
}

export function mapRoomServerRoomToDiscovered(
  item: RoomServerRoomListItem,
  options: MapRoomServerRoomOptions,
): DiscoveredRoomSummary {
  return {
    source: options.source,
    roomId: item.roomId,
    roomCode: item.roomCode,
    systemId: item.systemId,
    lifecycleStatus: item.lifecycleStatus,
    memberCount: item.memberCount,
    // Current GET /rooms summary does not expose joinApprovalMode; the local
    // scaffold maps conservatively: visible within its own server, room code +
    // host approval required to join.
    visibility: 'public',
    joinRequirement: 'hostApprovalRequired',
    serverLabel: options.serverLabel,
    serverBaseUrl: options.serverBaseUrl,
  };
}

export function mapRoomServerRoomsToDiscovered(
  items: RoomServerRoomListItem[],
  options: MapRoomServerRoomOptions,
): DiscoveredRoomSummary[] {
  return items.map((item) => mapRoomServerRoomToDiscovered(item, options));
}

/**
 * Whether a discovered room may be shown in the given system's workspace.
 * v0: exact systemId match only. TODO: allow 'custom' / cross-system policies.
 */
export function canDisplayDiscoveredRoomForSystem(
  room: DiscoveredRoomSummary,
  currentSystemId: RoomSystemId,
): boolean {
  return room.systemId === currentSystemId;
}
