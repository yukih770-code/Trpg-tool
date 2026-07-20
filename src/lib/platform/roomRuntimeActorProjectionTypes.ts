/**
 * Narrow, room-safe projection of a persisted campaign actor for Runtime UI.
 *
 * This is deliberately not a campaign actor record: it carries only the
 * compact combat facts that a room member may display. Full source snapshots,
 * inventory, actions, notes, owner ids, and opaque source actor ids stay on
 * their existing protected surfaces.
 */
export type RoomRuntimeActorProjectionSource = 'roomBinding' | 'campaignOverride';

export interface RoomRuntimeActorProjection {
  bindingId: string;
  campaignActorInstanceId?: string;
  displayName: string;
  systemId: string;
  actorKind?: 'pc' | 'npc' | 'monster' | 'unknown';
  hpCurrent?: number;
  hpMax?: number;
  temporaryHp?: number;
  armorClass?: number;
  /** Reserved for a future explicit condition projection; omitted today. */
  conditions?: string[];
  source: RoomRuntimeActorProjectionSource;
}

export interface RoomRuntimeActorProjectionListResult {
  actors: RoomRuntimeActorProjection[];
  /** The read remains useful with compact room-binding fallbacks if storage is unavailable. */
  persistence: 'available' | 'unavailable' | 'notLinked';
}
