/**
 * Room RuntimeLog contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_RUNTIME_LOG_TYPES_V0
 *
 * Platform-level, system-agnostic append-only RuntimeLog for the Room Server. An
 * event is server-authoritative: seq / eventId / createdAt are assigned by the
 * server; campaignRef is a READ-ONLY copy of room.campaignRef. NOT formal Runtime,
 * NOT a RuntimeActor / CampaignActorInstance, NOT map/token/action-intent. The
 * event list does NOT live inside RoomSnapshot (it grows unbounded). `payload`
 * stays `unknown` — no DND/COC/CP RED rule schema is frozen here.
 */
export {};
