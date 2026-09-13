/**
 * Combatant seed values from the Room Runtime actor projection (T10).
 *
 * AI-LANDMARK: COMBATANT_SEED_FROM_PROJECTION_V1
 *
 * Adding a map token to the combat table used to hardcode `armorClass:
 * undefined` and `initiativeModifier: 0`, so a host retyped an AC the server had
 * already projected and rolled initiative with no dexterity at all. This module
 * resolves those two values — and only those two — from the projection the room
 * already loads.
 *
 * Boundary rules enforced here:
 *  - The projection is the ONLY character-derived source. This module does not
 *    import the character store, `CharacterData`, or any builder module, and
 *    the combat layer must never read them directly.
 *  - It creates no combatant and appends no event. It returns seed values that
 *    the existing `CombatantInput` already accepts; no combat schema is added.
 *  - Token-carried values win. HP and conditions already flow token-first, and
 *    a host's edit to a token must not be silently replaced by the projection.
 *  - Pure: no React, no store, no I/O, no clock, no randomness.
 */

import type { MapToken } from '../map/mapRuntimeTypes';
import type { RoomRuntimeActorProjection } from '../platform/roomRuntimeActorProjectionTypes';

/** Default when no projection supplies one; preserves the previous behaviour. */
export const DEFAULT_INITIATIVE_MODIFIER = 0;

export interface CombatantProjectionSeed {
  armorClass?: number;
  initiativeModifier: number;
  hpCurrent?: number;
  hpMax?: number;
  temporaryHp?: number;
  conditions: string[];
  /** Which fields the projection supplied, for reporting and assertions. */
  seededFromProjection: Array<'armorClass' | 'initiativeModifier' | 'hpCurrent' | 'hpMax' | 'temporaryHp' | 'conditions'>;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Resolves the projection describing a token.
 *
 * Matches on the room actor binding first, because that is the identity a room
 * membership owns; the campaign actor instance is the fallback for a token
 * placed from a campaign actor without a live binding.
 */
export function findProjectionForToken(
  token: Pick<MapToken, 'actorBindingId' | 'campaignActorId' | 'sourceActorInstanceId'>,
  projections: readonly RoomRuntimeActorProjection[] = [],
): RoomRuntimeActorProjection | undefined {
  const bindingId = token.actorBindingId?.trim();
  if (bindingId) {
    const byBinding = projections.find((projection) => projection.bindingId === bindingId);
    if (byBinding) return byBinding;
  }
  const campaignActorInstanceId = token.sourceActorInstanceId?.trim() || token.campaignActorId?.trim();
  if (campaignActorInstanceId) {
    return projections.find((projection) => projection.campaignActorInstanceId === campaignActorInstanceId);
  }
  return undefined;
}

/**
 * Produces the combat seed for a token.
 *
 * Exact AC may already be carried by a host-authored campaign token. Otherwise
 * it comes from the authoritative room projection. HP and conditions stay
 * token-first: the bridge already fills a token's HP summary from this same
 * projection, and a host may have adjusted the token since.
 */
export function combatantSeedFromProjection(
  token: Pick<MapToken, 'actorBindingId' | 'campaignActorId' | 'sourceActorInstanceId' | 'hpSummary' | 'acDisplay' | 'conditionSummary'>,
  projection: RoomRuntimeActorProjection | undefined,
): CombatantProjectionSeed {
  const seededFromProjection: CombatantProjectionSeed['seededFromProjection'] = [];

  const tokenArmorClass = token.acDisplay?.kind === 'exact' && isFiniteNumber(token.acDisplay.value)
    ? token.acDisplay.value
    : undefined;
  const armorClass = tokenArmorClass ?? (isFiniteNumber(projection?.armorClass) ? projection.armorClass : undefined);
  if (tokenArmorClass === undefined && armorClass !== undefined) seededFromProjection.push('armorClass');

  const projectedInitiative = isFiniteNumber(projection?.initiativeModifier) ? projection.initiativeModifier : undefined;
  if (projectedInitiative !== undefined) seededFromProjection.push('initiativeModifier');
  const initiativeModifier = projectedInitiative ?? DEFAULT_INITIATIVE_MODIFIER;

  const hpCurrent = token.hpSummary?.current ?? (isFiniteNumber(projection?.hpCurrent) ? projection.hpCurrent : undefined);
  if (token.hpSummary?.current === undefined && hpCurrent !== undefined) seededFromProjection.push('hpCurrent');

  const hpMax = token.hpSummary?.max ?? (isFiniteNumber(projection?.hpMax) ? projection.hpMax : undefined);
  if (token.hpSummary?.max === undefined && hpMax !== undefined) seededFromProjection.push('hpMax');

  const temporaryHp = token.hpSummary?.temporary ?? (isFiniteNumber(projection?.temporaryHp) ? projection.temporaryHp : undefined);
  if (token.hpSummary?.temporary === undefined && temporaryHp !== undefined) seededFromProjection.push('temporaryHp');

  const tokenConditions = token.conditionSummary;
  const conditions = tokenConditions ?? projection?.conditions ?? [];
  if (tokenConditions === undefined && projection?.conditions !== undefined) seededFromProjection.push('conditions');

  return {
    ...(armorClass !== undefined ? { armorClass } : {}),
    initiativeModifier,
    ...(hpCurrent !== undefined ? { hpCurrent } : {}),
    ...(hpMax !== undefined ? { hpMax } : {}),
    ...(temporaryHp !== undefined ? { temporaryHp } : {}),
    conditions: [...conditions],
    seededFromProjection,
  };
}

/** Convenience: resolve the projection for a token and seed in one step. */
export function combatantSeedForToken(
  token: Parameters<typeof combatantSeedFromProjection>[0] & Parameters<typeof findProjectionForToken>[0],
  projections: readonly RoomRuntimeActorProjection[] = [],
): CombatantProjectionSeed {
  return combatantSeedFromProjection(token, findProjectionForToken(token, projections));
}
