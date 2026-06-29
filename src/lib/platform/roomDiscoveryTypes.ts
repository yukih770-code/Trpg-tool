/**
 * Room discovery contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_DISCOVERY_TYPES_V0
 *
 * Platform-level, system-agnostic types for the "Join Campaign" surface. They
 * describe discovery sources (LAN/local, official, third-party), room visibility,
 * and join requirements. They do not implement discovery, networking, or any
 * DND/COC/CP RED rules. The backend has no real visibility/public-private yet, so
 * an adapter maps local dev rooms into a `DiscoveredRoomSummary` for display.
 */

export type RoomDiscoverySource = 'all' | 'lan' | 'official' | 'thirdParty';

export type RoomVisibility = 'public' | 'unlisted' | 'private';

export type RoomJoinRequirement =
  | 'open'
  | 'roomCodeRequired'
  | 'hostApprovalRequired'
  | 'inviteOnly';

export interface RoomDiscoveryFilter {
  source: RoomDiscoverySource;
}

export interface DiscoveredRoomSummary {
  source: RoomDiscoverySource;
  roomId: string;
  roomCode?: string;
  displayName?: string;
  systemId: string;
  lifecycleStatus: string;
  memberCount: number;
  hostDisplayName?: string;
  visibility: RoomVisibility;
  joinRequirement: RoomJoinRequirement;
  serverLabel?: string;
  serverBaseUrl?: string;
}
