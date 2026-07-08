/**
 * createRoom service (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_CREATE_ROOM_V0
 *
 * Builds a RoomSnapshot with a host member. No persistence, no auth, no rules.
 */
import { randomUUID } from 'node:crypto';
// Allowed enums for runtime validation of a campaign linkage (M19.2). Shared so
// the HTTP handler and this service apply the same rules.
export const VALID_ROOM_CAMPAIGN_SOURCES = [
    'localCampaignLibrary',
    'imported',
    'workshop',
    'unknown',
];
export const VALID_ROOM_SYSTEM_IDS = ['dnd5e-2024', 'coc7e', 'cp-red', 'custom'];
/**
 * Validate an optional campaignRef against the room's resolved system. Returns an
 * error code (for the HTTP handler to map to 400) or null when valid/absent.
 * NOT a permission check.
 */
export function validateCampaignRef(ref, resolvedSystemId) {
    if (!ref)
        return null;
    if (typeof ref.displayName !== 'string' || ref.displayName.trim() === '')
        return 'invalidCampaignRef';
    if (!VALID_ROOM_CAMPAIGN_SOURCES.includes(ref.source))
        return 'invalidCampaignRef';
    if (!VALID_ROOM_SYSTEM_IDS.includes(ref.systemId))
        return 'invalidCampaignRef';
    if (ref.systemId !== resolvedSystemId)
        return 'campaignSystemMismatch';
    return null;
}
const ROOM_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
/** Simple, low-stakes 6-char room code (scaffold only). */
function makeRoomCode() {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
        code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    return code;
}
export function createRoom(input) {
    const now = new Date().toISOString();
    const systemId = input.systemId ?? 'dnd5e-2024';
    // Defensive validation so a direct service call (test/future code) cannot
    // bypass the HTTP handler and write an invalid campaignRef into a room.
    const campaignRefError = validateCampaignRef(input.campaignRef, systemId);
    if (campaignRefError) {
        throw new Error(`createRoom: ${campaignRefError}`);
    }
    // campaignRef.campaignId takes precedence; fall back to the legacy campaignId
    // input for backward compatibility.
    const campaignId = input.campaignRef?.campaignId ?? input.campaignId;
    const hostMember = {
        memberId: `member_${randomUUID()}`,
        userId: input.hostUserId,
        displayName: input.hostDisplayName,
        role: 'host',
        status: 'active',
        joinedAt: now,
        lastSeenAt: now,
    };
    const room = {
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
