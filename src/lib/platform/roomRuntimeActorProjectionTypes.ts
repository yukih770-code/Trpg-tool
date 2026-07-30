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

/**
 * Narrow action categories carried from an approved DND Lite campaign actor.
 * They drive presentation only; target resolution and effects stay outside
 * this room-safe projection.
 */
export type RoomRuntimeDndActionKind = 'weapon_attack' | 'spell_attack' | 'save_dc' | 'damage_only' | 'utility';

/** Self-only DND Lite action shortcut. It intentionally has no target or effect. */
export interface RoomRuntimeDndActionShortcut {
  id: string;
  name: string;
  kind: RoomRuntimeDndActionKind;
  attackBonus?: number;
  damageFormula?: string;
  damageType?: string;
  saveAbility?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  saveDc?: number;
}

export interface RoomRuntimeActorProjectionListResult {
  actors: RoomRuntimeActorProjection[];
  /** Returned only for the authenticated member's own approved binding. */
  selfDndActions?: RoomRuntimeDndActionShortcut[];
  /** The read remains useful with compact room-binding fallbacks if storage is unavailable. */
  persistence: 'available' | 'unavailable' | 'notLinked';
}
