/**
 * Character Clearance contracts (v0, types only).
 *
 * AI-LANDMARK: CHARACTER_CLEARANCE_CONTRACTS_V0
 *
 * This module defines platform-level contracts for future Character Clearance.
 * It does NOT enforce clearance, mutate actor stores, approve admissions, compute
 * hashes, or call AI. Current `RoomActorBinding` (RoomSnapshot.lobby.actorBindings)
 * remains the v0 lobby binding until a later milestone integrates these contracts.
 *
 * Design constraints:
 *  - Platform-level only — NO DND/COC/CP RED rule fields are hardcoded here. There
 *    is no shared CharacterData type in this codebase (actors live in per-system
 *    stores surfaced via ActorVaultAdapter), so ActorSnapshot is produced by a
 *    per-system ActorSnapshotAdapter (see actorSnapshotAdapter.ts).
 *  - System-specific data rides as system-tagged `Record<string, unknown>` payloads
 *    with clearly named buckets; this contract never inspects their contents.
 *  - RuntimeActorState and ActorStateDelta are intentionally NOT defined here
 *    (future M25). AIInspectionAdvice is advisory only — never authoritative.
 */
export {};
// ── Future (NOT defined here) ────────────────────────────────────────────────
// RuntimeActorState and ActorStateDelta are intentionally deferred to a later
// milestone (M25). Do not add them in this contracts module.
