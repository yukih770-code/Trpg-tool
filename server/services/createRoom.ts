/**
 * createRoom service (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_CREATE_ROOM_V0
 *
 * Builds a RoomSnapshot with a host member. No persistence, no auth, no rules.
 */

import { randomUUID } from 'node:crypto';

import {
  DEFAULT_ROOM_SYSTEM_ID,
  KNOWN_ROOM_SYSTEM_IDS,
} from '../../src/lib/platform/roomSystemRegistry.js';

import type {
  RoomMemberIdentity,
  RoomSnapshot,
  RoomSystemId,
  RoomCampaignRef,
  RoomCampaignRefSource,
} from '../protocol/room-protocol.js';

export interface CreateRoomInput {
  displayName?: string;
  hostDisplayName: string;
  hostUserId?: string;
  campaignId?: string;
  sessionId?: string;
  systemId?: RoomSystemId;
  /** Optional campaign linkage (M19). Validated by the HTTP handler. */
  campaignRef?: RoomCampaignRef;
}

export interface CreateRoomResult {
  room: RoomSnapshot;
}

// Allowed enums for runtime validation of a campaign linkage (M19.2). Shared so
// the HTTP handler and this service apply the same rules.
export const VALID_ROOM_CAMPAIGN_SOURCES: readonly RoomCampaignRefSource[] = [
  'localCampaignLibrary',
  'imported',
  'workshop',
  'unknown',
];
/**
 * Re-exported from the canonical registry so existing importers keep working.
 * The list itself is no longer declared here (P8 P0-A).
 */
export const VALID_ROOM_SYSTEM_IDS: readonly RoomSystemId[] = KNOWN_ROOM_SYSTEM_IDS;

export type CampaignRefValidationError = 'invalidCampaignRef' | 'campaignSystemMismatch';

/**
 * Validate an optional campaignRef against the room's resolved system. Returns an
 * error code (for the HTTP handler to map to 400) or null when valid/absent.
 * NOT a permission check.
 */
export function validateCampaignRef(
  ref: RoomCampaignRef | undefined,
  resolvedSystemId: RoomSystemId,
): CampaignRefValidationError | null {
  if (!ref) return null;
  if (typeof ref.displayName !== 'string' || ref.displayName.trim() === '') return 'invalidCampaignRef';
  if (ref.worldServerId !== undefined && (typeof ref.worldServerId !== 'string' || ref.worldServerId.trim() === '')) {
    return 'invalidCampaignRef';
  }
  if (ref.worldServerId !== undefined && (!ref.campaignId || ref.campaignId.trim() === '')) return 'invalidCampaignRef';
  if (!VALID_ROOM_CAMPAIGN_SOURCES.includes(ref.source)) return 'invalidCampaignRef';
  if (!VALID_ROOM_SYSTEM_IDS.includes(ref.systemId)) return 'invalidCampaignRef';
  if (ref.systemId !== resolvedSystemId) return 'campaignSystemMismatch';
  return null;
}

const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Simple, low-stakes 6-char room code (scaffold only). */
function makeRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export function createRoom(input: CreateRoomInput): CreateRoomResult {
  const now = new Date().toISOString();
  const systemId: RoomSystemId = input.systemId ?? DEFAULT_ROOM_SYSTEM_ID;
  // Defensive validation so a direct service call (test/future code) cannot
  // bypass the HTTP handler and write an invalid campaignRef into a room.
  const campaignRefError = validateCampaignRef(input.campaignRef, systemId);
  if (campaignRefError) {
    throw new Error(`createRoom: ${campaignRefError}`);
  }
  // campaignRef.campaignId takes precedence; fall back to the legacy campaignId
  // input for backward compatibility.
  const campaignId = input.campaignRef?.campaignId ?? input.campaignId;

  const hostMember: RoomMemberIdentity = {
    memberId: `member_${randomUUID()}`,
    userId: input.hostUserId,
    displayName: input.hostDisplayName,
    role: 'host',
    status: 'active',
    joinedAt: now,
    lastSeenAt: now,
  };

  const room: RoomSnapshot = {
    identity: {
      roomId: `room_${randomUUID()}`,
      roomCode: makeRoomCode(),
      serverId: 'room-server',
      campaignId,
      sessionId: input.sessionId,
      systemId,
      lifecycleStatus: 'open',
      displayName: input.displayName,
      createdAt: now,
      updatedAt: now,
    },
    joinApprovalMode: 'hostApprovalRequired',
    members: [hostMember],
    actorBindings: [],
    invites: [],
    campaignRef: input.campaignRef,
  };

  return { room };
}
