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

export interface CreateRoomInput {
  displayName?: string;
  hostDisplayName: string;
  hostUserId?: string;
  campaignId?: string;
  sessionId?: string;
  systemId?: RoomSystemId;
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
      campaignId: input.campaignId,
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
  };

  return { room };
}
