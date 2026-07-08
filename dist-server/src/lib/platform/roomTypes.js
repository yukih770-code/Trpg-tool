/**
 * Room / invite / member contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_INVITE_MEMBER_CONTRACTS_V0
 *
 * These are platform-level room, invite, and member contracts for the portable
 * Room Server model. They describe room identity, invite resolution inputs,
 * member roles, reconnect identity, and actor binding. They do not implement
 * networking, room creation, invite resolution, authentication, storage,
 * Runtime synchronization, or UI.
 *
 * Continues the principle: LAN is a deployment target, not a different
 * architecture. `host` is a ROOM role; authoritative state always belongs to the
 * Room Server even when the host runs it on a LAN computer. This module is
 * platform-neutral (no DND/COC/CP RED rules) and has only a single type-only
 * import: ActorSnapshotHash, used by the OPTIONAL clearance summary (M24.2a).
 */
export {};
