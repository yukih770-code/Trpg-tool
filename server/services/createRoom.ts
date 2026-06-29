/**
 * createRoom service (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_CREATE_ROOM_V0
 *
 * Builds a RoomSnapshot with a host member. No persistence, no auth, no rules.
 */

import { randomUUID } from 'node:crypto';

import type {
  RoomMemberIdentity,
  RoomSnapshot,
  RoomSystemId,
} from '../protocol/room-protocol.js';
// Campaign linkage type lives in the platform layer; imported directly (same
// pattern the transport layer uses) so room-protocol.ts stays untouched.
import type { RoomCampaignRef } from '../../src/lib/platform/roomTypes.js';

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
  const systemId: RoomSystemId = input.systemId ?? 'dnd5e-2024';
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
