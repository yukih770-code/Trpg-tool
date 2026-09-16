/**
 * Narrow, room-safe projection of a persisted campaign actor for Runtime UI.
 *
 * This is deliberately not a campaign actor record: it carries only the
 * compact combat facts that a room member may display. Full source snapshots,
 * inventory, actions, notes, owner ids, and opaque source actor ids stay on
 * their existing protected surfaces.
 */
export type RoomRuntimeActorProjectionSource = 'roomBinding' | 'campaignOverride' | 'acceptedCharacter';

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
  /** Accepted D&D Actor fact; never mutable Token footprint state. */
  dndCreatureSize?: import('../dnd2024/gameplay/dndCreatureSize.js').DndCreatureSize;
  /**
   * Initiative modifier derived from the approved combat sheet's dexterity.
   * Presentation/seed value only: it decides no turn order by itself, and the
   * roll that uses it stays a host action.
   */
  initiativeModifier?: number;
  /** Reserved for a future explicit condition projection; omitted today. */
  conditions?: string[];
  /**
   * Whether the player's Vault character has changed, in a combat-relevant way,
   * since the campaign froze the source this actor was linked from (T11a).
   *
   * A REVIEW SIGNAL ONLY. It ejects nobody, blocks no reconnect, gates no room
   * entry, and mutates no live combat. It is not an admission status and in
   * particular is not `ActorAdmissionStatus = 'stale'`.
   *
   * OMITTED means UNKNOWN, never "verified unchanged": there is no stored
   * baseline, the stored baseline predates this build's covered field set, or
   * the current character cannot be read. `false` is the only claim that the
   * two were compared and matched.
   *
   * Returned only to the room host and to a member about their own binding, so
   * the projection does not hand every player a change-detection oracle on
   * everyone else's character. The hash itself is never projected.
   */
  sourceChangedSinceApproval?: boolean;
  source: RoomRuntimeActorProjectionSource;
}

/**
 * Narrow action categories carried from an approved DND Lite campaign actor.
 * They drive presentation only; target resolution and effects stay outside
 * this room-safe projection.
 */
export type RoomRuntimeDndActionKind = 'weapon_attack' | 'spell_attack' | 'spell_cast' | 'save_dc' | 'damage_only' | 'utility';

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
  /** A compact self-only spellbook projection; no description or full snapshot is returned. */
  spellLevel?: number;
  activation?: string;
  range?: string;
  availability?: 'prepared' | 'known';
}

export interface RoomRuntimeActorProjectionListResult {
  actors: RoomRuntimeActorProjection[];
  /** Returned only for the authenticated member's own approved binding. */
  selfDndActions?: RoomRuntimeDndActionShortcut[];
  /** The read remains useful with compact room-binding fallbacks if storage is unavailable. */
  persistence: 'available' | 'unavailable' | 'notLinked';
}
